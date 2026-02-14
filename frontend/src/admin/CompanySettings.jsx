import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function CompanySettings() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState({
    name: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Nederland',
    phone: '',
    email: '',
    kvk: '',
    btw: '',
    openingHours: [
      { day: 'Maandag - Vrijdag', hours: '07:00 - 18:00' },
      { day: 'Zaterdag', hours: '08:00 - 12:00' },
      { day: 'Zondag', hours: 'Gesloten' }
    ],
    mapAddress: ''
  });

  useEffect(() => { loadCompanyInfo(); }, []);

  const loadCompanyInfo = async () => {
    try {
      const res = await api.get('/settings');
      // Backend returns { key: value } object
      const data = res.data;
      if (data.company_info) {
        const ci = typeof data.company_info === 'string' ? JSON.parse(data.company_info) : data.company_info;
        setInfo(prev => ({ ...prev, ...ci }));
      }
    } catch (error) {
      toast.error('Fout bij ophalen bedrijfsgegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleHoursChange = (index, field, value) => {
    setInfo(prev => {
      const hours = [...prev.openingHours];
      hours[index] = { ...hours[index], [field]: value };
      return { ...prev, openingHours: hours };
    });
  };

  const addHoursRow = () => {
    setInfo(prev => ({
      ...prev,
      openingHours: [...prev.openingHours, { day: '', hours: '' }]
    }));
  };

  const removeHoursRow = (index) => {
    setInfo(prev => ({
      ...prev,
      openingHours: prev.openingHours.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/company_info', { value: info });
      toast.success('Bedrijfsgegevens opgeslagen!');
    } catch (error) {
      toast.error('Fout bij opslaan bedrijfsgegevens');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏢 Bedrijfsgegevens</h2>
          <p className="text-sm text-gray-500 mt-1">Deze gegevens worden getoond op de contactpagina</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Bedrijfsnaam */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Algemeen</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
              <input
                type="text"
                value={info.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Moveo Transport & Logistiek B.V."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={info.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="info@moveo-bv.nl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
              <input
                type="tel"
                value={info.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+31 (0)10 234 5678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Adres */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Adres</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Straat + Huisnummer</label>
              <input
                type="text"
                value={info.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Transportweg 15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <input
                  type="text"
                  value={info.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  placeholder="3045 NB"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plaats</label>
                <input
                  type="text"
                  value={info.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Rotterdam"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
              <input
                type="text"
                value={info.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Nederland"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps adres</label>
              <input
                type="text"
                value={info.mapAddress}
                onChange={(e) => handleChange('mapAddress', e.target.value)}
                placeholder="Transportweg 15, 3045 NB Rotterdam"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Dit adres wordt gebruikt voor de Google Maps kaart op de contactpagina</p>
            </div>
          </div>
        </div>

        {/* KvK / BTW */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">KvK / BTW</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KvK-nummer</label>
                <input
                  type="text"
                  value={info.kvk}
                  onChange={(e) => handleChange('kvk', e.target.value)}
                  placeholder="12345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BTW-nummer</label>
                <input
                  type="text"
                  value={info.btw}
                  onChange={(e) => handleChange('btw', e.target.value)}
                  placeholder="NL001234567B01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Openingstijden */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Openingstijden</h3>
            <button
              onClick={addHoursRow}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Rij toevoegen
            </button>
          </div>
          <div className="space-y-3">
            {info.openingHours.map((oh, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={oh.day}
                  onChange={(e) => handleHoursChange(index, 'day', e.target.value)}
                  placeholder="Maandag - Vrijdag"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <input
                  type="text"
                  value={oh.hours}
                  onChange={(e) => handleHoursChange(index, 'hours', e.target.value)}
                  placeholder="07:00 - 18:00"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={() => removeHoursRow(index)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Verwijderen"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">👁 Preview</h3>
          <div className="p-5 rounded-xl bg-gray-50 space-y-4">
            {info.name && <h4 className="text-lg font-bold text-gray-800">{info.name}</h4>}
            {info.address && (
              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <p className="text-sm text-gray-600">
                  {info.address}<br />
                  {info.postalCode} {info.city}<br />
                  {info.country}
                </p>
              </div>
            )}
            {info.phone && (
              <div className="flex items-start gap-3">
                <span className="text-xl">📞</span>
                <p className="text-sm text-blue-600">{info.phone}</p>
              </div>
            )}
            {info.email && (
              <div className="flex items-start gap-3">
                <span className="text-xl">📧</span>
                <p className="text-sm text-blue-600">{info.email}</p>
              </div>
            )}
            {info.kvk && (
              <div className="flex items-start gap-3">
                <span className="text-xl">🏛️</span>
                <p className="text-sm text-gray-600">
                  KvK: {info.kvk}<br />
                  BTW: {info.btw}
                </p>
              </div>
            )}
            {info.openingHours.length > 0 && (
              <div className="mt-3 p-4 bg-white rounded-lg">
                <p className="font-medium text-sm text-gray-700 mb-2">🕐 Openingstijden</p>
                {info.openingHours.map((oh, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{oh.day}</span>
                    <span>{oh.hours}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
