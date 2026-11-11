// Таймлайн видео из озвучки: когда начинается каждая сцена, фраза и строка субтитров.
// Тайминг сцен подгоняется под длительность голоса (а не наоборот).
// Результат: timeline.json (для монтажа), субтитры .ru.srt и сценарий docs/video/scenarij-ozvuchki.md.
//   node scripts/build-timeline.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const narration = JSON.parse(readFileSync(join(ROOT, "narration.json"), "utf8"));
const timing = JSON.parse(readFileSync(join(ROOT, "audio", "voice-timing.json"), "utf8"));

const round = (n) => Math.round(n * 1000) / 1000;
let cursor = narration.leadIn;
const scenes = timing.scenes.map((scene, index) => {
  const meta = narration.scenes.find((s) => s.id === scene.id);
  // Сцена начинается чуть раньше голоса: первая — с нуля, остальные — с середины паузы
  const start = index === 0 ? 0 : cursor - narration.pauseBetweenScenes / 2;
  const phrases = scene.phrases.map((phrase, i) => {
    if (i > 0) cursor += narration.pauseBetweenPhrases;
    const phraseStart = cursor;
    cursor += phrase.duration;
    return {
      file: phrase.file,
      trimStart: phrase.trimStart,
      start: round(phraseStart),
      end: round(cursor),
      cues: phrase.cues.map((cue) => ({ text: cue.text, start: round(phraseStart + cue.start), end: round(phraseStart + cue.end) })),
    };
  });
  const voiceEnd = cursor;
  cursor += narration.pauseBetweenScenes;
  return { id: scene.id, label: scene.label, screen: meta.screen, motion: meta.motion, start: round(start), voiceEnd: round(voiceEnd), phrases };
});
const duration = round(scenes.at(-1).voiceEnd + narration.tailHold);
scenes.forEach((scene, i) => (scene.end = i + 1 < scenes.length ? scenes[i + 1].start : duration));

writeFileSync(join(ROOT, "timeline.json"), JSON.stringify({ voice: timing.voice, duration, scenes }, null, 1));

// ── Субтитры SRT ──
const srtTime = (t) => {
  const ms = Math.round(t * 1000);
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
};
/** Перенос на две строки до ~42 символов — по ближайшему к середине пробелу */
export function wrapCue(text, max = 42) {
  if (text.length <= max) return text;
  const middle = text.length / 2;
  const spaces = [...text].map((ch, i) => (ch === " " ? i : -1)).filter((i) => i > 0);
  const split = spaces.reduce((best, i) => (Math.abs(i - middle) < Math.abs(best - middle) ? i : best), spaces[0]);
  const cut = text.slice(split + 1, split + 3) === "— " ? split + 2 : split; // тире не переносим в начало второй строки
  return `${text.slice(0, cut)}\n${text.slice(cut + 1)}`;
}
const cues = scenes.flatMap((s) => s.phrases.flatMap((p) => p.cues));
const srt = cues.map((cue, i) => `${i + 1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${wrapCue(cue.text)}\n`).join("\n");
mkdirSync(join(ROOT, "renders"), { recursive: true });
writeFileSync(join(ROOT, "renders", "gosarchiv-vko-videoprezentaciya.ru.srt"), srt);

// Переводы субтитров (те же тайминги): subtitles/kz.json и subtitles/en.json — по строке на каждую русскую
for (const lang of ["kz", "en"]) {
  const file = join(ROOT, "subtitles", `${lang}.json`);
  if (!existsSync(file)) continue;
  const lines = JSON.parse(readFileSync(file, "utf8"));
  if (lines.length !== cues.length) {
    console.warn(`⚠ subtitles/${lang}.json: строк ${lines.length}, а в озвучке ${cues.length} — файл .${lang}.srt не обновлён`);
    continue;
  }
  const translated = cues.map((cue, i) => `${i + 1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${wrapCue(lines[i])}\n`).join("\n");
  writeFileSync(join(ROOT, "renders", `gosarchiv-vko-videoprezentaciya.${lang}.srt`), translated);
}

// ── Сценарий с таймкодами (для чтения и перезаписи голоса) ──
const clock = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const words = narration.scenes.flatMap((s) => s.phrases.flatMap((p) => p.cues.map((c) => c.say ?? c.text))).join(" ").split(/\s+/).length;
const md = [
  "# Сценарий озвучки видеопрезентации",
  "",
  `Длительность: **${clock(duration)}** · ${scenes.length} сцен · ${words} слов · голос ${timing.voice} (темп ${timing.rate}).`,
  "",
  "Файл собирается автоматически из `video/narration.json` (`node scripts/build-timeline.mjs`) — правьте текст там.",
  "Чтобы перезаписать голос самостоятельно: читайте фразы по таймкодам ниже, в скобках — как произносить сокращения.",
  "",
  ...scenes.flatMap((scene) => {
    const meta = narration.scenes.find((s) => s.id === scene.id);
    return [
      `## ${scene.label} · ${clock(scene.start)}–${clock(scene.end)}`,
      "",
      `**На экране:** ${scene.screen}`,
      "",
      `**Анимация:** ${scene.motion}`,
      "",
      "**Текст:**",
      "",
      ...scene.phrases.map((phrase, i) => {
        const source = meta.phrases[i].cues;
        const text = source.map((c) => c.text).join(" ");
        const say = source.some((c) => c.say) ? ` _(читать: «${source.map((c) => c.say ?? c.text).join(" ")}»)_` : "";
        return `- \`${clock(phrase.start)}\` ${text}${say}`;
      }),
      "",
    ];
  }),
].join("\n");
mkdirSync(join(ROOT, "..", "docs", "video"), { recursive: true });
writeFileSync(join(ROOT, "..", "docs", "video", "scenarij-ozvuchki.md"), md);

console.log(`Длительность ${clock(duration)} (${duration} с), сцен ${scenes.length}, строк субтитров ${cues.length}, длинных строк (>84): ${cues.filter((c) => c.text.length > 84).length}`);
for (const s of scenes) console.log(`  ${clock(s.start)}–${clock(s.end)}  ${s.label}`);
