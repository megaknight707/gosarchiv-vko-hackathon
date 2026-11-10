// Простая горизонтальная столбчатая диаграмма на HTML/CSS: подпись, полоса, число.
// Числа подписаны текстом — диаграмма понятна и без цвета, и для экранного диктора.
export function BarChart({ items, label }: { items: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className="space-y-1.5 text-sm">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-2">
          <span className="truncate" title={item.label}>
            {item.label}
          </span>
          <span className="h-3 rounded-full bg-chip" aria-hidden>
            <span className="block h-3 rounded-full bg-accent-2" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          </span>
          <span className="w-12 text-right font-mono text-xs">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Столбики по дням (поиск за период) — SVG с подписью итога */
export function DailyColumns({ points, label }: { points: { day: string; count: number }[]; label: string }) {
  if (points.length === 0) return null;
  const max = Math.max(1, ...points.map((p) => p.count));
  const width = Math.max(points.length * 12, 120);
  return (
    <svg viewBox={`0 0 ${width} 60`} role="img" aria-label={label} className="h-24 w-full" preserveAspectRatio="none">
      {points.map((p, i) => {
        const h = Math.max(2, (p.count / max) * 56);
        return (
          <rect key={p.day} x={i * 12 + 2} y={60 - h} width={8} height={h} rx={2} fill="var(--accent-2)">
            <title>{`${p.day}: ${p.count}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
