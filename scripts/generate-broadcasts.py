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

Broadcasts are bilingual where a real civic announcement would be — Hindi then
English, the way public address actually works in India, and the way this world
already works: the station robots at Serenity Junction "announce gentle beeps in
five languages".

Usage:
    pip install piper-tts lameenc
    python3 -m piper.download_voices hi_IN-priyamvada-medium en_GB-alan-medium --data-dir .voices
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

# One voice per language. There is no Indian-English voice in Piper's catalogue,
# so rather than fake an accent the broadcasts are bilingual — which is what a
# civic announcement in this world would actually be. The novel says so itself:
# the station robots at Serenity Junction "announce gentle beeps in five
# languages".
VOICES = {
    "hi": "hi_IN-priyamvada-medium",
    "en": "en_GB-alan-medium",
}

# Pause between language segments, in seconds.
SEGMENT_GAP = 0.55

# `degrade` runs the intercepted-fragment treatment: the Resistance's fork is a
# sabotaged copy of the state network, and it should not sound clean.
BROADCASTS = [
    {
        "slug": "pai-civic-notice",
        "degrade": False,
        "segments": [
            {
                "voice": "hi",
                "text": (
                    "पी. ए. आई.। नागरिक अनुपालन प्रसारण, सेक्टर नौ। "
                    "अगले चार घंटों तक तापमान जीवित रहने योग्य सीमा में है। "
                    "प्रमाणित शीतलन के बिना निवासियों को घर के अंदर रहने की सलाह दी जाती है। "
                    "आपके ज़िले का अनुपालन स्कोर अद्यतन कर दिया गया है। "
                    "आपके सहयोग के लिए धन्यवाद।"
                ),
            },
            {
                "voice": "en",
                "text": (
                    "Public Access Intelligence. Civic compliance broadcast, "
                    "sector nine. "
                    "Ambient temperature is within survivable range for the next four hours. "
                    "Residents without certified cooling are advised to remain indoors. "
                    "Your district compliance score has been updated. "
                    "Queue times are shorter than yesterday. "
                    "Thank you for your cooperation."
                ),
            },
        ],
    },
    {
        # The fork retransmits the state's own words, then lets the correction
        # through in the second language — the part the broadcast never says.
        "slug": "pai-whisper-fragment",
        "degrade": True,
        "segments": [
            {
                "voice": "hi",
                "text": (
                    "अनुपालन प्रसारण अवरोधित। अंश सुरक्षित। "
                    "आपके ज़िले का अनुपालन स्कोर अद्यतन कर दिया गया है। "
                    "कतार का समय कल से कम है।"
                ),
            },
            {
                "voice": "en",
                "text": (
                    "Correction. Queue times were not measured. "
                    "Correction. The score was assigned before the measurement. "
                    "Thank you for your cooperation."
                ),
            },
        ],
    },
    {
        "slug": "curriculum-notice-2061",
        "degrade": False,
        "segments": [
            {
                "voice": "hi",
                "text": (
                    "पाठ्यक्रम प्रभाग सूचना। शैक्षणिक वर्ष दो हज़ार इकसठ। "
                    "राष्ट्रीय पाठ्यक्रम पुनः तैयार किया गया है। "
                    "शिक्षकों के पास मौजूद अनधिकृत अभिलेख जमा किए जाने हैं।"
                ),
            },
            {
                "voice": "en",
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
        ],
    },
    {
        # Technical bulletin: English only, in the register such things are
        # actually published in.
        "slug": "emissions-bulletin",
        "degrade": False,
        "segments": [
            {
                "voice": "en",
                "text": (
                    "Waste to energy pilot. Emissions integrity bulletin. "
                    "Stack readings for this cycle are within declared tolerance. "
                    "Declared tolerance has been adjusted this cycle. "
                    "Particulate figures for the residential perimeter are pending review "
                    "and will be published following review. "
                    "The pilot remains a model for the zone."
                ),
            },
        ],
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

    # Load only the voices the broadcasts actually reference.
    needed = {seg["voice"] for b in BROADCASTS for seg in b["segments"]}
    loaded = {}
    for lang in sorted(needed):
        name = VOICES[lang]
        model = VOICE_DIR / f"{name}.onnx"
        if not model.exists():
            print(f"Voice model missing: {model}")
            print(f"Run: python3 -m piper.download_voices {name} --data-dir {VOICE_DIR}")
            return 1
        loaded[lang] = PiperVoice.load(str(model), config_path=str(model) + ".json")

    OUT.mkdir(parents=True, exist_ok=True)

    total = 0
    for b in BROADCASTS:
        chunks: list[bytes] = []
        rate = channels = None

        for i, seg in enumerate(b["segments"]):
            pcm, r, c = synthesise(loaded[seg["voice"]], seg["text"])
            if rate is None:
                rate, channels = r, c
            elif (r, c) != (rate, channels):
                # Every Piper voice used here is 22.05 kHz mono; bail loudly
                # rather than silently splicing mismatched audio.
                print(f"  ! {b['slug']}: segment {i} is {r}Hz/{c}ch, expected {rate}Hz/{channels}ch")
                return 1
            if i:
                chunks.append(b"\x00\x00" * int(rate * channels * SEGMENT_GAP))
            chunks.append(pcm)

        pcm = b"".join(chunks)
        if b["degrade"]:
            pcm = degrade(pcm, rate)
        mp3 = to_mp3(pcm, rate, channels)

        path = OUT / f"{b['slug']}.mp3"
        path.write_bytes(mp3)
        seconds = len(pcm) / (rate * channels * 2)
        langs = "+".join(dict.fromkeys(seg["voice"] for seg in b["segments"]))
        total += len(mp3)
        print(f"{path}  {langs:5}  {seconds:5.1f}s  {len(mp3) / 1024:6.1f} KB")

    print(f"\n{len(BROADCASTS)} broadcasts, {total / 1024:.1f} KB total")
    return 0


if __name__ == "__main__":
    sys.exit(main())
