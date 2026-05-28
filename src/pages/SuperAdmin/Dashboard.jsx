import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../config/supabaseClient'
import { Card, Loader, Badge, SectionTitle, Btn, Input, Select } from '../../components/UiKit'

// ── Metric Card ───────────────────────────────────────────────
function Metric({ label, value, sub }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs text-white/40 tracking-widest uppercase">{label}</p>
      <p className="text-2xl font-bold text-gold">{value}</p>
      {sub && <p className="text-xs text-white/30">{sub}</p>}
    </Card>
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
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <span className="flex-1 text-sm text-white font-medium">{plan.name}</span>
      <span className="text-xs text-white/30 w-24 text-right">
        SMS {plan.sms_limit} / Call {plan.call_limit}
      </span>
      <input
        value={price}
        onChange={e => setPrice(e.target.value)}
        className="w-28 glass rounded-xl px-3 py-2 text-sm text-white text-right outline-none focus:ring-1 focus:ring-gold/40"
      />
      <span className="text-xs text-white/30">UZS</span>
      <button onClick={save} disabled={saving || Number(price) === plan.price}
        className="px-3 py-2 rounded-xl text-xs font-semibold bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-30 transition-colors">
        {saving ? '…' : 'Save'}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass gold-border rounded-3xl p-6 w-full max-w-sm flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-semibold">{shop.name}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">✕</button>
        </div>

        <Select label="Yangi tarif" value={planId} onChange={e => setPlanId(e.target.value)}>
          {plans.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.price.toLocaleString()} UZS
            </option>
          ))}
        </Select>

        {planId && (() => {
          const p = plans.find(x => x.id === planId)
          return p ? (
            <div className="glass rounded-2xl p-3 flex flex-col gap-1.5 text-xs text-white/50">
              <div className="flex justify-between"><span>SMS limiti</span><span className="text-white">{p.sms_limit}</span></div>
              <div className="flex justify-between"><span>Qo'ng'iroq limiti</span><span className="text-white">{p.call_limit}</span></div>
              <div className="flex justify-between"><span>Muddat</span><span className="text-white">+30 kun</span></div>
            </div>
          ) : null
        })()}

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
  const [modal, setModal] = useState(null) // shop object

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
      ...s,
      subscription_plan_id: plan.id,
      subscription_expires_at: expires,
      sms_limit_remaining: plan.sms_limit,
      call_limit_remaining: plan.call_limit,
      subscription_plans: plan,
    } : s))
  }

  function handlePlanPriceSaved(planId, price) {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, price } : p))
  }

  // Metrics
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
    <div className="min-h-screen bg-obsidian-900 text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-gold/60 tracking-widest uppercase mb-1">Platforma boshqaruvi</p>
          <h1 className="text-3xl font-bold tracking-tight">SuperAdmin paneli</h1>
        </div>

        {/* Metrikalar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <Metric label="Faol salonlar" value={activeShops.length} sub={`${shops.length} jami`} />
          <Metric label="Oylik tushum" value={`${(monthlyRevenue / 1_000_000).toFixed(2)}M`} sub="UZS" />
          <Metric label="SMS yuborildi" value={totalSmsUsed.toLocaleString()} sub="bu davr" />
          <Metric label="Qo'ng'iroqlar" value={totalCallsUsed.toLocaleString()} sub="bu davr" />
        </div>

        {/* Tenant jadvali */}
        <div className="mb-10">
          <SectionTitle>Salonlar boshqaruvi</SectionTitle>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-xs tracking-wider uppercase">
                    {['Salon', 'Tarif', 'Muddat', 'SMS qoldi', 'Qo\'ng\'iroq qoldi', 'Holat', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shops.map(s => (
                    <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{s.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gold/10 text-gold font-medium">
                          {s.subscription_plans?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50 whitespace-nowrap">{fmtDate(s.subscription_expires_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${s.sms_limit_remaining > 10 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.sms_limit_remaining ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${s.call_limit_remaining > 5 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.call_limit_remaining ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(s.id, s.is_active)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${s.is_active ? 'bg-gold' : 'bg-white/10'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${s.is_active ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setModal(s)}
                          className="text-xs px-3 py-1.5 rounded-lg glass gold-border text-gold hover:bg-gold/10 transition-colors whitespace-nowrap">
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

        {/* Tarif muharriri */}
        <div>
          <SectionTitle>Tarif narxlari</SectionTitle>
          <Card>
            {plans.map(p => (
              <PlanRow key={p.id} plan={p} onSave={handlePlanPriceSaved} />
            ))}
          </Card>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <UpdateModal
          shop={modal}
          plans={plans}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
