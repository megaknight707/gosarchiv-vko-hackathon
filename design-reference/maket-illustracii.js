// Условные «сепия»-иллюстрации вместо реальных архивных фото (в проекте — снимки из фондов)
const P = { l: "#EADCBD", m: "#CDB68E", d: "#8C7354", dd: "#5A4630", k: "#35291C" };
function rnd(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

const art = {
  city(seed = 1) {
    const r = rnd(seed); let b = "";
    for (let x = 0; x < 1600; x += 38 + r() * 30) {
      const w = 30 + r() * 60, h = 60 + r() * 150, y = 470 - h;
      b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${r() > .5 ? P.dd : P.d}"/>`;
      for (let wy = y + 12; wy < 450; wy += 22) for (let wx = x + 6; wx < x + w - 8; wx += 14)
        if (r() > .35) b += `<rect x="${wx}" y="${wy}" width="6" height="9" fill="${P.m}" opacity=".55"/>`;
    }
    let arcs = ""; for (let i = 0; i < 7; i++) arcs += `<path d="M${220 + i * 160} 560 Q ${300 + i * 160} 500 ${380 + i * 160} 560" stroke="${P.k}" stroke-width="7" fill="none"/>`;
    return `<svg class="photo" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sky${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.l}"/><stop offset="1" stop-color="${P.m}"/></linearGradient></defs>
      <rect width="1600" height="700" fill="url(#sky${seed})"/>
      <polygon points="0,330 180,200 330,290 520,150 700,280 900,170 1100,300 1300,190 1600,310 1600,470 0,470" fill="${P.m}" opacity=".9"/>
      <polygon points="0,380 250,290 460,360 760,260 1000,370 1280,280 1600,370 1600,470 0,470" fill="${P.d}" opacity=".55"/>
      ${b}<rect y="470" width="1600" height="230" fill="${P.dd}"/><rect y="520" width="1600" height="180" fill="${P.d}" opacity=".7"/>
      <rect x="160" y="548" width="1240" height="14" fill="${P.k}"/>${arcs}
      <circle cx="1240" cy="120" r="46" fill="#F4EAD2" opacity=".7"/></svg>`;
  },
  factory(seed = 2) {
    const r = rnd(seed); let s = "";
    [180, 300, 420].forEach((x, i) => { s += `<rect x="${x}" y="${90 + i * 20}" width="34" height="${260 - i * 20}" fill="${P.dd}"/>`;
      for (let k = 0; k < 6; k++) s += `<circle cx="${x + 17 + k * 22 + r() * 10}" cy="${80 + i * 20 - k * 14}" r="${14 + k * 5}" fill="${P.m}" opacity="${.5 - k * .07}"/>`; });
    return `<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice"><rect width="600" height="400" fill="${P.l}"/>${s}
      <rect x="40" y="250" width="520" height="150" fill="${P.d}"/><rect x="90" y="210" width="200" height="60" fill="${P.dd}"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${70 + i * 54}" y="285" width="30" height="40" fill="${P.m}" opacity=".6"/>`).join("")}</svg>`;
  },
  people(seed = 3) {
    const r = rnd(seed); let s = "";
    for (let i = 0; i < 7; i++) { const x = 60 + i * 72 + r() * 10, y = 200 + (i % 2) * 18;
      s += `<circle cx="${x}" cy="${y}" r="24" fill="${P.dd}"/><path d="M${x - 38} 400 Q ${x - 36} ${y + 34} ${x} ${y + 30} Q ${x + 36} ${y + 34} ${x + 38} 400Z" fill="${i % 3 ? P.d : P.k}"/>`; }
    return `<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice"><rect width="600" height="400" fill="${P.m}"/><rect width="600" height="160" fill="${P.l}"/>${s}</svg>`;
  },
  doc(seed = 4, big = false) {
    const r = rnd(seed); let l = "";
    for (let y = 120; y < 560; y += 22) { const w = 260 + r() * 70; l += `<path d="M60 ${y} q ${w / 4} ${-4 + r() * 8} ${w / 2} 0 t ${w / 2} 0" stroke="#3B2E20" stroke-width="2.2" fill="none" opacity=".75"/>`; }
    return `<svg ${big ? 'class="page"' : ''} viewBox="0 0 430 620" preserveAspectRatio="xMidYMid slice"><rect width="430" height="620" fill="#E6D7B6"/>
      <rect x="14" y="14" width="402" height="592" fill="none" stroke="#B9A17A" stroke-width="2"/>
      <text x="215" y="80" text-anchor="middle" font-family="PT Serif" font-size="22" fill="#3B2E20">П Р О Т О К О Л  № 17</text>${l}
      <circle cx="320" cy="550" r="44" fill="none" stroke="#6E3B5A" stroke-width="3" opacity=".6"/><circle cx="320" cy="550" r="34" fill="none" stroke="#6E3B5A" stroke-width="1.5" opacity=".5"/>
      <path d="M60 560 c 30 -20 50 10 80 -8 s 40 6 60 -4" stroke="#1E2A55" stroke-width="2" fill="none" opacity=".7"/></svg>`;
  },
  portrait(seed = 5) {
    return `<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice"><rect width="600" height="400" fill="${P.d}"/>
      <ellipse cx="300" cy="200" rx="170" ry="190" fill="${P.l}"/><circle cx="300" cy="160" r="62" fill="${P.dd}"/>
      <path d="M170 400 Q 175 250 300 240 Q 425 250 430 400Z" fill="${P.k}"/><path d="M285 245 l15 40 l15 -40z" fill="${P.l}"/></svg>`;
  },
  map(seed = 6) {
    const r = rnd(seed); let s = "";
    for (let i = 0; i < 14; i++) s += `<path d="M${r() * 600} 0 C ${r() * 600} ${r() * 400}, ${r() * 600} ${r() * 400}, ${r() * 600} 400" stroke="${P.d}" stroke-width="1" fill="none" opacity=".5"/>`;
    return `<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice"><rect width="600" height="400" fill="${P.l}"/>${s}
      <path d="M0 260 C 150 220, 260 300, 380 230 S 560 180, 600 210" stroke="#5E8A93" stroke-width="10" fill="none" opacity=".7"/>
      <circle cx="380" cy="230" r="9" fill="#8E2A1F"/><circle cx="160" cy="150" r="6" fill="#8E2A1F"/><circle cx="480" cy="110" r="6" fill="#8E2A1F"/>
      <rect x="20" y="20" width="560" height="360" fill="none" stroke="${P.dd}" stroke-width="3"/></svg>`;
  },
};

