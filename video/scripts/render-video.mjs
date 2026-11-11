// Рендер видео: монтажная сцена (stage/) снимается покадрово, затем ffmpeg собирает MP4 со звуком.
//   node scripts/render-video.mjs --preview            — превью 1280×720
//   node scripts/render-video.mjs --final              — финал 1920×1080
//   node scripts/render-video.mjs --stills 3.5,12,40   — только отдельные кадры (проверка), в renders/kadry/
// Дополнительно: --from 40 --to 60 (фрагмент), --workers 4 (сколько вкладок снимают кадры параллельно).
import { spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import ffmpegPath from "ffmpeg-static";
import QRCode from "qrcode";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const SITE_URL = "https://gosarchiv-vko-hackathon.vercel.app";

// QR-код рабочей ссылки для финального кадра
writeFileSync(join(ROOT, "stage", "qr.svg"), await QRCode.toString(SITE_URL, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1e1a15", light: "#0000" } }));

// Маленький статический сервер: сцена читает timeline.json, записи экрана и шрифты по HTTP
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff" };
const server = createServer((req, res) => {
  const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!path.startsWith(ROOT) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(path)] ?? "application/octet-stream", "Cache-Control": "max-age=3600" });
  createReadStream(path).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
async function openStage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => console.error("Ошибка сцены:", error.message));
  page.on("console", (msg) => msg.type() === "error" && console.error("Консоль сцены:", msg.text()));
  await page.goto(`${origin}/stage/index.html`);
  await page.waitForFunction(() => window.stageReady === true, null, { timeout: 60000 });
  return page;
}

try {
  if (flag("--stills")) {
    const out = join(ROOT, "renders", "kadry");
    mkdirSync(out, { recursive: true });
    const page = await openStage();
    for (const t of value("--stills").split(",").map(Number)) {
      await page.evaluate((time) => window.renderFrame(time), t);
      await page.screenshot({ path: join(out, `t${t.toFixed(2).padStart(6, "0")}.jpg`), type: "jpeg", quality: 85 });
    }
    console.log(`Кадры: ${out}`);
  } else {
    const final = flag("--final");
    const framesDir = join(ROOT, ".frames");
    rmSync(framesDir, { recursive: true, force: true });
    mkdirSync(framesDir, { recursive: true });
    const first = await openStage();
    const duration = await first.evaluate(() => window.videoDuration);
    const from = Math.round(Number(value("--from") ?? 0) * FPS);
    const total = Math.round(Math.min(duration, Number(value("--to") ?? duration)) * FPS);
    const pages = [first, ...(await Promise.all(Array.from({ length: Number(value("--workers") ?? 4) - 1 }, openStage)))];
    let next = from;
    let done = 0;
    const started = Date.now();
    await Promise.all(
      pages.map(async (page) => {
        while (next < total) {
          const frame = next++;
          await page.evaluate((time) => window.renderFrame(time), frame / FPS);
          await page.screenshot({ path: join(framesDir, `f${String(frame - from).padStart(5, "0")}.jpg`), type: "jpeg", quality: final ? 96 : 90 });
          if (++done % 300 === 0) console.log(`  кадров ${done}/${total - from} · ${Math.round((Date.now() - started) / 1000)} с`);
        }
      }),
    );
    const name = final ? "gosarchiv-vko-videoprezentaciya-1080p.mp4" : "gosarchiv-vko-videoprezentaciya-preview.mp4";
    const output = join(ROOT, "renders", value("--out") ?? name);
    const audio = join(ROOT, "audio", "soundtrack.wav");
    const ffmpegArgs = ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(FPS), "-i", join(framesDir, "f%05d.jpg")];
    if (existsSync(audio)) ffmpegArgs.push("-ss", String(from / FPS), "-i", audio);
    ffmpegArgs.push("-vf", final ? "format=yuv420p" : "scale=1280:720:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-profile:v", "high", "-preset", final ? "slow" : "medium", "-crf", final ? "17" : "21", "-r", String(FPS));
    if (existsSync(audio)) ffmpegArgs.push("-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest");
    ffmpegArgs.push("-movflags", "+faststart", output);
    const code = await new Promise((resolve) => spawn(ffmpegPath, ffmpegArgs, { stdio: "inherit" }).on("close", resolve));
    if (code !== 0) throw new Error("ffmpeg завершился с ошибкой");
    if (!flag("--keep-frames")) rmSync(framesDir, { recursive: true, force: true });
    console.log(`Готово: ${output} · ${((total - from) / FPS).toFixed(1)} с · ${(statSync(output).size / 1048576).toFixed(1)} МБ · рендер ${Math.round((Date.now() - started) / 1000)} с`);
  }
} finally {
  await browser.close();
  server.close();
}
