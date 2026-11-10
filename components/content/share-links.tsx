"use client";

// «Поделиться»: системное меню на телефоне, иначе копирование ссылки; плюс Telegram / WhatsApp / Facebook.
import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function ShareLinks({ title, url }: { title: string; url: string }) {
  const t = useTranslations("Document");
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t("share"), url);
    }
  }

  const u = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <button type="button" onClick={share} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 font-bold text-primary-foreground hover:opacity-90">
        {copied ? <Check aria-hidden className="size-4" /> : <Share2 aria-hidden className="size-4" />}
        {copied ? t("shareCopied") : t("share")}
      </button>
      <span className="text-muted-ink">{t("shareVia")}:</span>
      <a href={`https://t.me/share/url?url=${u}&text=${text}`} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">Telegram</a>
      <a href={`https://wa.me/?text=${text}%20${u}`} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">Facebook</a>
    </div>
  );
}
