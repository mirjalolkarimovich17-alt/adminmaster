import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../config/supabaseClient'

const BG = 'radial-gradient(circle at top left, #0d1a2e, #050a12)'
const PURPLE = '#8a2be2'
const GOLD = '#ffcc00'
const G = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20,
  }
}

const STATUS_META = {
  booked:    { label: 'Kutmoqda', color: GOLD },
  completed: { label: 'Bajarildi', color: '#4ade80' },
  cancelled: { label: 'Bekor',    color: '#f87171' },
}

export default function BarberProfile() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [barber, setBarber] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState('today') // today | upcoming | past

  const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    ?? Number(localStorage.getItem('tg_id'))

  useEffect(() => {
    window.Telegram?.WebApp?.expand?.()
    load()
  }, [])

  async function load() {
    const { data: b } = await supabase
      .from('barbers')
      .select('id,name,daily_start_time,daily_end_time,profile_photo,rating')
      .eq('tg_id', tgId)
      .eq('is_active', true)
      .maybeSingle()

    if (!b) { setLoading(false); return }
    setBarber(b)

    const { data: appts } = await supabase
      .from('appointments')
      .select('id,start_time,end_time,customer_name,customer_phone,appointment_status')
      .eq('barber_id', b.id)
      .order('start_time', { ascending: true })

    setAppointments(appts ?? [])
    setLoading(false)
  }

  async function uploadPhoto(e) {
    const file = e.target.files?.[0]
    if (!file || !barber) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `barbers/${barber.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('barbers').update({ profile_photo: publicUrl }).eq('id', barber.id)
    setBarber(b => ({ ...b, profile_photo: publicUrl }))
    setUploading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ appointment_status: status }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, appointment_status: status } : a))
  }

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('uz', { day: 'numeric', month: 'short' })
  const today = new Date().toISOString().slice(0, 10)

  const filtered = appointments.filter(a => {
    const d = a.start_time.slice(0, 10)
    if (tab === 'today') return d === today
    if (tab === 'upcoming') return d > today
    return d < today || a.appointment_status === 'cancelled'
  })

  const todayCount = appointments.filter(a => a.start_time.slice(0, 10) === today && a.appointment_status === 'booked').length
  const totalDone = appointments.filter(a => a.appointment_status === 'completed').length

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}30`, borderTop: `2px solid ${GOLD}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!barber) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Profil topilmadi</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', paddingBottom: 40 }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${PURPLE}12 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}08 0%, transparent 70%)` }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* Hero */}
        <div style={{ paddingTop: 40, paddingBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${PURPLE}50`, boxShadow: `0 0 30px ${PURPLE}25` }}>
              {barber.profile_photo
                ? <img src={barber.profile_photo} alt={barber.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: `${PURPLE}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: PURPLE }}>{barber.name[0]}</div>
              }
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: GOLD, border: '2px solid #050a12', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {uploading
                ? <div style={{ width: 12, height: 12, border: '2px solid #00000040', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="13" height="13" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>{barber.name}</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {barber.daily_start_time?.slice(0,5)} – {barber.daily_end_time?.slice(0,5)}
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            {[
              { label: 'Bugun', value: todayCount, color: GOLD },
              { label: 'Bajarildi', value: totalDone, color: '#4ade80' },
              { label: 'Reyting', value: barber.rating ?? '—', color: PURPLE },
            ].map(s => (
              <div key={s.label} style={{ ...G.card, flex: 1, padding: '14px 10px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <button onClick={() => navigate('/barber/booking')}
            style={{ padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}35` }}>
            + Navbat qo'shish
          </button>
          <button onClick={() => navigate('/barber/slots')}
            style={{ padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Vaqtni bloklash
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
          {[['today', 'Bugun'], ['upcoming', 'Kelgusi'], ['past', "O'tgan"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
                background: tab === key ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === key ? '#fff' : 'rgba(255,255,255,0.3)',
                border: 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Appointments */}
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, padding: '32px 0' }}>Navbat yo'q</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(a => {
              const meta = STATUS_META[a.appointment_status] ?? STATUS_META.booked
              return (
                <div key={a.id} style={{ ...G.card, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 600, color: '#fff' }}>{a.customer_name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                        {fmtDate(a.start_time)} · {fmt(a.start_time)} – {fmt(a.end_time)}
                      </p>
                      {a.customer_phone && (
                        <a href={`tel:${a.customer_phone}`} style={{ margin: '3px 0 0', display: 'block', fontSize: 12, color: `${GOLD}aa` }}>{a.customer_phone}</a>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30`, whiteSpace: 'nowrap' }}>
                      {meta.label}
                    </span>
                  </div>
                  {a.appointment_status === 'booked' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateStatus(a.id, 'completed')}
                        style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                        ✓ Bajarildi
                      </button>
                      <button onClick={() => updateStatus(a.id, 'cancelled')}
                        style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                        ✕ Bekor
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
