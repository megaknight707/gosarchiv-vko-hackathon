// Генератор демонстрационных «сканов» для каталога.
//   npm run scans
// Рисует страницы в SVG (бумага, «машинописные» строки, печать, водяной знак «ДЕМО»)
// и конвертирует их в WebP через sharp: полноразмерная копия + миниатюра.
// Результат: public/uploads/demo/doc-XXX/p1.webp, p1-thumb.webp, …
//
// Это НЕ исторические изображения и не имитация реальных документов —
// условные иллюстрации с явной пометкой «ДЕМО».
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { demoPageCount, documents, hasDemoScans, scanSize, type DemoDocument } from "../prisma/demo-data/documents";

const OUT_DIR = path.join(process.cwd(), "public", "uploads", "demo");
const THUMB_WIDTH = 320;
const MAX_PAGE_BYTES = 250 * 1024;

// Детерминированный генератор псевдослучайных чисел (одинаковые картинки при каждом запуске)
function rng(seed: number) {
  let state = seed % 2147483647 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function escapeXml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Перенос длинного заголовка на строки */
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

const PAPER = `
  <defs>
    <radialGradient id="paper" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#f4ead2"/>
      <stop offset="80%" stop-color="#e9dbb9"/>
      <stop offset="100%" stop-color="#d9c59a"/>
    </radialGradient>
    <linearGradient id="sepia" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d8c7a3"/>
      <stop offset="55%" stop-color="#b59c72"/>
      <stop offset="100%" stop-color="#7d6544"/>
    </linearGradient>
  </defs>`;

function watermark(width: number, height: number) {
  const size = Math.round(Math.min(width, height) * 0.22);
  return `
    <g transform="translate(${width / 2} ${height / 2}) rotate(-28)" opacity="0.13">
      <text x="0" y="${size / 3}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="${size}" font-weight="700" fill="#8e2a1f" letter-spacing="${size / 10}">ДЕМО</text>
    </g>
    <text x="${width - 40}" y="${height - 30}" text-anchor="end" font-family="Arial, sans-serif" font-size="22"
      fill="#8e2a1f" opacity="0.75">Демонстрационная иллюстрация · не архивный документ</text>`;
}

function stamp(cx: number, cy: number, r: number) {
  return `
    <g transform="rotate(-12 ${cx} ${cy})" opacity="0.55" fill="none" stroke="#3d4f8a">
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="5"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 14}" stroke-width="2"/>
      <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${r / 3.6}"
        fill="#3d4f8a" stroke="none" font-weight="700">ГОСАРХИВ</text>
      <text x="${cx}" y="${cy + r / 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${r / 4.2}"
        fill="#3d4f8a" stroke="none">ВКО · ДЕМО</text>
    </g>`;
}

// ───────────── Фотография ─────────────

function photoSvg(doc: DemoDocument, page: number, random: () => number) {
  const { width, height } = scanSize(doc.type);
  const pad = 70;
  const photoW = width - pad * 2;
  const photoH = height - pad * 2 - 110;
  const horizon = pad + photoH * (0.52 + random() * 0.1);
  const isBack = page === 2;

  if (isBack) {
    // Оборот фотографии: надпись от руки (условно) и штамп
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${PAPER}
      <rect width="100%" height="100%" fill="url(#paper)"/>
      <text x="${pad + 20}" y="${pad + 90}" font-family="Georgia, serif" font-style="italic" font-size="44" fill="#4a3b2a">${escapeXml(doc.titleRu)}</text>
      <text x="${pad + 20}" y="${pad + 160}" font-family="Georgia, serif" font-style="italic" font-size="40" fill="#4a3b2a">${doc.year} г.</text>
      ${stamp(width - 260, height - 300, 120)}
      ${watermark(width, height)}
    </svg>`;
  }

  const tags = new Set(doc.tags);
  let scene = "";
  // земля и река
  scene += `<rect x="${pad}" y="${horizon}" width="${photoW}" height="${pad + photoH - horizon}" fill="#6e583b" opacity="0.55"/>`;
  if (tags.has("city") || tags.has("energy") || random() > 0.5) {
    scene += `<path d="M${pad} ${horizon + 90} C ${width * 0.35} ${horizon + 40}, ${width * 0.6} ${horizon + 150}, ${pad + photoW} ${horizon + 80} L ${pad + photoW} ${horizon + 150} C ${width * 0.6} ${horizon + 220}, ${width * 0.35} ${horizon + 110}, ${pad} ${horizon + 170} Z" fill="#cdbb95" opacity="0.8"/>`;
  }
  // холмы на горизонте
  scene += `<path d="M${pad} ${horizon} Q ${width * 0.25} ${horizon - 120} ${width * 0.45} ${horizon - 30} T ${pad + photoW} ${horizon - 60} L ${pad + photoW} ${horizon} Z" fill="#8f7754" opacity="0.6"/>`;

  if (tags.has("industry") || tags.has("energy") || tags.has("construction")) {
    for (let i = 0; i < 4; i++) {
      const x = pad + 120 + i * (photoW / 4.5) + random() * 40;
      const h = 160 + random() * 160;
      scene += `<rect x="${x}" y="${horizon - h}" width="${36 + random() * 20}" height="${h}" fill="#4f3e2a" opacity="0.85"/>`;
      scene += `<ellipse cx="${x + 25}" cy="${horizon - h - 50}" rx="${50 + random() * 40}" ry="${28 + random() * 14}" fill="#e8dcc2" opacity="0.5"/>`;
    }
    scene += `<rect x="${pad + 60}" y="${horizon - 120}" width="${photoW * 0.75}" height="120" fill="#5c4831" opacity="0.8"/>`;
  }
  if (tags.has("energy")) {
    scene += `<rect x="${pad}" y="${horizon - 40}" width="${photoW}" height="70" fill="#a08a64"/>`;
    for (let i = 0; i < 12; i++) scene += `<rect x="${pad + 40 + i * (photoW / 12)}" y="${horizon - 40}" width="22" height="70" fill="#6b5639"/>`;
  }
  if (tags.has("city") || tags.has("culture") || tags.has("education")) {
    for (let i = 0; i < 9; i++) {
      const w = 90 + random() * 110;
      const h = 90 + random() * 220;
      const x = pad + 30 + i * (photoW / 9);
      scene += `<rect x="${x}" y="${horizon - h}" width="${w}" height="${h}" fill="#5a4730" opacity="${0.55 + random() * 0.35}"/>`;
      for (let wy = horizon - h + 20; wy < horizon - 25; wy += 34) {
        for (let wx = x + 12; wx < x + w - 18; wx += 26) {
          scene += `<rect x="${wx}" y="${wy}" width="12" height="16" fill="#e2d3b0" opacity="0.55"/>`;
        }
      }
    }
  }
  if (!tags.has("industry") && !tags.has("energy")) {
    // условные фигуры людей
    for (let i = 0; i < 7 + Math.floor(random() * 6); i++) {
      const x = pad + 120 + random() * (photoW - 240);
      const y = horizon + 120 + random() * 120;
      scene += `<circle cx="${x}" cy="${y - 70}" r="16" fill="#3e3020"/><rect x="${x - 18}" y="${y - 54}" width="36" height="74" rx="12" fill="#3e3020"/>`;
    }
  }
  if (tags.has("agriculture") || tags.has("virgin-lands")) {
    for (let i = 0; i < 14; i++) {
      scene += `<line x1="${pad}" y1="${horizon + 30 + i * 22}" x2="${pad + photoW}" y2="${horizon + 10 + i * 26}" stroke="#4f3e2a" stroke-width="3" opacity="0.4"/>`;
    }
  }

  const titleLines = wrap(doc.titleRu, 70);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${PAPER}
    <rect width="100%" height="100%" fill="url(#paper)"/>
    <rect x="${pad - 12}" y="${pad - 12}" width="${photoW + 24}" height="${photoH + 24}" fill="#f8f1e0"/>
    <svg x="${pad}" y="${pad}" width="${photoW}" height="${photoH}" viewBox="${pad} ${pad} ${photoW} ${photoH}">
      <rect x="${pad}" y="${pad}" width="${photoW}" height="${photoH}" fill="url(#sepia)"/>
      ${scene}
    </svg>
    ${titleLines.map((line, i) => `<text x="${pad}" y="${pad + photoH + 60 + i * 38}" font-family="Georgia, 'Times New Roman', serif" font-size="32" fill="#3b2f22">${escapeXml(line)}${i === titleLines.length - 1 ? `, ${doc.year}` : ""}</text>`).join("")}
    ${watermark(width, height)}
  </svg>`;
}

// ───────────── Карта / чертёж ─────────────

function mapSvg(doc: DemoDocument, page: number, random: () => number) {
  const { width, height } = scanSize(doc.type);
  let grid = "";
  for (let x = 80; x < width - 80; x += 80) grid += `<line x1="${x}" y1="80" x2="${x}" y2="${height - 160}" stroke="#7b8fa3" stroke-width="1" opacity="0.35"/>`;
  for (let y = 80; y < height - 160; y += 80) grid += `<line x1="80" y1="${y}" x2="${width - 80}" y2="${y}" stroke="#7b8fa3" stroke-width="1" opacity="0.35"/>`;
  let blocks = "";
  for (let i = 0; i < 26; i++) {
    const x = 140 + random() * (width - 420);
    const y = 140 + random() * (height - 480);
    blocks += `<rect x="${x}" y="${y}" width="${60 + random() * 140}" height="${40 + random() * 100}" fill="none" stroke="#4a3b2a" stroke-width="3" opacity="0.7"/>`;
  }
  const river = `<path d="M 80 ${height * 0.35} C ${width * 0.3} ${height * 0.2}, ${width * 0.55} ${height * 0.7}, ${width - 80} ${height * 0.5}" stroke="#4c7f95" stroke-width="${26 + page * 4}" fill="none" opacity="0.55"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${PAPER}
    <rect width="100%" height="100%" fill="url(#paper)"/>
    <rect x="70" y="70" width="${width - 140}" height="${height - 220}" fill="none" stroke="#4a3b2a" stroke-width="4"/>
    ${grid}${river}${blocks}
    <g transform="translate(${width - 200} 190)"><circle r="60" fill="none" stroke="#4a3b2a" stroke-width="3"/>
      <path d="M0 -55 L14 0 L0 55 L-14 0 Z" fill="#4a3b2a"/><text y="-70" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#4a3b2a">С</text></g>
    <text x="90" y="${height - 100}" font-family="Georgia, 'Times New Roman', serif" font-size="36" fill="#3b2f22">${escapeXml(doc.titleRu)} · ${doc.year}</text>
    <text x="90" y="${height - 60}" font-family="'Courier New', monospace" font-size="24" fill="#5b4a36">Лист ${page}</text>
    ${watermark(width, height)}
  </svg>`;
}

// ───────────── Машинописный документ ─────────────

function textSvg(doc: DemoDocument, page: number, pages: number, random: () => number) {
  const { width, height } = scanSize(doc.type);
  const left = 150;
  const right = width - 140;
  let content = "";
  let y = 220;
  if (page === 1) {
    content += `<text x="${width / 2}" y="170" text-anchor="middle" font-family="'Courier New', monospace" font-size="30" font-weight="700" fill="#2d241a">${doc.type === "PERSONAL" ? "ЛИЧНЫЙ ФОНД" : "ГОСУДАРСТВЕННЫЙ АРХИВ"}</text>`;
    const titleLines = wrap(doc.titleRu.toUpperCase(), 44);
    titleLines.forEach((line, i) => {
      content += `<text x="${width / 2}" y="${260 + i * 46}" text-anchor="middle" font-family="'Courier New', monospace" font-size="34" font-weight="700" fill="#2d241a">${escapeXml(line)}</text>`;
    });
    y = 300 + titleLines.length * 46;
    content += `<text x="${width / 2}" y="${y}" text-anchor="middle" font-family="'Courier New', monospace" font-size="28" fill="#2d241a">${doc.year} г.</text>`;
    y += 80;
  }
  // «строки текста» — серые полосы разной длины (без выдуманного содержания)
  const handwritten = doc.type === "PERSONAL";
  while (y < height - 260) {
    const indent = random() > 0.85 ? 70 : 0;
    const lineWidth = (right - left - indent) * (random() > 0.88 ? 0.35 + random() * 0.4 : 0.9 + random() * 0.1);
    if (handwritten) {
      content += `<path d="M ${left + indent} ${y} q 40 -10 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0" stroke="#2f3f78" stroke-width="3" fill="none" opacity="0.55" stroke-dasharray="${lineWidth} 2000"/>`;
    } else {
      content += `<rect x="${left + indent}" y="${y - 16}" width="${lineWidth}" height="16" rx="3" fill="#2d241a" opacity="${0.22 + random() * 0.12}"/>`;
    }
    y += random() > 0.93 ? 80 : 46;
  }
  if (page === pages) content += stamp(width - 330, height - 330, 110);
  content += `<text x="${width / 2}" y="${height - 120}" text-anchor="middle" font-family="'Courier New', monospace" font-size="26" fill="#5b4a36">— ${page} —</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${PAPER}
    <rect width="100%" height="100%" fill="url(#paper)"/>
    <line x1="${left - 40}" y1="0" x2="${left - 40}" y2="${height}" stroke="#c9a77a" stroke-width="2" opacity="0.5"/>
    ${content}
    ${watermark(width, height)}
  </svg>`;
}

function pageSvg(doc: DemoDocument, page: number, pages: number, seed: number) {
  const random = rng(seed);
  if (doc.type === "PHOTO") return photoSvg(doc, page, random);
  if (doc.type === "MAP_DRAWING") return mapSvg(doc, page, random);
  return textSvg(doc, page, pages, random);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  let files = 0;
  let totalBytes = 0;
  let maxBytes = 0;

  for (const [index, doc] of documents.entries()) {
    if (!hasDemoScans(doc)) continue;
    const pages = demoPageCount(doc, index);
    const dir = path.join(OUT_DIR, doc.key);
    await fs.mkdir(dir, { recursive: true });

    for (let page = 1; page <= pages; page++) {
      const svg = pageSvg(doc, page, pages, (index + 1) * 1000 + page);
      const image = sharp(Buffer.from(svg));
      let quality = 74;
      let full = await image.clone().webp({ quality }).toBuffer();
      while (full.length > MAX_PAGE_BYTES && quality > 40) {
        quality -= 8;
        full = await image.clone().webp({ quality }).toBuffer();
      }
      const thumb = await image.clone().resize({ width: THUMB_WIDTH }).webp({ quality: 70 }).toBuffer();
      await fs.writeFile(path.join(dir, `p${page}.webp`), full);
      await fs.writeFile(path.join(dir, `p${page}-thumb.webp`), thumb);
      files += 2;
      totalBytes += full.length + thumb.length;
      maxBytes = Math.max(maxBytes, full.length);
    }
    process.stdout.write(".");
  }

  console.log(`\n✅ Сгенерировано файлов: ${files} в ${path.relative(process.cwd(), OUT_DIR)}`);
  console.log(`   Общий объём: ${(totalBytes / 1024 / 1024).toFixed(1)} МБ, самая тяжёлая страница: ${Math.round(maxBytes / 1024)} КБ`);
}

main().catch((error) => {
  console.error("❌ Ошибка генерации сканов:", error);
  process.exitCode = 1;
});
