// ── Button ──────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'gold', disabled, className = '', type = 'button' }) {
  const base = 'w-full py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none'
  const variants = {
    gold: 'bg-gold text-obsidian-900 shadow-gold hover:bg-gold-light',
    ghost: 'glass gold-border text-gold hover:bg-gold/10',
    danger: 'bg-red-500/20 gold-border border-red-500/40 text-red-400 hover:bg-red-500/30',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
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
export function Badge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeColors[status] ?? 'bg-white/10 text-white/50'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

// ── Section Title ────────────────────────────────────────────
export function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-gold/70 mb-3">{children}</h2>
  )
}
