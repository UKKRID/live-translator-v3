import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'

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

const BG = '#1c1c1c', BD = '#3a3a3a', DIM = '#b0b0b0', GRN = '#4ade80'
const cache = new Map()

async function translate(text, sl) {
  const k = sl + '|' + text
  if (cache.has(k)) return cache.get(k)
  return new Promise(r => {
    const x = new XMLHttpRequest()
    x.open('GET', `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl.split('-')[0]}&tl=th&dt=t&q=${encodeURIComponent(text)}`, true)
    x.timeout = 3000
    x.onload = () => { try { r(JSON.parse(x.responseText)[0].map(s => s[0]).join('') || text) } catch { r(text) } }
    x.onerror = () => r(text)
    x.ontimeout = () => r(text)
    x.send()
  }).then(t => { if (cache.size > 200) cache.clear(); cache.set(k, t); return t })
}

export default function App() {
  const [page, setPage] = useState('select')
  const [lang, setLang] = useState(null)
  const [isOn, setIsOn] = useState(false)
  const [cards, setCards] = useState([])
  const [interim, setInterim] = useState('')
  const [flash, setFlash] = useState(false)
  const boxRef = useRef(null)
  const recogRef = useRef(null)
  const idRef = useRef(0)

  const scroll = () => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }
  const doFlash = () => { setFlash(true); setTimeout(() => setFlash(false), 400) }
  useLayoutEffect(scroll)
  useEffect(scroll, [cards])

  const addCard = (src, flag) => {
    const id = ++idRef.current
    setCards(p => [...p, { id, src, th: '...', flag }])
    return id
  }
  const updCard = (id, th) => setCards(p => p.map(c => c.id === id ? { ...c, th } : c))

  const start = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = lang.code
    r.maxAlternatives = 1

    r.onstart = () => setIsOn(true)

    let interimBuf = ''
    let splitDone = false

    r.onresult = (ev) => {
      let interimText = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const txt = ev.results[i][0].transcript
        if (ev.results[i].isFinal) {
          if (splitDone) {
            const remain = txt.slice(60)
            if (remain.length > 2) {
              const id = addCard(remain, lang.flag)
              translate(remain, lang.code).then(t => { updCard(id, t); doFlash() })
            }
          } else {
            const id = addCard(txt, lang.flag)
            translate(txt, lang.code).then(t => { updCard(id, t); doFlash() })
          }
          setInterim('')
          interimBuf = ''
          splitDone = false
        } else {
          interimText += txt
        }
      }

      if (interimText) {
        if (interimText.length > 60 && !splitDone) {
          const cut = interimText.slice(0, 60)
          const id = addCard(cut, lang.flag)
          translate(cut, lang.code).then(t => { updCard(id, t); doFlash() })
          splitDone = true
          interimBuf = interimText.slice(60)
          setInterim(interimBuf)
        } else if (splitDone) {
          interimBuf = interimText.slice(60)
          setInterim(interimBuf)
        } else {
          interimBuf = interimText
          setInterim(interimText)
        }
      }
      scroll()
    }

    r.onerror = () => {}
    r.onend = () => { if (isOn) try { r.start() } catch {} }

    recogRef.current = r
    r.start()
  }, [lang, isOn])

  const stop = useCallback(() => {
    setIsOn(false)
    setInterim('')
    if (recogRef.current) { recogRef.current.stop(); recogRef.current = null }
  }, [])

  if (page === 'select') {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
        <style>{`*{margin:0;padding:0;box-sizing:border-box}html,body,#root{height:100%;overflow:hidden}body{background:#0d0d0d;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}`}</style>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Live Translator</h1>
          <p style={{ color: DIM, marginBottom: '48px', fontSize: '16px', fontWeight: '500' }}>Real-time voice translation to Thai</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', maxWidth: '640px', margin: '0 auto' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { setLang(l); setPage('main') }}
                style={{ background: BG, border: `1px solid ${BD}`, borderRadius: '14px', padding: '22px 12px', textAlign: 'center', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.transform = 'scale(1.06)' }}
                onMouseLeave={e => { e.currentTarget.style.background = BG; e.currentTarget.style.borderColor = BD; e.currentTarget.style.transform = 'none' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>{l.flag}</div>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{l.name}</div>
                <div style={{ color: DIM, fontSize: '12px' }}>→ Thai</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', background: flash ? '#0f1a12' : '#0d0d0d', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'background 0.3s ease' }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body,#root{height:100%;overflow:hidden}
        body{background:#0d0d0d;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        .box{flex:1;overflow-y:auto;padding:20px;max-width:720px;width:100%;margin:0 auto}
        .card{background:${BG};border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid ${BD}}
        .src{color:#fff;font-size:16px;font-weight:500;line-height:1.5;word-break:break-word}
        .th{color:${GRN};font-size:20px;font-weight:700;line-height:1.5;word-break:break-word}
        .meta{display:flex;gap:8px;font-size:12px;color:${DIM};font-weight:600;margin-bottom:8px}
        .interim{background:${BG};border-radius:14px;padding:16px;margin-bottom:12px;border:1px dashed #555}
        .interim .src{color:#999;font-size:15px}
      `}</style>

      <header style={{ background: '#141414', borderBottom: `1px solid ${BD}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => { stop(); setPage('select') }}
            style={{ color: '#fff', background: '#333', border: '1px solid #555', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '7px 14px', borderRadius: '8px' }}>← Back</button>
          <span style={{ fontSize: '24px' }}>{lang.flag}</span>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{lang.name} → 🇹🇭</span>
        </div>
        <button onClick={() => isOn ? stop() : start()}
          style={{ padding: '10px 24px', borderRadius: '24px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: '#fff', background: isOn ? '#dc2626' : '#16a34a', animation: isOn ? 'pulse 1.5s infinite' : 'none' }}>
          {isOn ? '⏹ Stop' : '🎤 Start'}
        </button>
      </header>

      <div ref={boxRef} className="box">
        {cards.length === 0 && !interim && (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎙️</div>
            <p style={{ fontSize: '20px', color: '#fff', fontWeight: '600', marginBottom: '8px' }}>
              {isOn ? `Listening ${lang.name}...` : `Press "Start" and speak ${lang.name}`}
            </p>
            <p style={{ fontSize: '15px', color: DIM }}>
              {isOn ? 'Waiting for speech...' : 'Voice will be translated to Thai in real-time'}
            </p>
          </div>
        )}
        {cards.map(c => (
          <div key={c.id} className="card">
            <div className="meta"><span>{c.flag}</span></div>
            <div className="src">{c.src}</div>
            <div className="th">🇹🇭 {c.th}</div>
          </div>
        ))}
        {interim && (
          <div className="interim">
            <div className="src">{interim}</div>
          </div>
        )}
      </div>

      {isOn && (
        <div style={{ background: '#141414', borderTop: `1px solid ${BD}`, padding: '12px', textAlign: 'center', flexShrink: 0 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: '#22c55e', borderRadius: '50%', marginRight: 8, animation: 'blink 1s infinite' }}></span>
          <span style={{ color: GRN, fontSize: '14px', fontWeight: '700' }}>Listening and translating...</span>
        </div>
      )}
    </div>
  )
}
