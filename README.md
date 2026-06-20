# Live Translator V3

Real-time voice translator for YouTube live streams. Captures system audio via BlackHole, translates to Thai.

## Features

- 10 language options (EN/CN/JP/KR/ES/FR/DE/PT/RU/AR → TH)
- Speaker detection (🔵🔴)
- Auto-save history (CSV + JSON)
- Minimal latency

## Setup

### 1. Install dependencies

```bash
brew install blackhole-2ch portaudio
pip3 install SpeechRecognition deep-translator pyaudio numpy
```

### 2. Restart Mac after installing BlackHole

### 3. Create Multi-Output Device

Open **Audio MIDI Setup** → Click **+** → **Create Multi-Output Device**

Add:
- ☑ BlackHole 2ch (check **Drift Correction**)
- ☑ Built-in Output

Set as default output.

### 4. Run

```bash
python3 live_translator_v3.py
```

## Toggle Audio

```bash
chmod +x toggle_audio.sh
./toggle_audio.sh  # Toggle between Multi-Output and speakers
```

## Output

- Speaker 🔵 / 🔴 detection
- 🇬🇧🇨🇳🇯🇵🇰🇷🇪🇸🇫🇷🇩🇪🇧🇷🇷🇺🇸🇦 → 🇹🇭
- Auto-save to `~/translator_v3_*.csv` and `*.json`

## Requirements

- macOS with BlackHole installed
- Python 3.8+
- Internet connection (Google Speech API + Google Translate)
