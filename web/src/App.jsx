import { useState, useRef, useCallback, useEffect } from 'react'

const LANGUAGES = [
  { code: 'en-US', name: 'English', flag: '🇬🇧' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
]

export default function App() {
  const [selectedLang, setSelectedLang] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [history, setHistory] = useState([])
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const historyEndRef = useRef(null)

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const translate = async (text, srcLang) => {
    const langCode = srcLang.split('-')[0]
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${langCode}&tl=th&dt=t&q=${encodeURIComponent(text)}`
      )
      const data = await res.json()
      return data[0].map(s => s[0]).join('')
    } catch {
      return text
    }
  }

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Browser ไม่รองรับ Web Speech API (ใช้ Chrome หรือ Edge)')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = selectedLang.code

    recognition.onstart = () => {
      setIsListening(true)
      setError('')
    }

    recognition.onresult = async (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          const translated = await translate(transcript, selectedLang.code)
          setHistory(prev => [...prev, {
            id: Date.now(),
            source: transcript,
            translated,
            time: new Date().toLocaleTimeString('th-TH'),
            lang: selectedLang,
          }])
          setInterim('')
        } else {
          interimText += transcript
        }
      }
      if (interimText) setInterim(interimText)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setError(`Error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      if (isListening) {
        try { recognition.start() } catch {}
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [selectedLang, isListening])

  const stopListening = useCallback(() => {
    setIsListening(false)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!selectedLang) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">📺 Live Translator</h1>
            <p className="text-gray-400">Real-time voice translation to Thai</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl p-4 text-center transition-all hover:scale-105 border border-white/10"
              >
                <div className="text-3xl mb-2">{lang.flag}</div>
                <div className="text-white font-medium text-sm">{lang.name}</div>
                <div className="text-gray-400 text-xs">→ 🇹🇭 Thai</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      <header className="bg-black/30 backdrop-blur p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { stopListening(); setSelectedLang(null) }}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← เลือกภาษาใหม่
          </button>
          <span className="text-2xl">{selectedLang.flag}</span>
          <span className="text-white font-bold">{selectedLang.name} → 🇹🇭 Thai</span>
        </div>
        <button
          onClick={toggleListening}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isListening ? '⏹ หยุด' : '🎤 เริ่มฟัง'}
        </button>
      </header>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-3 text-center text-sm">{error}</div>
      )}

      <main className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        {history.length === 0 && !isListening && (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">🎙️</div>
            <p>กด "เริ่มฟัง" แล้วพูดภาษา{selectedLang.name}</p>
            <p className="text-sm mt-2">เสียงจะแปลเป็นภาษาไทยแบบ real-time</p>
          </div>
        )}

        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                <span>{item.time}</span>
                <span>{item.lang.flag}</span>
              </div>
              <div className="text-white mb-1">{item.source}</div>
              <div className="text-green-400 text-lg">🇹🇭 {item.translated}</div>
            </div>
          ))}

          {interim && (
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/20 opacity-60">
              <div className="text-gray-400 text-xs mb-1">กำลังฟัง...</div>
              <div className="text-white">{interim}</div>
            </div>
          )}
        </div>

        <div ref={historyEndRef} />
      </main>

      {isListening && (
        <div className="bg-black/30 p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm">กำลังฟังและแปล...</span>
          </div>
        </div>
      )}
    </div>
  )
}
