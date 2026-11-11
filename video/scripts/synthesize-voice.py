# Озвучка видеопрезентации: каждая фраза из narration.json синтезируется отдельным файлом
# (edge-tts, голос из поля "voice"), вместе с таймингом слов — по нему субтитры ставятся
# точно под голос. Результат: audio/voice/<сцена>-<номер>.mp3 и audio/voice-timing.json.
#   python scripts/synthesize-voice.py            — синтезировать только новые и изменённые фразы
#   python scripts/synthesize-voice.py --force    — пересоздать всё
import asyncio
import hashlib
import json
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "voice"
MP3_BYTES_PER_SECOND = 48_000 / 8  # формат edge-tts: 24 кГц, моно, постоянные 48 кбит/с


async def synthesize(say: str, voice: str, rate: str, target: Path):
    """Возвращает список слов с временем начала (в секундах) и длительность файла."""
    # Сервис иногда отвечает «No audio was received» — повторяем до 4 раз
    for attempt in range(4):
        words = []
        audio = bytearray()
        try:
            stream = edge_tts.Communicate(say, voice, rate=rate, boundary="WordBoundary").stream()
            async for chunk in stream:
                if chunk["type"] == "audio":
                    audio.extend(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    words.append({"text": chunk["text"], "start": chunk["offset"] / 1e7, "end": (chunk["offset"] + chunk["duration"]) / 1e7})
            break
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == 3:
                raise
            await asyncio.sleep(1.5 * (attempt + 1))
    target.write_bytes(audio)
    return words, len(audio) / MP3_BYTES_PER_SECOND


def cue_times(cues, say: str, words, duration: float):
    """Когда начинается каждая строка субтитров: время первого слова, попавшего в её часть текста."""
    # позиция каждого произнесённого слова в строке say
    positions, cursor = [], 0
    lowered = say.lower()
    for word in words:
        index = lowered.find(word["text"].lower(), cursor)
        if index < 0:
            index = cursor
        positions.append(index)
        cursor = index + len(word["text"])
    # границы строк субтитров в той же строке say
    starts, offset = [], 0
    for cue in cues:
        starts.append(offset)
        offset += len(cue.get("say", cue["text"])) + 1
    times = []
    for start in starts:
        first = next((w for w, pos in zip(words, positions) if pos >= start), None)
        times.append(first["start"] if first else duration)
    times[0] = 0.0
    result = []
    for i, cue in enumerate(cues):
        end = times[i + 1] if i + 1 < len(cues) else duration
        result.append({"text": cue["text"], "start": round(times[i], 3), "end": round(end, 3)})
    return result


async def main():
    force = "--force" in sys.argv
    config = json.loads((ROOT / "narration.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    cache_path = OUT.parent / "voice-timing.json"
    cache = {} if force or not cache_path.exists() else {p["file"]: p for s in json.loads(cache_path.read_text(encoding="utf-8"))["scenes"] for p in s["phrases"]}

    scenes, total_words, speech = [], 0, 0.0
    for scene in config["scenes"]:
        phrases = []
        for number, phrase in enumerate(scene["phrases"], start=1):
            say = " ".join(cue.get("say", cue["text"]) for cue in phrase["cues"])
            file = f"{scene['id']}-{number:02d}.mp3"
            digest = hashlib.sha1(f"v2|{config['voice']}|{config['rate']}|{say}".encode()).hexdigest()[:12]
            cached = cache.get(file)
            if cached and cached.get("digest") == digest and (OUT / file).exists():
                entry = cached
            else:
                words, full = await synthesize(say, config["voice"], config["rate"], OUT / file)
                # В начале и конце каждого файла ~0,5 с тишины — при монтаже берём только саму речь
                trim_start = max(0.0, words[0]["start"] - 0.05) if words else 0.0
                trim_end = min(full, words[-1]["end"] + 0.15) if words else full
                duration = trim_end - trim_start
                cues = cue_times(phrase["cues"], say, [{**w, "start": w["start"] - trim_start} for w in words], duration)
                entry = {"file": file, "digest": digest, "say": say, "trimStart": round(trim_start, 3), "duration": round(duration, 3), "cues": cues}
                print(f"  ♪ {file}  {duration:5.2f} с  {say[:60]}")
            phrases.append(entry)
            total_words += len(say.split())
            speech += entry["duration"]
        scenes.append({"id": scene["id"], "label": scene["label"], "phrases": phrases})

    cache_path.write_text(json.dumps({"voice": config["voice"], "rate": config["rate"], "scenes": scenes}, ensure_ascii=False, indent=1), encoding="utf-8")
    pauses = sum((len(s["phrases"]) - 1) * config["pauseBetweenPhrases"] for s in scenes) + (len(scenes) - 1) * config["pauseBetweenScenes"]
    print(f"Фраз: {sum(len(s['phrases']) for s in scenes)}, слов: {total_words}, речь: {speech:.1f} с ({total_words / speech * 60:.0f} слов/мин), с паузами: {speech + pauses:.1f} с")
    for s in scenes:
        length = sum(p["duration"] for p in s["phrases"]) + (len(s["phrases"]) - 1) * config["pauseBetweenPhrases"]
        print(f"  {s['label']:<34} {length:5.1f} с")


asyncio.run(main())
