import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TENANT_ID } from '../../config/supabaseClient'

const BG = 'radial-gradient(135deg, #0a0f1e 0%, #050a12 100%)'
const PURPLE = '#8a2be2'
const GOLD = '#ffcc00'
const G = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
  }
}
const inp = {
  ...G.card, width: '100%', padding: '12px 14px', fontSize: 13,
  color: '#fff', outline: 'none', borderRadius: 12, boxSizing: 'border-box',
}

// ── Paywall ───────────────────────────────────────────────────
const PLANS = [
  { name: 'STANDARD', price: '200,000', features: ['Cheksiz navbatlar', 'SMS xabarnomalar'], accent: 'rgba(255,255,255,0.7)' },
  { name: 'PREMIUM',  price: '500,000', features: ['Ustalar statistikasi', 'CRM boshqaruv'], accent: GOLD, badge: 'Mashhur' },
  { name: 'VIP',      price: '1,000,000', features: ['Shaxsiy menejer', '24/7 Support'],    accent: PURPLE, badge: 'Elite' },
]

function Paywall() {
  function pay(name) {
    const text = encodeURIComponent(`Salom! ${name} tarifiga obuna bo'lmoqchiman.`)
    window.Telegram?.WebApp?.openTelegramLink(`https://t.me/wasadmin?text=${text}`)
  }
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: '-apple-system,sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${PURPLE}15 0%, transparent 70%)` }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `${PURPLE}18`, border: `1px solid ${PURPLE}40`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="28" height="28" fill="none" stroke={PURPLE} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#fff' }}>Obuna faol emas</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Tarif tanlang va @wasadmin ga to'lov qiling</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PLANS.map(p => (
            <div key={p.name} style={{ ...G.card, border: `1px solid ${p.accent}25`, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.accent, letterSpacing: '0.1em' }}>{p.name}</span>
                  {p.badge && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${p.accent}18`, color: p.accent, border: `1px solid ${p.accent}30` }}>{p.badge}</span>}
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: p.accent }}>{p.price} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>UZS/oy</span></p>
                {p.features.map(f => <p key={f} style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>· {f}</p>)}
              </div>
              <button onClick={() => pay(p.name)} style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: `${p.accent}15`, color: p.accent, border: `1px solid ${p.accent}35` }}>
                To'lov
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div style={{ ...G.card, border: `1px solid ${PURPLE}35`, borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function BarberModal({ barber, shopId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: barber?.name ?? '', tg_id: barber?.tg_id ?? '', daily_start_time: barber?.daily_start_time ?? '09:00', daily_end_time: barber?.daily_end_time ?? '19:00' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    setSaving(true); setErr('')
    const payload = { name: form.name.trim(), tg_id: form.tg_id ? Number(form.tg_id) : null, daily_start_time: form.daily_start_time, daily_end_time: form.daily_end_time, tenant_id: shopId }
    const { data, error } = barber
      ? await supabase.from('barbers').update(payload).eq('id', barber.id).select().single()
      : await supabase.from('barbers').insert({ ...payload, is_active: true }).select().single()
    setSaving(false)
    if (error) { setErr(error.message); return }
    onSaved(data, !!barber); onClose()
  }

  return (
    <Modal title={barber ? 'Ustani tahrirlash' : "Yangi Usta"} onClose={onClose}>
      {[['Ism', 'name', 'text', 'Ali Karimov'], ['Telegram ID', 'tg_id', 'number', '123456789']].map(([lbl, key, type, ph]) => (
        <div key={key}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{lbl}</p>
          <input style={inp} type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[['Boshlanish', 'daily_start_time'], ['Tugash', 'daily_end_time']].map(([lbl, key]) => (
          <div key={key}>
            <p style={{ margin: '0 0 6px', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{lbl}</p>
            <input style={inp} type="time" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
      </div>
      {err && <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{err}</p>}
      <button onClick={save} disabled={saving || !form.name.trim()}
        style={{ padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: `${PURPLE}20`, color: PURPLE, border: `1px solid ${PURPLE}40`, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saqlanmoqda…' : 'Saqlash'}
      </button>
    </Modal>
  )
}

function ServiceModal({ service, shopId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: service?.name ?? '', price: service?.price ?? '', duration_minutes: service?.duration_minutes ?? 30 })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    setSaving(true); setErr('')
    const payload = { name: form.name.trim(), price: Number(form.price), duration_minutes: Number(form.duration_minutes), tenant_id: shopId }
    const { data, error } = service
      ? await supabase.from('services').update(payload).eq('id', service.id).select().single()
      : await supabase.from('services').insert(payload).select().single()
    setSaving(false)
    if (error) { setErr(error.message); return }
    onSaved(data, !!service); onClose()
  }

  return (
    <Modal title={service ? 'Xizmatni tahrirlash' : "Yangi Xizmat"} onClose={onClose}>
      {[['Xizmat nomi', 'name', 'text', 'Soch kesish'], ['Narx (UZS)', 'price', 'number', '50000']].map(([lbl, key, type, ph]) => (
        <div key={key}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{lbl}</p>
          <input style={inp} type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Davomiylik (daqiqa)</p>
        <input style={inp} type="number" min="5" step="5" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
      </div>
      {err && <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{err}</p>}
      <button onClick={save} disabled={saving || !form.name.trim() || !form.price}
        style={{ padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}35`, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saqlanmoqda…' : 'Saqlash'}
      </button>
    </Modal>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function BarberDashboard({ ownerMode = false }) {
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [shopId, setShopId] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(false)
  const [barberModal, setBarberModal] = useState(null)
  const [serviceModal, setServiceModal] = useState(null)

  useEffect(() => {
    async function load() {
      let sid = TENANT_ID

      if (ownerMode) {
        const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
          ?? Number(localStorage.getItem('tg_id'))
        const { data: owned, error: ownErr } = await supabase
          .from('barbershops').select('id').eq('owner_tg_id', tgId).maybeSingle()
        alert(`tgId=${tgId} owned=${owned?.id} err=${ownErr?.message}`)
        if (owned?.id) sid = owned.id
      }

      if (!sid) { setLoading(false); return }
      setShopId(sid)

      const [{ data: s }, { data: b }, { data: sv }] = await Promise.all([
        supabase.from('barbershops').select('id,name,is_active,subscription_expires_at,subscription_plan_id').eq('id', sid).single(),
        supabase.from('barbers').select('*').eq('tenant_id', sid).eq('is_active', true).order('created_at'),
        supabase.from('services').select('*').eq('tenant_id', sid).order('created_at'),
      ])
      setShop(s); setBarbers(b ?? []); setServices(sv ?? [])
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
      <div style={{ width: 32, height: 32, border: `2px solid ${PURPLE}30`, borderTop: `2px solid ${PURPLE}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!paid && ownerMode) return <Paywall />

  const expires = shop?.subscription_expires_at
    ? new Date(shop.subscription_expires_at).toLocaleDateString('uz', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', paddingBottom: 40 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -60, left: -60, width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, ${PURPLE}10 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: -40, right: -40, width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}08 0%, transparent 70%)` }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '28px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: `${PURPLE}99` }}>Salon boshqaruvi</p>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, background: `linear-gradient(135deg, #fff 50%, ${PURPLE}cc)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {shop?.name ?? 'Salon'}
          </h1>
          {expires && <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Obuna: {expires} gacha</p>}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <button onClick={() => navigate(ownerMode ? '/owner/booking' : '/barber/booking')}
            style={{ padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }}>
            + Navbat
          </button>
          <button onClick={() => navigate(ownerMode ? '/owner/slots' : '/barber/slots')}
            style={{ padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Vaqtlar
          </button>
        </div>

        {/* Barbers */}
        <div style={{ ...G.card, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Ustalar · {barbers.length}</p>
            <button onClick={() => setBarberModal('new')}
              style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, cursor: 'pointer', background: `${PURPLE}15`, color: PURPLE, border: `1px solid ${PURPLE}30` }}>
              + Qo'shish
            </button>
          </div>
          {barbers.length === 0
            ? <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '16px 0' }}>Hali usta yo'q</p>
            : barbers.map((b, i) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${PURPLE}40` }}>
                  {b.profile_photo
                    ? <img src={b.profile_photo} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: `${PURPLE}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: PURPLE }}>{b.name[0]}</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{b.daily_start_time?.slice(0,5)} – {b.daily_end_time?.slice(0,5)}</p>
                </div>
                <button onClick={() => setBarberModal(b)} style={{ fontSize: 11, padding: '6px 11px', borderRadius: 9, cursor: 'pointer', background: `${PURPLE}12`, color: PURPLE, border: `1px solid ${PURPLE}28`, flexShrink: 0 }}>Tahrir</button>
                <button onClick={() => removeBarber(b.id)} style={{ fontSize: 11, padding: '6px 11px', borderRadius: 9, cursor: 'pointer', background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', flexShrink: 0 }}>O'chir</button>
              </div>
            ))
          }
        </div>

        {/* Services */}
        <div style={{ ...G.card, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Xizmatlar · {services.length}</p>
            <button onClick={() => setServiceModal('new')}
              style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, cursor: 'pointer', background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}28` }}>
              + Qo'shish
            </button>
          </div>
          {services.length === 0
            ? <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '16px 0' }}>Hali xizmat yo'q</p>
            : services.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.duration_minutes} daqiqa</p>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: GOLD, flexShrink: 0 }}>{Number(s.price).toLocaleString()} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>UZS</span></p>
                <button onClick={() => setServiceModal(s)} style={{ fontSize: 11, padding: '6px 11px', borderRadius: 9, cursor: 'pointer', background: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD}25`, flexShrink: 0 }}>Tahrir</button>
                <button onClick={() => removeService(s.id)} style={{ fontSize: 11, padding: '6px 11px', borderRadius: 9, cursor: 'pointer', background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', flexShrink: 0 }}>O'chir</button>
              </div>
            ))
          }
        </div>
      </div>

      {barberModal && (
        <BarberModal barber={barberModal === 'new' ? null : barberModal} shopId={shopId}
          onClose={() => setBarberModal(null)}
          onSaved={(data, isEdit) => { setBarbers(prev => isEdit ? prev.map(b => b.id === data.id ? data : b) : [...prev, data]); setBarberModal(null) }} />
      )}
      {serviceModal && (
        <ServiceModal service={serviceModal === 'new' ? null : serviceModal} shopId={shopId}
          onClose={() => setServiceModal(null)}
          onSaved={(data, isEdit) => { setServices(prev => isEdit ? prev.map(s => s.id === data.id ? data : s) : [...prev, data]); setServiceModal(null) }} />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
