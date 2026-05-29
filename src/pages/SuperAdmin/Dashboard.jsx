import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

const PLAN_ICONS = {
  START: '🚀',
  STANDARD: '⭐',
  PREMIUM: '💎',
  VIP_BRAND: '👑'
};

const PLAN_COLORS = {
  START: 'from-blue-500/20 to-blue-900/10 border-blue-500/30',
  STANDARD: 'from-green-500/20 to-green-900/10 border-green-500/30',
  PREMIUM: 'from-purple-500/20 to-purple-900/10 border-purple-500/30',
  VIP_BRAND: 'from-amber-500/20 to-amber-900/10 border-amber-500/30'
};

export default function SuperAdmin() {
  const [salons, setSalons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [tariffInput, setTariffInput] = useState('');

  // Plan edit states
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

  const handleUpdateSalonTariff = async (e) => {
    e.preventDefault();
    if (!selectedSalon || !tariffInput) return;
    const { error } = await supabase
      .from('barbershops')
      .update({ subscription_plan_id: tariffInput })
      .eq('id', selectedSalon.id);
    if (error) alert(`❌ Xatolik: ${error.message}`);
    else { alert('✅ Salon tarifi yangilandi!'); setActiveModal(null); fetchData(); }
  };

  const handleToggleActive = async (salon) => {
    const { error } = await supabase
      .from('barbershops')
      .update({ is_active: !salon.is_active })
      .eq('id', salon.id);
    if (!error) fetchData();
    else alert(`❌ Xatolik: ${error.message}`);
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    const { error } = await supabase
      .from('subscription_plans')
      .update({
        name: planForm.name,
        price: Number(planForm.price),
        sms_limit: Number(planForm.sms_limit),
        call_limit: Number(planForm.call_limit),
        description: planForm.description
      })
      .eq('id', editingPlan.id);
    if (error) alert(`❌ Xatolik: ${error.message}`);
    else { alert('✅ Tarif yangilandi!'); setActiveModal(null); fetchData(); }
  };

  const activeSalons = salons.filter(s => s.is_active).length;
  const inactiveSalons = salons.filter(s => !s.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#0a0512] via-[#120720] to-[#1a0b2e] text-white p-6 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
        👨‍💼 SuperAdmin Paneli
      </h1>

      {/* UMUMIY STATISTIKA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-gray-400 text-sm">🏢 Jami Salonlar</p>
          <p className="text-2xl font-bold mt-1">{salons.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-900/5 border border-green-500/20 rounded-xl p-5">
          <p className="text-gray-400 text-sm">✅ Faol</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{activeSalons}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-900/5 border border-red-500/20 rounded-xl p-5">
          <p className="text-gray-400 text-sm">⛔ Nofaol</p>
          <p className="text-2xl font-bold mt-1 text-red-400">{inactiveSalons}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/5 border border-purple-500/20 rounded-xl p-5">
          <p className="text-gray-400 text-sm">📋 Tarif Turlari</p>
          <p className="text-2xl font-bold mt-1 text-purple-400">{plans.length}</p>
        </div>
      </div>

      {/* SALONLAR JADVALI */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mb-12">
        <h2 className="text-xl font-semibold mb-4 text-[#ffcc00]">🏪 SALONLAR BOSHQARUVI</h2>
        {loading ? <p className="text-gray-400">Yuklanmoqda...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="p-3">SALON</th>
                  <th className="p-3">TARIF</th>
                  <th className="p-3">HOLAT</th>
                  <th className="p-3">AMALLAR</th>
                </tr>
              </thead>
              <tbody>
                {salons.map(salon => (
                  <tr key={salon.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="p-3 font-medium">{salon.name}</td>
                    <td className="p-3 uppercase text-purple-400 font-bold">{getPlanName(salon.subscription_plan_id)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${salon.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {salon.is_active ? '✅ Faol' : '⛔ Nofaol'}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 flex-wrap">
                      <button
                        onClick={() => { setSelectedSalon(salon); setTariffInput(salon.subscription_plan_id || ''); setActiveModal('salon_tariff'); }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-sm transition"
                      >
                        📝 Tarif
                      </button>
                      <button
                        onClick={() => handleToggleActive(salon)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${salon.is_active ? 'bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300' : 'bg-green-500/20 border border-green-500/40 hover:bg-green-500/30 text-green-300'}`}
                      >
                        {salon.is_active ? "🔴 O'chirish" : '🟢 Faollashtirish'}
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
      <h2 className="text-xl font-semibold mb-4 text-[#ffcc00]">💰 TARIF REJALARI</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map(plan => (
          <div key={plan.id} className={`bg-gradient-to-br ${PLAN_COLORS[plan.name] || 'from-white/10 to-white/5 border-white/10'} border rounded-2xl p-5 shadow-xl flex flex-col justify-between`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{PLAN_ICONS[plan.name] || '📦'}</span>
                <h3 className="text-lg font-bold uppercase tracking-wider text-white">{plan.name}</h3>
              </div>
              <p className="text-2xl font-extrabold my-2 text-[#ffcc00]">{Number(plan.price || 0).toLocaleString()} <span className="text-sm text-gray-400 font-normal">UZS/oy</span></p>
              <p className="text-xs text-gray-300 mb-3 italic">{plan.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                  <span>💬</span> <span className="text-gray-300">SMS:</span> <span className="text-white font-bold ml-auto">{plan.sms_limit} ta</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                  <span>📞</span> <span className="text-gray-300">Qo'ng'iroq:</span> <span className="text-white font-bold ml-auto">{plan.call_limit} ta</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingPlan(plan);
                setPlanForm({ name: plan.name, price: String(plan.price), sms_limit: String(plan.sms_limit), call_limit: String(plan.call_limit), description: plan.description || '' });
                setActiveModal('edit_plan');
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition font-medium text-sm"
            >
              ✏️ Tahrirlash
            </button>
          </div>
        ))}
      </div>

      {/* MODAL: SALON TARIFI */}
      {activeModal === 'salon_tariff' && selectedSalon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#120720] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-xl font-bold mb-4">📝 {selectedSalon.name}</h3>
            <form onSubmit={handleUpdateSalonTariff}>
              <label className="block text-sm text-gray-400 mb-2">Yangi Tarifni Tanlang</label>
              <select
                value={tariffInput}
                onChange={(e) => setTariffInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-6 focus:outline-none focus:border-purple-500"
              >
                <option value="" className="bg-[#120720]">— Tanlang —</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#120720]">{PLAN_ICONS[p.name] || '📦'} {p.name} — {Number(p.price).toLocaleString()} UZS</option>
                ))}
              </select>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition">
                ✅ Tasdiqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TARIF TO'LIQ TAHRIRLASH */}
      {activeModal === 'edit_plan' && editingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#120720] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-xl font-bold mb-5">✏️ Tarifni tahrirlash — {editingPlan.name}</h3>
            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tarif Nomi</label>
                <input type="text" value={planForm.name} onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">💰 Narx (UZS/oy)</label>
                <input type="text" value={planForm.price} onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">💬 SMS Limiti</label>
                <input type="text" value={planForm.sms_limit} onChange={(e) => setPlanForm({...planForm, sms_limit: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">📞 Qo'ng'iroq Limiti</label>
                <input type="text" value={planForm.call_limit} onChange={(e) => setPlanForm({...planForm, call_limit: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">📝 Tavsif</label>
                <textarea value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 resize-none" rows={3} />
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition">
                💾 Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
