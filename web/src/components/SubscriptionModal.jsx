import { useState } from 'react'

const PLANS = [
  {
    id: 'monthly',
    name: 'รายเดือน',
    price: 149,
    period: '/เดือน',
    badge: null,
    color: '#3b82f6',
    features: [
      'ใช้งานไม่จำกัด',
      'แปลภาษาได้ 10+ ภาษา',
      'ความเร็วสูงสุด',
      'ไม่มีโฆษณา',
      'อัพเดทฟรี',
    ],
  },
  {
    id: 'yearly',
    name: 'รายปี',
    price: 1199,
    period: '/ปี',
    badge: 'ประหยัด 33%',
    color: '#8b5cf6',
    features: [
      'ใช้งานไม่จำกัด',
      'แปลภาษาได้ 10+ ภาษา',
      'ความเร็วสูงสุด',
      'ไม่มีโฆษณา',
      'อัพเดทฟรี',
      'Priority support',
    ],
  },
  {
    id: 'lifetime',
    name: 'ตลอดกาล',
    price: 2999,
    period: 'ครั้งเดียว',
    badge: 'คุ้มที่สุด',
    color: '#f59e0b',
    features: [
      'ใช้งานไม่จำกัดตลอดกาล',
      'แปลภาษาได้ 10+ ภาษา',
      'ความเร็วสูงสุด',
      'ไม่มีโฆษณา',
      'อัพเดทฟรีตลอดกาล',
      'Priority support',
      'Early access ฟีเจอร์ใหม่',
    ],
  },
]

function CheckIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill={color} fillOpacity="0.15" />
      <path d="M5 8L7 10L11 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 11L4 5L8 8L12 5L14 11H2Z" fill="#f59e0b" />
      <rect x="1" y="12" width="14" height="2" rx="1" fill="#f59e0b" />
    </svg>
  )
}

export default function SubscriptionModal({ onClose, onSubscribe }) {
  const [selectedPlan, setSelectedPlan] = useState('yearly')
  const [processing, setProcessing] = useState(false)

  const handleSubscribe = async () => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1500))
    onSubscribe(selectedPlan)
    setProcessing(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(20px)',
      padding: 20,
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
        borderRadius: 24, padding: '32px 28px',
        border: '1px solid rgba(255,255,255,.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,.6)',
        maxWidth: 480, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'fadeUp .3s ease-out',
      }}>
        <style>{`
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        `}</style>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(245,158,11,.3)',
          }}>
            <CrownIcon />
          </div>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>
            อัพเกรดเป็น Pro
          </h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, lineHeight: 1.5 }}>
            ใช้งานได้ไม่จำกัด เร็วขึ้น ไม่มีโฆษณา
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {PLANS.map(plan => {
            const isSelected = selectedPlan === plan.id
            return (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                style={{
                  position: 'relative',
                  background: isSelected
                    ? `linear-gradient(135deg, ${plan.color}15 0%, ${plan.color}08 100%)`
                    : 'rgba(255,255,255,.03)',
                  border: `1.5px solid ${isSelected ? plan.color : 'rgba(255,255,255,.08)'}`,
                  borderRadius: 16, padding: '16px 18px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all .2s ease',
                }}>
                {plan.badge && (
                  <span style={{
                    position: 'absolute', top: -10, right: 16,
                    background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}cc 100%)`,
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 8,
                    boxShadow: `0 4px 12px ${plan.color}40`,
                  }}>
                    {plan.badge}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                      {plan.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
                      {plan.features.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>
                      {plan.price.toLocaleString()}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div style={{
                    marginTop: 14, paddingTop: 14,
                    borderTop: `1px solid ${plan.color}30`,
                  }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <CheckIcon color={plan.color} />
                        <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <button onClick={handleSubscribe} disabled={processing}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 14,
            border: 'none', cursor: processing ? 'wait' : 'pointer',
            background: processing
              ? 'rgba(255,255,255,.1)'
              : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#fff', fontSize: 16, fontWeight: 700,
            boxShadow: processing ? 'none' : '0 8px 24px rgba(99,102,241,.4)',
            transition: 'all .2s ease',
          }}>
          {processing ? 'กำลังดำเนินการ...' : 'สมัครสมาชิกตอนนี้'}
        </button>

        <button onClick={onClose}
          style={{
            display: 'block', margin: '16px auto 0',
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,.4)', fontSize: 13,
            cursor: 'pointer', padding: '8px 16px',
          }}>
          ข้ามไปใช้เวอร์ชันฟรี
        </button>

        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: 'rgba(255,255,255,.03)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" />
              <path d="M7 4V7.5M7 9.5V10" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, fontWeight: 600 }}>
              ทดลองใช้ฟรี 1 ชั่วโมง
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, lineHeight: 1.5 }}>
            ใช้งานได้ฟรี 1 ชม. ไม่ต้องผูกบัตรเครดิต เมื่อหมดเวลาสามารถสมัครสมาชิกเพื่อใช้งานต่อได้
          </p>
        </div>
      </div>
    </div>
  )
}
