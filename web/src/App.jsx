import { useState, useRef, useEffect, useCallback } from 'react'

const LANGUAGES = [
  { code: 'en-US', name: 'English', sub: 'อังกฤษ', flag: '🇬🇧', flagImg: 'https://flagcdn.com/w80/gb.png', color: '#3b82f6' },
  { code: 'zh-CN', name: 'Chinese', sub: 'จีน', flag: '🇨🇳', flagImg: 'https://flagcdn.com/w80/cn.png', color: '#ef4444' },
  { code: 'ja-JP', name: 'Japanese', sub: 'ญี่ปุ่น', flag: '🇯🇵', flagImg: 'https://flagcdn.com/w80/jp.png', color: '#f43f5e' },
  { code: 'ko-KR', name: 'Korean', sub: 'เกาหลี', flag: '🇰🇷', flagImg: 'https://flagcdn.com/w80/kr.png', color: '#8b5cf6' },
  { code: 'es-ES', name: 'Spanish', sub: 'สเปน', flag: '🇪🇸', flagImg: 'https://flagcdn.com/w80/es.png', color: '#f97316' },
  { code: 'fr-FR', name: 'French', sub: 'ฝรั่งเศส', flag: '🇫🇷', flagImg: 'https://flagcdn.com/w80/fr.png', color: '#6366f1' },
  { code: 'de-DE', name: 'German', sub: 'เยอรมัน', flag: '🇩🇪', flagImg: 'https://flagcdn.com/w80/de.png', color: '#eab308' },
  { code: 'pt-BR', name: 'Portuguese', sub: 'โปรตุเกส', flag: '🇧🇷', flagImg: 'https://flagcdn.com/w80/br.png', color: '#22c55e' },
  { code: 'ru-RU', name: 'Russian', sub: 'รัสเซีย', flag: '🇷🇺', flagImg: 'https://flagcdn.com/w80/ru.png', color: '#06b6d4' },
  { code: 'ar-SA', name: 'Arabic', sub: 'อาหรับ', flag: '🇸🇦', flagImg: 'https://flagcdn.com/w80/sa.png', color: '#10b981' },
]

const MAX = 10
const TH_FLAG = '🇹🇭'
const TH_FLAG_IMG = 'https://flagcdn.com/w80/th.png'
const CHUNK_DURATION = 3000

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

async function transcribeAudio(audioBlob, language) {
  const reader = new FileReader()
  const base64 = await new Promise((resolve, reject) => {
    reader.onload = () => {
      const data = reader.result.split(',')[1]
      resolve(data)
    }
    reader.onerror = reject
    reader.readAsDataURL(audioBlob)
  })

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: base64, language }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Transcription failed' }))
    throw new Error(err.error || 'Transcription failed')
  }

  const result = await res.json()
  return result.text || ''
}

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans Thai",sans-serif;overflow:hidden}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(74,222,128,.3)}50%{box-shadow:0 0 20px rgba(74,222,128,.5)}}
@keyframes barPulse{0%{width:0%}50%{width:100%}100%{width:0%}}
`

function Spinner({ size = 16, color = '#4ade80' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2.5px solid rgba(255,255,255,.15)`, borderTopColor: color,
      borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0
    }} />
  )
}

