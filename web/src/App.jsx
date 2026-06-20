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
const TEXT_DIM = '#b0b0b0'
const GREEN = '#4ade80'
const cache = new Map()

function translateXHR(text, langCode) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', `https://translate.googleapis.com/translate_a/t?client=gtx&sl=${langCode}&tl=th&dt=t&q=${encodeURIComponent(text)}`, true)
    xhr.timeout = 3000
    xhr.onload = () => {
      try {
        const d = JSON.parse(xhr.responseText)
        resolve(d[0] ? d[0][0] || text : text)
      } catch { resolve(text) }
    }
    xhr.onerror = () => resolve(text)
    xhr.ontimeout = () => resolve(text)
    xhr.send()
  })
}

async function fastTranslate(text, srcLang) {
  const key = srcLang + '|' + text
  if (cache.has(key)) return cache.get(key)
  const langCode = srcLang.split('-')[0]
  const result = await translateXHR(text, langCode)
  if (cache.size > 200) cache.clear()
  cache.set(key, result)
  return result
}

export default function App() {
  const [page, setPage] = useState('select')
  const [lang, setLang] = useState(null)
  const [isOn, setIsOn] = useState(false)
  const [history, setHistory] = useState([])
  const recogRef = useRef(null)
  const listRef = useRef(null)
  const interimRef = useRef(null)
  const countRef = useRef(0)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [history])

  const addCard = (source, time, flag) => {
    setHistory(prev => [...prev, { id: ++countRef.current, source, translated: '...', time, flag }])
    return countRef.current
  }

  const updateCard = (id, translated) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, translated } : item))
  }

  const start = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = lang.code
    r.maxAlternatives = 1

    r.onstart = () => setIsOn(true)

    r.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        const text = res[0].transcript
        if (res.isFinal) {
          const now = new Date().toLocaleTimeString('th-TH')
          const id = addCard(text, now, lang.flag)
          fastTranslate(text, lang.code).then(t => updateCard(id, t))
        } else {
          interimText += text
        }
      }
      if (interimRef.current) {
        interimRef.current.textContent = interimText
        interimRef.current.style.display = interimText ? 'block' : 'none'
      }
    }

    r.onerror = () => {}
    r.onend = () => {}

    recogRef.current = r
    r.start()
  }, [lang, isOn])

  const stop = useCallback(() => {
    setIsOn(false)
    if (recogRef.current) { recogRef.current.stop(); recogRef.current = null }
  }, [])

  const pickLang = (l) => { setLang(l); setPage('main') }

  if (page === 'select') {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
        <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#0d0d0d;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}`}</style>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Live Translator</h1>
          <p style={{ color: TEXT_DIM, marginBottom: '48px', fontSize: '16px', fontWeight: '500' }}>Real-time voice translation to Thai</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', maxWidth: '640px', margin: '0 auto' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => pickLang(l)}
                style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '22px 12px', textAlign: 'center', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.transform = 'scale(1.06)' }}
                onMouseLeave={e => { e.currentTarget.style.background = CARD_BG; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = 'none' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>{l.flag}</div>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{l.name}</div>
                <div style={{ color: TEXT_DIM, fontSize: '12px' }}>→ Thai</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#0d0d0d;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        .card{background:${CARD_BG};border-radius:14px;padding:18px;margin-bottom:14px;border:1px solid ${BORDER}}
        .src{color:#fff;font-size:17px;font-weight:500;line-height:1.5;margin-bottom:8px;word-break:break-word}
        .th{color:${GREEN};font-size:21px;font-weight:700;line-height:1.5;word-break:break-word}
        .meta{display:flex;gap:8px;font-size:13px;color:${TEXT_DIM};font-weight:600;margin-bottom:10px}
        #interim{display:none;background:${CARD_BG};border-radius:14px;padding:18px;margin-bottom:14px;border:2px dashed #555}
        #interim .label{color:${TEXT_DIM};font-size:13px;font-weight:600;margin-bottom:8px}
        #interim .text{color:#fff;font-size:17px;font-weight:500}
      `}</style>

      <header style={{ background: '#141414', borderBottom: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { stop(); setPage('select') }}
            style={{ color: '#fff', background: '#333', border: '1px solid #555', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '8px' }}>← Back</button>
          <span style={{ fontSize: '26px' }}>{lang.flag}</span>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '17px' }}>{lang.name} → 🇹🇭</span>
        </div>
        <button onClick={() => isOn ? stop() : start()}
          style={{ padding: '12px 28px', borderRadius: '28px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', color: '#fff', background: isOn ? '#dc2626' : '#16a34a', animation: isOn ? 'pulse 1.5s infinite' : 'none' }}>
          {isOn ? '⏹ Stop' : '🎤 Start'}
        </button>
      </header>

      <main ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        {!isOn && history.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎙️</div>
            <p style={{ fontSize: '20px', color: '#fff', fontWeight: '600', marginBottom: '8px' }}>Press "Start" and speak {lang.name}</p>
            <p style={{ fontSize: '15px', color: TEXT_DIM }}>Voice will be translated to Thai in real-time</p>
          </div>
        )}
        {history.map(item => (
          <div key={item.id} className="card">
            <div className="meta"><span>{item.time}</span><span>{item.flag}</span></div>
            <div className="src">{item.source}</div>
            <div className="th">🇹🇭 {item.translated}</div>
          </div>
        ))}
        <div id="interim" ref={interimRef}>
          <div className="label">Listening...</div>
          <div className="text"></div>
        </div>
      </main>

      {isOn && (
        <div style={{ background: '#141414', borderTop: `1px solid ${BORDER}`, padding: '14px', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, background: '#22c55e', borderRadius: '50%', marginRight: 10, animation: 'blink 1s infinite' }}></span>
          <span style={{ color: GREEN, fontSize: '15px', fontWeight: '700' }}>Listening and translating...</span>
        </div>
      )}
    </div>
  )
}
