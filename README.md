# Live Translator V3 (Windows 11)

Real-time voice translator for YouTube live streams. Captures system audio via WASAPI Loopback, translates to Thai.

## Features

- 10 language options (EN/CN/JP/KR/ES/FR/DE/PT/RU/AR → TH)
- Speaker detection (🔵🔴)
- Auto-save history (CSV + JSON)
- Minimal latency
- No microphone required - captures system audio directly

## Setup (Windows 11)

### 1. Enable Stereo Mix

1. Open **Settings → System → Sound**
2. Scroll down, click **More sound settings**
3. Go to **Recording** tab
4. Right-click → **Show Disabled Devices**
5. Right-click **Stereo Mix** → **Enable**
6. Right-click **Stereo Mix** → **Set as Default Device**

> If Stereo Mix is not available, install [VB-Audio Virtual Cable](https://vb-audio.com/Cable/) and set it as default recording device.

### 2. Install Python dependencies

```bash
pip install SpeechRecognition deep-translator sounddevice numpy
```

### 3. Run

```bash
python live_translator_v3.py
```

## Alternative: VB-Audio Virtual Cable

If Stereo Mix is not available:

1. Download [VB-Audio Virtual Cable](https://vb-audio.com/Cable/) (free)
2. Install and restart
3. Set **CABLE Input** as default playback device (Sound Settings → Playback)
4. Set **CABLE Output** as default recording device (Sound Settings → Recording)
5. Run the script

## Output

- Speaker 🔵 / 🔴 detection
- 🇬🇧🇨🇳🇯🇵🇰🇷🇪🇸🇫🇷🇩🇪🇧🇷🇷🇺🇸🇦 → 🇹🇭
- Auto-save to `~/translator_v3_*.csv` and `*.json`

## Requirements

- Windows 10/11 with WASAPI support
- Python 3.8+
- Internet connection (Google Speech API + Google Translate)
