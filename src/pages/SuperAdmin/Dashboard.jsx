import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../config/supabaseClient'
import { Loader, SectionTitle, Btn, Select } from '../../components/UiKit'

// ── Style tokens ──────────────────────────────────────────────
const G = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
    borderRadius: '20px',
  },
  cardGold: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: '1px solid rgba(255,204,0,0.2)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,204,0,0.06), inset 0 1px 0 rgba(255,255,255,0.10)',
    borderRadius: '24px',
  },
}

// ── Float keyframes injected once ────────────────────────────
const FLOAT_CSS = `
@keyframes float {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-6px); }
}
@keyframes floatB {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-4px); }
}
`

// ── Metric Card ───────────────────────────────────────────────
function Metric({ label, value, sub, delay = '0s', color = '#ffcc00' }) {
  return (
    <div style={{ ...G.card, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 8, animation: `float 5s ease-in-out ${delay} infinite` }}>
      <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, margin: 0, color, textShadow: `0 0 20px ${color}80, 0 0 40px ${color}30` }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

// ── Plan row ──────────────────────────────────────────────────
function PlanRow({ plan, onSave }) {
  const [price, setPrice] = useState(String(plan.price))
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('subscription_plans').update({ price: Number(price) }).eq('id', plan.id)
    onSave(plan.id, Number(price))
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ flex: 1, fontSize: 13, color: '#fff', fontWeight: 500 }}>{plan.name}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', minWidth: 110, textAlign: 'right' }}>
        SMS {plan.sms_limit} / Call {plan.call_limit}
      </span>
      <input value={price} onChange={e => setPrice(e.target.value)}
        style={{ ...G.card, width: 110, padding: '8px 12px', fontSize: 13, color: '#fff', textAlign: 'right', outline: 'none', borderRadius: 12 }} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>UZS</span>
      <button onClick={save} disabled={saving || Number(price) === plan.price}
        style={{ padding: '8px 14px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
          background: 'rgba(255,204,0,0.1)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.2)', opacity: (saving || Number(price) === plan.price) ? 0.3 : 1 }}>
        {saving ? '…' : 'Saqlash'}
      </button>
    </div>
  )
}

// ── New Salon Modal ───────────────────────────────────────────
function NewSalonModal({ plans, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', owner: '', plan_id: plans[0]?.id ?? '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!form.name.trim()) { setErr("Salon nomi kiritilmagan"); return }
    setSaving(true)
    const plan = plans.find(p => p.id === form.plan_id)
    const expires = new Date(); expires.setDate(expires.getDate() + 30)
    const { data, error } = await supabase.from('barbershops').insert({
      name: form.name.trim(),
      subscription_plan_id: plan?.id ?? null,
      subscription_expires_at: expires.toISOString(),
      sms_limit_remaining: plan?.sms_limit ?? 0,
      call_limit_remaining: plan?.call_limit ?? 0,
      is_active: true,
    }).select('id,name,is_active,subscription_plan_id,subscription_expires_at,sms_limit_remaining,call_limit_remaining,subscription_plans(name,price,sms_limit,call_limit)').single()
    setSaving(false)
    if (error) {
      const msg = error.message ?? ''
      setErr(
        msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls') || msg.toLowerCase().includes('policy')
          ? '❌ Tizim xatoligi: Ma\'lumotlar bazasiga kirish taqiqlangan (RLS).'
          : '❌ Nimadir noto\'g\'ri bajarildi. Iltimos qaytadan urunib ko\'ring.'
      )
      return
    }
    onCreated(data); onClose()
  }

  const inp = { ...G.card, width: '100%', padding: '12px 14px', fontSize: 13, color: '#fff', outline: 'none', borderRadius: 14, boxSizing: 'border-box' }

  return (
    <Overlay>
      <ModalBox title="Yangi Salon Qo'shish" onClose={onClose}>
        <label style={LBL}>Salon nomi</label>
        <input style={inp} placeholder="23 BRO BARBER" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <label style={LBL}>Egasi ismi</label>
        <input style={inp} placeholder="Abdulloh Karimov" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
        <label style={LBL}>Boshlang'ich tarif</label>
        <select style={{ ...inp, background: '#0f0a1e' }} value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}>
          {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString()} UZS</option>)}
        </select>
        {err && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>
            {err}
          </div>
        )}
        <Btn onClick={save} disabled={saving}>{saving ? 'Yaratilmoqda…' : 'Salon Yaratish'}</Btn>
      </ModalBox>
    </Overlay>
  )
}

