// Звуковая дорожка видео: фразы озвучки расставляются по таймлайну, громкость приводится к −16 LUFS.
//   node scripts/mix-audio.mjs                — только голос (так собран ролик: фоновую музыку убрали)
//   node scripts/mix-audio.mjs --voice-only   — то же в MP3-черновик (проверить произношение)
//   node scripts/mix-audio.mjs --music <файл> — подложить свою музыку: тише голоса и с приглушением под репликами
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const timeline = JSON.parse(readFileSync(join(ROOT, "timeline.json"), "utf8"));
const voiceOnly = process.argv.includes("--voice-only");
const phrases = timeline.scenes.flatMap((s) => s.phrases);
mkdirSync(join(ROOT, "renders"), { recursive: true });
mkdirSync(join(ROOT, "audio"), { recursive: true });

function ffmpeg(args) {
  const result = spawnSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "ffmpeg завершился с ошибкой");
}

// 1. Голос: из каждого файла берём только речь (без тишины по краям) и ставим на своё время
const inputs = phrases.flatMap((p) => ["-i", join(ROOT, "audio", "voice", p.file)]);
const chains = phrases.map((p, i) => {
  const length = p.end - p.start;
  return `[${i}:a]atrim=start=${p.trimStart}:duration=${length.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(length - 0.06).toFixed(3)}:d=0.06,adelay=${Math.round(p.start * 1000)}:all=1[v${i}]`;
});
const voiceFilter = `${chains.join(";")};${phrases.map((_, i) => `[v${i}]`).join("")}amix=inputs=${phrases.length}:normalize=0:duration=longest,apad=whole_dur=${timeline.duration}[voice]`;
const voiceWav = join(ROOT, "audio", "voice-track.wav");
ffmpeg([...inputs, "-filter_complex", voiceFilter, "-map", "[voice]", "-ar", "48000", "-ac", "2", voiceWav]);

if (voiceOnly) {
  const draft = join(ROOT, "renders", "ozvuchka-chernovik.mp3");
  ffmpeg(["-i", voiceWav, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-b:a", "160k", draft]);
  console.log(`Черновик озвучки: ${draft} (${timeline.duration} с)`);
  process.exit(0);
}

// 2. Сведение. Без музыки — просто голос; с музыкой — она звучит тихо и приглушается под репликами (sidechain)
const mixed = join(ROOT, "audio", "soundtrack.wav");
const musicIndex = process.argv.indexOf("--music");
const music = musicIndex >= 0 ? process.argv[musicIndex + 1] : null;
if (music) {
  if (!existsSync(music)) throw new Error(`Файл музыки не найден: ${music}`);
  ffmpeg([
    "-i", voiceWav, "-stream_loop", "-1", "-i", music,
    "-filter_complex",
    `[0:a]asplit=2[voice][key];[1:a]atrim=duration=${timeline.duration},volume=0.12,afade=t=in:d=2,afade=t=out:st=${(timeline.duration - 3).toFixed(2)}:d=3[music];[music][key]sidechaincompress=threshold=0.02:ratio=4:attack=40:release=600[ducked];[voice][ducked]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[out]`,
    "-map", "[out]", "-ar", "48000", mixed,
  ]);
} else {
  ffmpeg(["-i", voiceWav, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", mixed]);
}
console.log(`Звуковая дорожка${music ? " с музыкой" : " (только голос)"}: ${mixed} (${timeline.duration} с)`);
