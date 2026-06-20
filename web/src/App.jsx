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

const CARD_BG = '#1c1c1c'
const BORDER = '#3a3a3a'
const TEXT = '#f0f0f0'
const TEXT_DIM = '#b0b0b0'
const GREEN = '#4ade80'

const css = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d0d0d; color: #f0f0f0; font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
`

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
      setError('Browser does not support Web Speech API. Use Chrome or Edge.')
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = selectedLang.code

    recognition.onstart = () => { setIsListening(true); setError('') }

    recognition.onresult = async (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          const translated = await translate(transcript, selectedLang.code)
          setHistory(prev => [...prev, {
            id: Date.now() + Math.random(),
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

    recognition.onerror = (e) => { if (e.error !== 'no-speech') setError(`Error: ${e.error}`) }
    recognition.onend = () => { if (isListening) try { recognition.start() } catch {} }

    recognitionRef.current = recognition
    recognition.start()
  }, [selectedLang, isListening])

  const stopListening = useCallback(() => {
    setIsListening(false)
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null }
  }, [])

  const toggleListening = () => { isListening ? stopListening() : startListening() }

  if (!selectedLang) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
        <style>{css}</style>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#ffffff', marginBottom: '8px', letterSpacing: '-1px' }}>
            Live Translator
          </h1>
          <p style={{ color: TEXT_DIM, marginBottom: '48px', fontSize: '16px', fontWeight: '500' }}>
            Real-time voice translation to Thai
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', maxWidth: '640px', margin: '0 auto' }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                style={{
                  background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '14px',
                  padding: '22px 12px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.transform = 'scale(1.06)' }}
                onMouseLeave={e => { e.currentTarget.style.background = CARD_BG; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>{lang.flag}</div>
                <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{lang.name}</div>
                <div style={{ color: TEXT_DIM, fontSize: '12px', fontWeight: '500' }}>→ Thai</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
      <style>{css}</style>

      <header style={{ background: '#141414', borderBottom: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => { stopListening(); setSelectedLang(null) }}
            style={{ color: '#ffffff', background: '#333', border: '1px solid #555', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '8px' }}
          >
            ← Back
          </button>
          <span style={{ fontSize: '26px' }}>{selectedLang.flag}</span>
          <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '17px' }}>{selectedLang.name} → 🇹🇭 Thai</span>
        </div>
        <button
          onClick={toggleListening}
          style={{
            padding: '12px 28px', borderRadius: '28px', border: 'none', fontWeight: '700', fontSize: '15px',
            cursor: 'pointer', color: '#ffffff',
            background: isListening ? '#dc2626' : '#16a34a',
            animation: isListening ? 'pulse 1.5s infinite' : 'none',
          }}
        >
          {isListening ? '⏹ Stop' : '🎤 Start'}
        </button>
      </header>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.2)', color: '#ff6b6b', padding: '14px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
          {error}
        </div>
      )}

      <main style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        {history.length === 0 && !isListening && (
          <div style={{ textAlign: 'center', color: TEXT_DIM, marginTop: '100px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎙️</div>
            <p style={{ fontSize: '20px', color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
              Press "Start" and speak {selectedLang.name}
            </p>
            <p style={{ fontSize: '15px', color: TEXT_DIM, fontWeight: '500' }}>
              Voice will be translated to Thai in real-time
            </p>
          </div>
        )}

        {history.map(item => (
          <div key={item.id} style={{ background: CARD_BG, borderRadius: '14px', padding: '18px', marginBottom: '14px', border: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: TEXT_DIM, fontWeight: '600' }}>
              <span>{item.time}</span>
              <span>{item.lang.flag}</span>
            </div>
            <div style={{ color: '#ffffff', fontSize: '17px', lineHeight: 1.6, marginBottom: '10px', wordBreak: 'break-word', fontWeight: '500' }}>
              {item.source}
            </div>
            <div style={{ color: GREEN, fontSize: '21px', lineHeight: 1.6, wordBreak: 'break-word', fontWeight: '700' }}>
              🇹🇭 {item.translated}
            </div>
          </div>
        ))}

        {interim && (
          <div style={{ background: CARD_BG, borderRadius: '14px', padding: '18px', marginBottom: '14px', border: '2px dashed #555' }}>
            <div style={{ color: TEXT_DIM, fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>Listening...</div>
            <div style={{ color: '#ffffff', fontSize: '17px', fontWeight: '500' }}>{interim}</div>
          </div>
        )}

        <div ref={historyEndRef} />
      </main>

      {isListening && (
        <div style={{ background: '#141414', borderTop: `1px solid ${BORDER}`, padding: '14px', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%', marginRight: '10px', animation: 'blink 1s infinite' }}></span>
          <span style={{ color: GREEN, fontSize: '15px', fontWeight: '700' }}>Listening and translating...</span>
        </div>
      )}
    </div>
  )
}
