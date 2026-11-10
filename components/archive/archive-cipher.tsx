"use client";

// Архивный шифр моноширинным шрифтом + кнопка «Скопировать шифр».
// Сообщение «Шифр скопирован» объявляется экранному диктору (aria-live).
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "failed";

export function ArchiveCipher({
  cipher,
  className,
  showCopy = true,
}: {
  cipher: string;
  className?: string;
  showCopy?: boolean;
}) {
  const t = useTranslations("Archive");
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(cipher);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <code className="font-mono text-[12.5px] text-muted-ink" aria-label={`${t("cipherLabel")}: ${cipher}`}>
        {cipher}
      </code>
      {showCopy && (
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink transition-colors hover:bg-chip"
        >
          {state === "copied" ? <Check aria-hidden className="size-3.5 text-ok" /> : <Copy aria-hidden className="size-3.5" />}
          {t("copyCipher")}
        </button>
      )}
      <span role="status" aria-live="polite" className={cn("text-xs", state === "failed" ? "text-destructive" : "text-ok")}>
        {state === "copied" ? t("cipherCopied") : state === "failed" ? t("copyFailed") : ""}
      </span>
    </span>
  );
}
