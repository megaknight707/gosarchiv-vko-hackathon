"use client";

// Выбор периода: двойной ползунок + поля ввода годов.
// Применяется, когда пользователь отпустил ползунок или закончил ввод (Enter / уход с поля).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { YEAR_MAX, YEAR_MIN } from "@/lib/search/catalog-filters";

export function PeriodRange({
  from,
  to,
  onCommit,
}: {
  from?: number;
  to?: number;
  onCommit: (from: number | undefined, to: number | undefined) => void;
}) {
  const t = useTranslations("Catalog");
  const [low, setLow] = useState(from ?? YEAR_MIN);
  const [high, setHigh] = useState(to ?? YEAR_MAX);
  const [lowText, setLowText] = useState(String(from ?? YEAR_MIN));
  const [highText, setHighText] = useState(String(to ?? YEAR_MAX));

  function commit(nextLow = low, nextHigh = high) {
    const a = Math.min(nextLow, nextHigh);
    const b = Math.max(nextLow, nextHigh);
    onCommit(a <= YEAR_MIN ? undefined : a, b >= YEAR_MAX ? undefined : b);
  }

  function commitText() {
    const a = Number.parseInt(lowText, 10);
    const b = Number.parseInt(highText, 10);
    const nextLow = Number.isFinite(a) ? Math.min(Math.max(a, YEAR_MIN), YEAR_MAX) : YEAR_MIN;
    const nextHigh = Number.isFinite(b) ? Math.min(Math.max(b, YEAR_MIN), YEAR_MAX) : YEAR_MAX;
    setLow(nextLow);
    setHigh(nextHigh);
    setLowText(String(nextLow));
    setHighText(String(nextHigh));
    commit(nextLow, nextHigh);
  }

  const span = YEAR_MAX - YEAR_MIN;
  const left = ((Math.min(low, high) - YEAR_MIN) / span) * 100;
  const right = ((Math.max(low, high) - YEAR_MIN) / span) * 100;

  const thumb =
    "pointer-events-none absolute inset-x-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-surface " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-surface";

  return (
    <div>
      <div className="relative mx-1 h-6" aria-hidden={false}>
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-chip" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${left}%`, right: `${100 - right}%` }} />
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={low}
          aria-label={t("yearFrom")}
          onChange={(e) => {
            setLow(+e.target.value);
            setLowText(e.target.value);
          }}
          onPointerUp={() => commit()}
          onKeyUp={(e) => e.key.startsWith("Arrow") && commit()}
          className={thumb}
        />
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={high}
          aria-label={t("yearTo")}
          onChange={(e) => {
            setHigh(+e.target.value);
            setHighText(e.target.value);
          }}
          onPointerUp={() => commit()}
          onKeyUp={(e) => e.key.startsWith("Arrow") && commit()}
          className={thumb}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">{t("yearFrom")}</span>
          <input
            inputMode="numeric"
            value={lowText}
            onChange={(e) => setLowText(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onBlur={commitText}
            onKeyDown={(e) => e.key === "Enter" && commitText()}
            className="h-9 w-full rounded-md border border-border bg-bg px-2 text-center font-mono text-sm"
          />
        </label>
        <span aria-hidden className="text-muted-ink">
          –
        </span>
        <label className="flex-1">
          <span className="sr-only">{t("yearTo")}</span>
          <input
            inputMode="numeric"
            value={highText}
            onChange={(e) => setHighText(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onBlur={commitText}
            onKeyDown={(e) => e.key === "Enter" && commitText()}
            className="h-9 w-full rounded-md border border-border bg-bg px-2 text-center font-mono text-sm"
          />
        </label>
      </div>
    </div>
  );
}