function TranslationCard({ card, lang }) {
  const isTranslating = card.th === null
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: 16, padding: '18px 20px', marginBottom: 14,
      border: '1px solid rgba(255,255,255,.06)',
      animation: 'fadeUp .3s ease-out',
      boxShadow: '0 4px 24px rgba(0,0,0,.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <img src={lang.flagImg} alt="" style={{ width: 28, height: 21, borderRadius: 2, objectFit: 'cover' }} />
        <span style={{ color: 'rgba(255,255,255,.25)', fontSize: 14 }}>→</span>
        <img src={TH_FLAG_IMG} alt="TH" style={{ width: 28, height: 21, borderRadius: 2, objectFit: 'cover' }} />
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,.3)',
          fontWeight: 500, letterSpacing: 0.5
        }}>{lang.name} → Thai</span>
      </div>
      <div style={{
        color: 'rgba(255,255,255,.85)', fontSize: 15, fontWeight: 500,
        lineHeight: 1.6, wordBreak: 'break-word', marginBottom: 10,
        paddingLeft: 12, borderLeft: `3px solid ${lang.color}`,
      }}>{card.src}</div>
      <div style={{
        color: '#4ade80', fontSize: 18, fontWeight: 700,
        lineHeight: 1.6, wordBreak: 'break-word', paddingLeft: 12,
      }}>
        {isTranslating ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Spinner size={18} />
            <span style={{ color: 'rgba(74,222,128,.5)', fontWeight: 500 }}>กำลังแปล...</span>
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span>{TH_FLAG}</span>
            <span>{card.th}</span>
          </span>
        )}
      </div>
    </div>
  )
}

function ListeningCard({ lang }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d2818 0%, #1a3a2a 100%)',
      borderRadius: 16, padding: '18px 20px', marginBottom: 14,
      border: '1px solid rgba(74,222,128,.15)',
      animation: 'glow 2s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Spinner size={20} color="#4ade80" />
        <span style={{ color: '#4ade80', fontSize: 14, fontWeight: 600 }}>กำลังฟัง system audio...</span>
        <img src={lang.flagImg} alt="" style={{ marginLeft: 'auto', width: 28, height: 21, borderRadius: 2, objectFit: 'cover' }} />
      </div>
      <div style={{
        marginTop: 10, height: 3, background: 'rgba(74,222,128,.1)', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#4ade80', borderRadius: 2,
          animation: 'barPulse 3s ease-in-out infinite',
        }} />
      </div>
    </div>
  )
}

