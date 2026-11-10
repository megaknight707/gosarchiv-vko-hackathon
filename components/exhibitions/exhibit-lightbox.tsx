"use client";

// Лайтбокс экспоната: крупное изображение, подпись, источник (шифр со ссылкой на карточку),
// переход «предыдущий / следующий» — кнопками, стрелками клавиатуры и свайпом.
// На базе Radix Dialog: фокус остаётся внутри окна, Esc закрывает, фокус возвращается на место.
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import type { ExhibitView } from "@/lib/memory/exhibitions";

export function ExhibitLightbox({
  exhibits,
  index,
  onIndexChange,
  onClose,
}: {
  exhibits: ExhibitView[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("Exhibitions");
  const touchX = useRef<number | null>(null);
  // Последний просмотренный экспонат — после закрытия вернём на него фокус
  const lastIndex = useRef(0);
  useEffect(() => {
    if (index !== null) lastIndex.current = index;
  }, [index]);
  const exhibit = index === null ? null : exhibits[index];
  const total = exhibits.length;
  const go = (delta: number) => index !== null && onIndexChange((index + delta + total) % total);

  return (
    <Dialog open={exhibit !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby="lightbox-caption"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = document.querySelector<HTMLElement>(`#exhibit-${lastIndex.current + 1} button`);
          target?.focus({ preventScroll: false });
          target?.scrollIntoView({ block: "center" });
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
        className="flex h-[100dvh] max-h-none w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-[#15130f] p-0 text-[#F3E9D6] sm:max-w-none"
      >
        {exhibit && (
          <>
            <div className="flex items-center justify-between gap-3 p-3">
              <span className="font-mono text-sm" aria-live="polite">
                {t("counter", { n: (index ?? 0) + 1, total })}
              </span>
              <button type="button" onClick={onClose} aria-label={t("close")} className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              {exhibit.mediaType === "VIDEO" && exhibit.mediaUrl ? (
                <video src={exhibit.mediaUrl} controls className="h-full w-full object-contain" />
              ) : exhibit.mediaUrl ? (
                <Image key={exhibit.id} src={exhibit.mediaUrl} alt={exhibit.title} fill sizes="100vw" className="object-contain p-2" />
              ) : (
                <p className="grid h-full place-items-center p-6 text-center opacity-80">{t("noImage")}</p>
              )}
              <button type="button" onClick={() => go(-1)} aria-label={t("prev")} className="absolute top-1/2 left-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/50 hover:bg-black/70">
                <ChevronLeft aria-hidden className="size-6" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={t("next")} className="absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/50 hover:bg-black/70">
                <ChevronRight aria-hidden className="size-6" />
              </button>
            </div>
            <div className="mx-auto w-full max-w-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <DialogTitle className="font-serif text-xl font-bold">{exhibit.title}</DialogTitle>
              <DialogDescription id="lightbox-caption" className="mt-1 text-[#d9ccb2]">
                {exhibit.text}
              </DialogDescription>
              {exhibit.document && (
                <p className="mt-2 text-sm">
                  {t("source")}:{" "}
                  <Link href={`/catalog/${exhibit.document.id}`} className="font-mono text-[#D9A44A] underline-offset-4 hover:underline">
                    {exhibit.document.cipher}
                  </Link>
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
