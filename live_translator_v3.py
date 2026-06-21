#!/usr/bin/env python3
"""V3: Multi-language translator - Windows 11 (WASAPI Loopback)."""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import speech_recognition as sr
from deep_translator import GoogleTranslator
import sounddevice as sd
import numpy as np
import csv
import json
import os
import time
import threading
import queue
import signal
import struct
from datetime import datetime

LANGUAGES = {
    "1":  {"name": "English  -> Thai",   "stt": "en-US", "translate": "en",    "flag_in": "[EN]", "flag_out": "[TH]"},
    "2":  {"name": "Chinese  -> Thai",   "stt": "zh-CN", "translate": "zh-CN", "flag_in": "[CN]", "flag_out": "[TH]"},
    "3":  {"name": "Japanese -> Thai",   "stt": "ja-JP", "translate": "ja",    "flag_in": "[JP]", "flag_out": "[TH]"},
    "4":  {"name": "Korean   -> Thai",   "stt": "ko-KR", "translate": "ko",    "flag_in": "[KR]", "flag_out": "[TH]"},
    "5":  {"name": "Spanish  -> Thai",   "stt": "es-ES", "translate": "es",    "flag_in": "[ES]", "flag_out": "[TH]"},
    "6":  {"name": "French   -> Thai",   "stt": "fr-FR", "translate": "fr",    "flag_in": "[FR]", "flag_out": "[TH]"},
    "7":  {"name": "German   -> Thai",   "stt": "de-DE", "translate": "de",    "flag_in": "[DE]", "flag_out": "[TH]"},
    "8":  {"name": "Portuguese-> Thai",  "stt": "pt-BR", "translate": "pt",    "flag_in": "[BR]", "flag_out": "[TH]"},
    "9":  {"name": "Russian  -> Thai",   "stt": "ru-RU", "translate": "ru",    "flag_in": "[RU]", "flag_out": "[TH]"},
    "10": {"name": "Arabic   -> Thai",   "stt": "ar-SA", "translate": "ar",    "flag_in": "[SA]", "flag_out": "[TH]"},
}

AUTO_LANGS = ["en-US", "zh-CN", "ja-JP", "ko-KR", "es-ES", "fr-FR", "de-DE", "pt-BR", "ru-RU", "ar-SA"]

SAMPLE_RATE = 16000
CHANNELS = 1


class AudioCapturer:
    def __init__(self, device_id):
        self.device_id = device_id
        self.buffer = queue.Queue()
        self.running = False
        self.stream = None

    def _callback(self, indata, frames, time_info, status):
        if status:
            pass
        self.buffer.put(indata[:, 0].copy())

    def start(self):
        self.running = True
        self.stream = sd.InputStream(
            device=self.device_id,
            channels=CHANNELS,
            samplerate=SAMPLE_RATE,
            dtype="float32",
            blocksize=SAMPLE_RATE,
            callback=self._callback,
        )
        self.stream.start()

    def stop(self):
        self.running = False
        if self.stream:
            self.stream.stop()
            self.stream.close()

    def get_audio_chunk(self, timeout=8):
        chunks = []
        try:
            while True:
                chunk = self.buffer.get(timeout=timeout)
                chunks.append(chunk)
                if sum(len(c) for c in chunks) >= SAMPLE_RATE * 4:
                    break
        except queue.Empty:
            pass
        if not chunks:
            return None
        audio = np.concatenate(chunks)
        audio_int16 = (audio * 32767).astype(np.int16)
        return sr.AudioData(audio_int16.tobytes(), SAMPLE_RATE, 2)


def find_loopback_device():
    devices = sd.query_devices()
    for i, dev in enumerate(devices):
        name = dev["name"].lower()
        if dev["max_input_channels"] > 0 and ("loopback" in name or "stereo mix" in name):
            return i, dev["name"]
    for i, dev in enumerate(devices):
        name = dev["name"].lower()
        if dev["max_input_channels"] > 0 and ("wasapi" in name or "wave" in name):
            return i, dev["name"]
    return None, None


