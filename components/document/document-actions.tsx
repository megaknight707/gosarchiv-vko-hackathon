"use client";

// Действия в карточке документа: «Поделиться ссылкой» (системное меню «Поделиться»
// на телефоне, иначе — копирование ссылки), Telegram / WhatsApp / Facebook, «В избранное».
import { Check, Share2, Star } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/lib/favorites/favorites-store";
import { cn } from "@/lib/utils";

export function DocumentActions({ id, title, url }: { id: string; title: string; url: string }) {
  const t = useTranslations("Document");
  const favorites = useFavorites();
  const [copied, setCopied] = useState(false);
  const inFavorites = favorites.has(id);

  async function share() {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Пользователь закрыл системное окно — ничего не делаем
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t("share"), url);
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);
  const networks = [
    { name: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  const ghost = "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 font-bold hover:bg-chip";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={share} className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-4 font-bold text-primary-foreground hover:opacity-90">
          {copied ? <Check aria-hidden className="size-4" /> : <Share2 aria-hidden className="size-4" />}
          {t("share")}
        </button>
        <button
          type="button"
          onClick={() => favorites.toggle(id)}
          aria-pressed={inFavorites}
          title={inFavorites ? t("favoritesRemoveLabel") : undefined}
          className={cn(ghost, inFavorites && "border-primary text-primary")}
        >
          <Star aria-hidden className={cn("size-4", inFavorites && "fill-current")} />
          {inFavorites ? t("favoritesRemove") : t("favoritesAdd")}
        </button>
        <a href="#related" className={ghost}>
          {t("related")}
        </a>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-ok">
        {copied ? t("shareCopied") : ""}
      </p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-ink">
        {t("shareVia")}:
        {networks.map((network) => (
          <a key={network.name} href={network.href} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline-offset-4 hover:underline">
            {network.name}
          </a>
        ))}
      </p>
    </div>
  );
}
