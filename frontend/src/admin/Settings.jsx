import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import MediaLibrary from '../components/MediaLibrary';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaFor, setShowMediaFor] = useState(null); // 'logo' | 'favicon' | null
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      // The endpoint returns { key: value } object
      const map = typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : {};
      if (Array.isArray(res.data)) {
        res.data.forEach(s => { map[s.key] = s.value; });
      }
      setSettings(map);

      // Load logo/favicon previews
      if (map.site_logo) setLogoPreview(map.site_logo);
      if (map.site_favicon) setFaviconPreview(map.site_favicon);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each setting individually to avoid bulk endpoint issues
      const promises = Object.entries(settings).map(([key, value]) =>
        api.put(`/settings/${key}`, { value })
      );
      await Promise.all(promises);
      toast.success(t('savedSuccess'));
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleMediaSelect = (media) => {
    const path = media.path || `/uploads/${media.filename}`;
    if (showMediaFor === 'logo') {
      handleChange('site_logo', path);
      setLogoPreview(path);
    } else if (showMediaFor === 'favicon') {
      handleChange('site_favicon', path);
      setFaviconPreview(path);
    }
    setShowMediaFor(null);
  };

  const removeLogo = () => {
    handleChange('site_logo', '');
    setLogoPreview(null);
  };

  const removeFavicon = () => {
    handleChange('site_favicon', '');
    setFaviconPreview(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('settings')}</h2>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? t('loading') : t('save')}
        </button>
      </div>

      <div className="space-y-5">
        {/* General */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('generalSettings')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('siteName')}</label>
              <input type="text" value={settings.site_name || ''} onChange={(e) => handleChange('site_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('siteDescription')}</label>
              <textarea value={settings.site_description || ''} onChange={(e) => handleChange('site_description', e.target.value)}
                rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('siteUrl')}</label>
              <input type="url" value={settings.site_url || ''} onChange={(e) => handleChange('site_url', e.target.value)}
                placeholder="https://moveo-bv.nl" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {/* Logo & Favicon */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Logo & Favicon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <p className="text-xs text-gray-500 mb-3">Wordt getoond in de header. Aanbevolen: transparante PNG, max 200x60px.</p>
              {logoPreview ? (
                <div className="relative inline-block">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 inline-block">
                    <img src={logoPreview} alt="Logo" className="max-h-16 max-w-[200px] object-contain" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => setShowMediaFor('logo')}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Wijzigen
                    </button>
                    <button type="button" onClick={removeLogo}
                      className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      Verwijderen
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowMediaFor('logo')}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex flex-col items-center gap-2">
                  <span className="text-2xl">🖼️</span>
                  <span className="text-sm">Logo uploaden</span>
                </button>
              )}
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
              <p className="text-xs text-gray-500 mb-3">Icoon in het browsertabblad. Aanbevolen: vierkant, 32x32 of 64x64px.</p>
              {faviconPreview ? (
                <div className="relative inline-block">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 inline-flex items-center gap-3">
                    <img src={faviconPreview} alt="Favicon" className="w-8 h-8 object-contain" />
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 rounded text-xs text-gray-600">
                      <img src={faviconPreview} alt="" className="w-4 h-4 object-contain" />
                      <span>Tabblad voorbeeld</span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => setShowMediaFor('favicon')}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Wijzigen
                    </button>
                    <button type="button" onClick={removeFavicon}
                      className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      Verwijderen
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowMediaFor('favicon')}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex flex-col items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-sm">Favicon uploaden</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('contactInfo')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactEmail')}</label>
              <input type="email" value={settings.contact_email || ''} onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactPhone')}</label>
              <input type="tel" value={settings.contact_phone || ''} onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactAddress')}</label>
              <textarea value={settings.contact_address || ''} onChange={(e) => handleChange('contact_address', e.target.value)}
                rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-y" />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('socialMedia')}</h3>
          <div className="space-y-4">
            {[
              { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
              { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
              { key: 'social_twitter', label: 'X / Twitter', placeholder: 'https://x.com/...' },
              { key: 'social_linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
              { key: 'social_youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' }
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="url" value={settings[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('defaultMetaTitle')}</label>
              <input type="text" value={settings.meta_title || ''} onChange={(e) => handleChange('meta_title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('defaultMetaDescription')}</label>
              <textarea value={settings.meta_description || ''} onChange={(e) => handleChange('meta_description', e.target.value)}
                rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
              <input type="text" value={settings.google_analytics || ''} onChange={(e) => handleChange('google_analytics', e.target.value)}
                placeholder="G-XXXXXXXXXX" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {/* Modules / Extensies */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🔌 Modules</h3>
          <p className="text-sm text-gray-500 mb-4">Schakel modules in of uit om ze zichtbaar te maken op de website.</p>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚛</span>
                <div>
                  <span className="text-sm font-medium text-gray-800">Transport Calculator</span>
                  <p className="text-xs text-gray-500">Offerte aanvraag pagina op /calculator</p>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer"
                  checked={settings.calculator_enabled !== 'false'}
                  onChange={(e) => handleChange('calculator_enabled', e.target.checked ? 'true' : 'false')} />
                <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-600 rounded-full transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Google Maps API */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🗺️ Google Maps API</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps API Key</label>
              <input type="text" value={settings.google_maps_api_key || ''} onChange={(e) => handleChange('google_maps_api_key', e.target.value)}
                placeholder="AIzaSy..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
              <p className="mt-1 text-xs text-gray-500">
                Nodig voor de transport calculator (adres autocomplete, route berekening, tolkosten).
                Maak een key aan via <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a> met
                deze API's ingeschakeld: <strong>Places API</strong>, <strong>Routes API</strong>, <strong>Maps JavaScript API</strong>, <strong>Geocoding API</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Advanced */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('advanced')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('customCss')}</label>
              <textarea value={settings.custom_css || ''} onChange={(e) => handleChange('custom_css', e.target.value)}
                rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-y"
                placeholder="/* Custom CSS */" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('customHeaderCode')}</label>
              <textarea value={settings.custom_header_code || ''} onChange={(e) => handleChange('custom_header_code', e.target.value)}
                rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-y"
                placeholder="<!-- Header code -->" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('customFooterCode')}</label>
              <textarea value={settings.custom_footer_code || ''} onChange={(e) => handleChange('custom_footer_code', e.target.value)}
                rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-y"
                placeholder="<!-- Footer code -->" />
            </div>
          </div>
        </div>
      </div>

      <MediaLibrary isOpen={!!showMediaFor} onClose={() => setShowMediaFor(null)} onSelect={handleMediaSelect} />
    </div>
  );
}