export default function App() {
  const [selectedLang, setSelectedLang] = useState(null)
  const [status, setStatus] = useState('idle')
  const [cards, setCards] = useState([])
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const boxRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunkTimerRef = useRef(null)
  const activeRef = useRef(false)
  const cardIdRef = useRef(0)
  const processingRef = useRef(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
    })
  }, [cards, listening])

  const updateCard = useCallback((id, th) => {
    setCards(p => p.map(c => c.id === id ? { ...c, th } : c))
  }, [])

  const addCard = useCallback((src) => {
    const id = ++cardIdRef.current
    setCards(p => {
      const next = [...p, { id, src, th: null }]
      return next.length > MAX ? next.slice(next.length - MAX) : next
    })
    return id
  }, [])

  const processChunk = useCallback(async (blob) => {
    if (!blob || blob.size < 1000 || processingRef.current) return
    processingRef.current = true
    try {
      const text = await transcribeAudio(blob, selectedLang?.code)
      if (text && text.trim().length > 0) {
        const id = addCard(text.trim())
        translateWithRetry(text.trim(), selectedLang.code)
          .then(th => updateCard(id, th))
      }
    } catch (err) {
      console.error('Transcribe error:', err)
    } finally {
      processingRef.current = false
    }
  }, [selectedLang, addCard, updateCard])

  const startRecording = useCallback(async () => {
    setError('')
    setStatus('requesting')

    let stream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000,
        },
        video: true,
      })
    } catch (err) {
      setError('ไม่ได้รับอนุญาตให้จับเสียง กรุณาเลือก tab ที่มีเสียงแล้วติ๊ก "Share system audio"')
      setStatus('idle')
      return
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      setError('ไม่พบ audio track — กรุณาติ๊ก "Share system audio" ตอนเลือก tab')
      stream.getTracks().forEach(t => t.stop())
      setStatus('idle')
      return
    }

    streamRef.current = stream

    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (activeRef.current) stop()
    })

    audioTracks[0].addEventListener('ended', () => {
      if (activeRef.current) stop()
    })

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    const chunks = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: mimeType })
        processChunk(blob)
      }
      chunks.length = 0
    }

    recorder.start()
    activeRef.current = true
    setListening(true)
    setStatus('listening')
    setCards([])
    cardIdRef.current = 0

    chunkTimerRef.current = setInterval(() => {
      if (recorder.state === 'recording') {
        recorder.stop()
        recorder.start()
      }
    }, CHUNK_DURATION)

  }, [processChunk])

  const stop = useCallback(() => {
    activeRef.current = false
    setListening(false)
    setStatus('idle')
    setError('')

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current)
      chunkTimerRef.current = null
    }

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      recorderRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => () => { stop() }, [stop])

  const statusDotColor = status === 'listening' ? '#4ade80' : status === 'requesting' ? '#eab308' : 'rgba(255,255,255,.3)'
  const statusLabel = status === 'listening' ? 'ฟังอยู่ (system audio)' : status === 'requesting' ? 'กำลังขอสิทธิ์...' : ''

  if (!selectedLang) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
        <style>{CSS}</style>
        <div style={{ padding: '80px 20px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌐</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: -0.5 }}>
            Live Translator
          </h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 15, marginBottom: 56, fontWeight: 500 }}>
            เลือกภาษาที่ต้องการแปล
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, maxWidth: 560, margin: '0 auto' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setSelectedLang(l)}
                style={{
                  background: 'rgba(255,255,255,.03)',
                  border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 16, padding: '24px 8px', cursor: 'pointer',
                  transition: 'all .2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.08)'
                  e.currentTarget.style.borderColor = l.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 8px 24px ${l.color}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                  <img src={l.flagImg} alt={l.name} style={{ width: 48, height: 36, borderRadius: 4, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }} />
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{l.name}</div>
                <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 11 }}>{l.sub} → ไทย</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{CSS}</style>
      <header style={{
        background: 'rgba(10,10,10,.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        padding: '12px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { stop(); setSelectedLang(null); setCards([]); cardIdRef.current = 0 }}
            style={{
              color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer',
              fontSize: 13, padding: '6px 12px', borderRadius: 10,
              fontWeight: 500, transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
          >← Back</button>
          <img src={selectedLang.flagImg} alt="" style={{ width: 32, height: 24, borderRadius: 3, objectFit: 'cover' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{selectedLang.name}</span>
          <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 18 }}>→</span>
          <img src={TH_FLAG_IMG} alt="TH" style={{ width: 32, height: 24, borderRadius: 3, objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeRef.current && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: statusDotColor, fontWeight: 600 }}>
              <span style={{
                width: 7, height: 7, background: statusDotColor, borderRadius: '50%',
                animation: status === 'listening' ? 'pulse 1.5s infinite' : 'none',
                boxShadow: `0 0 8px ${statusDotColor}`,
              }}></span>
              {statusLabel}
            </span>
          )}
          <button onClick={() => { setCards([]); cardIdRef.current = 0 }}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              color: 'rgba(255,255,255,.5)', background: 'rgba(255,255,255,.06)',
              transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
          >ล้าง</button>
          <button onClick={() => { if (activeRef.current) { stop() } else { startRecording() } }}
            style={{
              padding: '9px 22px', borderRadius: 12, border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#fff',
              background: activeRef.current
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'linear-gradient(135deg, #16a34a, #15803d)',
              boxShadow: activeRef.current
                ? '0 4px 16px rgba(220,38,38,.3)'
                : '0 4px 16px rgba(22,163,74,.3)',
              transition: 'all .2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            {activeRef.current ? '⏹ หยุด' : '🎤 เริ่มฟัง'}
          </button>
        </div>
      </header>

      <div ref={boxRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 14,
            color: '#f87171', fontSize: 13, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}
        {cards.length === 0 && !listening && !error && (
          <div style={{ textAlign: 'center', marginTop: 100, opacity: 0.3 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎙️</div>
            <p style={{ fontSize: 14 }}>กด "เริ่มฟัง" แล้วเลือก tab ที่มีเสียง</p>
            <p style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>อย่าลืมติ๊ก "Share system audio"</p>
          </div>
        )}
        {cards.map(c => (
          <TranslationCard key={c.id} card={c} lang={selectedLang} />
        ))}
        {listening && <ListeningCard lang={selectedLang} />}
      </div>
    </div>
  )
}
