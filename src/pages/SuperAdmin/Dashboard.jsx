import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

export default function SuperAdmin() {
  const [salons, setSalons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [tariffInput, setTariffInput] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [customPriceInput, setCustomPriceInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [salonsRes, plansRes] = await Promise.all([
      supabase.from('barbershops').select('*'),
      supabase.from('subscription_plans').select('*')
    ]);
    if (salonsRes.data) setSalons(salonsRes.data);
    if (plansRes.data) setPlans(plansRes.data);
    setLoading(false);
  };

  const getPlanName = (planId) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : '—';
  };

  // Salon tarifini yangilash (UUID bilan)
  const handleUpdateSalonTariff = async (e) => {
    e.preventDefault();
    if (!selectedSalon || !tariffInput) return;
    const { error } = await supabase
      .from('barbershops')
      .update({ subscription_plan_id: tariffInput })
      .eq('id', selectedSalon.id);
    if (error) {
      alert(`❌ Xatolik: ${error.message}`);
    } else {
      alert('✅ Salon tarifi yangilandi!');
      setActiveModal(null);
      fetchData();
    }
  };

  // Salonni faollashtirish/o'chirish
  const handleToggleActive = async (salon) => {
    const { error } = await supabase
      .from('barbershops')
      .update({ is_active: !salon.is_active })
      .eq('id', salon.id);
    if (!error) fetchData();
    else alert(`❌ Xatolik: ${error.message}`);
  };

  // Plan narxini yangilash (subscription_plans jadvalida)
  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    const { error } = await supabase
      .from('subscription_plans')
      .update({ price: Number(customPriceInput.replace(/\D/g, '')) })
      .eq('id', editingPlan.id);
    if (error) {
      alert(`❌ Xatolik: ${error.message}`);
    } else {
      alert('✅ Narx yangilandi!');
      setActiveModal(null);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#0a0512] via-[#120720] to-[#1a0b2e] text-white p-6 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
        SuperAdmin Paneli
      </h1>

      {/* SALONLAR */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mb-12">
        <h2 className="text-xl font-semibold mb-4 text-[#ffcc00]">SALONLAR BOSHQARUVI</h2>
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
                        {salon.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedSalon(salon);
                          setTariffInput(salon.subscription_plan_id || '');
                          setActiveModal('salon_tariff');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-sm transition"
                      >
                        Tarifni o'zgartirish
                      </button>
                      <button
                        onClick={() => handleToggleActive(salon)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          salon.is_active
                            ? 'bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300'
                            : 'bg-green-500/20 border border-green-500/40 hover:bg-green-500/30 text-green-300'
                        }`}
                      >
                        {salon.is_active ? "O'chirish" : 'Faollashtirish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TARIF KARTALARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-gray-400">{plan.name}</h3>
              <p className="text-3xl font-extrabold my-4 text-[#ffcc00]">{Number(plan.price || 0).toLocaleString()} UZS</p>
            </div>
            <button
              onClick={() => {
                setEditingPlan(plan);
                setCustomPriceInput(String(plan.price || ''));
                setActiveModal('global_price');
              }}
              className="mt-4 w-full py-2 rounded-xl bg-purple-600/30 border border-purple-500/50 hover:bg-purple-600/50 transition font-medium"
            >
              Narxni Tahrirlash
            </button>
          </div>
        ))}
      </div>

      {/* MODAL: SALON TARIFI */}
      {activeModal === 'salon_tariff' && selectedSalon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#120720] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-xl font-bold mb-4">{selectedSalon.name}</h3>
            <form onSubmit={handleUpdateSalonTariff}>
              <label className="block text-sm text-gray-400 mb-2">Yangi Tarifni Tanlang</label>
              <select
                value={tariffInput}
                onChange={(e) => setTariffInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-6 focus:outline-none focus:border-purple-500"
              >
                <option value="" className="bg-[#120720]">— Tanlang —</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#120720]">{p.name}</option>
                ))}
              </select>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition">
                Tasdiqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NARX TAHRIRLASH */}
      {activeModal === 'global_price' && editingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#120720] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-xl font-bold mb-4 uppercase">Narxni tahrirlash — {editingPlan.name}</h3>
            <form onSubmit={handleUpdatePrice}>
              <label className="block text-sm text-gray-400 mb-2">Yangi Narx (UZS / OY)</label>
              <input
                type="text"
                value={customPriceInput}
                onChange={(e) => setCustomPriceInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-6 focus:outline-none focus:border-purple-500"
                placeholder="Narxni kiriting"
                required
              />
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition">
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
