import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, getTenantId } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Loader } from '../../components/UiKit'

export default function SalonAppointments() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tenantData, setTenantData] = useState(null)

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
      const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .eq('customer_tg_id', tgId)
        .gte('start_time', new Date().toISOString())
        .order('start_time')
      setAppointments(data ?? [])
      setLoading(false)
    }
    load()
  }, [tenantData])

  const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (d) => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

  if (loading) return (
    <Layout title="Navbatlarim">
      <div className="flex justify-center mt-20"><Loader /></div>
    </Layout>
  )

  return (
    <Layout title="Navbatlarim" back={() => navigate(`/client/${slug}`)}>
      <div className="flex flex-col gap-3">
        {appointments.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-white/40">Hali navbat yo'q</p>
            <button onClick={() => navigate(`/client/${slug}/booking`)}
              className="mt-4 px-6 py-2 rounded-xl bg-gold text-obsidian-900 font-medium text-sm">
              Navbat olish
            </button>
          </div>
        ) : (
          appointments.map(app => (
            <div key={app.id} className="glass rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-gold font-semibold text-sm">{fmt(app.start_time)} - {fmt(app.end_time)}</p>
                  <p className="text-white/40 text-xs mt-0.5">{fmtDate(app.start_time)}</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                  Tasdiqlangan
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-white text-sm">{app.customer_name}</p>
                <p className="text-white/40 text-xs">{app.customer_phone}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  )
}
