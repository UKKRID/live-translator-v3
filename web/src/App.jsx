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

const CARD_BG = '#1c1c1c'
const BORDER = '#3a3a3a'
const TEXT_DIM = '#b0b0b0'
const GREEN = '#4ade80'
const cache = new Map()

function xhrTrans(text, lc) {
  return new Promise(r => {
    const x = new XMLHttpRequest()
    x.open('GET', `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${lc}&tl=th&dt=t&q=${encodeURIComponent(text)}`, true)
    x.timeout = 3000
    x.onload = () => { try { r(JSON.parse(x.responseText)[0].map(s => s[0]).join('') || text) } catch { r(text) } }
    x.onerror = () => r(text)
    x.ontimeout = () => r(text)
    x.send()
  })
}

async function tr(text, sl) {
  const k = sl + '|' + text
  if (cache.has(k)) return cache.get(k)
  const r = await xhrTrans(text, sl.split('-')[0])
  if (cache.size > 200) cache.clear()
  cache.set(k, r)
  return r
}

export default function App() {
  const [page, setPage] = useState('select')
  const [lang, setLang] = useState(null)
  const [isOn, setIsOn] = useState(false)
  const [cards, setCards] = useState([])
  const boxRef = useRef(null)
  const recogRef = useRef(null)
  const idRef = useRef(0)
  const activeCardRef = useRef(null)
  const transTRef = useRef(null)

  const scroll = () => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }

  useLayoutEffect(scroll)
  useEffect(scroll, [cards])
  useEffect(() => { const t = setInterval(scroll, 200); return () => clearInterval(t) }, [])

  const newCard = (src, flag) => {
    const id = ++idRef.current
    setCards(p => [...p, { id, src, th: '...', flag, done: false }])
    return id
  }

  const updCard = (id, src, th) => {
    setCards(p => p.map(c => c.id === id ? { ...c, src: src ?? c.src, th: th ?? c.th } : c))
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

    r.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i]
        const txt = res[0].transcript

        if (res.isFinal) {
          if (activeCardRef.current) {
            updCard(activeCardRef.current, txt)
            tr(txt, lang.code).then(t => updCard(activeCardRef.current, null, t))
          } else {
            const id = newCard(txt, lang.flag)
            tr(txt, lang.code).then(t => updCard(id, null, t))
          }
          activeCardRef.current = null
          clearTimeout(transTRef.current)
        } else {
          if (!activeCardRef.current) {
            activeCardRef.current = newCard(txt, lang.flag)
          } else {
            updCard(activeCardRef.current, txt)
            if (txt.length > 80) {
              const cut = txt.slice(0, 80)
              const rem = txt.slice(80)
              updCard(activeCardRef.current, cut)
              tr(cut, lang.code).then(t => updCard(activeCardRef.current, null, t))
              activeCardRef.current = newCard(rem, lang.flag)
            }
          }
          clearTimeout(transTRef.current)
          transTRef.current = setTimeout(() => {
            if (activeCardRef.current) {
              const cur = txt
              tr(cur, lang.code).then(t => updCard(activeCardRef.current, null, t))
            }
          }, 200)
        }
      }
    }

    r.onerror = () => {}
    r.onend = () => {}
    recogRef.current = r
    r.start()
  }, [lang, isOn])

  const stop = useCallback(() => {
    setIsOn(false)
    clearTimeout(transTRef.current)
    if (recogRef.current) { recogRef.current.stop(); recogRef.current = null }
  }, [])

  if (page === 'select') {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
        <style>{`*{margin:0;padding:0;box-sizing:border-box}html,body,#root{height:100%;overflow:hidden}body{background:#0d0d0d;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}`}</style>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Live Translator</h1>
          <p style={{ color: TEXT_DIM, marginBottom: '48px', fontSize: '16px', fontWeight: '500' }}>Real-time voice translation to Thai</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', maxWidth: '640px', margin: '0 auto' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { setLang(l); setPage('main') }}
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
    <div style={{ height: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body,#root{height:100%;overflow:hidden}
        body{background:#0d0d0d;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        .box{flex:1;overflow-y:auto;padding:20px;max-width:720px;width:100%;margin:0 auto}
        .card{background:${CARD_BG};border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid ${BORDER}}
        .src{color:#fff;font-size:16px;font-weight:500;line-height:1.5;word-break:break-word}
        .th{color:${GREEN};font-size:20px;font-weight:700;line-height:1.5;word-break:break-word}
        .meta{display:flex;gap:8px;font-size:12px;color:${TEXT_DIM};font-weight:600;margin-bottom:8px}
      `}</style>

      <header style={{ background: '#141414', borderBottom: `1px solid ${BORDER}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
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
        {!isOn && cards.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎙️</div>
            <p style={{ fontSize: '20px', color: '#fff', fontWeight: '600', marginBottom: '8px' }}>Press "Start" and speak {lang.name}</p>
            <p style={{ fontSize: '15px', color: TEXT_DIM }}>Voice will be translated to Thai in real-time</p>
          </div>
        )}
        {cards.filter(c => c.src && c.src.length >= 3).map(c => (
          <div key={c.id} className="card">
            <div className="meta"><span>{c.flag}</span></div>
            <div className="src">{c.src}</div>
            <div className="th">🇹🇭 {c.th}</div>
          </div>
        ))}
      </div>

      {isOn && (
        <div style={{ background: '#141414', borderTop: `1px solid ${BORDER}`, padding: '12px', textAlign: 'center', flexShrink: 0 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: '#22c55e', borderRadius: '50%', marginRight: 8, animation: 'blink 1s infinite' }}></span>
          <span style={{ color: GREEN, fontSize: '14px', fontWeight: '700' }}>Listening and translating...</span>
        </div>
      )}
    </div>
  )
}
