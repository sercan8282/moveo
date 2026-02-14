import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || '/api';

const STATUS_OPTIONS = [
  { value: 'nieuw', label: 'Nieuw', color: 'bg-blue-100 text-blue-800' },
  { value: 'bekeken', label: 'Bekeken', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'offerte_verstuurd', label: 'Offerte verstuurd', color: 'bg-purple-100 text-purple-800' },
  { value: 'geaccepteerd', label: 'Geaccepteerd', color: 'bg-green-100 text-green-800' },
  { value: 'afgewezen', label: 'Afgewezen', color: 'bg-red-100 text-red-800' },
  { value: 'afgerond', label: 'Afgerond', color: 'bg-gray-100 text-gray-800' },
];

export default function QuoteManager() {
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);

  useEffect(() => { fetchQuotes(); }, [pagination.page, filterStatus]);

  const token = () => localStorage.getItem('moveo_token');

  async function fetchQuotes() {
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: 20 });
      if (filterStatus) params.set('status', filterStatus);
      
      const res = await fetch(`${API}/calculator/quotes?${params}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.data);
        setPagination(p => ({ ...p, totalPages: data.pagination.totalPages, total: data.pagination.total }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`${API}/calculator/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status, read: true })
      });
      if (res.ok) {
        toast.success('Status bijgewerkt');
        fetchQuotes();
        if (selectedQuote?.id === id) {
          const updated = await res.json();
          setSelectedQuote(updated);
        }
      }
    } catch (err) { toast.error('Fout bij bijwerken'); }
  }

  async function deleteQuote(id) {
    if (!confirm('Weet u zeker dat u deze offerte aanvraag wilt verwijderen?')) return;
    try {
      const res = await fetch(`${API}/calculator/quotes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        toast.success('Offerte verwijderd');
        setSelectedQuote(null);
        fetchQuotes();
      }
    } catch (err) { toast.error('Fout bij verwijderen'); }
  }

  async function openQuote(quote) {
    setSelectedQuote(quote);
    if (!quote.read) {
      await fetch(`${API}/calculator/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ read: true })
      });
      fetchQuotes();
    }
  }

  function getStatusBadge(status) {
    const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${opt.color}`}>{opt.label}</span>;
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Offerte Aanvragen</h1>
          <p className="text-gray-500 mt-1">{pagination.total} aanvra{pagination.total === 1 ? 'ag' : 'gen'} totaal</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Alle statussen</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Quote List */}
        <div className={`${selectedQuote ? 'w-1/2' : 'w-full'} transition-all`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {quotes.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium">Geen offerte aanvragen</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {quotes.map(q => (
                  <div key={q.id}
                    onClick={() => openQuote(q)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!q.read ? 'bg-blue-50/50' : ''} ${selectedQuote?.id === q.id ? 'ring-2 ring-blue-400' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {!q.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        <span className="font-semibold text-gray-800">{q.customerName}</span>
                      </div>
                      {getStatusBadge(q.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>{q.vehicleType?.icon || '🚛'} {q.vehicleType?.name}</span>
                      <span className="mx-2">•</span>
                      <span>{q.distanceKm?.toFixed(0)} km</span>
                      <span className="mx-2">•</span>
                      <span className="font-semibold text-green-700">€{q.calculatedPrice?.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {q.startAddress?.substring(0, 30)}... → {q.endAddress?.substring(0, 30)}...
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(q.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t">
                <button disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50">Vorige</button>
                <span className="text-sm text-gray-600">Pagina {pagination.page} van {pagination.totalPages}</span>
                <button disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50">Volgende</button>
              </div>
            )}
          </div>
        </div>

        {/* Quote Detail */}
        {selectedQuote && (
          <div className="w-1/2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Offerte #{selectedQuote.id}</h2>
                <button onClick={() => setSelectedQuote(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_OPTIONS.map(s => (
                      <button key={s.value}
                        onClick={() => updateStatus(selectedQuote.id, s.value)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          selectedQuote.status === s.value ? s.color + ' border-current' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">👤 Klantgegevens</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Naam:</strong> {selectedQuote.customerName}</p>
                    <p><strong>E-mail:</strong> <a href={`mailto:${selectedQuote.customerEmail}`} className="text-blue-600">{selectedQuote.customerEmail}</a></p>
                    {selectedQuote.customerPhone && <p><strong>Telefoon:</strong> <a href={`tel:${selectedQuote.customerPhone}`} className="text-blue-600">{selectedQuote.customerPhone}</a></p>}
                  </div>
                </div>

                {/* Transport Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">🚛 Transportgegevens</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Van:</strong> {selectedQuote.startAddress}</p>
                    <p><strong>Naar:</strong> {selectedQuote.endAddress}</p>
                    <p><strong>Afstand:</strong> {selectedQuote.distanceKm?.toFixed(1)} km</p>
                    <p><strong>Voertuig:</strong> {selectedQuote.vehicleType?.icon} {selectedQuote.vehicleType?.name}</p>
                    <p><strong>Type:</strong> {selectedQuote.isDomestic ? '🇳🇱 Binnenlands' : '🌍 Internationaal'}</p>
                    <p><strong>Express:</strong> {selectedQuote.isExpress ? '⚡ Ja' : 'Nee'}</p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">💰 Prijsoverzicht</h3>
                  {selectedQuote.priceBreakdown && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Tarief per km:</span>
                        <span>€{selectedQuote.priceBreakdown.basePricePerKm?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Basis ({selectedQuote.priceBreakdown.distanceKm?.toFixed(0)} km × 2):</span>
                        <span>€{selectedQuote.priceBreakdown.basePrice?.toFixed(2)}</span>
                      </div>
                      {selectedQuote.priceBreakdown.expressSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span>Express toeslag ({selectedQuote.priceBreakdown.expressSurchargePercent}%):</span>
                          <span>€{selectedQuote.priceBreakdown.expressSurcharge?.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedQuote.priceBreakdown.additionalCosts > 0 && (
                        <div className="flex justify-between">
                          <span>Extra kosten:</span>
                          <span>€{selectedQuote.priceBreakdown.additionalCosts?.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-green-200 pt-1 mt-1 font-bold text-green-800">
                        <span>Totaalprijs:</span>
                        <span className="text-lg">€{selectedQuote.calculatedPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedQuote.notes && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-1">📝 Opmerkingen</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedQuote.notes}</p>
                  </div>
                )}

                {/* Meta */}
                <div className="text-xs text-gray-400">
                  <p>Aangemaakt: {formatDate(selectedQuote.createdAt)}</p>
                  {selectedQuote.updatedAt !== selectedQuote.createdAt && (
                    <p>Bijgewerkt: {formatDate(selectedQuote.updatedAt)}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <a href={`mailto:${selectedQuote.customerEmail}?subject=Re: Offerte aanvraag #${selectedQuote.id}`}
                    className="flex-1 px-3 py-2 text-sm text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ✉ E-mail klant
                  </a>
                  <button onClick={() => deleteQuote(selectedQuote.id)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
                    Verwijderen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
