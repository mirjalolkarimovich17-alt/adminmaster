import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TENANT_ID } from '../../config/supabaseClient'
import { Loader } from '../../components/UiKit'

// ── Style tokens ──────────────────────────────────────────────
const BG = 'radial-gradient(circle at top left, #0d1a2e, #050a12)'
const G = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
}
const PURPLE = '#8a2be2'
const GOLD = '#ffcc00'

const inp = {
  ...G.card, width: '100%', padding: '12px 14px', fontSize: 13,
  color: '#fff', outline: 'none', borderRadius: 14, boxSizing: 'border-box',
}

// ── Shared ────────────────────────────────────────────────────
function SLabel({ children }) {
  return <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{children}</p>
}

function GBtn({ children, onClick, disabled, accent = GOLD }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.05em', transition: 'all .2s', opacity: disabled ? 0.4 : 1,
        background: `${accent}18`, color: accent, border: `1px solid ${accent}35`,
        boxShadow: `0 0 20px ${accent}15` }}>
      {children}
    </button>
  )
}

function Overlay({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      {children}
    </div>
  )
}

function ModalBox({ title, onClose, children }) {
  return (
    <div style={{ ...G.card, border: `1px solid ${PURPLE}40`, boxShadow: `0 30px 60px rgba(0,0,0,0.6), 0 0 40px ${PURPLE}15, inset 0 1px 0 rgba(255,255,255,0.08)`,
      borderRadius: 24, padding: 28, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  )
}

// ── Paywall ───────────────────────────────────────────────────
const PLANS_STATIC = [
  { name: 'STANDARD', price: '200,000', features: ['1 Salon', 'Cheksiz navbatlar', 'SMS xabarnomalar'], accent: 'rgba(255,255,255,0.6)' },
  { name: 'PREMIUM',  price: '500,000', features: ['3 Salon', 'Ustalar statistikasi', 'CRM boshqaruv'],  accent: GOLD,   badge: 'Mashhur' },
  { name: 'VIP',      price: '1,000,000', features: ['Cheksiz salonlar', 'Shaxsiy menejer', '24/7 Support'], accent: `${PURPLE}`, badge: 'Elite' },
]

function Paywall({ onActivate }) {
  function pay(planName) {
    const text = encodeURIComponent(`Salom! ${planName} tarifiga obuna bo'lmoqchiman.`)
    window.Telegram?.WebApp?.openTelegramLink(`https://t.me/wasadmin?text=${text}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${PURPLE}18 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}10 0%, transparent 70%)` }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 18, marginBottom: 20,
            background: `${PURPLE}18`, border: `1px solid ${PURPLE}40`, boxShadow: `0 0 30px ${PURPLE}25` }}>
            <svg width="28" height="28" fill="none" stroke={PURPLE} strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 style={{ margin: '0 0 10px', fontSize: 28, fontWeight: 700, background: `linear-gradient(135deg, #fff 40%, ${PURPLE}cc)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Obuna faol emas
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Barcha imkoniyatlardan foydalanish uchun tarif tanlang</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {PLANS_STATIC.map(plan => (
            <div key={plan.name} style={{ ...G.card, border: `1px solid ${plan.accent}25`, boxShadow: `0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${plan.accent}10, inset 0 1px 0 rgba(255,255,255,0.08)`,
              padding: 24, display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: `linear-gradient(90deg, transparent, ${plan.accent}70, transparent)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: plan.accent }}>{plan.name}</p>
                {plan.badge && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${plan.accent}18`, color: plan.accent, border: `1px solid ${plan.accent}35` }}>{plan.badge}</span>}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: plan.accent, textShadow: `0 0 20px ${plan.accent}60` }}>{plan.price}</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>UZS / oy</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: plan.accent, boxShadow: `0 0 6px ${plan.accent}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => pay(plan.name)}
                style={{ padding: '12px', borderRadius: 14, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .25s',
                  background: `${plan.accent}15`, color: plan.accent, border: `1px solid ${plan.accent}35`,
                  boxShadow: `0 0 20px ${plan.accent}12` }}>
                To'lov Qilish
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Add/Edit Barber Modal ─────────────────────────────────────
function BarberModal({ barber, shopId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: barber?.name ?? '',
    tg_id: barber?.tg_id ?? '',
    daily_start_time: barber?.daily_start_time ?? '09:00',
    daily_end_time: barber?.daily_end_time ?? '19:00',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const tenantId = shopId || TENANT_ID
    const payload = { name: form.name.trim(), tg_id: form.tg_id ? Number(form.tg_id) : null, daily_start_time: form.daily_start_time, daily_end_time: form.daily_end_time, tenant_id: tenantId }
    const { data, error } = barber
      ? await supabase.from('barbers').update(payload).eq('id', barber.id).select().single()
      : await supabase.from('barbers').insert({ ...payload, is_active: true }).select().single()
    setSaving(false)
    if (!error) { onSaved(data, !!barber); onClose() }
  }

  return (
    <Overlay>
      <ModalBox title={barber ? 'Ustani tahrirlash' : 'Yangi Usta Qo\'shish'} onClose={onClose}>
        {[['Ism', 'name', 'text', 'Ali Karimov'], ['Telegram ID', 'tg_id', 'number', '123456789']].map(([lbl, key, type, ph]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SLabel>{lbl}</SLabel>
            <input style={inp} type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Ish boshlanishi', 'daily_start_time'], ['Ish tugashi', 'daily_end_time']].map(([lbl, key]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SLabel>{lbl}</SLabel>
              <input style={inp} type="time" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <GBtn onClick={save} disabled={saving || !form.name.trim()} accent={PURPLE}>
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </GBtn>
      </ModalBox>
    </Overlay>
  )
}

// ── Add/Edit Service Modal ────────────────────────────────────
function ServiceModal({ service, shopId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: service?.name ?? '', price: service?.price ?? '', duration_minutes: service?.duration_minutes ?? 30 })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const tenantId = shopId || TENANT_ID
    const payload = { name: form.name.trim(), price: Number(form.price), duration_minutes: Number(form.duration_minutes), tenant_id: tenantId }
    const { data, error } = service
      ? await supabase.from('services').update(payload).eq('id', service.id).select().single()
      : await supabase.from('services').insert(payload).select().single()
    setSaving(false)
    if (!error) { onSaved(data, !!service); onClose() }
  }

  return (
    <Overlay>
      <ModalBox title={service ? 'Xizmatni tahrirlash' : 'Yangi Xizmat Qo\'shish'} onClose={onClose}>
        {[['Xizmat nomi', 'name', 'text', 'Soch kesish'], ['Narx (UZS)', 'price', 'number', '50000']].map(([lbl, key, type, ph]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SLabel>{lbl}</SLabel>
            <input style={inp} type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SLabel>Davomiylik (daqiqa)</SLabel>
          <input style={inp} type="number" min="5" step="5" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
        </div>
        <GBtn onClick={save} disabled={saving || !form.name.trim() || !form.price} accent={GOLD}>
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </GBtn>
      </ModalBox>
    </Overlay>
  )
}

// ── Section header ────────────────────────────────────────────
function SecHead({ title, onAdd }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{title}</p>
      <button onClick={onAdd}
        style={{ fontSize: 11, fontWeight: 600, padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
          background: `${PURPLE}15`, color: PURPLE, border: `1px solid ${PURPLE}35`, transition: 'all .2s' }}>
        + Qo'shish
      </button>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function BarberDashboard({ ownerMode = false }) {
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(false)

  // Modals
  const [barberModal, setBarberModal] = useState(null)   // null | 'new' | barber obj
  const [serviceModal, setServiceModal] = useState(null) // null | 'new' | service obj

  useEffect(() => {
    async function load() {
      let shopId = TENANT_ID

      if (ownerMode) {
        const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
          ?? Number(localStorage.getItem('tg_id'))
        const { data: owned } = await supabase
          .from('barbershops')
          .select('id')
          .eq('owner_tg_id', tgId)
          .maybeSingle()
        shopId = owned?.id
      }

      if (!shopId) { setLoading(false); return }

      const [{ data: s }, { data: b }, { data: sv }] = await Promise.all([
        supabase.from('barbershops').select('id,name,is_active,subscription_expires_at,subscription_plan_id').eq('id', shopId).single(),
        supabase.from('barbers').select('*').eq('tenant_id', shopId).order('created_at'),
        supabase.from('services').select('*').eq('tenant_id', shopId).order('created_at'),
      ])
      setShop(s)
      setBarbers(b ?? [])
      setServices(sv ?? [])
      // Active if plan exists and not expired
      const active = s?.subscription_plan_id && s?.subscription_expires_at && new Date(s.subscription_expires_at) > new Date()
      setPaid(!!active)
      setLoading(false)
    }
    load()
  }, [])

  async function removeBarber(id) {
    await supabase.from('barbers').update({ is_active: false }).eq('id', id)
    setBarbers(prev => prev.filter(b => b.id !== id))
  }

  async function removeService(id) {
    await supabase.from('services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader />
    </div>
  )

  if (!paid && ownerMode) return <Paywall onActivate={() => setPaid(true)} />

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -60, left: -60, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${PURPLE}10 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}08 0%, transparent 70%)` }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: `${PURPLE}aa` }}>Salon boshqaruvi</p>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, background: `linear-gradient(135deg, #fff 50%, ${PURPLE}cc)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {shop?.name ?? 'Salonım'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate(ownerMode ? '/owner/booking' : '/barber/booking')}
              style={{ fontSize: 12, fontWeight: 600, padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
                background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}>
              + Navbat
            </button>
            <button onClick={() => navigate(ownerMode ? '/owner/slots' : '/barber/slots')}
              style={{ fontSize: 12, fontWeight: 600, padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Vaqtlar
            </button>
          </div>
        </div>

        {/* Barbers section */}
        <div style={{ ...G.card, padding: 20, marginBottom: 20 }}>
          <SecHead title="Ustalar" onAdd={() => setBarberModal('new')} />
          {barbers.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0' }}>Hali usta qo'shilmagan</p>
          ) : barbers.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${PURPLE}20`, border: `1px solid ${PURPLE}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: PURPLE }}>
                {b.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{b.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {b.daily_start_time?.slice(0,5)} – {b.daily_end_time?.slice(0,5)}
                  {b.tg_id && <span style={{ marginLeft: 8, color: `${PURPLE}aa` }}>TG: {b.tg_id}</span>}
                </p>
              </div>
              <button onClick={() => setBarberModal(b)}
                style={{ fontSize: 11, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', background: `${PURPLE}12`, color: PURPLE, border: `1px solid ${PURPLE}30` }}>
                Tahrir
              </button>
              <button onClick={() => removeBarber(b.id)}
                style={{ fontSize: 11, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                O'chirish
              </button>
            </div>
          ))}
        </div>

        {/* Services section */}
        <div style={{ ...G.card, padding: 20 }}>
          <SecHead title="Xizmatlar" onAdd={() => setServiceModal('new')} />
          {services.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0' }}>Hali xizmat qo'shilmagan</p>
          ) : services.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.duration_minutes} daqiqa</p>
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: GOLD, textShadow: `0 0 12px ${GOLD}50` }}>
                {Number(s.price).toLocaleString()} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>UZS</span>
              </p>
              <button onClick={() => setServiceModal(s)}
                style={{ fontSize: 11, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', background: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD}28` }}>
                Tahrir
              </button>
              <button onClick={() => removeService(s.id)}
                style={{ fontSize: 11, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                O'chirish
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {barberModal && (
        <BarberModal
          barber={barberModal === 'new' ? null : barberModal}
          shopId={shop?.id}
          onClose={() => setBarberModal(null)}
          onSaved={(data, isEdit) => setBarbers(prev => isEdit ? prev.map(b => b.id === data.id ? data : b) : [...prev, data])}
        />
      )}
      {serviceModal && (
        <ServiceModal
          service={serviceModal === 'new' ? null : serviceModal}
          shopId={shop?.id}
          onClose={() => setServiceModal(null)}
          onSaved={(data, isEdit) => setServices(prev => isEdit ? prev.map(s => s.id === data.id ? data : s) : [...prev, data])}
        />
      )}
    </div>
  )
}
