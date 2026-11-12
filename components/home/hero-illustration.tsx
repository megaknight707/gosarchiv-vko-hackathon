// Стилизованная иллюстрация первого экрана (горы Алтая, силуэт города, мост через Иртыш).
// Это не историческое фото, а условный рисунок в стиле макета — см. подпись под ним.
// Детерминированные «окна», чтобы сервер и браузер рисовали одно и то же.

const BUILDINGS = [
  [0, 230, 60], [70, 180, 50], [130, 250, 70], [210, 200, 40], [260, 290, 80], [350, 220, 55], [415, 170, 45],
  [470, 260, 75], [555, 210, 50], [615, 300, 85], [710, 230, 60], [780, 190, 45], [835, 270, 70], [915, 215, 55],
  [980, 285, 80], [1070, 200, 50], [1130, 250, 65], [1205, 180, 45], [1260, 240, 70], [1340, 205, 60],
] as const;

export function HeroIllustration() {
  return (
    <svg aria-hidden viewBox="0 0 1440 560" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9db0c9" />
          <stop offset="1" stopColor="#4c6283" />
        </linearGradient>
      </defs>
      <rect width="1440" height="560" fill="url(#hero-sky)" />
      <circle cx="1120" cy="120" r="46" fill="#e7edf6" opacity=".55" />
      <path d="M0 330 L180 210 L330 300 L520 170 L700 290 L860 200 L1040 300 L1230 190 L1440 290 L1440 560 L0 560Z" fill="#3f5577" opacity=".55" />
      <path d="M0 380 L240 300 L420 360 L640 280 L860 370 L1080 300 L1300 360 L1440 320 L1440 560 L0 560Z" fill="#33476a" opacity=".6" />
      {BUILDINGS.map(([x, h, w], i) => (
        <g key={x} fill="#1d2c48" opacity={0.75 + (i % 3) * 0.08}>
          <rect x={x} y={560 - 90 - h} width={w} height={h} />
          {Array.from({ length: Math.floor(h / 34) }, (_, row) =>
            Array.from({ length: Math.floor(w / 22) }, (_, col) =>
              (row + col + i) % 3 === 0 ? null : (
                <rect key={`${row}-${col}`} x={x + 8 + col * 20} y={560 - 90 - h + 14 + row * 32} width="9" height="13" fill="#f1d9a8" opacity=".45" />
              ),
            ),
          )}
        </g>
      ))}
      <rect x="0" y="470" width="1440" height="90" fill="#17233b" />
      <path d="M0 500 Q 120 455 240 500 T 480 500 T 720 500 T 960 500 T 1200 500 T 1440 500" fill="none" stroke="#0f1829" strokeWidth="10" />
      <rect x="0" y="498" width="1440" height="8" fill="#0f1829" />
      <path d="M0 530 Q 360 515 720 530 T 1440 530 L1440 560 L0 560Z" fill="#7fa6e8" opacity=".35" />
    </svg>
  );
}
