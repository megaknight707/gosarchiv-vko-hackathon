// Контактный лист для проверки кадров: несколько картинок на одном листе (2 в ряд).
//   node scripts/contact-sheet.mjs <итог.jpg> <картинка1.jpg> <картинка2.jpg> …
import sharp from "sharp";

const [out, ...files] = process.argv.slice(2);
const W = 960;
const H = 540;
const cols = 2;
const rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(
  files.map(async (file, i) => ({
    input: await sharp(file).resize(W, H, { fit: "contain", background: "#222" }).toBuffer(),
    left: (i % cols) * W,
    top: Math.floor(i / cols) * H,
  })),
);
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: "#222" } }).composite(tiles).jpeg({ quality: 82 }).toFile(out);
