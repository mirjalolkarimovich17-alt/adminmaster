import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Client/Home.jsx'
import Booking from './pages/Client/Booking.jsx'
import MyAppointments from './pages/Client/MyAppointments.jsx'
import Dashboard from './pages/Barber/Dashboard.jsx'
import ManualBooking from './pages/Barber/ManualBooking.jsx'
import SlotManager from './pages/Barber/SlotManager.jsx'
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client routes */}
        <Route path="/client" element={<Home />} />
        <Route path="/client/booking" element={<Booking />} />
        <Route path="/client/appointments" element={<MyAppointments />} />

        {/* Barber routes */}
        <Route path="/barber" element={<Dashboard />} />
        <Route path="/barber/booking" element={<ManualBooking />} />
        <Route path="/barber/slots" element={<SlotManager />} />

        {/* SuperAdmin route */}
        <Route path="/superadmin" element={<SuperAdminDashboard />} />

        <Route path="*" element={<Navigate to="/client" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
