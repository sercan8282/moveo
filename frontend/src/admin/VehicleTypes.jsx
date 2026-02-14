import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || '/api';

export default function VehicleTypes() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', icon: '',
    pricePerKmDomestic: '', pricePerKmInternational: '',
    expressSurchargePercent: '', minPrice: '',
    additionalCosts: [], active: true, sortOrder: 0
  });

  useEffect(() => { fetchVehicleTypes(); }, []);

  const token = () => localStorage.getItem('moveo_token');

  async function fetchVehicleTypes() {
    try {
      const res = await fetch(`${API}/vehicle-types`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) setVehicleTypes(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({
      name: '', slug: '', description: '', icon: '',
      pricePerKmDomestic: '', pricePerKmInternational: '',
      expressSurchargePercent: '', minPrice: '', tollMultiplier: '1.0',
      additionalCosts: [], active: true, sortOrder: vehicleTypes.length
    });
    setShowForm(true);
  }

  function openEdit(vt) {
    setEditing(vt.id);
    setForm({
      name: vt.name,
      slug: vt.slug,
      description: vt.description || '',
      icon: vt.icon || '',
      pricePerKmDomestic: vt.pricePerKmDomestic?.toString() || '',
      pricePerKmInternational: vt.pricePerKmInternational?.toString() || '',
      expressSurchargePercent: vt.expressSurchargePercent?.toString() || '',
      minPrice: vt.minPrice?.toString() || '',
      tollMultiplier: vt.tollMultiplier?.toString() || '1.0',
      additionalCosts: vt.additionalCosts || [],
      active: vt.active,
      sortOrder: vt.sortOrder
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const url = editing ? `${API}/vehicle-types/${editing}` : `${API}/vehicle-types`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fout');
      }
      toast.success(editing ? 'Voertuigtype bijgewerkt' : 'Voertuigtype aangemaakt');
      setShowForm(false);
      fetchVehicleTypes();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Weet u zeker dat u dit voertuigtype wilt verwijderen?')) return;
    try {
      const res = await fetch(`${API}/vehicle-types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fout bij verwijderen');
      }
      toast.success('Voertuigtype verwijderd');
      fetchVehicleTypes();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function toggleActive(vt) {
    try {
      await fetch(`${API}/vehicle-types/${vt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ active: !vt.active })
      });
      fetchVehicleTypes();
    } catch (err) {
      toast.error('Fout bij wijzigen status');
    }
  }

  function addAdditionalCost() {
    setForm(f => ({
      ...f,
      additionalCosts: [...f.additionalCosts, { name: '', amount: 0, enabled: true }]
    }));
  }

  function updateAdditionalCost(index, field, value) {
    setForm(f => {
      const costs = [...f.additionalCosts];
      costs[index] = { ...costs[index], [field]: field === 'amount' ? parseFloat(value) || 0 : field === 'enabled' ? value : value };
      return { ...f, additionalCosts: costs };
    });
  }

  function removeAdditionalCost(index) {
    setForm(f => ({
      ...f,
      additionalCosts: f.additionalCosts.filter((_, i) => i !== index)
    }));
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🚛 Voertuigtypes & Tarieven</h1>
          <p className="text-gray-500 mt-1">Beheer voertuigtypes en transporttarieven voor de calculator</p>
        </div>
        <button onClick={openNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          + Nieuw voertuigtype
        </button>
      </div>

      {/* Vehicle Types List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {vehicleTypes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">🚛</p>
            <p className="font-medium">Nog geen voertuigtypes</p>
            <p className="text-sm">Maak uw eerste voertuigtype aan om te beginnen</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {vehicleTypes.map(vt => (
              <div key={vt.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${!vt.active ? 'opacity-50' : ''}`}>
                <div className="text-3xl w-12 text-center">{vt.icon || '🚛'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{vt.name}</h3>
                    {!vt.active && <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Inactief</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{vt.description || 'Geen beschrijving'}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>🇳🇱 €{vt.pricePerKmDomestic?.toFixed(2)}/km</span>
                    <span>🌍 €{vt.pricePerKmInternational?.toFixed(2)}/km</span>
                    {vt.expressSurchargePercent > 0 && <span>⚡ +{vt.expressSurchargePercent}% express</span>}
                    {vt.minPrice > 0 && <span>Min: €{vt.minPrice?.toFixed(2)}</span>}
                    {vt._count?.quotes > 0 && <span>📋 {vt._count.quotes} offertes</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(vt)}
                    className={`px-3 py-1.5 text-xs rounded-lg ${vt.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {vt.active ? 'Actief' : 'Inactief'}
                  </button>
                  <button onClick={() => openEdit(vt)}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                    Bewerken
                  </button>
                  <button onClick={() => handleDelete(vt.id)}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
                    Verwijderen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? 'Voertuigtype bewerken' : 'Nieuw voertuigtype'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="bijv. Vrachtwagen"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input type="text" value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="Auto-generated from name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows="2" placeholder="Korte beschrijving van het voertuigtype..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icoon (emoji)</label>
                  <input type="text" value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="🚛"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sorteervolgorde</label>
                  <input type="number" value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">💰 Tarieven</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🇳🇱 Tarief binnenland (€/km)</label>
                    <input type="number" step="0.01" min="0" value={form.pricePerKmDomestic}
                      onChange={e => setForm(f => ({ ...f, pricePerKmDomestic: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🌍 Tarief internationaal (€/km)</label>
                    <input type="number" step="0.01" min="0" value={form.pricePerKmInternational}
                      onChange={e => setForm(f => ({ ...f, pricePerKmInternational: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">⚡ Express toeslag (%)</label>
                    <input type="number" step="0.1" min="0" value={form.expressSurchargePercent}
                      onChange={e => setForm(f => ({ ...f, expressSurchargePercent: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimumprijs (€)</label>
                    <input type="number" step="0.01" min="0" value={form.minPrice}
                      onChange={e => setForm(f => ({ ...f, minPrice: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🛣️ Tol vermenigvuldiger</label>
                    <input type="number" step="0.1" min="0.1" value={form.tollMultiplier}
                      onChange={e => setForm(f => ({ ...f, tollMultiplier: e.target.value }))}
                      placeholder="1.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    <p className="text-xs text-gray-500 mt-1">Factor waarmee tolkosten vermenigvuldigd worden (bijv. 2.5 voor vrachtwagens)</p>
                  </div>
                </div>
              </div>

              {/* Additional Costs */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">📋 Extra kosten per rit</h3>
                  <button type="button" onClick={addAdditionalCost}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    + Toevoegen
                  </button>
                </div>
                {form.additionalCosts.length === 0 ? (
                  <p className="text-sm text-gray-500">Geen extra kosten geconfigureerd</p>
                ) : (
                  <div className="space-y-2">
                    {form.additionalCosts.map((cost, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <input type="checkbox" checked={cost.enabled !== false}
                          onChange={e => updateAdditionalCost(i, 'enabled', e.target.checked)}
                          className="rounded" />
                        <input type="text" value={cost.name} placeholder="Naam (bijv. Tolkosten)"
                          onChange={e => updateAdditionalCost(i, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">€</span>
                          <input type="number" step="0.01" value={cost.amount} placeholder="0.00"
                            onChange={e => updateAdditionalCost(i, 'amount', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm" />
                        </div>
                        <button type="button" onClick={() => removeAdditionalCost(i)}
                          className="text-red-500 hover:text-red-700 text-sm">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <div className="border-t pt-4 mt-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="rounded" />
                  <span className="text-sm font-medium text-gray-700">Actief (zichtbaar in calculator)</span>
                </label>
              </div>

              {/* Pricing Preview */}
              {(form.pricePerKmDomestic || form.pricePerKmInternational) && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Voorbeeld berekening (100 km)</h3>
                  <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-1">
                    <p>Tarief: €{parseFloat(form.pricePerKmDomestic || 0).toFixed(2)}/km × 100 km × 2 (retour) = <strong>€{(parseFloat(form.pricePerKmDomestic || 0) * 100 * 2).toFixed(2)}</strong></p>
                    {parseFloat(form.expressSurchargePercent) > 0 && (
                      <p>Express toeslag ({form.expressSurchargePercent}%): +€{((parseFloat(form.pricePerKmDomestic || 0) * 100 * 2) * parseFloat(form.expressSurchargePercent) / 100).toFixed(2)}</p>
                    )}
                    {form.additionalCosts.filter(c => c.enabled !== false).length > 0 && (
                      <p>Extra kosten: +€{form.additionalCosts.filter(c => c.enabled !== false).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Annuleren
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editing ? 'Bijwerken' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
