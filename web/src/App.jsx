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

const styles = {
  body: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
  },
  header: {
    background: '#111111',
    borderBottom: '1px solid #222',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    color: '#e0e0e0',
    background: '#333',
    border: '1px solid #555',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '6px 14px',
    borderRadius: '6px',
  },
  langInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  langFlag: {
    fontSize: '24px',
  },
  langText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  startBtn: {
    padding: '10px 24px',
    borderRadius: '24px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  startBtnActive: {
    background: '#dc2626',
    color: '#fff',
    animation: 'pulse 1.5s infinite',
  },
  startBtnInactive: {
    background: '#16a34a',
    color: '#fff',
  },
  error: {
    background: 'rgba(220, 38, 38, 0.15)',
    color: '#fca5a5',
    padding: '12px',
    textAlign: 'center',
    fontSize: '14px',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    maxWidth: '700px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  emptyState: {
    textAlign: 'center',
    color: '#cccccc',
    marginTop: '80px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '18px',
    color: '#ffffff',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#aaaaaa',
    marginTop: '8px',
    fontWeight: '500',
  },
  card: {
    background: '#1e1e1e',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #444',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '12px',
    color: '#aaaaaa',
    fontWeight: '600',
  },
  cardSource: {
    color: '#ffffff',
    fontSize: '16px',
    lineHeight: 1.5,
    marginBottom: '8px',
    wordBreak: 'break-word',
    fontWeight: '500',
  },
  cardTranslated: {
    color: '#4ade80',
    fontSize: '20px',
    lineHeight: 1.5,
    wordBreak: 'break-word',
    fontWeight: '600',
  },
  interimCard: {
    background: '#1e1e1e',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    border: '2px dashed #555',
  },
  interimLabel: {
    color: '#aaaaaa',
    fontSize: '12px',
    marginBottom: '6px',
    fontWeight: '600',
  },
  interimText: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '500',
  },
  footer: {
    background: '#111111',
    borderTop: '1px solid #333',
    padding: '12px',
    textAlign: 'center',
  },
  footerDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    background: '#22c55e',
    borderRadius: '50%',
    marginRight: '8px',
    animation: 'pulse 1.5s infinite',
  },
  footerText: {
    color: '#4ade80',
    fontSize: '14px',
    fontWeight: '600',
  },
  selectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  selectCard: {
    background: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: '12px',
    padding: '20px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  selectCardHover: {
    background: '#2a2a2a',
    border: '1px solid #666',
    transform: 'scale(1.05)',
  },
  selectFlag: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  selectName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '14px',
    marginBottom: '4px',
  },
  selectSub: {
    color: '#aaaaaa',
    fontSize: '12px',
    fontWeight: '500',
  },
}

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
      <div style={styles.body}>
        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
            Live Translator
          </h1>
          <p style={{ color: '#555', marginBottom: '40px', fontSize: '14px' }}>
            Real-time voice translation to Thai
          </p>
          <div style={styles.selectGrid}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                style={styles.selectCard}
                onMouseEnter={e => Object.assign(e.target.style, styles.selectCardHover)}
                onMouseLeave={e => { e.target.style.background = '#141414'; e.target.style.border = '1px solid #222'; e.target.style.transform = 'none'; }}
              >
                <div style={styles.selectFlag}>{lang.flag}</div>
                <div style={styles.selectName}>{lang.name}</div>
                <div style={styles.selectSub}>Thai</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.body}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <header style={styles.header}>
        <div style={styles.langInfo}>
          <button
            onClick={() => { stopListening(); setSelectedLang(null) }}
            style={styles.backBtn}
          >
            Back
          </button>
          <span style={styles.langFlag}>{selectedLang.flag}</span>
          <span style={styles.langText}>{selectedLang.name} → Thai</span>
        </div>
        <button
          onClick={toggleListening}
          style={{
            ...styles.startBtn,
            ...(isListening ? styles.startBtnActive : styles.startBtnInactive),
          }}
        >
          {isListening ? 'Stop' : 'Start Listening'}
        </button>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <main style={styles.main}>
        {history.length === 0 && !isListening && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎙️</div>
            <p style={styles.emptyText}>Press "Start Listening" and speak {selectedLang.name}</p>
            <p style={styles.emptySubtext}>Voice will be translated to Thai in real-time</p>
          </div>
        )}

        {history.map(item => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardMeta}>
              <span>{item.time}</span>
              <span>{item.lang.flag}</span>
            </div>
            <div style={styles.cardSource}>{item.source}</div>
            <div style={styles.cardTranslated}>🇹🇭 {item.translated}</div>
          </div>
        ))}

        {interim && (
          <div style={styles.interimCard}>
            <div style={styles.interimLabel}>Listening...</div>
            <div style={styles.interimText}>{interim}</div>
          </div>
        )}

        <div ref={historyEndRef} />
      </main>

      {isListening && (
        <div style={styles.footer}>
          <span style={styles.footerDot}></span>
          <span style={styles.footerText}>Listening and translating...</span>
        </div>
      )}
    </div>
  )
}
