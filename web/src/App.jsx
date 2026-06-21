import { useState, useRef, useEffect } from 'react'

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
const MAX = 10

const translateCache = new Map()
async function translateText(text, sl) {
  const key = sl + '|' + text
  if (translateCache.has(key)) return translateCache.get(key)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl.split('-')[0]}&tl=th&dt=t&q=${encodeURIComponent(text)}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    const d = await res.json()
    const result = d[0].map(s => s[0]).join('') || text
    if (translateCache.size > 300) translateCache.clear()
    translateCache.set(key, result)
    return result
  } catch {
    clearTimeout(timeout)
    return text
  }
}

async function translateWithRetry(text, sl, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const result = await translateText(text, sl)
    if (result !== text) return result
    if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
  }
  return text
}

export default function App() {
  const [selectedLang, setSelectedLang] = useState(null)
  const [status, setStatus] = useState('idle')
  const boxRef = useRef(null)
  const recogRef = useRef(null)
  const countRef = useRef(0)
  const restartTimerRef = useRef(null)
  const activeRef = useRef(false)
  const restartCountRef = useRef(0)

  const addCard = (src, flag) => {
    const box = boxRef.current
    if (!box) return null
    const div = document.createElement('div')
    div.style.cssText = `background:${BG};border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid ${BD}`
    div.innerHTML = `<div style="font-size:12px;color:${DIM};font-weight:600;margin-bottom:8px">${flag}</div><div style="color:#fff;font-size:16px;font-weight:500;line-height:1.5;word-break:break-word">${src}</div><div style="color:${GRN};font-size:20px;font-weight:700;line-height:1.5;margin-top:4px;word-break:break-word">🇹🇭 ...</div>`
    box.appendChild(div)
    countRef.current++
    while (countRef.current > MAX && box.firstChild) {
      box.removeChild(box.firstChild)
      countRef.current--
    }
    box.scrollTop = box.scrollHeight
    return div
  }

  const updateCard = (div, th) => {
    if (div && div.children[2]) div.children[2].textContent = '🇹🇭 ' + th
  }

  const scheduleRestart = () => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    const delay = Math.min(500 * Math.pow(1.5, restartCountRef.current), 5000)
    restartTimerRef.current = setTimeout(() => {
      if (activeRef.current) startRecognition()
    }, delay)
  }

  const createRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null

    const r = new SR()
    r.continuous = true
    r.interimResults = false
    r.lang = selectedLang.code
    r.maxAlternatives = 1

    r.onresult = (ev) => {
      restartCountRef.current = 0
      setStatus('listening')
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) {
          const txt = ev.results[i][0].transcript.trim()
          if (!txt) continue
          const card = addCard(txt, selectedLang.flag)
          if (card) {
            translateWithRetry(txt, selectedLang.code)
              .then(th => updateCard(card, th))
          }
        }
      }
    }

    r.onerror = (ev) => {
      if (ev.error === 'no-speech' || ev.error === 'aborted') return
      setStatus('error')
      if (activeRef.current) scheduleRestart()
    }

    r.onend = () => {
      if (activeRef.current) {
        setStatus('reconnecting')
        scheduleRestart()
      }
    }

    r.onstart = () => {
      setStatus('listening')
      restartCountRef.current = 0
    }

    return r
  }

  const startRecognition = () => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null }
    if (recogRef.current) {
      try { recogRef.current.abort() } catch {}
      recogRef.current = null
    }
    const r = createRecognition()
    if (!r) return
    recogRef.current = r
    try { r.start() } catch {}
  }

  const start = () => {
    activeRef.current = true
    restartCountRef.current = 0
    startRecognition()
  }

  const stop = () => {
    activeRef.current = false
    setStatus('idle')
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null }
    if (recogRef.current) { try { recogRef.current.abort() } catch {} recogRef.current = null }
  }

  useEffect(() => () => { activeRef.current = false; if (restartTimerRef.current) clearTimeout(restartTimerRef.current); if (recogRef.current) try { recogRef.current.abort() } catch {} }, [])

  const statusColor = status === 'listening' ? GRN : status === 'error' ? '#ef4444' : status === 'reconnecting' ? '#eab308' : DIM
  const statusText = status === 'listening' ? 'Listening...' : status === 'error' ? 'Error - reconnecting...' : status === 'reconnecting' ? 'Reconnecting...' : ''

  if (!selectedLang) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
        <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#0d0d0d;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}`}</style>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Live Translator 🪟</h1>
          <p style={{ color: DIM, marginBottom: '48px', fontSize: '16px' }}>Real-time voice translation to Thai</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', maxWidth: '640px', margin: '0 auto' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setSelectedLang(l)}
                style={{ background: BG, border: `1px solid ${BD}`, borderRadius: '14px', padding: '22px 12px', cursor: 'pointer' }}>
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
    <div style={{ height: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#0d0d0d;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}`}</style>
      <header style={{ background: '#141414', borderBottom: `1px solid ${BD}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => { stop(); setSelectedLang(null); countRef.current = 0; if (boxRef.current) boxRef.current.innerHTML = '' }}
            style={{ color: '#fff', background: '#333', border: '1px solid #555', cursor: 'pointer', fontSize: '13px', padding: '7px 14px', borderRadius: '8px' }}>← Back</button>
          <span style={{ fontSize: '24px' }}>{selectedLang.flag}</span>
          <span style={{ color: '#fff', fontWeight: '700' }}>{selectedLang.name} → 🇹🇭</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {activeRef.current && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: statusColor }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: statusColor, borderRadius: '50%', animation: status === 'listening' ? 'pulse 1.5s infinite' : 'none' }}></span>
              {statusText}
            </span>
          )}
          <button onClick={() => { if (boxRef.current) boxRef.current.innerHTML = ''; countRef.current = 0 }}
            style={{ padding: '10px 16px', borderRadius: '24px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: '#fff', background: '#555' }}>🗑 Clear</button>
          <button onClick={() => { if (activeRef.current) { stop() } else { start() } }}
            style={{ padding: '10px 24px', borderRadius: '24px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: '#fff', background: activeRef.current ? '#dc2626' : '#16a34a' }}>
            {activeRef.current ? '⏹ Stop' : '🎤 Start'}
          </button>
        </div>
      </header>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div ref={boxRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', maxWidth: '720px', width: '100%', margin: '0 auto' }}></div>
    </div>
  )
}
