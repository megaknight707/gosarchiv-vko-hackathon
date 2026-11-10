"use client";

// Выставка-история: экспонаты идут друг за другом при прокрутке. Текст и изображение
// мягко появляются, когда экспонат попадает на экран (IntersectionObserver, без библиотек;
// при «уменьшить движение» в настройках системы анимации отключены).
// Сбоку — индикатор прогресса по разделам; клик по изображению открывает лайтбокс.
import Image from "next/image";
import { FileText, Maximize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ExhibitView } from "@/lib/memory/exhibitions";
import { cn } from "@/lib/utils";
import { ExhibitLightbox } from "./exhibit-lightbox";

type Section = { title: string; firstIndex: number };

export function ExhibitionStory({ exhibits }: { exhibits: ExhibitView[] }) {
  const t = useTranslations("Exhibitions");
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // Разделы: экспонат с полем section начинает новый раздел
  const sections: Section[] = [];
  exhibits.forEach((e, i) => {
    if (e.section) sections.push({ title: e.section, firstIndex: i });
  });
  const sectionOf = (index: number) => sections.filter((s) => s.firstIndex <= index).pop();

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setVisible((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
        }
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.15 },
    );
    // Текущий экспонат — тот, что пересекает середину экрана
    const middle = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    refs.current.forEach((el) => {
      if (el) {
        reveal.observe(el);
        middle.observe(el);
      }
    });
    return () => {
      reveal.disconnect();
      middle.disconnect();
    };
  }, [exhibits.length]);

  const progress = exhibits.length > 1 ? (current / (exhibits.length - 1)) * 100 : 100;
  const currentSection = sectionOf(current);

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
      {/* Индикатор прогресса по разделам (на широких экранах) */}
      <nav aria-label={t("progress")} className="hidden lg:block">
        <div className="sticky top-8 py-10">
          <div className="relative pl-5">
            <div aria-hidden className="absolute top-0 bottom-0 left-1 w-0.5 rounded bg-border" />
            <div aria-hidden className="absolute top-0 left-1 w-0.5 rounded bg-primary transition-[height] duration-300" style={{ height: `${progress}%` }} />
            <ol className="space-y-3 text-sm">
              {sections.map((section) => (
                <li key={section.firstIndex}>
                  <a
                    href={`#exhibit-${section.firstIndex + 1}`}
                    aria-current={currentSection?.firstIndex === section.firstIndex ? "step" : undefined}
                    className={cn("block hover:text-primary", currentSection?.firstIndex === section.firstIndex ? "font-bold text-primary" : "text-muted-ink")}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-6 font-mono text-xs text-muted-ink">
              {t("counter", { n: current + 1, total: exhibits.length })}
            </p>
          </div>
        </div>
      </nav>

      <ol className="space-y-20 py-12 sm:space-y-28">
        {exhibits.map((exhibit, index) => {
          const shown = visible.has(index);
          const reversed = index % 2 === 1;
          return (
            <li
              key={exhibit.id}
              id={`exhibit-${index + 1}`}
              data-index={index}
              ref={(el) => {
                refs.current[index] = el;
              }}
              className="scroll-mt-8"
            >
              {exhibit.section && (
                <h2 className="mb-6 flex items-center gap-3 font-serif text-2xl font-bold text-primary sm:text-3xl">
                  <span aria-hidden className="h-px w-10 bg-primary" />
                  {exhibit.section}
                </h2>
              )}
              <article className={cn("grid items-center gap-6 md:grid-cols-[1.3fr_1fr] md:gap-10", reversed && "md:grid-cols-[1fr_1.3fr]")}>
                <div
                  className={cn(
                    "transition-all duration-700 motion-reduce:transition-none",
                    reversed && "md:order-2",
                    shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
                  )}
                >
                  {exhibit.mediaType === "VIDEO" && exhibit.mediaUrl ? (
                    <video src={exhibit.mediaUrl} controls preload="none" className="w-full rounded-[14px] bg-black" />
                  ) : exhibit.mediaUrl ? (
                    <button
                      type="button"
                      onClick={() => setLightbox(index)}
                      aria-label={t("enlarge", { title: exhibit.title })}
                      className="group relative block aspect-[16/11] w-full overflow-hidden rounded-[14px] bg-chip shadow-[0_12px_40px_rgba(60,40,20,.18)]"
                    >
                      <Image
                        src={exhibit.mediaUrl}
                        alt={exhibit.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 55vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                      <span className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-black/55 text-white opacity-80 group-hover:opacity-100">
                        <Maximize2 aria-hidden className="size-4" />
                      </span>
                    </button>
                  ) : (
                    <div className="flex aspect-[16/11] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-border bg-chip p-6 text-center text-muted-ink">
                      <FileText aria-hidden className="size-8" />
                      {t("noImage")}
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "transition-all delay-150 duration-700 motion-reduce:transition-none",
                    shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
                  )}
                >
                  <p className="font-mono text-xs text-muted-ink">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 font-serif text-2xl leading-tight font-bold">{exhibit.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed">{exhibit.text}</p>
                  {exhibit.document && (
                    <p className="mt-4 text-sm text-muted-ink">
                      {t("source")}:{" "}
                      <Link href={`/catalog/${exhibit.document.id}`} className="font-mono text-primary underline-offset-4 hover:underline">
                        {exhibit.document.cipher}
                      </Link>
                      <span className="block">{exhibit.document.title}</span>
                    </p>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <ExhibitLightbox exhibits={exhibits.filter(Boolean)} index={lightbox} onIndexChange={setLightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
