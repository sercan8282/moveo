import { useState } from 'react';
import api from '../api/client';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState(null); // 'sending', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await api.post('/contact', formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.response?.data?.error || 'Er is iets misgegaan. Probeer het opnieuw.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">Bericht verzonden!</h3>
        <p className="text-green-700 mb-6">Bedankt voor uw bericht. Wij nemen zo snel mogelijk contact met u op, meestal binnen 24 uur op werkdagen.</p>
        <button
          onClick={() => setStatus(null)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Nieuw bericht versturen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text, #0f172a)' }}>
            Naam <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Uw volledige naam"
            className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors"
            style={{ 
              borderColor: 'var(--color-border, #e2e8f0)',
              backgroundColor: 'var(--color-surface, #fff)'
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text, #0f172a)' }}>
            E-mail <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="uw@email.nl"
            className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors"
            style={{ 
              borderColor: 'var(--color-border, #e2e8f0)',
              backgroundColor: 'var(--color-surface, #fff)'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text, #0f172a)' }}>
            Telefoonnummer
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+31 (0)6 12345678"
            className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors"
            style={{ 
              borderColor: 'var(--color-border, #e2e8f0)',
              backgroundColor: 'var(--color-surface, #fff)'
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text, #0f172a)' }}>
            Onderwerp
          </label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors"
            style={{ 
              borderColor: 'var(--color-border, #e2e8f0)',
              backgroundColor: 'var(--color-surface, #fff)'
            }}
          >
            <option value="">Selecteer een onderwerp</option>
            <option value="offerte">Offerte aanvragen</option>
            <option value="transport">Vraag over transport</option>
            <option value="warehousing">Vraag over warehousing</option>
            <option value="klacht">Klacht of melding</option>
            <option value="samenwerking">Samenwerking</option>
            <option value="overig">Overig</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text, #0f172a)' }}>
          Bericht <span className="text-red-500">*</span>
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows="6"
          placeholder="Beschrijf uw vraag of opmerking..."
          className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors resize-y"
          style={{ 
            borderColor: 'var(--color-border, #e2e8f0)',
            backgroundColor: 'var(--color-surface, #fff)'
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--color-text-light, #94a3b8)' }}>
          <span className="text-red-500">*</span> Verplichte velden
        </p>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="px-8 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary, #2563eb)' }}
        >
          {status === 'sending' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Versturen...
            </span>
          ) : 'Bericht versturen'}
        </button>
      </div>
    </form>
  );
}
