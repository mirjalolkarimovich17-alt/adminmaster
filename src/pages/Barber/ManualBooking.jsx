import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TENANT_ID } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Btn, Input, Select, Card, Loader, SectionTitle } from '../../components/UiKit'

// Generate 30-min slots between barber's working hours for a given date
function buildSlots(date, startTime, endTime, bookedRanges) {
  const slots = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const base = new Date(date)
  base.setSeconds(0, 0)

  let cur = new Date(base)
  cur.setHours(sh, sm)
  const end = new Date(base)
  end.setHours(eh, em)

  while (cur < end) {
    const slotStart = new Date(cur)
    const slotEnd = new Date(cur.getTime() + 30 * 60000)
    const busy = bookedRanges.some(
      ({ s, e }) => slotStart < new Date(e) && slotEnd > new Date(s)
    )
    slots.push({ time: slotStart, busy })
    cur = slotEnd
  }
  return slots
}

export default function ManualBooking() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    barber_id: '',
    service_id: '',
    customer_name: '',
    customer_phone: '',
    date: today,
    slot: null, // Date object
  })

  // Load barbers + services
  useEffect(() => {
    async function load() {
      const [{ data: b }, { data: s }] = await Promise.all([
        supabase.from('barbers').select('id,name,daily_start_time,daily_end_time').eq('tenant_id', TENANT_ID).eq('is_active', true),
        supabase.from('services').select('id,name,price,duration_minutes').eq('tenant_id', TENANT_ID),
      ])
      setBarbers(b ?? [])
      setServices(s ?? [])
      if (b?.length) setForm(f => ({ ...f, barber_id: b[0].id }))
      if (s?.length) setForm(f => ({ ...f, service_id: s[0].id }))
      setLoading(false)
    }
    load()
  }, [])

  // Reload slots when barber or date changes
  useEffect(() => {
    if (!form.barber_id || !form.date) return
    async function loadSlots() {
      const barber = barbers.find(b => b.id === form.barber_id)
      if (!barber) return

      const dayStart = `${form.date}T00:00:00`
      const dayEnd = `${form.date}T23:59:59`

      const [{ data: appts }, { data: blocks }] = await Promise.all([
        supabase.from('appointments')
          .select('start_time,end_time')
          .eq('barber_id', form.barber_id)
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd)
          .not('appointment_status', 'eq', 'cancelled'),
        supabase.from('blocked_slots')
          .select('start_time,end_time')
          .eq('barber_id', form.barber_id)
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd),
      ])

      const busy = [
        ...(appts ?? []).map(a => ({ s: a.start_time, e: a.end_time })),
        ...(blocks ?? []).map(b => ({ s: b.start_time, e: b.end_time })),
      ]
      setSlots(buildSlots(form.date, barber.daily_start_time, barber.daily_end_time, busy))
      setForm(f => ({ ...f, slot: null }))
    }
    loadSlots()
  }, [form.barber_id, form.date, barbers])

  const selectedService = services.find(s => s.id === form.service_id)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.slot || !selectedService) return
    setSubmitting(true)
    setError('')

    const start = form.slot
    const end = new Date(start.getTime() + selectedService.duration_minutes * 60000)

    const { error: err } = await supabase.from('appointments').insert({
      tenant_id: TENANT_ID,
      barber_id: form.barber_id,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      booking_source: 'manual_barber',
    })

    setSubmitting(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => navigate('/barber'), 1500)
  }

  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <Layout title="Qo'lda navbat">
      <div className="flex justify-center mt-20"><Loader /></div>
    </Layout>
  )

  if (success) return (
    <Layout title="Qo'lda navbat">
      <div className="flex flex-col items-center gap-4 mt-20">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white/70 text-sm">Navbat muvaffaqiyatli yozildi!</p>
      </div>
    </Layout>
  )

  return (
    <Layout title="Qo'lda navbat" back={() => navigate('/barber')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Usta */}
        <Select label="Usta" value={form.barber_id} onChange={e => setForm(f => ({ ...f, barber_id: e.target.value }))}>
          {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>

        {/* Mijoz ma'lumotlari */}
        <SectionTitle>Mijoz ma'lumotlari</SectionTitle>
        <div className="flex flex-col gap-3">
          <Input label="Ism" placeholder="Mijoz ismi" required value={form.customer_name}
            onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
          <Input label="Telefon" placeholder="+998 XX XXX XX XX" required type="tel" value={form.customer_phone}
            onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
        </div>

        {/* Xizmat */}
        <SectionTitle>Xizmat</SectionTitle>
        <Select value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}>
          {services.map(s => (
            <option key={s.id} value={s.id}>{s.name} — {s.duration_minutes} daqiqa — {s.price.toLocaleString()} UZS</option>
          ))}
        </Select>

        {/* Sana */}
        <Input label="Sana" type="date" value={form.date} min={today}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

        {/* Vaqt slotlari */}
        {slots.length > 0 && (
          <>
            <SectionTitle>Bo'sh vaqt</SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s, i) => {
                const selected = form.slot?.getTime() === s.time.getTime()
                return (
                  <button key={i} type="button" disabled={s.busy}
                    onClick={() => setForm(f => ({ ...f, slot: s.time }))}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95
                      ${s.busy ? 'bg-white/5 text-white/20 cursor-not-allowed line-through' :
                        selected ? 'bg-gold text-obsidian-900 shadow-gold' :
                        'glass text-white/70 hover:border-gold/40'}`}>
                    {fmt(s.time)}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Davomiylik ko'rinishi */}
        {form.slot && selectedService && (
          <Card className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Davomiylik</span>
            <span className="text-gold text-sm font-semibold">
              {fmt(form.slot)} → {fmt(new Date(form.slot.getTime() + selectedService.duration_minutes * 60000))}
            </span>
          </Card>
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <Btn type="submit" disabled={!form.slot || submitting}>
          {submitting ? 'Saqlanmoqda…' : 'Navbatni tasdiqlash'}
        </Btn>
      </form>
    </Layout>
  )
}