// ── Plan Edit Modal ───────────────────────────────────────────
function PlanEditModal({ plan, onClose, onSaved }) {
  const [form, setForm] = useState({ price: String(plan.price), sms_limit: String(plan.sms_limit), call_limit: String(plan.call_limit) })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('subscription_plans').update({
      price: Number(form.price), sms_limit: Number(form.sms_limit), call_limit: Number(form.call_limit),
    }).eq('id', plan.id)
    onSaved({ ...plan, price: Number(form.price), sms_limit: Number(form.sms_limit), call_limit: Number(form.call_limit) })
    setSaving(false); onClose()
  }

  const inp = { ...G.card, width: '100%', padding: '12px 14px', fontSize: 13, color: '#fff', outline: 'none', borderRadius: 14, boxSizing: 'border-box' }

  return (
    <Overlay>
      <ModalBox title={`Tahrirash — ${plan.name}`} onClose={onClose}>
        {[['Narx (UZS)', 'price'], ['SMS limiti', 'sms_limit'], ["Qo'ng'iroq limiti", 'call_limit']].map(([lbl, key]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={LBL}>{lbl}</label>
            <input style={inp} type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
        <Btn onClick={save} disabled={saving}>{saving ? 'Saqlanmoqda…' : 'Saqlash'}</Btn>
      </ModalBox>
    </Overlay>
  )
}

// ── Shared modal primitives ───────────────────────────────────
const LBL = { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 0 }

function Overlay({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}>
      {children}
    </div>
  )
}

function ModalBox({ title, onClose, children }) {
  return (
    <div style={{ ...G.cardGold, padding: 28, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>
      {children}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
function UpdateModal({ shop, plans, onClose, onSaved }) {
  const [planId, setPlanId] = useState(shop.subscription_plan_id ?? '')
  const [saving, setSaving] = useState(false)
  const sel = plans.find(x => x.id === planId)

  async function save() {
    if (!sel) return
    setSaving(true)
    const expires = new Date(); expires.setDate(expires.getDate() + 30)
    await supabase.from('barbershops').update({
      subscription_plan_id: sel.id, subscription_expires_at: expires.toISOString(),
      sms_limit_remaining: sel.sms_limit, call_limit_remaining: sel.call_limit,
    }).eq('id', shop.id)
    onSaved(shop.id, { plan: sel, expires: expires.toISOString() })
    setSaving(false); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
      <div style={{ ...G.cardGold, padding: 28, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, color: '#fff', fontWeight: 600 }}>{shop.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <Select label="Yangi tarif" value={planId} onChange={e => setPlanId(e.target.value)}>
          {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString()} UZS</option>)}
        </Select>

        {sel && (
          <div style={{ ...G.card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['SMS limiti', sel.sms_limit], ["Qo'ng'iroq limiti", sel.call_limit], ['Muddat', '+30 kun']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{k}</span>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <Btn onClick={save} disabled={saving || !planId}>
          {saving ? 'Saqlanmoqda…' : 'Tasdiqlash va limitlarni yangilash'}
        </Btn>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [shops, setShops] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [newSalon, setNewSalon] = useState(false)
  const [editPlan, setEditPlan] = useState(null)

  const load = useCallback(async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('barbershops')
        .select('id,name,is_active,subscription_plan_id,subscription_expires_at,sms_limit_remaining,call_limit_remaining,subscription_plans(name,price,sms_limit,call_limit)')
        .order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('*').order('price'),
    ])
    setShops(s ?? []); setPlans(p ?? []); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(id, current) {
    await supabase.from('barbershops').update({ is_active: !current }).eq('id', id)
    setShops(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
  }

  function handleSaved(shopId, { plan, expires }) {
    setShops(prev => prev.map(s => s.id === shopId ? {
      ...s, subscription_plan_id: plan.id, subscription_expires_at: expires,
      sms_limit_remaining: plan.sms_limit, call_limit_remaining: plan.call_limit, subscription_plans: plan,
    } : s))
  }

  const activeShops = shops.filter(s => s.is_active)
  const monthlyRevenue = activeShops.reduce((sum, s) => sum + (s.subscription_plans?.price ?? 0), 0)
  const totalSmsUsed = shops.reduce((sum, s) => sum + ((plans.find(p => p.id === s.subscription_plan_id)?.sms_limit ?? 0) - (s.sms_limit_remaining ?? 0)), 0)
  const totalCallsUsed = shops.reduce((sum, s) => sum + ((plans.find(p => p.id === s.subscription_plan_id)?.call_limit ?? 0) - (s.call_limit_remaining ?? 0)), 0)
  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a0b2e, #0a0512)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader />
    </div>
  )

  return (
    <>
      <style>{FLOAT_CSS}</style>
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a0b2e, #0a0512)', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Ambient orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.12) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -150, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,204,0,0.07) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 70%)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,204,0,0.45)', marginBottom: 8 }}>
                Platforma boshqaruvi
              </p>
              <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #fff 40%, rgba(255,204,0,0.7))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SuperAdmin paneli
              </h1>
            </div>
            <button onClick={() => setNewSalon(true)}
              style={{ fontSize: 12, fontWeight: 600, padding: '12px 22px', borderRadius: 14, cursor: 'pointer', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                background: 'rgba(255,204,0,0.1)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.25)',
                boxShadow: '0 0 24px rgba(255,204,0,0.12)', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,204,0,0.18)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(255,204,0,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,204,0,0.1)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,204,0,0.12)' }}>
              + Yangi Salon Qo'shish
            </button>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
            <Metric label="Faol salonlar"  value={activeShops.length}                          sub={`${shops.length} jami`} delay="0s"    color="#ffcc00" />
            <Metric label="Oylik tushum"   value={`${(monthlyRevenue/1_000_000).toFixed(2)}M`} sub="UZS"                   delay="0.4s"  color="#ffcc00" />
            <Metric label="SMS yuborildi"  value={totalSmsUsed.toLocaleString()}               sub="bu davr"               delay="0.8s"  color="#b57bee" />
            <Metric label="Qo'ng'iroqlar"  value={totalCallsUsed.toLocaleString()}             sub="bu davr"               delay="1.2s"  color="#b57bee" />
          </div>

          {/* Tenant table */}
          <div style={{ marginBottom: 40 }}>
            <SectionTitle>Salonlar boshqaruvi</SectionTitle>
            <div style={{ ...G.card, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Salon', 'Tarif', 'Muddat', 'SMS', "Qo'ng'iroq", 'Holat', ''].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shops.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 20px' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <svg width="24" height="24" fill="none" stroke="rgba(255,204,0,0.5)" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                              </svg>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>
                              Hozircha faol salonlar mavjud emas
                            </p>
                            <button
                              onClick={() => setNewSalon(true)}
                              style={{ fontSize: 12, fontWeight: 600, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', letterSpacing: '0.04em',
                                background: 'rgba(255,204,0,0.07)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.2)',
                                boxShadow: '0 0 20px rgba(255,204,0,0.08)', transition: 'all .2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,204,0,0.14)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,204,0,0.18)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,204,0,0.07)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,204,0,0.08)' }}>
                              + Yangi Salon Qo'shish
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : shops.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{s.name}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                            background: 'rgba(255,204,0,0.08)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.18)' }}>
                            {s.subscription_plans?.name ?? '—'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{fmtDate(s.subscription_expires_at)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: (s.sms_limit_remaining ?? 0) > 10 ? '#4ade80' : '#f87171' }}>
                            {s.sms_limit_remaining ?? 0}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: (s.call_limit_remaining ?? 0) > 5 ? '#4ade80' : '#f87171' }}>
                            {s.call_limit_remaining ?? 0}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => toggleActive(s.id, s.is_active)}
                            style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', transition: 'all .3s',
                              background: s.is_active ? '#ffcc00' : 'rgba(255,255,255,0.1)',
                              boxShadow: s.is_active ? '0 0 14px rgba(255,204,0,0.45)' : 'none' }}>
                            <span style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left .3s', left: s.is_active ? 21 : 3 }} />
                          </button>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => setModal(s)}
                            style={{ fontSize: 11, padding: '7px 14px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s',
                              background: 'rgba(255,204,0,0.07)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.18)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,204,0,0.14)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,204,0,0.07)'}>
                            Tarifni yangilash
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Plan cards */}
          <div>
            <SectionTitle>Tarif narxlari</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
              {[
                { name: 'STANDARD', price: '200,000', badge: null,
                  features: ["1 Salon uchun", "Cheksiz navbatlar", "SMS ogohlantirishlar"],
                  accent: 'rgba(255,255,255,0.7)' },
                { name: 'PREMIUM', price: '500,000', badge: 'Mashhur',
                  features: ["3 Salon uchun", "Ustalar statistikasi", "CRM boshqaruv"],
                  accent: '#ffcc00' },
                { name: 'VIP BRAND', price: '1,000,000', badge: 'Elite',
                  features: ["Cheksiz salonlar", "Shaxsiy menejer", "24/7 Support"],
                  accent: '#b57bee' },
              ].map((plan, i) => (
                <div key={plan.name} style={{
                  ...G.card,
                  border: `1px solid rgba(255,255,255,${plan.name === 'PREMIUM' ? '0.14' : '0.07'})`,
                  boxShadow: plan.name === 'PREMIUM'
                    ? '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,204,0,0.08), inset 0 1px 0 rgba(255,255,255,0.12)'
                    : G.card.boxShadow,
                  padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
                  animation: `float 5s ease-in-out ${i * 0.3}s infinite`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Top glow line */}
                  <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
                    background: `linear-gradient(90deg, transparent, ${plan.accent}60, transparent)` }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: plan.accent }}>{plan.name}</p>
                    {plan.badge && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.08em',
                        background: `${plan.accent}18`, color: plan.accent, border: `1px solid ${plan.accent}35` }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color: plan.accent,
                      textShadow: `0 0 20px ${plan.accent}60, 0 0 40px ${plan.accent}25` }}>
                      {plan.price}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>UZS / oy</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: plan.accent, boxShadow: `0 0 6px ${plan.accent}` }} />
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setEditPlan(plan)}
                    style={{ marginTop: 'auto', padding: '12px', borderRadius: 14, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      letterSpacing: '0.06em', transition: 'all .25s',
                      background: `${plan.accent}12`, color: plan.accent,
                      border: `1px solid ${plan.accent}30`,
                      boxShadow: `0 0 20px ${plan.accent}10` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${plan.accent}22`; e.currentTarget.style.boxShadow = `0 0 28px ${plan.accent}25` }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${plan.accent}12`; e.currentTarget.style.boxShadow = `0 0 20px ${plan.accent}10` }}>
                    Tahrirlash
                  </button>
                </div>
              ))}
            </div>

            {/* Inline price editor for DB plans */}
            {plans.length > 0 && (
              <div style={{ ...G.card, padding: '4px 20px' }}>
                {plans.map(p => (
                  <PlanRow key={p.id} plan={p} onSave={(id, price) => setPlans(prev => prev.map(x => x.id === id ? { ...x, price } : x))} />
                ))}
              </div>
            )}
          </div>
        </div>

        {modal && <UpdateModal shop={modal} plans={plans} onClose={() => setModal(null)} onSaved={handleSaved} />}
        {newSalon && <NewSalonModal plans={plans} onClose={() => setNewSalon(false)} onCreated={s => setShops(prev => [s, ...prev])} />}
        {editPlan && <PlanEditModal plan={editPlan} onClose={() => setEditPlan(null)} onSaved={updated => setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))} />}
      </div>
    </>
  )
}
