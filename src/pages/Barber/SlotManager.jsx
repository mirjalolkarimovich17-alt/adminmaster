import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TENANT_ID } from '../../config/supabaseClient'
import Layout from '../../components/Layout'
import { Btn, Card, Input, Select, Loader, SectionTitle } from '../../components/UiKit'

export default function SlotManager() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [barbers, setBarbers] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    barber_id: '',
    date: today,
    start: '12:00',
    end: '13:00',
    reason: '',
  })

  useEffect(() => {
    async function load() {
      const { data: b } = await supabase.from('barbers').select('id,name').eq('tenant_id', TENANT_ID).eq('is_active', true)
      setBarbers(b ?? [])
      if (b?.length) setForm(f => ({ ...f, barber_id: b[0].id }))
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!form.barber_id || !form.date) return
    supabase.from('blocked_slots')
      .select('id,start_time,end_time,reason')
      .eq('barber_id', form.barber_id)
      .gte('start_time', `${form.date}T00:00:00`)
      .lte('start_time', `${form.date}T23:59:59`)
      .order('start_time')
      .then(({ data }) => setBlocks(data ?? []))
  }, [form.barber_id, form.date])

  async function addBlock(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const start = new Date(`${form.date}T${form.start}:00`)
    const end = new Date(`${form.date}T${form.end}:00`)
    if (end <= start) { setError('End time must be after start time'); setSubmitting(false); return }

    const { data, error: err } = await supabase.from('blocked_slots').insert({
      tenant_id: TENANT_ID,
      barber_id: form.barber_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      reason: form.reason.trim() || null,
    }).select().single()

    setSubmitting(false)
    if (err) { setError(err.message); return }
    setBlocks(prev => [...prev, data].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)))
    setForm(f => ({ ...f, reason: '' }))
  }

  async function removeBlock(id) {
    await supabase.from('blocked_slots').delete().eq('id', id)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <Layout title="Slot Manager" back={() => navigate('/barber')}>
      <div className="flex justify-center mt-20"><Loader /></div>
    </Layout>
  )

  return (
    <Layout title="Slot Manager" back={() => navigate('/barber')}>
      <form onSubmit={addBlock} className="flex flex-col gap-4 mb-8">
        <SectionTitle>Block a Time</SectionTitle>

        <Select label="Barber" value={form.barber_id} onChange={e => setForm(f => ({ ...f, barber_id: e.target.value }))}>
          {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>

        <Input label="Date" type="date" value={form.date} min={today}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="From" type="time" value={form.start}
            onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
          <Input label="To" type="time" value={form.end}
            onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
        </div>

        <Input label="Reason (optional)" placeholder="Lunch, break, emergency…" value={form.reason}
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />

        {error && <p className="text-red-400 text-xs">{error}</p>}
        <Btn type="submit" disabled={submitting}>{submitting ? 'Blocking…' : 'Block Slot'}</Btn>
      </form>

      {/* Existing blocks */}
      {blocks.length > 0 && (
        <>
          <SectionTitle>Blocked — {new Date(form.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</SectionTitle>
          <div className="flex flex-col gap-3">
            {blocks.map(b => (
              <Card key={b.id} className="flex items-center justify-between">
                <div>
                  <p className="text-gold text-sm font-semibold">{fmt(b.start_time)} – {fmt(b.end_time)}</p>
                  {b.reason && <p className="text-white/40 text-xs mt-0.5">{b.reason}</p>}
                </div>
                <button onClick={() => removeBlock(b.id)}
                  className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Card>
            ))}
          </div>
        </>
      )}
    </Layout>
  )
}
