// Картинка для соцсетей (Open Graph, 1200×630): фирменный знак и название, без фото.
//   npx tsx scripts/generate-og-image.ts  →  public/og-image.png
import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#15130F"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#D9A44A" stroke-width="3"/>
  <circle cx="190" cy="315" r="90" fill="none" stroke="#D9A44A" stroke-width="6" stroke-dasharray="10 8"/>
  <text x="190" y="340" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="700" fill="#D9A44A">ГА</text>
  <text x="315" y="265" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="700" fill="#EDE6D8">Государственный архив</text>
  <text x="315" y="325" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="700" fill="#EDE6D8">Восточно-Казахстанской области</text>
  <text x="315" y="395" font-family="Arial, sans-serif" font-size="24" fill="#A89F90">Каталог · Выставки · Архив памяти · Филиалы · KZ / RU / EN</text>
</svg>`;

sharp(Buffer.from(svg)).png().toFile("public/og-image.png").then(() => console.log("✅ public/og-image.png"));
