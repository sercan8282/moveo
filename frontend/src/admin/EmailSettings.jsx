import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || '/api';

export default function EmailSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    email_smtp_host: '',
    email_smtp_port: '587',
    email_smtp_user: '',
    email_smtp_pass: '',
    email_smtp_secure: false,
    email_from_name: 'Moveo Transport',
    email_from_address: '',
    email_contact_recipient: '',
    email_quote_recipient: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [passSet, setPassSet] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const token = () => localStorage.getItem('moveo_token');

  async function fetchSettings() {
    try {
      const res = await fetch(`${API}/email-settings`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({
          ...prev,
          ...data,
          email_smtp_secure: data.email_smtp_secure === true || data.email_smtp_secure === 'true'
        }));
        setPassSet(!!data.email_smtp_pass_set);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/email-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success('E-mailinstellingen opgeslagen');
        fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Fout bij opslaan');
      }
    } catch (err) { toast.error('Fout bij opslaan'); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch(`${API}/email-settings/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Test e-mail verzonden!');
      } else {
        toast.error(data.error || 'Test mislukt');
      }
    } catch (err) { toast.error('Test mislukt'); }
    finally { setTesting(false); }
  }

  function update(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📧 E-mail Instellingen</h1>
        <p className="text-gray-500 mt-1">Configureer SMTP-server en e-mailadressen voor meldingen</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SMTP Server */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🔧 SMTP Server</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <input type="text" value={settings.email_smtp_host}
                onChange={e => update('email_smtp_host', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
              <input type="number" value={settings.email_smtp_port}
                onChange={e => update('email_smtp_port', e.target.value)}
                placeholder="587"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
              <input type="text" value={settings.email_smtp_user}
                onChange={e => update('email_smtp_user', e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord {passSet && <span className="text-green-600 text-xs">(ingesteld)</span>}
              </label>
              <input type="password" value={settings.email_smtp_pass}
                onChange={e => update('email_smtp_pass', e.target.value)}
                placeholder={passSet ? '••••••••' : 'SMTP wachtwoord'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.email_smtp_secure}
                onChange={e => update('email_smtp_secure', e.target.checked)}
                className="rounded" />
              <span className="text-sm text-gray-700">SSL/TLS gebruiken (poort 465)</span>
            </label>
          </div>
        </div>

        {/* From Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📤 Afzender</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Afzendernaam</label>
              <input type="text" value={settings.email_from_name}
                onChange={e => update('email_from_name', e.target.value)}
                placeholder="Moveo Transport"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Afzender e-mail</label>
              <input type="email" value={settings.email_from_address}
                onChange={e => update('email_from_address', e.target.value)}
                placeholder="noreply@moveo-bv.nl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📥 Ontvangers</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📩 Contactformulier berichten naar:
              </label>
              <input type="email" value={settings.email_contact_recipient}
                onChange={e => update('email_contact_recipient', e.target.value)}
                placeholder="info@moveo-bv.nl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <p className="text-xs text-gray-500 mt-1">Berichten van het contactformulier worden naar dit adres gestuurd</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🚛 Offerte aanvragen naar:
              </label>
              <input type="email" value={settings.email_quote_recipient}
                onChange={e => update('email_quote_recipient', e.target.value)}
                placeholder="offertes@moveo-bv.nl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <p className="text-xs text-gray-500 mt-1">Offerte aanvragen van de transportcalculator worden naar dit adres gestuurd</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Opslaan...
              </>
            ) : 'Instellingen opslaan'}
          </button>
          <button type="button" onClick={handleTest} disabled={testing || !settings.email_smtp_host}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {testing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Testen...
              </>
            ) : '📧 Test e-mail versturen'}
          </button>
        </div>

        {/* Help */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Hulp bij configuratie</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Gmail:</strong> Host: smtp.gmail.com, Port: 587, Gebruik <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="underline">App Password</a></p>
            <p><strong>Outlook:</strong> Host: smtp.office365.com, Port: 587</p>
            <p><strong>Custom SMTP:</strong> Gebruik de instellingen van uw hosting provider</p>
          </div>
        </div>
      </form>
    </div>
  );
}
