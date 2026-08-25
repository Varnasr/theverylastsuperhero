#!/usr/bin/env python3
"""
Generates the archive's *machine* voices with local, offline TTS.

The split matters, and it is deliberate. Salt Lamps hold human testimony: a
record survives because a person re-speaks it, which is the novel's whole
argument. Synthesising those would undercut it — a machine reciting a memory is
exactly the thing the Resistance is working against.

So synthetic voice is reserved for the other side. P.A.I., the Compliance Index,
the Curriculum Division: institutions that broadcast rather than remember. When a
reader hears the flat, tireless state voice and then an empty slot where a human
recording should be, the contrast is doing the narrative work.

Everything runs locally through Piper — no account, no API, no per-word cost, and
nothing leaves the machine. Output is 64 kbps mono MP3, which is plenty for
speech and keeps each clip well under 100 KB.

Usage:
    pip install piper-tts lameenc
    python3 -m piper.download_voices en_GB-alan-medium --data-dir .voices
    python3 scripts/generate-broadcasts.py

Adding a broadcast means adding an entry to BROADCASTS and re-running. Existing
files are overwritten, so the audio is always reproducible from this file.
"""

from __future__ import annotations

import array
import io
import math
import sys
import wave
from pathlib import Path

OUT = Path("public/audio")
VOICE_DIR = Path(".voices")
VOICE = "en_GB-alan-medium"

# `degrade` runs the intercepted-fragment treatment: the Resistance's fork is a
# sabotaged copy of the state network, and it should not sound clean.
BROADCASTS = [
    {
        "slug": "pai-civic-notice",
        "degrade": False,
        "text": (
            "Public Artificial Intelligence. Civic compliance broadcast, "
            "sector nine. "
            "Ambient temperature is within survivable range for the next four hours. "
            "Residents without certified cooling are advised to remain indoors. "
            "Your district compliance score has been updated. "
            "Queue times are shorter than yesterday. "
            "Thank you for your cooperation."
        ),
    },
    {
        "slug": "pai-whisper-fragment",
        "degrade": True,
        "text": (
            "Compliance broadcast intercepted. Fragment retained. "
            "Your district compliance score has been updated. "
            "Queue times are shorter than yesterday. "
            "Correction. Queue times were not measured. "
            "Correction. The score was assigned before the measurement. "
            "Thank you for your cooperation."
        ),
    },
    {
        "slug": "curriculum-notice-2061",
        "degrade": False,
        "text": (
            "Curriculum Division notice. Academic year twenty sixty one. "
            "The National Curriculum has been regenerated. "
            "Chapters concerning the period two thousand fifty five to two thousand sixty "
            "have been revised for accuracy. "
            "Unauthorised records held by individual educators are to be surrendered. "
            "Teaching from superseded material is a compliance matter. "
            "This notice will not be repeated."
        ),
    },
    {
        "slug": "emissions-bulletin",
        "degrade": False,
        "text": (
            "Waste to energy pilot. Emissions integrity bulletin. "
            "Stack readings for this cycle are within declared tolerance. "
            "Declared tolerance has been adjusted this cycle. "
            "Particulate figures for the residential perimeter are pending review "
            "and will be published following review. "
            "The pilot remains a model for the zone."
        ),
    },
]


def synthesise(voice, text: str) -> tuple[bytes, int, int]:
    """Returns (pcm, sample_rate, channels)."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        voice.synthesize_wav(text, w)
    buf.seek(0)
    with wave.open(buf, "rb") as w:
        return w.readframes(w.getnframes()), w.getframerate(), w.getnchannels()


def degrade(pcm: bytes, rate: int) -> bytes:
    """
    Makes a clean broadcast sound intercepted.

    Three cheap effects, no DSP library: a slow tremolo so the level breathes
    like a failing relay, a quiet noise floor, and periodic dropouts where the
    signal simply is not there. Deterministic — the same input always degrades
    the same way, so builds stay reproducible.
    """
    samples = array.array("h")
    samples.frombytes(pcm)

    seed = 0x5EED
    for i in range(len(samples)):
        t = i / rate

        # Tremolo: a 3.1 Hz wobble that never quite closes.
        gain = 0.72 + 0.28 * math.sin(2 * math.pi * 3.1 * t)

        # Dropouts: roughly every 1.7s, a short hole in the signal.
        if (t % 1.7) < 0.055:
            gain *= 0.12

        # Deterministic noise floor (xorshift, kept in 32-bit range).
        seed ^= (seed << 13) & 0xFFFFFFFF
        seed ^= seed >> 17
        seed ^= (seed << 5) & 0xFFFFFFFF
        seed &= 0xFFFFFFFF
        noise = ((seed % 2001) - 1000) * 0.9

        v = int(samples[i] * gain + noise)
        samples[i] = max(-32768, min(32767, v))

    return samples.tobytes()


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

    model = VOICE_DIR / f"{VOICE}.onnx"
    if not model.exists():
        print(f"Voice model missing: {model}")
        print(f"Run: python3 -m piper.download_voices {VOICE} --data-dir {VOICE_DIR}")
        return 1

    voice = PiperVoice.load(str(model), config_path=str(model) + ".json")
    OUT.mkdir(parents=True, exist_ok=True)

    total = 0
    for b in BROADCASTS:
        pcm, rate, channels = synthesise(voice, b["text"])
        if b["degrade"]:
            pcm = degrade(pcm, rate)
        mp3 = to_mp3(pcm, rate, channels)

        path = OUT / f"{b['slug']}.mp3"
        path.write_bytes(mp3)
        seconds = len(pcm) / (rate * channels * 2)
        total += len(mp3)
        print(f"{path}  {seconds:5.1f}s  {len(mp3) / 1024:6.1f} KB")

    print(f"\n{len(BROADCASTS)} broadcasts, {total / 1024:.1f} KB total")
    return 0


if __name__ == "__main__":
    sys.exit(main())
