import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './config/supabaseClient'
import Home from './pages/Client/Home.jsx'
import Booking from './pages/Client/Booking.jsx'
import MyAppointments from './pages/Client/MyAppointments.jsx'
import SalonHome from './pages/Salon/Home.jsx'
import SalonBooking from './pages/Salon/Booking.jsx'
import SalonAppointments from './pages/Salon/MyAppointments.jsx'
import Dashboard from './pages/Barber/Dashboard.jsx'
import ManualBooking from './pages/Barber/ManualBooking.jsx'
import SlotManager from './pages/Barber/SlotManager.jsx'
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard.jsx'

const OWNER_ID = 8536944196

async function resolveRole(tgId) {
  if (!tgId) return 'client'
  if (tgId === OWNER_ID) return 'superadmin'

  const [{ data: admin }, { data: barber }] = await Promise.all([
    supabase.from('superadmin').select('tg_id').eq('tg_id', tgId).maybeSingle(),
    supabase.from('barbers').select('id').eq('tg_id', tgId).eq('is_active', true).maybeSingle(),
  ])

  if (admin) return 'superadmin'
  if (barber) return 'barber'
  return 'client'
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

  const dest = { superadmin: '/superadmin', barber: '/barber', client: '/client' }
  return <Navigate to={dest[role]} replace />
}

export default function App() {
  return (
    <BrowserRouter>
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
        <Route path="/barber" element={<Dashboard />} />
        <Route path="/barber/booking" element={<ManualBooking />} />
        <Route path="/barber/slots" element={<SlotManager />} />

        {/* SuperAdmin routes */}
        <Route path="/superadmin" element={<SuperAdminDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
