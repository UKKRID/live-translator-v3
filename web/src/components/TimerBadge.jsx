import { useState, useEffect } from 'react'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}ชม. ${m}น.`
  if (m > 0) return `${m}น. ${s}วิ`
  return `${s}วิ`
}

export default function TimerBadge({ remaining, isPro, onUpgrade }) {
  const [showDetails, setShowDetails] = useState(false)

  if (isPro) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'linear-gradient(135deg, rgba(245,158,11,.15) 0%, rgba(217,119,6,.08) 100%)',
        border: '1px solid rgba(245,158,11,.3)',
        borderRadius: 10, padding: '6px 12px',
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 11L4 5L8 8L12 5L14 11H2Z" fill="#f59e0b" />
          <rect x="1" y="12" width="14" height="2" rx="1" fill="#f59e0b" />
        </svg>
        <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>PRO</span>
      </div>
    )
  }

  const isLow = remaining < 600
  const isCritical = remaining < 300

  return (
    <div
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      style={{ position: 'relative' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: isCritical
          ? 'linear-gradient(135deg, rgba(239,68,68,.15) 0%, rgba(220,38,38,.08) 100%)'
          : isLow
            ? 'linear-gradient(135deg, rgba(245,158,11,.15) 0%, rgba(217,119,6,.08) 100%)'
            : 'rgba(255,255,255,.05)',
        border: `1px solid ${isCritical ? 'rgba(239,68,68,.3)' : isLow ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.08)'}`,
        borderRadius: 10, padding: '6px 12px',
        cursor: 'pointer', transition: 'all .2s',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#4ade80',
          animation: isCritical ? 'pulse 1s infinite' : 'none',
          boxShadow: `0 0 8px ${isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#4ade80'}`,
        }} />
        <span style={{
          color: isCritical ? '#f87171' : isLow ? '#fbbf24' : 'rgba(255,255,255,.6)',
          fontSize: 12, fontWeight: 600,
        }}>
          {formatTime(remaining)}
        </span>
      </div>

      {showDetails && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 14, padding: '16px 18px', minWidth: 220,
          boxShadow: '0 16px 48px rgba(0,0,0,.5)',
          zIndex: 100, animation: 'fadeUp .2s ease-out',
        }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            เวลาใช้งานฟรีคงเหลือ
          </div>
          <div style={{
            color: isCritical ? '#f87171' : '#fbbf24',
            fontSize: 28, fontWeight: 800, marginBottom: 12,
          }}>
            {formatTime(remaining)}
          </div>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
            เมื่อหมดเวลาจะไม่สามารถใช้งานได้
          </p>
          <button onClick={onUpgrade}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99,102,241,.3)',
            }}>
            อัพเกรดเป็น Pro
          </button>
        </div>
      )}
    </div>
  )
}
