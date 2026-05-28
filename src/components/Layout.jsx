export default function Layout({ children, title, back }) {
  return (
    <div className="min-h-screen bg-obsidian-900 flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      {title && (
        <header className="sticky top-0 z-50 glass border-b border-white/5 px-4 py-3 flex items-center gap-3">
          {back && (
            <button onClick={back} className="text-gold hover:text-gold-light transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-base font-semibold tracking-wide text-white/90">{title}</h1>
        </header>
      )}

      <main className="flex-1 relative z-10 px-4 py-5 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
