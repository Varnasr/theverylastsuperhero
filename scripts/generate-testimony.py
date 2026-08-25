#!/usr/bin/env python3
"""
Generates the Salt Lamp testimony — the human side of the archive.

The words are the novel's own oral records, not invented for the site. Each is
read in Hindi by a distinct Indian voice, because that is what these people
would speak and because a lamp in Kishanganj is not going to answer in RP.

Piper's catalogue has no Indian-English voice, so English is carried by the
transcript rather than faked with an accent. Three Hindi voices keep the
speakers apart:

    priyamvada  — Nandini Maa, the tea stall
    rohan       — Rohan Kapoor (the voice happens to share his name)
    pratham     — Kishore Mehta, the librarian

These are readings, not recordings of the people who lived it. When real voices
arrive they replace these, which is the point of the whole feature.

Usage:
    pip install piper-tts lameenc
    python3 -m piper.download_voices hi_IN-priyamvada-medium hi_IN-rohan-medium \
        hi_IN-pratham-medium --data-dir .voices
    python3 scripts/generate-testimony.py
"""

from __future__ import annotations

import io
import math
import sys
import wave
from array import array
from pathlib import Path

OUT = Path("public/audio")
VOICE_DIR = Path(".voices")

TESTIMONY = [
    {
        "slug": "testimony-nandini",
        "voice": "hi_IN-priyamvada-medium",
        "text": (
            "यह कभी एक समन्वय केंद्र हुआ करता था। "
            "इसीलिए ज़मीन के नीचे संचार लाइनें आज भी गूँजती हैं। "
            "सुपरहीरो यहाँ से गुज़रे थे, एक बार, "
            "उन बचाव अभियानों की ओर जो असफल रहे।"
        ),
    },
    {
        "slug": "testimony-rohan",
        "voice": "hi_IN-rohan-medium",
        "text": (
            "कभी-कभी हमें समस्या हल करने को नहीं मिलती। "
            "कभी-कभी हमें बस उसके पास रहना होता है, "
            "और फिर भी कोशिश करते रहना होता है।"
        ),
    },
    {
        "slug": "testimony-mehta",
        "voice": "hi_IN-pratham-medium",
        "text": (
            "कभी-कभी हमारे पूर्वज हमारे पास लौट आते हैं, "
            "चींटियों या कौवों के रूप में, हमें राह दिखाने। "
            "जैसे चंद्रमा रात भर तारों को राह दिखाता है।"
        ),
    },
]

# A lamp is not a hard drive. Testimony comes back warmer and slightly unsteady,
# so a gentle wobble and a little room tone — nothing like the harsh degradation
# the intercepted broadcast gets.
TREMOLO_HZ = 0.7
TREMOLO_DEPTH = 0.06
ROOM_TONE = 90.0


def synthesise(voice, text: str) -> tuple[bytes, int, int]:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        voice.synthesize_wav(text, w)
    buf.seek(0)
    with wave.open(buf, "rb") as w:
        return w.readframes(w.getnframes()), w.getframerate(), w.getnchannels()


def warm(pcm: bytes, rate: int) -> bytes:
    """A slow breath in the level and a quiet noise floor. Deterministic."""
    s = array("h")
    s.frombytes(pcm)
    seed = 0x51A7
    for i in range(len(s)):
        gain = 1.0 - TREMOLO_DEPTH + TREMOLO_DEPTH * math.sin(2 * math.pi * TREMOLO_HZ * i / rate)
        seed ^= (seed << 13) & 0xFFFFFFFF
        seed ^= seed >> 17
        seed ^= (seed << 5) & 0xFFFFFFFF
        seed &= 0xFFFFFFFF
        noise = ((seed % 2001) - 1000) / 1000 * ROOM_TONE
        s[i] = max(-32768, min(32767, int(s[i] * gain + noise)))
    return s.tobytes()


def fade(pcm: bytes, rate: int, channels: int, seconds: float = 0.35) -> bytes:
    """Lamps come up and go down; they do not click on."""
    s = array("h")
    s.frombytes(pcm)
    n = int(rate * channels * seconds)
    n = min(n, len(s) // 2)
    for i in range(n):
        k = i / n
        s[i] = int(s[i] * k)
        s[-1 - i] = int(s[-1 - i] * k)
    return s.tobytes()


def to_mp3(pcm: bytes, rate: int, channels: int) -> bytes:
    import lameenc

    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
    enc.set_in_sample_rate(rate)
    enc.set_channels(channels)
    enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


def main() -> int:
    try:
        from piper import PiperVoice
    except ImportError:
        print("piper-tts is not installed. See the docstring at the top of this file.")
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    total = 0

    for t in TESTIMONY:
        model = VOICE_DIR / f"{t['voice']}.onnx"
        if not model.exists():
            print(f"Voice model missing: {model}")
            print(f"Run: python3 -m piper.download_voices {t['voice']} --data-dir {VOICE_DIR}")
            return 1
        voice = PiperVoice.load(str(model), config_path=str(model) + ".json")

        pcm, rate, channels = synthesise(voice, t["text"])
        pcm = fade(warm(pcm, rate), rate, channels)
        mp3 = to_mp3(pcm, rate, channels)

        path = OUT / f"{t['slug']}.mp3"
        path.write_bytes(mp3)
        seconds = len(pcm) / (rate * channels * 2)
        total += len(mp3)
        print(f"{path}  {t['voice']:24}  {seconds:5.1f}s  {len(mp3) / 1024:6.1f} KB")

    print(f"\n{len(TESTIMONY)} recordings, {total / 1024:.1f} KB total")
    return 0


if __name__ == "__main__":
    sys.exit(main())
