import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TENANT_ID } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Btn, Input, Select, Card, Loader, SectionTitle } from '../../components/UiKit'

export default function ManualBooking({ ownerMode = false }) {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
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
    timeStr: '10:00',
    slot: null,
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

  const selectedService = services.find(s => s.id === form.service_id)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.timeStr || !selectedService) return
    setSubmitting(true)
    setError('')

    const [h, m] = form.timeStr.split(':').map(Number)
    const start = new Date(form.date)
    start.setHours(h, m, 0, 0)
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
    setTimeout(() => navigate(ownerMode ? '/owner' : '/barber'), 1500)
  }

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
    <Layout title="Qo'lda navbat" back={() => navigate(ownerMode ? '/owner' : '/barber')}>
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

        {/* Vaqt */}
        <Input label="Vaqt" type="time" value={form.timeStr ?? ''}
          onChange={e => {
            const [h, m] = e.target.value.split(':').map(Number)
            const d = new Date(form.date)
            d.setHours(h, m, 0, 0)
            setForm(f => ({ ...f, timeStr: e.target.value, slot: d }))
          }} />

        {/* Davomiylik ko'rinishi */}
        {form.timeStr && selectedService && (
          <Card className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Davomiylik</span>
            <span className="text-gold text-sm font-semibold">
              {form.timeStr} → {(() => {
                const [h, m] = form.timeStr.split(':').map(Number)
                const end = new Date(form.date)
                end.setHours(h, m + selectedService.duration_minutes, 0, 0)
                return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              })()}
            </span>
          </Card>
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <Btn type="submit" disabled={!form.timeStr || submitting}>
          {submitting ? 'Saqlanmoqda…' : 'Navbatni tasdiqlash'}
        </Btn>
      </form>
    </Layout>
  )
}
