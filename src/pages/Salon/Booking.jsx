import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, getTenantId } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Loader, Input } from '../../components/UiKit'

const STEPS = ['Xizmat', 'Usta', 'Sana va vaqt', 'Tasdiqlash']

function buildSlots(date, startTime, endTime, bookedRanges, durationMin) {
  const slots = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const base = new Date(date)
  base.setSeconds(0, 0)

  let cur = new Date(base)
  cur.setHours(sh, sm)
  const end = new Date(base)
  end.setHours(eh, em)

  while (new Date(cur.getTime() + durationMin * 60000) <= end) {
    const slotStart = new Date(cur)
    const slotEnd = new Date(cur.getTime() + durationMin * 60000)
    const busy = bookedRanges.some(
      ({ s, e }) => slotStart < new Date(e) && slotEnd > new Date(s)
    )
    slots.push({ time: slotStart, busy })
    cur = new Date(cur.getTime() + 30 * 60000)
  }
  return slots
}

export default function SalonBooking() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [step, setStep] = useState(0)
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tenantData, setTenantData] = useState(null)

  const [sel, setSel] = useState({
    service: null,
    barber: null,
    date: today,
    slot: null,
    name: '',
    phone: '',
  })

  useEffect(() => {
    window.Telegram?.WebApp?.expand?.()
    async function loadTenant() {
      const data = await getTenantId()
      setTenantData(data)
    }
    loadTenant()
  }, [slug])

  useEffect(() => {
    if (!tenantData?.id) return
    async function load() {
      const [{ data: sv }, { data: br }] = await Promise.all([
        supabase.from('services').select('*').eq('tenant_id', tenantData.id),
        supabase.from('barbers').select('id,name,profile_photo,rating,daily_start_time,daily_end_time').eq('tenant_id', tenantData.id).eq('is_active', true),
      ])
      setServices(sv ?? [])
      setBarbers(br ?? [])
      setLoading(false)
    }
    load()
  }, [tenantData])

  useEffect(() => {
    if (step !== 2 || !sel.barber || !sel.date || !sel.service || !tenantData?.id) return
    setLoadingSlots(true)
    async function load() {
      const dayStart = `${sel.date}T00:00:00`
      const dayEnd = `${sel.date}T23:59:59`
      const [{ data: appts }, { data: blocks }] = await Promise.all([
        supabase.from('appointments')
          .select('start_time,end_time')
          .eq('barber_id', sel.barber.id)
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd)
          .not('appointment_status', 'eq', 'cancelled'),
        supabase.from('blocked_slots')
          .select('start_time,end_time')
          .eq('barber_id', sel.barber.id)
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd),
      ])
      const busy = [
        ...(appts ?? []).map(a => ({ s: a.start_time, e: a.end_time })),
        ...(blocks ?? []).map(b => ({ s: b.start_time, e: b.end_time })),
      ]
      setSlots(buildSlots(sel.date, sel.barber.daily_start_time, sel.barber.daily_end_time, busy, sel.service.duration_minutes))
      setSel(s => ({ ...s, slot: null }))
      setLoadingSlots(false)
    }
    load()
  }, [step, sel.barber, sel.date, sel.service, tenantData])

  async function confirm() {
    if (!sel.slot || !sel.service || !sel.barber || !tenantData?.id) return
    setSubmitting(true)
    setError('')
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null
    const end = new Date(sel.slot.getTime() + sel.service.duration_minutes * 60000)

    const { error: err } = await supabase.from('appointments').insert({
      tenant_id: tenantData.id,
      barber_id: sel.barber.id,
      customer_name: sel.name.trim(),
      customer_phone: sel.phone.trim(),
      customer_tg_id: tgId,
      start_time: sel.slot.toISOString(),
      end_time: end.toISOString(),
      booking_source: 'mini_app',
    })
    setSubmitting(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => navigate(`/client/${slug}/appointments`), 2000)
  }

  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (d) => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

  const canNext = [
    !!sel.service,
    !!sel.barber,
    !!sel.slot,
    sel.name.trim().length > 1 && sel.phone.trim().length > 7,
  ]

  if (loading) return (
    <Layout title="Navbat olish">
      <div className="flex justify-center mt-20"><Loader /></div>
    </Layout>
  )

  if (success) return (
    <Layout title="Navbat olish">
      <div className="flex flex-col items-center gap-4 mt-20">
        <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-semibold text-lg">Navbat olindi!</p>
        <p className="text-white/40 text-sm">{fmtDate(sel.date)}, soat {fmt(sel.slot)}</p>
      </div>
    </Layout>
  )

  return (
    <Layout title="Navbat olish" back={step > 0 ? () => setStep(s => s - 1) : () => navigate(`/client/${slug}`)}>
      <div className="flex gap-1.5 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-gold' : 'bg-white/10'}`} />
        ))}
      </div>
      <p className="text-xs text-white/40 mb-4 tracking-widest uppercase">{STEPS[step]}</p>

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-white mb-4">Xizmat tanlang</h2>
          {services.map(s => (
            <div key={s.id} onClick={() => setSel(f => ({ ...f, service: s }))}
              className={`glass rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.98]
                ${sel.service?.id === s.id ? 'gold-border shadow-gold' : 'border border-white/5'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium text-sm">{s.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{s.duration_minutes} daqiqa</p>
                </div>
                <p className="text-gold font-semibold text-sm">{s.price.toLocaleString()} <span className="text-xs text-white/30">UZS</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-white mb-4">Usta tanlang</h2>
          {barbers.map(b => (
            <div key={b.id} onClick={() => setSel(f => ({ ...f, barber: b }))}
              className={`glass rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.98] flex items-center gap-4
                ${sel.barber?.id === b.id ? 'gold-border shadow-gold' : 'border border-white/5'}`}>
              <div className="w-12 h-12 rounded-full bg-obsidian-700 overflow-hidden flex-shrink-0">
                {b.profile_photo ? (
                  <img src={b.profile_photo} alt={b.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold font-bold text-lg">{b.name[0]}</div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{b.name}</p>
                <p className="text-white/40 text-xs">{b.daily_start_time?.slice(0,5)} – {b.daily_end_time?.slice(0,5)}</p>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white/60 text-xs">{b.rating}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Input label="Sana" type="date" value={sel.date} min={today}
            onChange={e => setSel(f => ({ ...f, date: e.target.value, slot: null }))} />

          {loadingSlots ? (
            <div className="flex justify-center py-8"><Loader /></div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">Bo'sh vaqtlar</h2>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s, i) => {
                  const selected = sel.slot?.getTime() === s.time.getTime()
                  return (
                    <button key={i} type="button" disabled={s.busy}
                      onClick={() => setSel(f => ({ ...f, slot: s.time }))}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95
                        ${s.busy ? 'bg-white/5 text-white/20 cursor-not-allowed line-through' :
                          selected ? 'bg-gold text-obsidian-900 shadow-gold' :
                          'glass text-white/70 hover:border-gold/40'}`}>
                      {fmt(s.time)}
                    </button>
                  )
                })}
              </div>
              {slots.length === 0 && (
                <p className="text-center text-white/30 text-sm py-6">Bu kunda bo'sh vaqt yo'q</p>
              )}
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white mb-4">Ma'lumotlaringiz</h2>
          <Input label="Ism" placeholder="Ismingiz" required value={sel.name}
            onChange={e => setSel(f => ({ ...f, name: e.target.value }))} />
          <Input label="Telefon" placeholder="+998 XX XXX XX XX" type="tel" required value={sel.phone}
            onChange={e => setSel(f => ({ ...f, phone: e.target.value }))} />

          <h2 className="text-lg font-semibold text-white mb-4">Xulosa</h2>
          <div className="glass rounded-2xl p-4 flex flex-col gap-3">
            {[
              ['Xizmat', sel.service?.name],
              ['Usta', sel.barber?.name],
              ['Sana', fmtDate(sel.date)],
              ['Vaqt', sel.slot ? `${fmt(sel.slot)} → ${fmt(new Date(sel.slot.getTime() + sel.service.duration_minutes * 60000))}` : '—'],
              ['Narx', sel.service ? `${sel.service.price.toLocaleString()} UZS` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-white/40 text-sm">{k}</span>
                <span className="text-white text-sm font-medium">{v}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>
      )}

      <div className="mt-6">
        {step < 3 ? (
          <button disabled={!canNext[step]} onClick={() => setStep(s => s + 1)}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition
              ${!canNext[step] ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-gold text-obsidian-900 hover:brightness-110'}`}>
            Davom etish
          </button>
        ) : (
          <button disabled={!canNext[3] || submitting} onClick={confirm}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition
              ${!canNext[3] || submitting ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-gold text-obsidian-900 hover:brightness-110'}`}>
            {submitting ? 'Saqlanmoqda…' : 'Navbatni tasdiqlash'}
          </button>
        )}
      </div>
    </Layout>
  )
}
