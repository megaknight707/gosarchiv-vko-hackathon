// Безопасный вывод ответа помощника: понимает только **жирный**, `код`, [ссылки](/…) и списки «- ».
// HTML не вставляем — React экранирует текст (защита от XSS). Ссылки — только на наш сайт или https.
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

const INLINE = /(\[[^\]\n]+\]\([^)\s]+\)|\*\*[^*\n]+\*\*|`[^`\n]+`)/g;

function inline(text: string, onNavigate?: () => void): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith("/") && !href.startsWith("//")) {
        return (
          <Link key={i} href={href} onClick={onNavigate} className="font-bold text-primary underline-offset-4 hover:underline">
            {label}
          </Link>
        );
      }
      if (href.startsWith("https://")) {
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline-offset-4 hover:underline">
            {label}
          </a>
        );
      }
      return <Fragment key={i}>{label}</Fragment>;
    }
    if (/^\*\*[^*]+\*\*$/.test(part)) return <b key={i}>{part.slice(2, -2)}</b>;
    if (/^`[^`]+`$/.test(part)) return <code key={i} className="rounded bg-chip px-1 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    // Голые https-ссылки (например, egov.kz)
    return part.split(/(https:\/\/[^\s)]+)/g).map((piece, j) =>
      piece.startsWith("https://") ? (
        <a key={`${i}-${j}`} href={piece} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {piece}
        </a>
      ) : (
        <Fragment key={`${i}-${j}`}>{piece}</Fragment>
      ),
    );
  });
}

export function AssistantMarkdown({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5 marker:text-primary">
        {list.map((item, i) => <li key={i}>{inline(item, onNavigate)}</li>)}
      </ul>,
    );
    list = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const item = line.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (item) {
      list.push(item[1]);
      continue;
    }
    flush();
    if (!line) continue;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      heading ? (
        <p key={blocks.length} className="font-bold">{inline(heading[1], onNavigate)}</p>
      ) : (
        <p key={blocks.length}>{inline(line, onNavigate)}</p>
      ),
    );
  }
  flush();
  return <div className="space-y-2 leading-relaxed">{blocks}</div>;
}
