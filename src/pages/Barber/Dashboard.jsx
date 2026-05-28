import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TENANT_ID } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Card, Badge, Loader, SectionTitle, Btn } from '../../components/UiKit'

export default function Dashboard() {
  const navigate = useNavigate()
  const [barbers, setBarbers] = useState([])
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBarber, setSelectedBarber] = useState(null)

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      const [{ data: b }, { data: a }] = await Promise.all([
        supabase.from('barbers').select('id,name').eq('tenant_id', TENANT_ID).eq('is_active', true),
        supabase.from('appointments')
          .select('id,start_time,end_time,customer_name,customer_phone,appointment_status,barber_id')
          .eq('tenant_id', TENANT_ID)
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`)
          .order('start_time'),
      ])
      setBarbers(b ?? [])
      setAppts(a ?? [])
      if (b?.length) setSelectedBarber(b[0].id)
      setLoading(false)
    }
    load()
  }, [])

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ appointment_status: status }).eq('id', id)
    setAppts(prev => prev.map(a => a.id === id ? { ...a, appointment_status: status } : a))
  }

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const filtered = appts.filter(a => !selectedBarber || a.barber_id === selectedBarber)
  const counts = { booked: 0, completed: 0, no_show: 0 }
  filtered.forEach(a => { if (counts[a.appointment_status] !== undefined) counts[a.appointment_status]++ })

  if (loading) return (
    <Layout title="Boshqaruv paneli">
      <div className="flex justify-center mt-20"><Loader /></div>
    </Layout>
  )

  return (
    <Layout title="Boshqaruv paneli">
      {/* Tezkor amallar */}
      <div className="flex gap-2 mb-6">
        <Btn onClick={() => navigate('/barber/booking')} className="flex-1">+ Navbat</Btn>
        <Btn variant="ghost" onClick={() => navigate('/barber/slots')} className="flex-1">Vaqtlar</Btn>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[['Navbat', counts.booked, 'text-blue-300'], ['Bajarildi', counts.completed, 'text-emerald-300'], ['Kelmadi', counts.no_show, 'text-red-300']].map(([l, v, c]) => (
          <Card key={l} className="flex flex-col items-center py-3">
            <span className={`text-2xl font-bold ${c}`}>{v}</span>
            <span className="text-white/40 text-xs mt-0.5">{l}</span>
          </Card>
        ))}
      </div>

      {/* Barber filter */}
      {barbers.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {barbers.map(b => (
            <button key={b.id} onClick={() => setSelectedBarber(b.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all
                ${selectedBarber === b.id ? 'bg-gold text-obsidian-900' : 'glass text-white/60'}`}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Kun jadvali */}
      <SectionTitle>Bugun — {today.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</SectionTitle>

      {filtered.length === 0 ? (
        <p className="text-center text-white/30 text-sm py-10">Bugun navbat yo'q</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(a => (
            <Card key={a.id} className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium text-sm">{a.customer_name}</p>
                  <p className="text-white/40 text-xs">{a.customer_phone}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge status={a.appointment_status} />
                  <span className="text-gold text-xs font-semibold">{fmt(a.start_time)} – {fmt(a.end_time)}</span>
                </div>
              </div>
              {a.appointment_status === 'booked' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(a.id, 'completed')}
                    className="flex-1 py-2 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors">
                    ✓ Bajarildi
                  </button>
                  <button onClick={() => updateStatus(a.id, 'no_show')}
                    className="flex-1 py-2 rounded-xl text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                    ✗ Kelmadi
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  )
}
