import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../config/supabaseClient'
import { Loader, SectionTitle, Btn, Select } from '../../components/UiKit'

// ── Design tokens ─────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
}
const glassGold = {
  ...glass,
  border: '1px solid rgba(212,175,55,0.3)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
}

// ── Metric Card ───────────────────────────────────────────────
function Metric({ label, value, sub }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2" style={glass}>
      <p className="text-xs text-white/35 tracking-widest uppercase">{label}</p>
      <p
        className="text-3xl font-bold"
        style={{ color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.2)' }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-white/25">{sub}</p>}
    </div>
  )
}

// ── Plan price editor row ─────────────────────────────────────
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
    <div className="flex items-center gap-3 py-3.5 border-b border-white/5 last:border-0">
      <span className="flex-1 text-sm text-white font-medium">{plan.name}</span>
      <span className="text-xs text-white/25 w-28 text-right hidden sm:block">
        SMS {plan.sms_limit} / Call {plan.call_limit}
      </span>
      <input
        value={price}
        onChange={e => setPrice(e.target.value)}
        className="w-28 rounded-xl px-3 py-2 text-sm text-white text-right outline-none focus:ring-1 focus:ring-gold/40"
        style={glass}
      />
      <span className="text-xs text-white/25">UZS</span>
      <button onClick={save} disabled={saving || Number(price) === plan.price}
        className="px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-25"
        style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
        {saving ? '…' : 'Saqlash'}
      </button>
    </div>
  )
}

// ── Update Subscription Modal ─────────────────────────────────
function UpdateModal({ shop, plans, onClose, onSaved }) {
  const [planId, setPlanId] = useState(shop.subscription_plan_id ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return
    setSaving(true)
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    await supabase.from('barbershops').update({
      subscription_plan_id: plan.id,
      subscription_expires_at: expires.toISOString(),
      sms_limit_remaining: plan.sms_limit,
      call_limit_remaining: plan.call_limit,
    }).eq('id', shop.id)
    onSaved(shop.id, { plan, expires: expires.toISOString() })
    setSaving(false)
    onClose()
  }

  const selectedPlan = plans.find(x => x.id === planId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5" style={glassGold}>
        <div className="flex justify-between items-center">
          <h2 className="text-white font-semibold">{shop.name}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <Select label="Yangi tarif" value={planId} onChange={e => setPlanId(e.target.value)}>
          {plans.map(p => (
            <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString()} UZS</option>
          ))}
        </Select>

        {selectedPlan && (
          <div className="rounded-2xl p-3 flex flex-col gap-2 text-xs" style={glass}>
            {[['SMS limiti', selectedPlan.sms_limit], ["Qo'ng'iroq limiti", selectedPlan.call_limit], ['Muddat', '+30 kun']].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-white/40">{k}</span>
                <span className="text-white font-medium">{v}</span>
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

// ── Main Dashboard ────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [shops, setShops] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('barbershops')
        .select('id,name,is_active,subscription_plan_id,subscription_expires_at,sms_limit_remaining,call_limit_remaining,subscription_plans(name,price,sms_limit,call_limit)')
        .order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('*').order('price'),
    ])
    setShops(s ?? [])
    setPlans(p ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(id, current) {
    await supabase.from('barbershops').update({ is_active: !current }).eq('id', id)
    setShops(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
  }

  function handleSaved(shopId, { plan, expires }) {
    setShops(prev => prev.map(s => s.id === shopId ? {
      ...s, subscription_plan_id: plan.id, subscription_expires_at: expires,
      sms_limit_remaining: plan.sms_limit, call_limit_remaining: plan.call_limit,
      subscription_plans: plan,
    } : s))
  }

  function handlePlanPriceSaved(planId, price) {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, price } : p))
  }

  const activeShops = shops.filter(s => s.is_active)
  const monthlyRevenue = activeShops.reduce((sum, s) => sum + (s.subscription_plans?.price ?? 0), 0)
  const totalSmsUsed = shops.reduce((sum, s) => {
    const plan = plans.find(p => p.id === s.subscription_plan_id)
    return sum + ((plan?.sms_limit ?? 0) - (s.sms_limit_remaining ?? 0))
  }, 0)
  const totalCallsUsed = shops.reduce((sum, s) => {
    const plan = plans.find(p => p.id === s.subscription_plan_id)
    return sum + ((plan?.call_limit ?? 0) - (s.call_limit_remaining ?? 0))
  }, 0)

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

  if (loading) return (
    <div className="min-h-screen bg-obsidian-900 flex items-center justify-center">
      <Loader />
    </div>
  )

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>
            Platforma boshqaruvi
          </p>
          <h1 className="text-4xl font-bold tracking-tight"
            style={{ textShadow: '0 0 60px rgba(212,175,55,0.15)' }}>
            SuperAdmin paneli
          </h1>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Metric label="Faol salonlar" value={activeShops.length} sub={`${shops.length} jami`} />
          <Metric label="Oylik tushum" value={`${(monthlyRevenue / 1_000_000).toFixed(2)}M`} sub="UZS" />
          <Metric label="SMS yuborildi" value={totalSmsUsed.toLocaleString()} sub="bu davr" />
          <Metric label="Qo'ng'iroqlar" value={totalCallsUsed.toLocaleString()} sub="bu davr" />
        </div>

        {/* Tenant table */}
        <div className="mb-10">
          <SectionTitle>Salonlar boshqaruvi</SectionTitle>
          <div className="rounded-2xl overflow-hidden" style={glass}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Salon', 'Tarif', 'Muddat', 'SMS', "Qo'ng'iroq", 'Holat', ''].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-medium tracking-widest uppercase whitespace-nowrap"
                        style={{ color: 'rgba(255,255,255,0.25)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shops.map(s => (
                    <tr key={s.id} className="transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-4 py-3.5 font-medium text-white whitespace-nowrap">{s.name}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                          {s.subscription_plans?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {fmtDate(s.subscription_expires_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-semibold ${(s.sms_limit_remaining ?? 0) > 10 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.sms_limit_remaining ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-semibold ${(s.call_limit_remaining ?? 0) > 5 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.call_limit_remaining ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => toggleActive(s.id, s.is_active)}
                          className="relative w-10 h-5 rounded-full transition-all duration-300"
                          style={{ background: s.is_active ? '#D4AF37' : 'rgba(255,255,255,0.1)', boxShadow: s.is_active ? '0 0 12px rgba(212,175,55,0.4)' : 'none' }}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${s.is_active ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setModal(s)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.08)'}>
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

        {/* Plan editor */}
        <div>
          <SectionTitle>Tarif narxlari</SectionTitle>
          <div className="rounded-2xl p-4" style={glass}>
            {plans.map(p => (
              <PlanRow key={p.id} plan={p} onSave={handlePlanPriceSaved} />
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <UpdateModal shop={modal} plans={plans} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
