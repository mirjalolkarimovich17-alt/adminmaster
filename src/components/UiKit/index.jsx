import { useState, createContext, useContext } from 'react'
import { haptic } from '../../config/haptic'

// ── Button ──────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'gold', disabled, className = '', type = 'button' }) {
  const base = 'w-full py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none'
  const variants = {
    gold: 'bg-gold text-obsidian-900 shadow-gold hover:bg-gold-light',
    ghost: 'glass gold-border text-gold hover:bg-gold/10',
    danger: 'bg-red-500/20 gold-border border-red-500/40 text-red-400 hover:bg-red-500/30',
  }
  const handleClick = (e) => {
    haptic.light()
    onClick?.(e)
  }
  return (
    <button type={type} onClick={handleClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }) {
  return (
    <div onClick={onClick} className={`glass rounded-2xl p-4 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ── Input ────────────────────────────────────────────────────
export function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-white/50 tracking-wider uppercase">{label}</label>}
      <input
        {...props}
        className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:gold-border focus:ring-1 focus:ring-gold/30 transition-all"
      />
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────
export function Select({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-white/50 tracking-wider uppercase">{label}</label>}
      <select
        {...props}
        className="w-full glass rounded-xl px-4 py-3 text-sm text-white outline-none focus:gold-border bg-obsidian-800 transition-all"
      >
        {children}
      </select>
    </div>
  )
}

// ── Loader ───────────────────────────────────────────────────
export function Loader({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-2'
  return (
    <div className={`${s} border-gold/30 border-t-gold rounded-full animate-spin`} />
  )
}

// ── Badge ────────────────────────────────────────────────────
const badgeColors = {
  booked: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-emerald-500/20 text-emerald-300',
  no_show: 'bg-red-500/20 text-red-300',
  cancelled: 'bg-white/10 text-white/40',
  pending: 'bg-yellow-500/20 text-yellow-300',
}
const statusLabels = {
  booked: 'Navbatda',
  completed: 'Bajarildi',
  no_show: 'Kelmadi',
  cancelled: 'Bekor qilindi',
  pending: 'Kutilmoqda',
}
export function Badge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeColors[status] ?? 'bg-white/10 text-white/50'}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}

// ── Section Title ────────────────────────────────────────────
export function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-gold/70 mb-3">{children}</h2>
  )
}

// ── Skeleton ─────────────────────────────────────────────────
export function Skeleton({ className = '', count = 1 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />
  ))
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse glass rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-white/10 rounded w-3/4" />
            <div className="h-2.5 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────────
const ToastCtx = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = (message, type = 'success', duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: '90%', maxWidth: 360 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 14,
            background: t.type === 'error' ? 'rgba(239,68,68,0.95)' : t.type === 'warning' ? 'rgba(234,179,8,0.95)' : 'rgba(34,197,94,0.95)',
            backdropFilter: 'blur(12px)', color: '#fff', fontSize: 13, fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'toastIn 0.3s ease',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : '✓'} {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
