// Безопасный вывод текста страницы из базы (редактируется в админке).
// Поддерживает: абзацы (пустая строка), списки («- »), подзаголовки («## »),
// пометку «[[review]]» (формулировка на проверке) и «TODO…» (данных нет).
// Никакого HTML из базы не вставляем — React экранирует текст (защита от XSS).
import { AlertTriangle, Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";
import { isTodo } from "@/lib/archive/todo";
import { cn } from "@/lib/utils";

/** E-mail → mailto:, ссылки https://… и домены *.kz → кликабельные ссылки */
function linkify(text: string) {
  const parts = text.split(/([\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/[^\s,;]+|(?<![@\w.])[a-z0-9-]+(?:\.[a-z0-9-]+)*\.kz\b)/gi);
  return parts.map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.includes("@")) {
      return (
        <a key={i} href={`mailto:${part}`} className="text-primary underline-offset-4 hover:underline">
          {part}
        </a>
      );
    }
    const href = part.startsWith("http") ? part : `https://${part}`;
    return (
      <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline-offset-4 hover:underline">
        {part}
      </a>
    );
  });
}

export function ContentBody({ body, className }: { body: string | null | undefined; className?: string }) {
  const t = useTranslations("Content");

  if (!body || isTodo(body)) {
    return (
      <p className={cn("flex items-center gap-2 rounded-[12px] border border-dashed border-border bg-surface px-4 py-3 text-muted-ink", className)}>
        <Hourglass aria-hidden className="size-4 shrink-0" />
        {t("inProgress")}
      </p>
    );
  }

  const needsReview = body.startsWith("[[review]]");
  const text = body.replace(/^\[\[review\]\]/, "");
  const blocks = text.split(/\n{2,}/);

  return (
    <div className={cn("space-y-4 leading-relaxed", className)}>
      {needsReview && (
        <p className="inline-flex items-center gap-2 rounded-md bg-lock-soft px-3 py-1 text-sm text-lock">
          <AlertTriangle aria-hidden className="size-4" />
          {t("needsReview")}
        </p>
      )}
      {blocks.map((block, index) => {
        const lines = block.split("\n").filter(Boolean);
        if (lines[0]?.startsWith("## ")) {
          const rest = lines.slice(1);
          return (
            <div key={index}>
              <h3 className="mb-2 font-serif text-lg font-bold">{lines[0].slice(3)}</h3>
              {rest.length > 0 && <BlockLines lines={rest} />}
            </div>
          );
        }
        return <BlockLines key={index} lines={lines} />;
      })}
    </div>
  );
}

function BlockLines({ lines }: { lines: string[] }) {
  const items = lines.filter((l) => l.startsWith("- "));
  if (items.length === lines.length) {
    return (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
        {items.map((line, i) => (
          <li key={i}>{isTodo(line.slice(2)) ? "…" : linkify(line.slice(2))}</li>
        ))}
      </ul>
    );
  }
  return (
    <>
      {lines.map((line, i) =>
        line.startsWith("- ") ? (
          <ul key={i} className="list-disc pl-5 marker:text-primary">
            <li>{linkify(line.slice(2))}</li>
          </ul>
        ) : isTodo(line.replace(/^.*?—\s*/, "")) ? null : (
          <p key={i}>{linkify(line)}</p>
        ),
      )}
    </>
  );
}