class FastTranslator:
    def __init__(self, lang_config):
        self.lang = lang_config
        self.translator = GoogleTranslator(source=self.lang["translate"], target="th")
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        self.recognizer.non_speaking_duration = 0.5
        self.audio_q = queue.Queue(maxsize=10)
        self.history = []
        self.running = True
        self.start_time = datetime.now()
        self.total = 0
        self.sum_lat = 0
        self.last_speaker = None
        self.speaker_id = 0

        device_id, device_name = find_loopback_device()
        if device_id is None:
            print("[X] Not found loopback device!")
            print("    Enable Stereo Mix: Settings > Sound > Recording > Right click > Show Disabled Devices > Enable Stereo Mix")
            print("    Or install VB-Audio Virtual Cable: https://vb-audio.com/Cable/")
            sys.exit(1)

        print(f"[OK] Device: {device_name}")
        print(f"[OK] {self.lang['name']}\n")
        self.capturer = AudioCapturer(device_id)

    def _icon(self, speaker_id):
        if speaker_id is None:
            return "[?]"
        return "[1]" if (speaker_id % 2 == 1) else "[2]"

    def _get_speaker(self, audio):
        frames = audio.frame_data
        sample_width = audio.sample_width
        sr_rate = audio.sample_rate or SAMPLE_RATE
        fmt = "<" + "h" * (len(frames) // sample_width)
        samples = struct.unpack(fmt, frames)
        chunk_size = sr_rate // 10
        energies = []
        for i in range(0, len(samples), chunk_size):
            chunk = samples[i : i + chunk_size]
            if chunk:
                e = sum(s * s for s in chunk) / len(chunk)
                energies.append(e)
        if not energies:
            return self.last_speaker
        avg_e = sum(energies) / len(energies)
        if avg_e < 100:
            return self.last_speaker
        silence_start = all(e < avg_e * 0.2 for e in energies)
        if silence_start:
            self.speaker_id += 1
            return self.speaker_id
        return self.last_speaker

    def _auto_stt(self, audio):
        best_text = ""
        best_lang = ""
        for lang in AUTO_LANGS:
            try:
                text = self.recognizer.recognize_google(audio, language=lang)
                if text and len(text) > len(best_text):
                    best_text = text
                    best_lang = lang
            except Exception:
                continue
            if len(best_text) > 10:
                break
        return best_text, best_lang

    def _auto_translate(self, text, src_lang):
        code = src_lang.split("-")[0]
        try:
            t = GoogleTranslator(source=code, target="th")
            return t.translate(text)
        except Exception:
            return text

    def _listen(self):
        label = self.lang["stt"]
        print(f">>> Listening system audio ({label})...\n")
        self.capturer.start()
        while self.running:
            try:
                audio = self.capturer.get_audio_chunk(timeout=2)
                if audio is None:
                    continue
                self.audio_q.put(audio)
            except Exception:
                pass
        self.capturer.stop()

    def _translate(self, text):
        try:
            return self.translator.translate(text)
        except Exception:
            return text

    def _save(self):
        ts = self.start_time.strftime("%Y%m%d_%H%M%S")
        lang_code = self.lang["translate"]
        user_dir = os.path.expanduser("~")
        p = os.path.join(user_dir, f"translator_v3_{lang_code}_{ts}.csv")
        with open(p, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["Time", "Speaker", "Source", "Thai", "Latency"])
            for h in self.history:
                w.writerow([h["t"], h["s"], h["src"], h["th"], h["l"]])
        jp = os.path.join(user_dir, f"translator_v3_{lang_code}_{ts}.json")
        with open(jp, "w", encoding="utf-8") as f:
            json.dump(self.history, f, ensure_ascii=False, indent=2)
        return p

    def run(self):
        fi = self.lang["flag_in"]
        fo = self.lang["flag_out"]
        print(f"V3 {fi} -> {fo} | Ctrl+C to stop\n")
        t = threading.Thread(target=self._listen, daemon=True)
        t.start()

        while self.running:
            try:
                audio = self.audio_q.get(timeout=1)
            except queue.Empty:
                continue

            t0 = time.time()
            try:
                new_speaker = self._get_speaker(audio)

                if self.lang["stt"] == "auto":
                    text, detected_lang = self._auto_stt(audio)
                    if not text or len(text.strip()) < 1:
                        continue
                    translated = self._auto_translate(text, detected_lang)
                    flag = "[AUTO]"
                else:
                    detected_lang = self.lang["stt"]
                    text = self.recognizer.recognize_google(audio, language=self.lang["stt"])
                    if not text or len(text.strip()) < 1:
                        continue
                    translated = self._translate(text)
                    flag = self.lang["flag_in"]

                if new_speaker is None:
                    new_speaker = self.last_speaker
                elif new_speaker != self.last_speaker:
                    self.speaker_id += 1
                    new_speaker = self.speaker_id

                lat = time.time() - t0
                ts = datetime.now().strftime("%H:%M:%S")
                icon = self._icon(new_speaker)

                self.total += 1
                self.sum_lat += lat
                self.last_speaker = new_speaker

                if new_speaker and (len(self.history) == 0 or self.history[-1].get("s") != new_speaker):
                    print("-" * 35)

                self.history.append({"t": ts, "s": new_speaker, "src": text, "th": translated, "l": round(lat, 2), "lang": detected_lang})
                print(f"[{ts}] {icon} ({lat:.1f}s) [{detected_lang}]")
                print(f"  {flag} {text}")
                print(f"  [TH] {translated}\n")
                sys.stdout.flush()

            except sr.UnknownValueError:
                pass
            except sr.RequestError:
                time.sleep(1)
            except Exception:
                pass

    def stop(self):
        self.running = False
        if self.history:
            p = self._save()
            print(f"\n[OK] Saved {len(self.history)} entries -> {p}")
        if self.total:
            print(f"  Avg latency: {self.sum_lat / self.total:.2f}s")
        print("Bye!")


def select_language():
    print("=" * 40)
    print("   V3 Live Translator -> Thai")
    print("=" * 40)
    print("  1.  English    -> Thai")
    print("  2.  Chinese    -> Thai")
    print("  3.  Japanese   -> Thai")
    print("  4.  Korean     -> Thai")
    print("  5.  Spanish    -> Thai")
    print("  6.  French     -> Thai")
    print("  7.  German     -> Thai")
    print("  8.  Portuguese -> Thai")
    print("  9.  Russian    -> Thai")
    print("  10. Arabic     -> Thai")
    print("=" * 40)
    while True:
        choice = input("\nSelect (1-10): ").strip()
        if choice in LANGUAGES:
            return LANGUAGES[choice]
        print("[X] Select 1-10")


def main():
    lang = select_language()
    app = FastTranslator(lang)
    signal.signal(signal.SIGINT, lambda s, f: (app.stop(), sys.exit(0)))
    try:
        app.run()
    except KeyboardInterrupt:
        app.stop()


if __name__ == "__main__":
    main()
