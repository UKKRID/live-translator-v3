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

function xhrTranslate(text, langCode) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${langCode}&tl=th&dt=t&q=${encodeURIComponent(text)}`
    xhr.open('GET', url, true)
    xhr.timeout = 3000
    xhr.onload = () => {
      try {
        const d = JSON.parse(xhr.responseText)
        const result = d[0].map(s => s[0]).join('')
        resolve(result || text)
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
  const result = await xhrTranslate(text, langCode)
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
  const silenceRef = useRef(null)

  const scrollDown = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }

  useEffect(() => { scrollDown() }, [history])
  useEffect(() => {
    const t = setInterval(scrollDown, 300)
    return () => clearInterval(t)
  }, [])

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

    let interimCardId = null
    let interimSource = ''
    let lastTranslatedText = ''
    let lastTranslatedLen = 0
    let translateTimer = null

    const doTranslate = (text, cardId) => {
      fastTranslate(text, lang.code).then(t => {
        if (cardId === interimCardId) {
          setHistory(prev => prev.map(item => item.id === cardId ? { ...item, translated: t } : item))
        }
      })
    }

    r.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        const text = res[0].transcript
        if (res.isFinal) {
          const finalId = interimCardId || (() => {
            const now = new Date().toLocaleTimeString('th-TH')
            return addCard(text, now, lang.flag)
          })()
          interimCardId = null
          interimSource = ''
          lastTranslatedText = ''
          clearTimeout(translateTimer)
          doTranslate(text, finalId)
          lastFinalTime = Date.now()
        } else {
          interimText += text
          lastInterimText = text
        }
      }

      if (interimText) {
        if (interimText.length > 80 && interimCardId) {
          const cutText = interimText.slice(0, 80)
          const remainText = interimText.slice(80)
          setHistory(prev => prev.map(item => item.id === interimCardId ? { ...item, source: cutText } : item))
          doTranslate(cutText, interimCardId)
          const now = new Date().toLocaleTimeString('th-TH')
          interimCardId = addCard(remainText, now, lang.flag)
          interimSource = remainText
          doTranslate(remainText, interimCardId)
        } else if (!interimCardId) {
          const now = new Date().toLocaleTimeString('th-TH')
          interimCardId = addCard(interimText, now, lang.flag)
          interimSource = interimText
        } else {
          setHistory(prev => prev.map(item => item.id === interimCardId ? { ...item, source: interimText } : item))
          interimSource = interimText
        }

        if (interimText !== lastTranslatedText && interimText.length - lastTranslatedLen > 20) {
          clearTimeout(translateTimer)
          translateTimer = setTimeout(() => {
            lastTranslatedText = interimText
            lastTranslatedLen = interimText.length
            doTranslate(interimText, interimCardId)
          }, 200)
        }
      }
    }

    r.onerror = () => {}
    r.onend = () => {}

    let lastFinalTime = Date.now()
    let lastInterimText = ''
    let lastInterimLen = 0

    silenceRef.current = setInterval(() => {}, 10000)

    recogRef.current = r
    r.start()
  }, [lang, isOn])

  const stop = useCallback(() => {
    setIsOn(false)
    if (silenceRef.current) { clearInterval(silenceRef.current); silenceRef.current = null }
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

      <main ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '720px', margin: '0 auto', width: '100%', height: 0, minHeight: 0 }}>
        {!isOn && history.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎙️</div>
            <p style={{ fontSize: '20px', color: '#fff', fontWeight: '600', marginBottom: '8px' }}>Press "Start" and speak {lang.name}</p>
            <p style={{ fontSize: '15px', color: TEXT_DIM }}>Voice will be translated to Thai in real-time</p>
          </div>
        )}
        {history.filter(item => item.source.length >= 4).map(item => (
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
