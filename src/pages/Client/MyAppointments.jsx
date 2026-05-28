import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TENANT_ID } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Card, Badge, Loader, SectionTitle, Btn } from '../../components/UiKit'

export default function MyAppointments() {
  const navigate = useNavigate()
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)

  const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null

  useEffect(() => {
    if (!tgId) { setLoading(false); return }
    supabase.from('appointments')
      .select('id,start_time,end_time,appointment_status,barbers(name),services:barber_id(name)')
      .eq('tenant_id', TENANT_ID)
      .eq('customer_tg_id', tgId)
      .order('start_time', { ascending: false })
      .limit(30)
      .then(({ data }) => { setAppts(data ?? []); setLoading(false) })
  }, [tgId])

  const now = new Date()
  const upcoming = appts.filter(a => new Date(a.start_time) >= now && a.appointment_status === 'booked')
  const past = appts.filter(a => new Date(a.start_time) < now || a.appointment_status !== 'booked')

  const fmt = (iso) => new Date(iso).toLocaleString([], {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  function AppointmentCard({ a }) {
    return (
      <Card className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white font-medium text-sm">{a.barbers?.name ?? '—'}</p>
            <p className="text-white/40 text-xs mt-0.5">{fmt(a.start_time)}</p>
          </div>
          <Badge status={a.appointment_status} />
        </div>
      </Card>
    )
  }

  if (loading) return (
    <Layout title="Navbatlarim" back={() => navigate('/client')}>
      <div className="flex justify-center mt-20"><Loader /></div>
    </Layout>
  )

  if (!tgId) return (
    <Layout title="Navbatlarim" back={() => navigate('/client')}>
      <p className="text-center text-white/30 text-sm mt-20">Navbatlarni ko'rish uchun Telegram orqali oching.</p>
    </Layout>
  )

  return (
    <Layout title="Navbatlarim" back={() => navigate('/client')}>
      {upcoming.length > 0 && (
        <div className="mb-6">
          <SectionTitle>Kutilayotgan</SectionTitle>
          <div className="flex flex-col gap-3">
            {upcoming.map(a => <AppointmentCard key={a.id} a={a} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="mb-6">
          <SectionTitle>O'tgan</SectionTitle>
          <div className="flex flex-col gap-3">
            {past.map(a => <AppointmentCard key={a.id} a={a} />)}
          </div>
        </div>
      )}

      {appts.length === 0 && (
        <div className="flex flex-col items-center gap-4 mt-20">
          <p className="text-white/30 text-sm">Hali navbat yo'q</p>
          <Btn onClick={() => navigate('/client/booking')}>Navbat olish</Btn>
        </div>
      )}
    </Layout>
  )
}
