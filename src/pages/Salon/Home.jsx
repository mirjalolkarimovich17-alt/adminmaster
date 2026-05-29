import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, getTenantId } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Loader } from '../../components/UiKit'

export default function SalonHome() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.Telegram?.WebApp?.expand?.()
    async function load() {
      const tenantData = await getTenantId()
      if (!tenantData?.id) {
        setLoading(false)
        return
      }

      const [{ data: s }, { data: b }] = await Promise.all([
        supabase.from('barbershops').select('*').eq('id', tenantData.id).single(),
        supabase.from('barbers').select('id,name,profile_photo,rating').eq('tenant_id', tenantData.id).eq('is_active', true),
      ])
      setShop(s)
      setBarbers(b ?? [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <Layout>
      <div className="flex justify-center mt-20"><Loader /></div>
    </Layout>
  )

  if (!shop) return (
    <Layout>
      <div className="text-center mt-20">
        <p className="text-white/40">Salon topilmadi</p>
      </div>
    </Layout>
  )

  return (
    <Layout>
      {/* Hero */}
      <div className="flex flex-col items-center text-center pt-8 pb-6 gap-3">
        <div className="w-20 h-20 rounded-3xl bg-gold/10 border border-gold/30 flex items-center justify-center mb-1">
          {shop.logo ? (
            <img src={shop.logo} alt={shop.name} className="w-full h-full rounded-3xl object-cover" />
          ) : (
            <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{shop.name}</h1>
        <p className="text-white/40 text-sm">Premium sartaroshlik xizmati</p>
        {shop.location_link && (
          <a href={shop.location_link} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-gold text-xs hover:text-gold-light transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Xaritada ko'rish
          </a>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 mb-8">
        <button onClick={() => navigate(`/client/${slug}/booking`)}
          className="w-full py-3.5 rounded-2xl bg-gold text-obsidian-900 font-bold text-sm shadow-gold hover:brightness-110 transition">
          Navbat olish
        </button>
        <button onClick={() => navigate(`/client/${slug}/appointments`)}
          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition">
          Navbatlarim
        </button>
      </div>

      {/* Ustalar */}
      {barbers.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-white mb-4">Bizning ustalar</h2>
          <div className="flex flex-col gap-3">
            {barbers.map(b => (
              <div key={b.id} className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                <div className="w-12 h-12 rounded-full bg-obsidian-700 overflow-hidden flex-shrink-0">
                  {b.profile_photo ? (
                    <img src={b.profile_photo} alt={b.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold font-bold text-lg">{b.name[0]}</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{b.name}</p>
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
        </>
      )}
    </Layout>
  )
}
