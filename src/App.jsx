import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './config/supabaseClient'
import Home from './pages/Client/Home.jsx'
import Booking from './pages/Client/Booking.jsx'
import MyAppointments from './pages/Client/MyAppointments.jsx'
import Dashboard from './pages/Barber/Dashboard.jsx'
import ManualBooking from './pages/Barber/ManualBooking.jsx'
import SlotManager from './pages/Barber/SlotManager.jsx'
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard.jsx'

const DEV = import.meta.env.DEV

// ── Role resolver ─────────────────────────────────────────────
async function resolveRole(tgId) {
  if (!tgId) return 'client'
  const [{ data: admin }, { data: barber }] = await Promise.all([
    supabase.from('superadmin').select('tg_id').eq('tg_id', tgId).maybeSingle(),
    supabase.from('barbers').select('id').eq('tg_id', tgId).eq('is_active', true).maybeSingle(),
  ])
  if (admin) return 'superadmin'
  if (barber) return 'barber'
  return 'client'
}

// ── Loading screen ────────────────────────────────────────────
function RoleLoader({ onDevLogin }) {
  return (
    <div className="min-h-screen bg-obsidian-900 flex flex-col items-center justify-center gap-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative glass gold-border w-20 h-20 rounded-3xl flex items-center justify-center">
        <svg className="w-9 h-9 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
      </div>

      <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      <p className="text-white/30 text-xs tracking-widest uppercase">Aniqlanmoqda…</p>

      {/* Dev-only bypass button */}
      {DEV && (
        <button
          onClick={onDevLogin}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs px-4 py-2 rounded-full
            bg-white/5 border border-white/10 text-white/30 hover:text-gold hover:border-gold/30
            transition-all"
        >
          ⚙ Dev: SuperAdmin kirish
        </button>
      )}
    </div>
  )
}

// ── Role gate ─────────────────────────────────────────────────
function RoleGate() {
  const [role, setRole] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    tg?.ready()           // signal Telegram the app is ready
    tg?.expand?.()

    // Primary: SDK user id
    let tgId = tg?.initDataUnsafe?.user?.id ?? null

    // Fallback: persisted id from a previous successful session
    if (!tgId) {
      const stored = localStorage.getItem('tg_id')
      if (stored) tgId = Number(stored)
    } else {
      localStorage.setItem('tg_id', String(tgId))
    }

    resolveRole(tgId).then(setRole)
  }, [])

  function devLogin() {
    setRole('superadmin')
  }

  if (!role) return <RoleLoader onDevLogin={devLogin} />

  const destinations = { superadmin: '/superadmin', barber: '/barber', client: '/client' }
  return <Navigate to={destinations[role]} replace />
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleGate />} />

        <Route path="/client" element={<Home />} />
        <Route path="/client/booking" element={<Booking />} />
        <Route path="/client/appointments" element={<MyAppointments />} />

        <Route path="/barber" element={<Dashboard />} />
        <Route path="/barber/booking" element={<ManualBooking />} />
        <Route path="/barber/slots" element={<SlotManager />} />

        <Route path="/superadmin" element={<SuperAdminDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
