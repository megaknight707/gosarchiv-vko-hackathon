"use client";

// Просмотрщик цифровой копии: масштаб (кнопки, колёсико, щипок двумя пальцами),
// перетаскивание, «по размеру окна», полноэкранный режим, листание (кнопки, стрелки
// клавиатуры, свайп), лента миниатюр и «Лист 3 из 12».
// Сначала показывается лёгкая миниатюра, поверх неё — полноразмерная страница, когда загрузится.
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Minus, Plus, ScanSearch } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type ViewerPage = { url: string; previewUrl: string | null; width: number | null; height: number | null };

export function DocumentViewer({ pages, title }: { pages: ViewerPage[]; title: string }) {
  const t = useTranslations("Viewer");
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ReactZoomPanPinchContentRef>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const thumbsRef = useRef<HTMLOListElement>(null);

  const total = pages.length;
  const page = pages[index];

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), total - 1);
      setIndex(clamped);
      setScale(1);
      thumbsRef.current?.children[clamped]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    },
    [total],
  );

  // Стрелки ← → листают, + / − масштабируют (если фокус не в поле ввода)
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!visible && !document.fullscreenElement) return;
      if (event.key === "ArrowRight") goTo(index + 1);
      else if (event.key === "ArrowLeft") goTo(index - 1);
      else if (event.key === "+" || event.key === "=") zoomRef.current?.zoomIn(0.5);
      else if (event.key === "-") zoomRef.current?.zoomOut(0.5);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await containerRef.current?.requestFullscreen?.();
  }

  // Свайп влево/вправо листает, когда страница не увеличена (при увеличении — двигает её)
  function onTouchStart(event: React.TouchEvent) {
    if (event.touches.length !== 1) return (touchStart.current = null);
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || scale > 1.05) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(index + (dx < 0 ? 1 : -1));
  }

  const button =
    "grid h-9 min-w-9 place-items-center rounded-lg border border-white/15 bg-white/10 px-2 text-sm text-[#E3E9F2] transition-colors hover:bg-white/20 disabled:opacity-40";

  return (
    <section
      ref={containerRef}
      aria-label={t("label")}
      aria-roledescription="carousel"
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[18px] bg-[#141C2C] text-[#E3E9F2]",
        fullscreen ? "h-dvh rounded-none" : "h-[70vh] min-h-[420px] lg:h-[calc(100vh-180px)] lg:max-h-[820px]",
      )}
    >
      {/* Панель инструментов */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-1.5">
          <button type="button" className={button} onClick={() => zoomRef.current?.zoomOut(0.5)} aria-label={t("zoomOut")} title={t("zoomOut")}>
            <Minus aria-hidden className="size-4" />
          </button>
          <span className="min-w-14 text-center font-mono text-xs tabular-nums" aria-live="off">
            {Math.round(scale * 100)}%
          </span>
          <button type="button" className={button} onClick={() => zoomRef.current?.zoomIn(0.5)} aria-label={t("zoomIn")} title={t("zoomIn")}>
            <Plus aria-hidden className="size-4" />
          </button>
          <button type="button" className={button} onClick={() => zoomRef.current?.resetTransform()} aria-label={t("fit")} title={t("fit")}>
            <ScanSearch aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className={button}
            onClick={toggleFullscreen}
            aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
            title={fullscreen ? t("exitFullscreen") : t("fullscreen")}
          >
            {fullscreen ? <Minimize2 aria-hidden className="size-4" /> : <Maximize2 aria-hidden className="size-4" />}
          </button>
        </div>
        <p className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm" aria-live="polite">
          {t("sheetOf", { page: index + 1, total })}
        </p>
      </div>

      {/* Страница */}
      <div className="relative min-h-0 flex-1" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <TransformWrapper
          key={index}
          ref={zoomRef}
          minScale={1}
          maxScale={6}
          centerOnInit
          doubleClick={{ mode: "toggle", step: 1.5 }}
          wheel={{ step: 0.15 }}
          keyboard={{ disabled: true }}
          onTransform={(_ref, state) => setScale(state.scale)}
        >
          <TransformComponent wrapperClass="!h-full !w-full" contentClass="!h-full !w-full flex items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center p-3">
              {/* Миниатюра — сразу, полноразмерная страница — поверх, когда загрузится */}
              {page.previewUrl && !loaded[index] && (
                // eslint-disable-next-line @next/next/no-img-element -- просмотрщику нужен «сырой» img для масштабирования
                <img src={page.previewUrl} alt="" aria-hidden className="absolute max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] object-contain blur-[1px]" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- см. выше */}
              <img
                src={page.url}
                alt={t("pageAlt", { title, page: index + 1 })}
                width={page.width ?? undefined}
                height={page.height ?? undefined}
                onLoad={() => setLoaded((prev) => ({ ...prev, [index]: true }))}
                // Картинка могла загрузиться из кэша раньше, чем React повесил onLoad
                ref={(img) => {
                  if (img?.complete && img.naturalWidth > 0 && !loaded[index]) setLoaded((prev) => ({ ...prev, [index]: true }));
                }}
                draggable={false}
                className={cn(
                  "relative max-h-full max-w-full object-contain shadow-[0_10px_40px_rgba(0,0,0,.45)] transition-opacity duration-300",
                  loaded[index] ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </TransformComponent>
        </TransformWrapper>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label={t("prev")}
              className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white hover:bg-black/65 disabled:hidden"
            >
              <ChevronLeft aria-hidden className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === total - 1}
              aria-label={t("next")}
              className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white hover:bg-black/65 disabled:hidden"
            >
              <ChevronRight aria-hidden className="size-6" />
            </button>
          </>
        )}
      </div>

      <p className="sr-only">{t("hint")}</p>

      {/* Лента миниатюр */}
      {total > 1 && (
        <ol ref={thumbsRef} aria-label={t("thumbnails")} className="flex shrink-0 gap-2 overflow-x-auto px-3 pt-1 pb-3">
          {pages.map((p, i) => (
            <li key={p.url} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={t("thumbnail", { page: i + 1 })}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "block h-16 w-12 overflow-hidden rounded-[3px] bg-[#d9ccb2] transition-opacity",
                  i === index ? "opacity-100 outline-2 outline-offset-2 outline-[#D3A35E]" : "opacity-55 hover:opacity-90",
                )}
              >
                {p.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- миниатюры уже лёгкие (WebP ~5 КБ)
                  <img src={p.previewUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
