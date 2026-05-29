import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TENANT_ID } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Card, Badge, Loader, SectionTitle, Btn } from '../../components/UiKit'

export default function BarberProfile() {
  const navigate = useNavigate()
  const [barber, setBarber] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    ?? Number(localStorage.getItem('tg_id'))

  useEffect(() => {
    async function load() {
      const { data: b } = await supabase
        .from('barbers')
        .select('id,name,daily_start_time,daily_end_time')
        .eq('tg_id', tgId)
        .eq('is_active', true)
        .maybeSingle()

      if (!b) { setLoading(false); return }
      setBarber(b)

      const today = new Date().toISOString().slice(0, 10)
      const { data: appts } = await supabase
        .from('appointments')
        .select('id,start_time,end_time,customer_name,customer_phone,appointment_status')
        .eq('barber_id', b.id)
        .gte('start_time', `${today}T00:00:00`)
        .order('start_time')

      setAppointments(appts ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <Layout><div className="flex justify-center mt-20"><Loader /></div></Layout>
  )

  if (!barber) return (
    <Layout>
      <p className="text-center text-white/30 text-sm mt-20">Profil topilmadi</p>
    </Layout>
  )

  return (
    <Layout>
      <div className="flex flex-col items-center text-center pt-8 pb-6 gap-2">
        <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl font-bold text-purple-400">
          {barber.name[0]}
        </div>
        <h1 className="text-xl font-bold text-white">{barber.name}</h1>
        <p className="text-white/40 text-sm">{barber.daily_start_time?.slice(0,5)} – {barber.daily_end_time?.slice(0,5)}</p>
      </div>

      <div className="flex gap-3 mb-8">
        <Btn onClick={() => navigate('/barber/booking')}>+ Navbat</Btn>
        <Btn variant="ghost" onClick={() => navigate('/barber/slots')}>Vaqtlar</Btn>
      </div>

      <SectionTitle>Bugungi navbatlar</SectionTitle>
      {appointments.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">Bugun navbat yo'q</p>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map(a => (
            <Card key={a.id} className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium text-sm">{a.customer_name}</p>
                <p className="text-white/40 text-xs">{fmt(a.start_time)} → {fmt(a.end_time)}</p>
                {a.customer_phone && <p className="text-white/30 text-xs">{a.customer_phone}</p>}
              </div>
              <Badge status={a.appointment_status} />
            </Card>
          ))}
        </div>
      )}
    </Layout>
  )
}
