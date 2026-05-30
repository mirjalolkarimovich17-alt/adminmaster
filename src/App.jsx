import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './config/supabaseClient'
import { ToastProvider } from './components/UiKit'
import Home from './pages/Client/Home.jsx'
import Booking from './pages/Client/Booking.jsx'
import MyAppointments from './pages/Client/MyAppointments.jsx'
import SalonHome from './pages/Salon/Home.jsx'
import SalonBooking from './pages/Salon/Booking.jsx'
import SalonAppointments from './pages/Salon/MyAppointments.jsx'
import Dashboard from './pages/Barber/Dashboard.jsx'
import BarberProfile from './pages/Barber/BarberProfile.jsx'
import ManualBooking from './pages/Barber/ManualBooking.jsx'
import SlotManager from './pages/Barber/SlotManager.jsx'
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard.jsx'

const OWNER_ID = 8536944196
const IS_SUPERADMIN_BOT = !import.meta.env.VITE_TENANT_ID

async function resolveRole(tgId) {
  if (!tgId) return IS_SUPERADMIN_BOT ? 'blocked' : 'client'
  if (IS_SUPERADMIN_BOT) {
    return tgId === OWNER_ID ? 'superadmin' : 'blocked'
  }

  const [{ data: admin }, { data: barber }, { data: ownedShop }] = await Promise.all([
    supabase.from('superadmin').select('tg_id').eq('tg_id', tgId).maybeSingle(),
    supabase.from('barbers').select('id').eq('tg_id', tgId).eq('is_active', true).maybeSingle(),
    supabase.from('barbershops').select('id').eq('owner_tg_id', tgId).maybeSingle(),
  ])

  if (admin) return 'superadmin'
  if (ownedShop) return 'owner'
  if (barber) return 'barber'
  return 'client'
}

function Blocked() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #1a0a0a, #0a0505)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: 24, textAlign: 'center'
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="36" height="36" fill="none" stroke="#ef4444" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Доступ запрещён</p>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>У вас нет прав для входа<br />в эту панель управления.</p>
        </div>
        <div style={{ marginTop: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(220,38,38,0.7)', letterSpacing: '0.1em' }}>ДОСТУП ЗАКРЫТ</p>
        </div>
      </div>
    </div>
  )
}

function RoleLoader() {
  return (
    <div className="min-h-screen bg-obsidian-900 flex flex-col items-center justify-center gap-5">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl" />
      </div>
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 40px rgba(212,175,55,0.1), inset 0 1px 0 rgba(255,255,255,0.06)' }}
      >
        <svg className="w-9 h-9 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
      </div>
      <div className="w-7 h-7 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      <p className="text-white/25 text-xs tracking-widest uppercase">Aniqlanmoqda…</p>
    </div>
  )
}

function RoleGate() {
  const [role, setRole] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    tg?.ready()
    tg?.expand?.()

    let tgId = tg?.initDataUnsafe?.user?.id ?? null

    if (!tgId) {
      const stored = localStorage.getItem('tg_id')
      if (stored) tgId = Number(stored)
    } else {
      localStorage.setItem('tg_id', String(tgId))
    }

    resolveRole(tgId).then(setRole)
  }, [])

  if (!role) return <RoleLoader />

  if (role === 'blocked') return <Blocked />

  const dest = { superadmin: '/superadmin', owner: '/owner', barber: '/barber', client: '/client' }
  return <Navigate to={dest[role]} replace />
}

export default function App() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  return (
    <ToastProvider>
    <BrowserRouter>
      {offline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, padding: '10px 16px', background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M15.536 8.464a5 5 0 010 7.072" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Internet aloqasi yo'q</span>
        </div>
      )}
      <Routes>
        <Route path="/" element={<RoleGate />} />

        {/* Client routes (old) */}
        <Route path="/client" element={<Home />} />
        <Route path="/client/booking" element={<Booking />} />
        <Route path="/client/appointments" element={<MyAppointments />} />

        {/* Salon routes (new multi-tenant) */}
        <Route path="/client/:slug" element={<SalonHome />} />
        <Route path="/client/:slug/booking" element={<SalonBooking />} />
        <Route path="/client/:slug/appointments" element={<SalonAppointments />} />

        {/* Barber routes */}
        <Route path="/barber" element={<BarberProfile />} />
        <Route path="/barber/booking" element={<ManualBooking />} />
        <Route path="/barber/slots" element={<SlotManager />} />

        {/* Owner routes (salon egasi) */}
        <Route path="/owner" element={<Dashboard ownerMode />} />
        <Route path="/owner/booking" element={<ManualBooking ownerMode />} />
        <Route path="/owner/slots" element={<SlotManager ownerMode />} />

        {/* SuperAdmin routes */}
        <Route path="/superadmin" element={<SuperAdminDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  )
}