// Схематичная карта филиалов (в проекте — Leaflet + OpenStreetMap)
function branchMap(dark) {
  const bg = dark ? "#1B1915" : "#EEF0EA", road = dark ? "#2D2A24" : "#FFFFFF", water = dark ? "#1E3337" : "#C9DDE0", green = dark ? "#1E2419" : "#DDE7D2";
  const pin = (x, y, main, c) => `<g transform="translate(${x} ${y})"><path d="M0 0 C -14 -18 -16 -26 -16 -32 a16 16 0 0 1 32 0 c 0 6 -2 14 -16 32z" fill="${c}"/><circle cy="-32" r="${main ? 7 : 5}" fill="${dark ? '#15130F' : '#fff'}"/></g>`;
  const acc = dark ? "#D9A44A" : "#8E2A1F", acc2 = dark ? "#5FB3BF" : "#1F5E6B";
  return `<svg viewBox="0 0 560 360" preserveAspectRatio="xMidYMid slice"><rect width="560" height="360" fill="${bg}"/>
    <path d="M-10 70 C 120 60, 180 150, 300 140 S 470 220, 580 200 L 580 250 C 470 270, 330 200, 290 190 S 110 110, -10 120Z" fill="${water}"/>
    <rect x="60" y="210" width="120" height="90" rx="10" fill="${green}"/><rect x="380" y="40" width="110" height="70" rx="10" fill="${green}"/>
    ${[40, 110, 180, 260, 330].map(y => `<path d="M0 ${y} L560 ${y + 30}" stroke="${road}" stroke-width="${y === 260 ? 9 : 5}"/>`).join("")}
    ${[90, 210, 330, 450].map(x => `<path d="M${x} 0 L${x - 40} 360" stroke="${road}" stroke-width="5"/>`).join("")}
    <path d="M150 300 C 220 260, 260 230, 292 186" stroke="${acc2}" stroke-width="4" stroke-dasharray="8 6" fill="none"/>
    <circle cx="150" cy="300" r="8" fill="${acc2}" stroke="${dark ? '#15130F' : '#fff'}" stroke-width="3"/>
    ${pin(292, 186, true, acc)}${pin(120, 120, false, acc2)}${pin(440, 230, false, acc2)}${pin(470, 90, false, acc2)}
    <g font-family="PT Sans" font-size="12" fill="${dark ? '#EDE6D8' : '#1E1A15'}"><rect x="300" y="132" width="132" height="24" rx="6" fill="${dark ? '#1F1C17' : '#fff'}"/><text x="308" y="149" font-weight="700">Центральное здание</text>
    <text x="120" y="326" fill="${acc2}" font-weight="700">Вы здесь · 2,4 км</text></g>
    <g transform="translate(520 300)" font-family="PT Sans" font-size="18" fill="${dark ? '#EDE6D8' : '#1E1A15'}"><rect x="-14" y="-40" width="28" height="56" rx="6" fill="${dark ? '#1F1C17' : '#fff'}" stroke="${dark ? '#2E2A23' : '#E2D9C8'}"/><text x="-5" y="-20">+</text><text x="-4" y="8">−</text></g></svg>`;
}

document.querySelectorAll("[data-art]").forEach(el => {
  const [k, s, big] = el.dataset.art.split(":");
  el.insertAdjacentHTML("afterbegin", art[k](+s || 1, !!big));
});
document.querySelectorAll("[data-map]").forEach(el => el.insertAdjacentHTML("afterbegin", branchMap(document.documentElement.dataset.theme === "dark")));
