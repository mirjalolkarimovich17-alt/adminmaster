import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Building2, CheckCircle2, XCircle, LayoutGrid, Rocket, Star, Gem, Crown, MessageSquare, Phone, Pencil, Power, PowerOff, ShieldCheck, BadgeDollarSign, FileText, Plus, Copy } from 'lucide-react';

const PLAN_META = {
  START: { icon: Rocket, color: 'from-blue-500/20 to-blue-900/10 border-blue-500/30', accent: 'text-blue-400' },
  STANDARD: { icon: Star, color: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30', accent: 'text-emerald-400' },
  PREMIUM: { icon: Gem, color: 'from-purple-500/20 to-purple-900/10 border-purple-500/30', accent: 'text-purple-400' },
  VIP_BRAND: { icon: Crown, color: 'from-amber-500/20 to-amber-900/10 border-amber-500/30', accent: 'text-amber-400' }
};

export default function SuperAdmin() {
  const [salons, setSalons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [tariffInput, setTariffInput] = useState('');

  const [newSalonForm, setNewSalonForm] = useState({ name: '', owner_tg_id: '' });
  const [newSalonResult, setNewSalonResult] = useState(null);

  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', price: '', sms_limit: '', call_limit: '', description: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [salonsRes, plansRes] = await Promise.all([
      supabase.from('barbershops').select('*'),
      supabase.from('subscription_plans').select('*').order('price', { ascending: true })
    ]);
    if (salonsRes.data) setSalons(salonsRes.data);
    if (plansRes.data) setPlans(plansRes.data);
    setLoading(false);
  };

  const getPlanName = (planId) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : '—';
  };

  const [expiresMonths, setExpiresMonths] = useState(1);

  const handleUpdateSalonTariff = async (e) => {
    e.preventDefault();
    if (!selectedSalon || !tariffInput) return;
    const expires = new Date();
    expires.setMonth(expires.getMonth() + Number(expiresMonths));
    const { error } = await supabase.from('barbershops').update({
      subscription_plan_id: tariffInput,
      is_active: true,
      subscription_expires_at: expires.toISOString(),
    }).eq('id', selectedSalon.id);
    if (error) alert(`❌ Xatolik: ${error.message}`);
    else { setActiveModal(null); fetchData(); }
  };

  const handleAddSalon = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('barbershops')
      .insert({ name: newSalonForm.name.trim(), owner_tg_id: Number(newSalonForm.owner_tg_id), is_active: true })
      .select('id, name')
      .single();
    if (error) { alert(`❌ Xatolik: ${error.message}`); return; }
    setNewSalonResult(data);
    fetchData();
  };

  const handleToggleActive = async (salon) => {
    const { error } = await supabase.from('barbershops').update({ is_active: !salon.is_active }).eq('id', salon.id);
    if (!error) fetchData();
    else alert(`❌ Xatolik: ${error.message}`);
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    const { error } = await supabase.from('subscription_plans').update({
      name: planForm.name, price: Number(planForm.price), sms_limit: Number(planForm.sms_limit), call_limit: Number(planForm.call_limit), description: planForm.description
    }).eq('id', editingPlan.id);
    if (error) alert(`❌ Xatolik: ${error.message}`);
    else { alert('✅ Tarif yangilandi!'); setActiveModal(null); fetchData(); }
  };

  const activeSalons = salons.filter(s => s.is_active).length;
  const inactiveSalons = salons.filter(s => !s.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#0a0512] via-[#120720] to-[#1a0b2e] text-white p-6 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-purple-400" /> SuperAdmin Paneli
      </h1>

      {/* STATISTIKA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-gray-400" />
          <div><p className="text-gray-400 text-xs">Jami Salonlar</p><p className="text-xl font-bold">{salons.length}</p></div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-900/5 border border-green-500/20 rounded-xl p-5 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
          <div><p className="text-gray-400 text-xs">Faol</p><p className="text-xl font-bold text-green-400">{activeSalons}</p></div>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-900/5 border border-red-500/20 rounded-xl p-5 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-400" />
          <div><p className="text-gray-400 text-xs">Nofaol</p><p className="text-xl font-bold text-red-400">{inactiveSalons}</p></div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/5 border border-purple-500/20 rounded-xl p-5 flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-purple-400" />
          <div><p className="text-gray-400 text-xs">Tarif Turlari</p><p className="text-xl font-bold text-purple-400">{plans.length}</p></div>
        </div>
      </div>

      {/* SALONLAR */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mb-12">
        <h2 className="text-xl font-semibold mb-4 text-[#ffcc00] flex items-center gap-2"><Building2 className="w-5 h-5" /> SALONLAR BOSHQARUVI</h2>
        {loading ? <p className="text-gray-400">Yuklanmoqda...</p> : (
          <div className="overflow-x-auto">
            <div className="flex justify-end mb-3">
              <button onClick={() => { setNewSalonForm({ name: '', owner_tg_id: '' }); setNewSalonResult(null); setActiveModal('add_salon'); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition">
                <Plus className="w-4 h-4" /> Yangi Salon
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="p-3">SALON</th><th className="p-3">TENANT_ID</th><th className="p-3">TARIF</th><th className="p-3">HOLAT</th><th className="p-3">AMALLAR</th>
                </tr>
              </thead>
              <tbody>
                {salons.map(salon => (
                  <tr key={salon.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="p-3 font-medium">{salon.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded font-mono truncate max-w-[140px]">{salon.id}</code>
                        <button onClick={() => navigator.clipboard.writeText(salon.id)} title="Nusxa olish"
                          className="text-gray-500 hover:text-white transition flex-shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 uppercase text-purple-400 font-bold">{getPlanName(salon.subscription_plan_id)}</td>
                    <td className="p-3">
                      {salon.is_active
                        ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400"><CheckCircle2 className="w-3 h-3" /> Faol</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" /> Nofaol</span>
                      }
                    </td>
                    <td className="p-3 flex gap-2 flex-wrap">
                      <button onClick={() => { setSelectedSalon(salon); setTariffInput(salon.subscription_plan_id || ''); setActiveModal('salon_tariff'); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-sm transition">
                        <Pencil className="w-3.5 h-3.5" /> Tarif
                      </button>
                      <button onClick={() => handleToggleActive(salon)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${salon.is_active ? 'bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300' : 'bg-green-500/20 border border-green-500/40 hover:bg-green-500/30 text-green-300'}`}>
                        {salon.is_active ? <><PowerOff className="w-3.5 h-3.5" /> O'chirish</> : <><Power className="w-3.5 h-3.5" /> Faollashtirish</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TARIF REJALARI */}
      <h2 className="text-xl font-semibold mb-4 text-[#ffcc00] flex items-center gap-2"><BadgeDollarSign className="w-5 h-5" /> TARIF REJALARI</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map(plan => {
          const meta = PLAN_META[plan.name] || { icon: LayoutGrid, color: 'from-white/10 to-white/5 border-white/10', accent: 'text-gray-400' };
          const Icon = meta.icon;
          return (
            <div key={plan.id} className={`bg-gradient-to-br ${meta.color} border rounded-2xl p-5 shadow-xl flex flex-col justify-between`}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${meta.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold uppercase text-white">{plan.name}</h3>
                </div>
                <p className="text-2xl font-extrabold my-2 text-[#ffcc00]">{Number(plan.price || 0).toLocaleString()} <span className="text-sm text-gray-400 font-normal">UZS/oy</span></p>
                <p className="text-xs text-gray-300 mb-3 italic">{plan.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" /> <span className="text-gray-300">SMS</span> <span className="text-white font-bold ml-auto">{plan.sms_limit} ta</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    <Phone className="w-4 h-4 text-green-400" /> <span className="text-gray-300">Qo'ng'iroq</span> <span className="text-white font-bold ml-auto">{plan.call_limit} ta</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setEditingPlan(plan); setPlanForm({ name: plan.name, price: String(plan.price), sms_limit: String(plan.sms_limit), call_limit: String(plan.call_limit), description: plan.description || '' }); setActiveModal('edit_plan'); }}
                className="mt-4 w-full py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition font-medium text-sm inline-flex items-center justify-center gap-2">
                <Pencil className="w-4 h-4" /> Tahrirlash
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL: YANGI SALON */}
      {activeModal === 'add_salon' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#120720] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2"><Plus className="w-5 h-5 text-purple-400" /> Yangi Salon Qo'shish</h3>

            {!newSalonResult ? (
              <form onSubmit={handleAddSalon} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Salon nomi</label>
                  <input type="text" required value={newSalonForm.name}
                    onChange={e => setNewSalonForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Masalan: Barbershop 23"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Egasining Telegram ID</label>
                  <input type="number" required value={newSalonForm.owner_tg_id}
                    onChange={e => setNewSalonForm(f => ({ ...f, owner_tg_id: e.target.value }))}
                    placeholder="Masalan: 6713025920"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" />
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold rounded-xl hover:brightness-110 transition">
                  Yaratish
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <p className="text-green-400 font-bold mb-1">✅ Salon yaratildi!</p>
                  <p className="text-white font-medium">{newSalonResult.name}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">TENANT_ID (Vercel env uchun)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-purple-300 font-mono text-sm flex-1 break-all">{newSalonResult.id}</code>
                    <button onClick={() => navigator.clipboard.writeText(newSalonResult.id)}
                      className="flex-shrink-0 p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition">
                      <Copy className="w-4 h-4 text-purple-300" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-xs">Vercel da yangi project yarating va <code className="text-purple-300">VITE_TENANT_ID</code> ga shu UUID ni qo'ying.</p>
                <button onClick={() => setActiveModal(null)}
                  className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition">
                  Yopish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SALON TARIFI */}
      {activeModal === 'salon_tariff' && selectedSalon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#120720] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Pencil className="w-5 h-5 text-purple-400" /> {selectedSalon.name}</h3>
            <form onSubmit={handleUpdateSalonTariff}>
              <label className="block text-sm text-gray-400 mb-2">Yangi Tarifni Tanlang</label>
              <select value={tariffInput} onChange={(e) => setTariffInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-4 focus:outline-none focus:border-purple-500">
                <option value="" className="bg-[#120720]">— Tanlang —</option>
                {plans.map(p => <option key={p.id} value={p.id} className="bg-[#120720]">{p.name} — {Number(p.price).toLocaleString()} UZS</option>)}
              </select>
              <label className="block text-sm text-gray-400 mb-2">Muddat (oy)</label>
              <input type="number" min="1" max="24" value={expiresMonths} onChange={e => setExpiresMonths(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-6 focus:outline-none focus:border-purple-500" />
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition inline-flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Tasdiqlash va Faollashtirish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TARIF TAHRIRLASH */}
      {activeModal === 'edit_plan' && editingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#120720] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2"><Pencil className="w-5 h-5 text-amber-400" /> {editingPlan.name}</h3>
            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Tarif Nomi</label>
                <input type="text" value={planForm.name} onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-1"><BadgeDollarSign className="w-3.5 h-3.5" /> Narx (UZS/oy)</label>
                <input type="text" value={planForm.price} onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> SMS Limiti</label>
                <input type="text" value={planForm.sms_limit} onChange={(e) => setPlanForm({...planForm, sms_limit: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Qo'ng'iroq Limiti</label>
                <input type="text" value={planForm.call_limit} onChange={(e) => setPlanForm({...planForm, call_limit: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Tavsif</label>
                <textarea value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 resize-none" rows={3} />
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition inline-flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
