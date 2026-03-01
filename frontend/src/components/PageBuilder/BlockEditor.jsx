import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import RichTextEditor from '../RichTextEditor';
import MediaLibrary from '../MediaLibrary';
import EffectsPanel from './EffectsPanel';

/* ============================================================================
   Icon Library - SVG icons for counter/stats blocks
   ============================================================================ */
const ICON_LIBRARY = [
  { name: 'truck', label: 'Vrachtwagen', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>' },
  { name: 'package', label: 'Pakket', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>' },
  { name: 'users', label: 'Medewerkers', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>' },
  { name: 'chart', label: 'Grafiek', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>' },
  { name: 'globe', label: 'Wereld', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>' },
  { name: 'clock', label: 'Klok', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>' },
  { name: 'location', label: 'Locatie', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>' },
  { name: 'star', label: 'Ster', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>' },
  { name: 'check', label: 'Vinkje', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>' },
  { name: 'shield', label: 'Schild', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>' },
  { name: 'award', label: 'Award', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" /></svg>' },
  { name: 'heart', label: 'Hart', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>' },
  { name: 'phone', label: 'Telefoon', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>' },
  { name: 'mail', label: 'E-mail', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>' },
  { name: 'building', label: 'Gebouw', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>' },
  { name: 'calendar', label: 'Kalender', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>' },
  { name: 'bolt', label: 'Bliksem', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>' },
  { name: 'cog', label: 'Tandwiel', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>' },
  { name: 'currency', label: 'Euro', svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 7.756a4.5 4.5 0 1 0 0 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>' },
];

/* ============================================================================
   IconPicker - Grid of selectable icons
   ============================================================================ */
function IconPicker({ value, onChange, label }) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedIcon = ICON_LIBRARY.find(i => i.svg === value);
  
  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full px-3 py-2 border rounded-lg text-left flex items-center gap-2 hover:bg-gray-50"
      >
        {value ? (
          <>
            <span className="w-6 h-6 text-gray-700" dangerouslySetInnerHTML={{ __html: value }} />
            <span className="text-xs text-gray-600">{selectedIcon?.label || 'Aangepast icoon'}</span>
          </>
        ) : (
          <span className="text-xs text-gray-400">Kies een icoon...</span>
        )}
      </button>
      {showPicker && (
        <div className="absolute z-50 mt-1 p-3 bg-white rounded-lg shadow-xl border w-72">
          <div className="grid grid-cols-6 gap-2 mb-2">
            {ICON_LIBRARY.map((icon) => (
              <button
                key={icon.name}
                type="button"
                onClick={() => { onChange(icon.svg); setShowPicker(false); }}
                title={icon.label}
                className={`w-10 h-10 p-2 rounded border transition-all hover:bg-blue-50 hover:border-blue-300 ${
                  value === icon.svg ? 'bg-blue-100 border-blue-500' : 'border-gray-200'
                }`}
              >
                <span className="w-full h-full block text-gray-700" dangerouslySetInnerHTML={{ __html: icon.svg }} />
              </button>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <button
              type="button"
              onClick={() => { onChange(''); setShowPicker(false); }}
              className="text-xs text-red-500 hover:underline"
            >
              Icoon verwijderen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   ColorPicker - Full color picker with palette and native picker
   ============================================================================ */
const PRESET_COLORS = [
  // Grayscale
  '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af',
  '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#000000',
  // Red
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444',
  '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
  // Orange
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316',
  '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
  // Yellow
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308',
  '#ca8a04', '#a16207', '#854d0e', '#713f12',
  // Green
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e',
  '#16a34a', '#15803d', '#166534', '#14532d',
  // Cyan
  '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4',
  '#0891b2', '#0e7490', '#155e75', '#164e63',
  // Blue
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6',
  '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
  // Purple
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7',
  '#9333ea', '#7c3aed', '#6d28d9', '#5b21b6',
  // Pink
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899',
  '#db2777', '#be185d', '#9d174d', '#831843',
  // Transparent
  'transparent', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)',
  'rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)',
];

function ColorPicker({ value, onChange, label }) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('palette');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) && 
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);
  
  // Calculate position when opening
  const handleToggle = () => {
    if (!showPicker && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const pickerHeight = 350;
      // Place above if not enough space below
      const top = rect.bottom + pickerHeight > viewportHeight 
        ? rect.top - pickerHeight - 4 
        : rect.bottom + 4;
      setPosition({ top, left: rect.left });
    }
    setShowPicker(!showPicker);
  };
  
  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          className="flex-shrink-0 w-9 h-9 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm hover:border-blue-400 hover:shadow transition-all"
          style={{ 
            backgroundColor: value || '#ffffff',
            backgroundImage: !value || value === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            minWidth: '36px',
            minHeight: '36px'
          }}
          onClick={handleToggle}
          title="Klik om kleur te kiezen"
        />
        <input 
          type="text" 
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1.5 border rounded text-xs font-mono"
          placeholder="#ffffff"
        />
      </div>
      
      {showPicker && createPortal(
        <div 
          ref={pickerRef}
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border w-72 overflow-hidden"
          style={{ top: position.top, left: position.left }}
        >
          {/* Tabs */}
          <div className="flex border-b">
            <button type="button" onClick={() => setActiveTab('palette')}
              className={`flex-1 py-2 text-xs font-medium ${activeTab === 'palette' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'}`}>
              Palet
            </button>
            <button type="button" onClick={() => setActiveTab('picker')}
              className={`flex-1 py-2 text-xs font-medium ${activeTab === 'picker' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'}`}>
              Kleurkiezer
            </button>
          </div>
          
          <div className="p-3">
            {activeTab === 'palette' ? (
              <div className="grid grid-cols-10 gap-1">
                {PRESET_COLORS.map((color, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`w-6 h-6 rounded border hover:scale-110 transition-transform ${
                      value === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-200'
                    }`}
                    style={{ 
                      backgroundColor: color,
                      backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px'
                    }}
                    onClick={() => { onChange(color); setShowPicker(false); }}
                    title={color}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <input 
                  type="color" 
                  value={value?.startsWith('#') && value.length === 7 ? value : '#3b82f6'} 
                  onChange={e => onChange(e.target.value)}
                  className="w-full h-32 rounded-lg cursor-pointer border-0"
                />
                <div className="flex gap-2">
                  <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
                    className="flex-1 px-2 py-1.5 border rounded text-xs font-mono" placeholder="#3b82f6" />
                  <button type="button" onClick={() => setShowPicker(false)}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600">OK</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Current color preview */}
          <div className="px-3 pb-3 flex items-center gap-2 border-t pt-2">
            <div className="w-8 h-8 rounded border" style={{ backgroundColor: value || 'transparent' }} />
            <span className="text-xs font-mono text-gray-500 flex-1">{value || 'Geen kleur'}</span>
            <button type="button" onClick={() => { onChange('transparent'); }}
              className="text-xs text-red-500 hover:underline">Wissen</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ============================================================================
   ButtonStylePicker - Predefined button styles with hover effects
   ============================================================================ */
const BUTTON_PRESETS = [
  // === Shadow Buttons ===
  { id: 'shadow-lift', name: 'Schaduw Lift', category: 'Schaduw',
    baseStyle: 'bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300',
    hoverStyle: 'hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30',
    css: '' },
  { id: 'shadow-grow', name: 'Schaduw Groei', category: 'Schaduw',
    baseStyle: 'bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md',
    hoverStyle: 'hover:shadow-2xl hover:shadow-purple-500/40',
    css: '' },
  { id: 'shadow-soft', name: 'Zachte Schaduw', category: 'Schaduw',
    baseStyle: 'bg-white text-gray-800 px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-300',
    hoverStyle: 'hover:shadow-2xl hover:-translate-y-0.5',
    css: '' },
  { id: 'shadow-neon', name: 'Neon Glow', category: 'Schaduw',
    baseStyle: 'bg-cyan-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300',
    hoverStyle: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.7)]',
    css: '' },
  
  // === Background Fill Buttons ===
  { id: 'fill-left', name: 'Vul Links → Rechts', category: 'Achtergrond',
    baseStyle: 'relative overflow-hidden bg-transparent border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-lg font-medium transition-all duration-500',
    hoverStyle: 'hover:text-white',
    css: `
      .btn-fill-left::before { content: ''; position: absolute; top: 0; left: 0; width: 0; height: 100%; background: #3b82f6; transition: width 0.4s ease; z-index: -1; }
      .btn-fill-left:hover::before { width: 100%; }
    `, cssClass: 'btn-fill-left' },
  { id: 'fill-right', name: 'Vul Rechts → Links', category: 'Achtergrond',
    baseStyle: 'relative overflow-hidden bg-transparent border-2 border-emerald-500 text-emerald-500 px-6 py-3 rounded-lg font-medium transition-all duration-500',
    hoverStyle: 'hover:text-white',
    css: `
      .btn-fill-right::before { content: ''; position: absolute; top: 0; right: 0; width: 0; height: 100%; background: #10b981; transition: width 0.4s ease; z-index: -1; }
      .btn-fill-right:hover::before { width: 100%; }
    `, cssClass: 'btn-fill-right' },
  { id: 'fill-up', name: 'Vul Omhoog', category: 'Achtergrond',
    baseStyle: 'relative overflow-hidden bg-transparent border-2 border-orange-500 text-orange-500 px-6 py-3 rounded-lg font-medium transition-all duration-500',
    hoverStyle: 'hover:text-white',
    css: `
      .btn-fill-up::before { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 0; background: #f97316; transition: height 0.4s ease; z-index: -1; }
      .btn-fill-up:hover::before { height: 100%; }
    `, cssClass: 'btn-fill-up' },
  { id: 'fill-down', name: 'Vul Omlaag', category: 'Achtergrond',
    baseStyle: 'relative overflow-hidden bg-transparent border-2 border-pink-500 text-pink-500 px-6 py-3 rounded-lg font-medium transition-all duration-500',
    hoverStyle: 'hover:text-white',
    css: `
      .btn-fill-down::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 0; background: #ec4899; transition: height 0.4s ease; z-index: -1; }
      .btn-fill-down:hover::before { height: 100%; }
    `, cssClass: 'btn-fill-down' },
  { id: 'fill-center', name: 'Vul Midden', category: 'Achtergrond',
    baseStyle: 'relative overflow-hidden bg-transparent border-2 border-violet-500 text-violet-500 px-6 py-3 rounded-lg font-medium transition-all duration-500',
    hoverStyle: 'hover:text-white',
    css: `
      .btn-fill-center::before { content: ''; position: absolute; top: 50%; left: 50%; width: 0; height: 0; background: #8b5cf6; border-radius: 50%; transform: translate(-50%, -50%); transition: width 0.5s ease, height 0.5s ease; z-index: -1; }
      .btn-fill-center:hover::before { width: 300%; height: 300%; }
    `, cssClass: 'btn-fill-center' },
  { id: 'fill-diagonal', name: 'Vul Diagonaal', category: 'Achtergrond',
    baseStyle: 'relative overflow-hidden bg-transparent border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-lg font-medium transition-all duration-500',
    hoverStyle: 'hover:text-white',
    css: `
      .btn-fill-diagonal::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(120deg, transparent, #f43f5e, transparent); transition: left 0.5s ease; z-index: -1; }
      .btn-fill-diagonal:hover::before { left: 100%; }
    `, cssClass: 'btn-fill-diagonal' },
  
  // === Gradient Buttons ===
  { id: 'gradient-shift', name: 'Gradient Shift', category: 'Gradient',
    baseStyle: 'px-6 py-3 rounded-lg font-medium text-white transition-all duration-500 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_auto]',
    hoverStyle: 'hover:bg-right',
    css: '' },
  { id: 'gradient-sunset', name: 'Sunset Gradient', category: 'Gradient',
    baseStyle: 'px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 transition-all duration-300',
    hoverStyle: 'hover:shadow-lg hover:shadow-red-500/30 hover:scale-105',
    css: '' },
  { id: 'gradient-ocean', name: 'Ocean Gradient', category: 'Gradient',
    baseStyle: 'px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300',
    hoverStyle: 'hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105',
    css: '' },
  
  // === Border Buttons ===
  { id: 'border-draw', name: 'Border Teken', category: 'Rand',
    baseStyle: 'relative bg-transparent text-blue-500 px-6 py-3 font-medium transition-all duration-300',
    hoverStyle: 'hover:text-blue-600',
    css: `
      .btn-border-draw { border: 2px solid transparent; background: linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #3b82f6, #3b82f6) border-box; }
      .btn-border-draw::before, .btn-border-draw::after { content: ''; position: absolute; width: 0; height: 2px; background: #3b82f6; transition: width 0.3s ease; }
      .btn-border-draw::before { top: 0; left: 0; }
      .btn-border-draw::after { bottom: 0; right: 0; }
      .btn-border-draw:hover::before, .btn-border-draw:hover::after { width: 100%; }
    `, cssClass: 'btn-border-draw' },
  { id: 'border-pulse', name: 'Border Pulse', category: 'Rand',
    baseStyle: 'bg-transparent border-2 border-indigo-500 text-indigo-500 px-6 py-3 rounded-lg font-medium transition-all duration-300',
    hoverStyle: 'hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_0_4px_rgba(99,102,241,0.3)]',
    css: '' },
  { id: 'border-slide', name: 'Border Slide', category: 'Rand',
    baseStyle: 'relative bg-transparent border-2 border-teal-500 text-teal-500 px-6 py-3 rounded-lg font-medium overflow-hidden transition-colors duration-300',
    hoverStyle: 'hover:text-white',
    css: `
      .btn-border-slide::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: #14b8a6; transition: left 0.3s ease; z-index: -1; }
      .btn-border-slide:hover::before { left: 0; }
    `, cssClass: 'btn-border-slide' },
  
  // === Underline Buttons ===
  { id: 'underline-grow', name: 'Onderstreep Groei', category: 'Onderstrepen',
    baseStyle: 'relative bg-transparent text-gray-800 px-4 py-2 font-medium transition-all duration-300',
    hoverStyle: 'hover:text-blue-600',
    css: `
      .btn-underline-grow::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background: #3b82f6; transition: width 0.3s ease, left 0.3s ease; }
      .btn-underline-grow:hover::after { width: 100%; left: 0; }
    `, cssClass: 'btn-underline-grow' },
  { id: 'underline-slide', name: 'Onderstreep Slide', category: 'Onderstrepen',
    baseStyle: 'relative bg-transparent text-gray-800 px-4 py-2 font-medium transition-all duration-300',
    hoverStyle: 'hover:text-emerald-600',
    css: `
      .btn-underline-slide::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: #10b981; transition: width 0.3s ease; }
      .btn-underline-slide:hover::after { width: 100%; }
    `, cssClass: 'btn-underline-slide' },
  
  // === 3D Buttons ===
  { id: '3d-push', name: '3D Druk', category: '3D',
    baseStyle: 'bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-150 shadow-[0_6px_0_#1d4ed8] translate-y-0',
    hoverStyle: 'hover:shadow-[0_4px_0_#1d4ed8] hover:translate-y-[2px] active:shadow-[0_0_0_#1d4ed8] active:translate-y-[6px]',
    css: '' },
  { id: '3d-pop', name: '3D Pop', category: '3D',
    baseStyle: 'bg-gradient-to-b from-green-400 to-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-[0_8px_0_#15803d,0_12px_10px_rgba(0,0,0,0.2)]',
    hoverStyle: 'hover:shadow-[0_4px_0_#15803d,0_8px_10px_rgba(0,0,0,0.2)] hover:translate-y-1',
    css: '' },
  
  // === Minimal Buttons ===
  { id: 'minimal-arrow', name: 'Minimaal + Pijl', category: 'Minimaal',
    baseStyle: 'bg-transparent text-gray-700 px-4 py-2 font-medium transition-all duration-300 flex items-center gap-2',
    hoverStyle: 'hover:text-blue-600 hover:gap-3',
    css: '', hasArrow: true },
  { id: 'minimal-ghost', name: 'Ghost', category: 'Minimaal',
    baseStyle: 'bg-transparent border border-gray-300 text-gray-600 px-6 py-3 rounded-lg font-medium transition-all duration-300',
    hoverStyle: 'hover:border-gray-800 hover:text-gray-800 hover:bg-gray-50',
    css: '' },
  
  // === Special Effects ===
  { id: 'shine', name: 'Shimmering', category: 'Speciaal',
    baseStyle: 'relative overflow-hidden bg-blue-600 text-white px-6 py-3 rounded-lg font-medium',
    hoverStyle: '',
    css: `
      .btn-shine::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: shine 2s infinite; }
      @keyframes shine { to { left: 100%; } }
    `, cssClass: 'btn-shine' },
  { id: 'ripple', name: 'Ripple Effect', category: 'Speciaal',
    baseStyle: 'relative overflow-hidden bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300',
    hoverStyle: 'hover:bg-indigo-700',
    css: '', hasRipple: true },
];

function ButtonStylePicker({ value, onChange, label }) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Alle');
  const categories = ['Alle', ...new Set(BUTTON_PRESETS.map(b => b.category))];
  const filteredPresets = activeCategory === 'Alle' 
    ? BUTTON_PRESETS 
    : BUTTON_PRESETS.filter(b => b.category === activeCategory);
  
  const selectedPreset = BUTTON_PRESETS.find(b => b.id === value);
  
  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <button type="button" onClick={() => setShowPicker(!showPicker)}
        className="w-full px-3 py-2 border rounded-lg text-left hover:bg-gray-50 flex items-center justify-between">
        <span className="text-sm">{selectedPreset?.name || 'Kies een stijl...'}</span>
        <span className="text-gray-400">▼</span>
      </button>
      
      {showPicker && (
        <div className="absolute z-[100] mt-1 bg-white rounded-xl shadow-2xl border w-96 max-h-[500px] overflow-hidden">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
            {categories.map(cat => (
              <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  activeCategory === cat ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}>{cat}</button>
            ))}
          </div>
          
          {/* Button previews */}
          <div className="p-3 max-h-96 overflow-y-auto space-y-2">
            {filteredPresets.map(preset => (
              <button key={preset.id} type="button"
                onClick={() => { onChange(preset.id); setShowPicker(false); }}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  value === preset.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">{preset.name}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{preset.category}</span>
                </div>
                {/* Preview button */}
                <div className="flex justify-center py-2 bg-gray-50 rounded">
                  <span className={`${preset.baseStyle} ${preset.hoverStyle} ${preset.cssClass || ''}`}>
                    Voorbeeld {preset.hasArrow && '→'}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-2 border-t bg-gray-50">
            <button type="button" onClick={() => { onChange(''); setShowPicker(false); }}
              className="text-xs text-gray-500 hover:text-red-500">Stijl resetten</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export for use in other components
export { BUTTON_PRESETS };

/* ============================================================================
   PositionPicker - 9-position grid selector
   ============================================================================ */
const POSITIONS = [
  { value: 'top-left', label: '↖', title: 'Linksboven' },
  { value: 'top-center', label: '↑', title: 'Boven midden' },
  { value: 'top-right', label: '↗', title: 'Rechtsboven' },
  { value: 'center-left', label: '←', title: 'Links midden' },
  { value: 'center-center', label: '●', title: 'Midden' },
  { value: 'center-right', label: '→', title: 'Rechts midden' },
  { value: 'bottom-left', label: '↙', title: 'Linksonder' },
  { value: 'bottom-center', label: '↓', title: 'Onder midden' },
  { value: 'bottom-right', label: '↘', title: 'Rechtsonder' },
];

function PositionPicker({ value, onChange, label }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <div className="inline-grid grid-cols-3 gap-0.5 p-1 bg-gray-100 rounded-lg">
        {POSITIONS.map((pos) => (
          <button
            key={pos.value}
            type="button"
            onClick={() => onChange(pos.value)}
            title={pos.title}
            className={`w-8 h-8 rounded text-sm font-bold transition-all ${
              value === pos.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            {pos.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        {POSITIONS.find(p => p.value === value)?.title || 'Midden'}
      </p>
    </div>
  );
}

/* ============================================================================
   Helper: Default data for hero column blocks
   ============================================================================ */
function getHeroBlockDefaults(type) {
  const defaults = {
    text: { html: '<p></p>' },
    styledText: {
      text: 'Tekst',
      textStyle: 'simple',
      fontSize: 48,
      fontWeight: 'bold',
      textColor: '#ffffff',
      gradientFrom: '#00c2ff',
      gradientTo: '#00fdcf',
      glowColor: '#00c2ff',
      textAlign: 'center',
      wrapMode: 'wrap',
      marginBottom: 0,
    },
    image: { src: '', alt: '', caption: '', objectFit: 'cover', maxWidth: '100%' },
    button: { 
      text: 'Klik hier', 
      url: '#', 
      backgroundColor: '#ffffff', 
      textColor: '#000000',
      borderRadius: 'lg',
      size: 'medium',
      align: 'center',
    },
    icon: {
      icon: '⭐',
      size: 48,
      color: '#ffffff',
      align: 'center',
    },
    spacer: { height: 40 },
    divider: {
      width: '100%',
      thickness: 1,
      color: 'rgba(255,255,255,0.3)',
      style: 'solid',
      marginY: 16,
    },
    counter: { 
      number: 0, 
      suffix: '', 
      label: '',
      numberColor: '#ffffff',
      labelColor: '#94a3b8',
      numberSize: 48,
      labelSize: 14,
    },
    countdown: {
      targetDate: '',
      targetTime: '00:00',
      style: 'minimal',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      numberColor: '#ffffff',
      labelColor: '#94a3b8',
    },
    video: {
      url: '',
      type: 'youtube',
      autoplay: false,
      maxWidth: '100%',
    },
    social: {
      icons: [],
      iconSize: 24,
      iconColor: '#ffffff',
      gap: 12,
      align: 'center',
    },
    list: {
      items: [],
      listStyle: 'check',
      textColor: '#ffffff',
      iconColor: '#10b981',
      gap: 8,
    },
    badge: {
      text: 'Badge',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: 'full',
      size: 'medium',
    },
  };
  return defaults[type] || {};
}

export default function BlockEditor({ block, onChange }) {
  const [showMedia, setShowMedia] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null); // 'image', 'hero-bg', 'carousel', 'card-N', 'avatar', 'video'
  const [mediaFilterType, setMediaFilterType] = useState(null);

  const openMedia = (target, filterType = null) => {
    setMediaTarget(target);
    setMediaFilterType(filterType);
    setShowMedia(true);
  };

  const handleMediaSelect = (media) => {
    // Handle both full media objects (path) and variant objects (url)
    const url = media.url || media.path;
    if (mediaTarget === 'image') {
      onChange({ src: url, alt: media.altText || media.originalName || '' });
    } else if (mediaTarget === 'imageCard-image') {
      onChange({ image: url, imageAlt: media.altText || media.originalName || '' });
    } else if (mediaTarget === 'hero-bg') {
      onChange({ backgroundImage: url });
    } else if (mediaTarget === 'heroBanner-bg') {
      onChange({ backgroundImage: url });
    } else if (mediaTarget === 'hero-video') {
      onChange({ backgroundVideo: url });
    } else if (mediaTarget === 'heroBanner-video') {
      onChange({ backgroundVideo: url });
    } else if (mediaTarget === 'carousel') {
      onChange({ images: [...(block.data.images || []), { src: url, alt: media.altText || '' }] });
    } else if (mediaTarget === 'avatar') {
      onChange({ avatar: url });
    } else if (mediaTarget?.startsWith('card-')) {
      const idx = parseInt(mediaTarget.split('-')[1]);
      const items = [...(block.data.items || [])];
      if (items[idx]) { items[idx] = { ...items[idx], image: url }; }
      onChange({ items });
    } else if (mediaTarget?.startsWith('flipcard-front-')) {
      const idx = parseInt(mediaTarget.split('-')[2]);
      const items = [...(block.data.items || [])];
      if (items[idx]) { items[idx] = { ...items[idx], frontImage: url }; }
      onChange({ items });
    } else if (mediaTarget?.startsWith('flipcard-back-')) {
      const idx = parseInt(mediaTarget.split('-')[2]);
      const items = [...(block.data.items || [])];
      if (items[idx]) { items[idx] = { ...items[idx], backImage: url }; }
      onChange({ items });
    } else if (mediaTarget?.startsWith('heroBanner-flipFront-')) {
      const idx = parseInt(mediaTarget.split('-')[2]);
      const cards = [...(block.data.cards || [])];
      if (cards[idx]) { cards[idx] = { ...cards[idx], frontImage: url }; }
      onChange({ cards });
    } else if (mediaTarget?.startsWith('heroBanner-flipBack-')) {
      const idx = parseInt(mediaTarget.split('-')[2]);
      const cards = [...(block.data.cards || [])];
      if (cards[idx]) { cards[idx] = { ...cards[idx], backImage: url }; }
      onChange({ cards });
    } else if (mediaTarget === 'video') {
      onChange({ url: url, type: 'direct', source: 'media' });
    } else if (mediaTarget?.startsWith('iconbox-')) {
      const idx = parseInt(mediaTarget.split('-')[1]);
      const items = [...(block.data.items || [])];
      if (items[idx]) { items[idx] = { ...items[idx], icon: url }; }
      onChange({ items });
    } else if (mediaTarget?.startsWith('hero-col-')) {
      // Hero column image: hero-col-{colIdx}-block-{blockIdx}
      const parts = mediaTarget.split('-');
      const colIdx = parseInt(parts[2]);
      const blockIdx = parseInt(parts[4]);
      const newColumns = [...(block.data.heroColumns || [])];
      if (newColumns[colIdx]?.blocks?.[blockIdx]) {
        const newBlocks = [...newColumns[colIdx].blocks];
        newBlocks[blockIdx] = { ...newBlocks[blockIdx], data: { ...newBlocks[blockIdx].data, src: url } };
        newColumns[colIdx] = { ...newColumns[colIdx], blocks: newBlocks };
        onChange({ heroColumns: newColumns });
      }
    } else if (mediaTarget?.startsWith('split-image-')) {
      // Split images background: split-image-{idx}
      const idx = parseInt(mediaTarget.split('-')[2]);
      const currentImages = [...(block.data.splitImages || [])];
      // Ensure array is large enough
      while (currentImages.length <= idx) currentImages.push('');
      currentImages[idx] = url;
      onChange({ splitImages: currentImages });
    }
    setShowMedia(false);
    setMediaTarget(null);
    setMediaFilterType(null);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const sectionClass = "space-y-3";

  const renderEditor = () => {
    switch (block.type) {
      case 'text':
        return (
          <div className={sectionClass}>
            <label className={labelClass}>Inhoud</label>
            <RichTextEditor
              content={block.data.html || ''}
              onChange={(html) => onChange({ html })}
            />
          </div>
        );

      case 'styledText':
        const STYLED_TEXT_OPTIONS = [
          { id: 'simple', name: '📝 Simpel', desc: 'Gewone tekst' },
          { id: 'gradient', name: '🌈 Gradiënt', desc: 'Kleurverloop door tekst' },
          { id: 'aurora', name: '🌌 Aurora', desc: 'Bewegend aurora effect' },
          { id: 'glow', name: '💡 Glow', desc: 'Oplichtend neon effect' },
          { id: 'outline', name: '🔲 Outline', desc: 'Alleen omlijning' },
          { id: 'shadow3d', name: '🏔️ 3D Schaduw', desc: 'Diepte met schaduwen' },
          { id: 'sliced', name: '🔪 Gesneden', desc: 'Doorgesneden effect' },
          { id: 'dual', name: '🎭 Dual Color', desc: 'Twee kleuren' },
          { id: 'fancy', name: '🎨 Fancy Gradient', desc: 'Patroon achtergrond' },
          { id: 'lightness', name: '☀️ Lightness', desc: 'Licht en schaduw' },
          { id: 'glitch', name: '📺 Glitch', desc: 'Digitale storing' },
          { id: 'neon', name: '🌃 Neon Sign', desc: 'Neon bord effect' },
        ];
        return (
          <div className={sectionClass}>
            {/* Tekst input */}
            <div>
              <label className={labelClass}>Tekst</label>
              <textarea
                value={block.data.text || ''}
                onChange={e => onChange({ text: e.target.value })}
                rows={2}
                className={inputClass}
                placeholder="Typ je gestileerde tekst..."
              />
            </div>

            {/* Style selector - visual grid */}
            <div>
              <label className={labelClass}>✨ Tekststijl</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {STYLED_TEXT_OPTIONS.map(style => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onChange({ textStyle: style.id })}
                    className={`p-2 rounded-lg text-left transition-all ${
                      block.data.textStyle === style.id
                        ? 'bg-purple-100 border-2 border-purple-500 text-purple-700'
                        : 'bg-gray-50 border border-gray-200 hover:border-purple-300 text-gray-600'
                    }`}
                  >
                    <span className="text-sm font-medium block">{style.name}</span>
                    <span className="text-[10px] opacity-70">{style.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font settings */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>Grootte (px)</label>
                <input
                  type="number"
                  value={block.data.fontSize || 64}
                  onChange={e => onChange({ fontSize: parseInt(e.target.value) })}
                  min={12}
                  max={300}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gewicht</label>
                <select value={block.data.fontWeight || 'bold'} onChange={e => onChange({ fontWeight: e.target.value })} className={inputClass}>
                  <option value="normal">Normaal</option>
                  <option value="medium">Medium</option>
                  <option value="semibold">Semi-bold</option>
                  <option value="bold">Bold</option>
                  <option value="extrabold">Extra bold</option>
                  <option value="black">Black (900)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Uitlijning</label>
                <select value={block.data.textAlign || 'center'} onChange={e => onChange({ textAlign: e.target.value })} className={inputClass}>
                  <option value="left">Links</option>
                  <option value="center">Midden</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
            </div>

            {/* Colors based on style */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <h4 className="text-xs font-semibold text-gray-700">🎨 Kleuren</h4>
              
              <ColorPicker label="Tekstkleur" value={block.data.textColor || '#ffffff'} onChange={c => onChange({ textColor: c })} />
              
              {(block.data.textStyle === 'gradient' || block.data.textStyle === 'aurora' || block.data.textStyle === 'dual' || block.data.textStyle === 'fancy') && (
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker label="Gradiënt van" value={block.data.gradientFrom || '#00c2ff'} onChange={c => onChange({ gradientFrom: c })} />
                  <ColorPicker label="Gradiënt naar" value={block.data.gradientTo || '#00fdcf'} onChange={c => onChange({ gradientTo: c })} />
                </div>
              )}
              
              {(block.data.textStyle === 'glow' || block.data.textStyle === 'neon') && (
                <ColorPicker label="Glow kleur" value={block.data.glowColor || '#00c2ff'} onChange={c => onChange({ glowColor: c })} />
              )}
              
              {block.data.textStyle === 'outline' && (
                <ColorPicker label="Outline kleur" value={block.data.outlineColor || '#ffffff'} onChange={c => onChange({ outlineColor: c })} />
              )}
            </div>

            {/* Background */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <h4 className="text-xs font-semibold text-gray-700">🖼️ Achtergrond</h4>
              <ColorPicker label="Achtergrondkleur" value={block.data.backgroundColor || ''} onChange={c => onChange({ backgroundColor: c })} />
              <div>
                <label className={labelClass}>Achtergrond gradiënt (CSS)</label>
                <input
                  type="text"
                  value={block.data.backgroundGradient || ''}
                  onChange={e => onChange({ backgroundGradient: e.target.value })}
                  placeholder="linear-gradient(135deg, #1a1a2e, #16213e)"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Spacing */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>Padding (px)</label>
                <input type="number" value={block.data.padding ?? 24} onChange={e => onChange({ padding: parseInt(e.target.value) })} className={inputClass} min={0} />
              </div>
              <div>
                <label className={labelClass}>Marge boven</label>
                <input type="number" value={block.data.marginTop ?? 0} onChange={e => onChange({ marginTop: parseInt(e.target.value) })} className={inputClass} min={0} />
              </div>
              <div>
                <label className={labelClass}>Marge onder</label>
                <input type="number" value={block.data.marginBottom ?? 0} onChange={e => onChange({ marginBottom: parseInt(e.target.value) })} className={inputClass} min={0} />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg border-2 border-dashed border-gray-200" style={{ 
              background: block.data.backgroundGradient || block.data.backgroundColor || '#1a1a2e',
              padding: `${block.data.padding || 24}px`
            }}>
              <p className="text-xs text-gray-400 mb-2 text-center">Preview</p>
              <div 
                className={`styled-text-preview styled-text-${block.data.textStyle || 'gradient'}`}
                style={{
                  fontSize: `${Math.min(block.data.fontSize || 64, 48)}px`,
                  fontWeight: block.data.fontWeight || 'bold',
                  textAlign: block.data.textAlign || 'center',
                  color: block.data.textColor || '#ffffff',
                  '--gradient-from': block.data.gradientFrom || '#00c2ff',
                  '--gradient-to': block.data.gradientTo || '#00fdcf',
                  '--glow-color': block.data.glowColor || '#00c2ff',
                  '--outline-color': block.data.outlineColor || '#ffffff',
                }}
              >
                {block.data.text || 'Preview tekst'}
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className={sectionClass}>
            <label className={labelClass}>Afbeelding</label>
            {block.data.src ? (
              <div className="relative">
                <img src={block.data.src} alt="" className="w-full rounded-lg" />
                <button type="button" onClick={() => onChange({ src: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => openMedia('image')}
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                Selecteer afbeelding
              </button>
            )}
            <div>
              <label className={labelClass}>Alt tekst</label>
              <input type="text" value={block.data.alt || ''} onChange={e => onChange({ alt: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bijschrift</label>
              <input type="text" value={block.data.caption || ''} onChange={e => onChange({ caption: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Object Fit</label>
              <select value={block.data.objectFit || 'cover'} onChange={e => onChange({ objectFit: e.target.value })} className={inputClass}>
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </div>
            
            {/* Container styling */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Container stijl</label>
            </div>
            <div>
              <label className={labelClass}>Achtergrondkleur</label>
              <div className="flex gap-2">
                <input type="color" value={block.data.backgroundColor || '#ffffff'} 
                  onChange={e => onChange({ backgroundColor: e.target.value })}
                  className="w-10 h-8 rounded cursor-pointer" />
                <input type="text" value={block.data.backgroundColor || ''} 
                  onChange={e => onChange({ backgroundColor: e.target.value })}
                  placeholder="#ffffff" className={`${inputClass} flex-1`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Hover achtergrondkleur</label>
              <div className="flex gap-2">
                <input type="color" value={block.data.hoverBackgroundColor || '#f3f4f6'} 
                  onChange={e => onChange({ hoverBackgroundColor: e.target.value })}
                  className="w-10 h-8 rounded cursor-pointer" />
                <input type="text" value={block.data.hoverBackgroundColor || ''} 
                  onChange={e => onChange({ hoverBackgroundColor: e.target.value })}
                  placeholder="#f3f4f6" className={`${inputClass} flex-1`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Padding (px)</label>
                <input type="number" value={block.data.padding ?? 0} 
                  onChange={e => onChange({ padding: parseInt(e.target.value) || 0 })}
                  className={inputClass} min={0} max={100} />
              </div>
              <div>
                <label className={labelClass}>Border radius (px)</label>
                <input type="number" value={block.data.borderRadius ?? 8} 
                  onChange={e => onChange({ borderRadius: parseInt(e.target.value) || 0 })}
                  className={inputClass} min={0} max={50} />
              </div>
            </div>
          </div>
        );

      case 'imageCard':
        return (
          <div className={sectionClass}>
            {/* 1. Afbeelding */}
            <label className={labelClass}>Hoofdafbeelding</label>
            {block.data.image ? (
              <div className="relative">
                <img src={block.data.image} alt="" className="w-full rounded-lg" />
                <button type="button" onClick={() => onChange({ image: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => openMedia('imageCard-image')}
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                Selecteer afbeelding
              </button>
            )}
            
            {/* 2. Kaart positie - visuele picker */}
            <div className="border-t pt-3 mt-3">
              <label className={labelClass}>Positie van de kaart</label>
              <p className="text-[10px] text-gray-400 mb-2">Kies waar de kaart moet uitsteken</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'top-left', label: '↖ Links boven' },
                  { value: 'top-center', label: '↑ Midden boven' },
                  { value: 'top-right', label: '↗ Rechts boven' },
                  { value: 'bottom-left', label: '↙ Links onder' },
                  { value: 'bottom-center', label: '↓ Midden onder' },
                  { value: 'bottom-right', label: '↘ Rechts onder' },
                ].map(pos => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => onChange({ cardPosition: pos.value })}
                    className={`p-2 rounded-lg border-2 text-xs transition-all ${
                      block.data.cardPosition === pos.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Mini preview */}
                    <div className="relative w-full h-12 bg-gray-100 rounded mb-1">
                      <div className={`absolute w-6 h-4 bg-white border-2 border-blue-400 rounded-sm ${
                        pos.value === 'top-left' ? '-top-1 -left-1' :
                        pos.value === 'top-center' ? '-top-1 left-1/2 -translate-x-1/2' :
                        pos.value === 'top-right' ? '-top-1 -right-1' :
                        pos.value === 'bottom-left' ? '-bottom-1 -left-1' :
                        pos.value === 'bottom-center' ? '-bottom-1 left-1/2 -translate-x-1/2' :
                        '-bottom-1 -right-1'
                      }`}>
                        <div className={`absolute w-full h-0.5 ${
                          pos.value.includes('left') ? 'left-0 bg-blue-500' :
                          pos.value.includes('right') ? 'right-0 bg-blue-500' :
                          'left-0 right-0 bg-blue-500'
                        } ${pos.value.includes('top') ? 'top-0' : 'bottom-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px]">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 3. Kaart inhoud */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Kaart inhoud</label>
            </div>
            
            <IconPicker 
              label="Icoon" 
              value={block.data.icon || ''} 
              onChange={v => onChange({ icon: v })} 
            />
            
            <div>
              <label className={labelClass}>Icoon positie</label>
              <select value={block.data.iconPosition || 'left'} onChange={e => onChange({ iconPosition: e.target.value })} className={inputClass}>
                <option value="left">Links van tekst</option>
                <option value="right">Rechts van tekst</option>
                <option value="top">Boven tekst</option>
                <option value="bottom">Onder tekst</option>
              </select>
            </div>
            
            <div>
              <label className={labelClass}>Titel</label>
              <input type="text" value={block.data.title || ''} onChange={e => onChange({ title: e.target.value })} 
                placeholder="bijv. 12+ Jaar" className={inputClass} />
            </div>
            
            <div>
              <label className={labelClass}>Ondertitel</label>
              <input type="text" value={block.data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} 
                placeholder="bijv. Werkervaring" className={inputClass} />
            </div>
            
            {/* 4. Kleuren */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Kleuren</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ColorPicker label="Icoon kleur" value={block.data.iconColor || '#3b82f6'} onChange={v => onChange({ iconColor: v })} />
              <ColorPicker label="Titel kleur" value={block.data.titleColor || '#111827'} onChange={v => onChange({ titleColor: v })} />
              <ColorPicker label="Ondertitel kleur" value={block.data.subtitleColor || '#6b7280'} onChange={v => onChange({ subtitleColor: v })} />
              <ColorPicker label="Kaart achtergrond" value={block.data.cardBgColor || '#ffffff'} onChange={v => onChange({ cardBgColor: v })} />
            </div>
            
            {/* 5. Rand */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Rand accent</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Rand zijde</label>
                <select value={block.data.borderSide || 'right'} onChange={e => onChange({ borderSide: e.target.value })} className={inputClass}>
                  <option value="none">Geen rand</option>
                  <option value="left">Links</option>
                  <option value="right">Rechts</option>
                  <option value="top">Boven</option>
                  <option value="bottom">Onder</option>
                  <option value="all">Alle zijden</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Rand dikte (px)</label>
                <input type="number" value={block.data.borderWidth || 4} min={1} max={10}
                  onChange={e => onChange({ borderWidth: parseInt(e.target.value) })} className={inputClass} />
              </div>
            </div>
            <ColorPicker label="Rand kleur" value={block.data.borderColor || '#3b82f6'} onChange={v => onChange({ borderColor: v })} />
            
            {/* 6. Extra opties */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Extra opties</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Kaart schaduw</label>
                <select value={block.data.cardShadow || 'lg'} onChange={e => onChange({ cardShadow: e.target.value })} className={inputClass}>
                  <option value="none">Geen</option>
                  <option value="sm">Klein</option>
                  <option value="md">Medium</option>
                  <option value="lg">Groot</option>
                  <option value="xl">Extra groot</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Afbeelding hoogte</label>
                <select value={block.data.imageHeight || 'auto'} onChange={e => onChange({ imageHeight: e.target.value })} className={inputClass}>
                  <option value="auto">Automatisch</option>
                  <option value="200px">200px</option>
                  <option value="300px">300px</option>
                  <option value="400px">400px</option>
                  <option value="500px">500px</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'carousel':
        return (
          <div className={sectionClass}>
            <label className={labelClass}>Afbeeldingen ({block.data.images?.length || 0})</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(block.data.images || []).map((img, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <img src={img.src} alt="" className="w-12 h-12 object-cover rounded" />
                  <input type="text" value={img.alt || ''} placeholder="Alt tekst"
                    onChange={e => {
                      const images = [...block.data.images];
                      images[i] = { ...images[i], alt: e.target.value };
                      onChange({ images });
                    }}
                    className="flex-1 px-2 py-1 border rounded text-xs" />
                  <button type="button" onClick={() => {
                    onChange({ images: block.data.images.filter((_, j) => j !== i) });
                  }} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => openMedia('carousel')}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 text-sm">
              + Afbeelding toevoegen
            </button>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={block.data.autoplay !== false}
                  onChange={e => onChange({ autoplay: e.target.checked })} />
                Autoplay
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={block.data.showDots !== false}
                  onChange={e => onChange({ showDots: e.target.checked })} />
                Stippen
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={block.data.showArrows !== false}
                  onChange={e => onChange({ showArrows: e.target.checked })} />
                Pijlen
              </label>
              <div>
                <label className={labelClass}>Interval (ms)</label>
                <input type="number" value={block.data.interval || 5000}
                  onChange={e => onChange({ interval: parseInt(e.target.value) })}
                  className={inputClass} />
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className={sectionClass}>
            {/* Source selector tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => onChange({ source: 'url', url: '', type: 'youtube' })}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  block.data.source !== 'media' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔗 URL (YouTube/Vimeo)
              </button>
              <button
                type="button"
                onClick={() => onChange({ source: 'media', type: 'direct' })}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  block.data.source === 'media' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🎬 Eigen video
              </button>
            </div>

            {block.data.source === 'media' ? (
              /* Media library video picker */
              <div>
                {block.data.url ? (
                  <div className="relative">
                    <video src={block.data.url} controls className="w-full rounded-lg" />
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => openMedia('video', 'video')}
                        className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Andere video kiezen
                      </button>
                      <button type="button" onClick={() => onChange({ url: '' })}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                        Verwijderen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => openMedia('video', 'video')}
                    className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm">
                    🎬 Video selecteren uit mediabibliotheek
                  </button>
                )}
              </div>
            ) : (
              /* URL-based video */
              <>
                <div>
                  <label className={labelClass}>Video URL</label>
                  <input type="url" value={block.data.url || ''} onChange={e => onChange({ url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... of https://vimeo.com/..."
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={block.data.type || 'youtube'} onChange={e => onChange({ type: e.target.value })} className={inputClass}>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="direct">Direct (mp4)</option>
                  </select>
                </div>
              </>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={block.data.autoplay || false}
                onChange={e => onChange({ autoplay: e.target.checked })} />
              Autoplay
            </label>
          </div>
        );

      case 'contactForm':
        return (
          <div className={sectionClass}>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              📋 Het contactformulier wordt automatisch weergegeven met alle standaard velden (naam, e-mail, telefoon, onderwerp, bericht).
            </p>
          </div>
        );

      case 'googleMap':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Adres</label>
              <input type="text" value={block.data.address || ''} onChange={e => onChange({ address: e.target.value })}
                placeholder="Transportweg 15, 3045 NB Rotterdam" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hoogte</label>
              <input type="text" value={block.data.height || '400px'} onChange={e => onChange({ height: e.target.value })}
                className={inputClass} />
            </div>
          </div>
        );

      case 'button':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Tekst</label>
              <input type="text" value={block.data.text || ''} onChange={e => onChange({ text: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>URL</label>
              <input type="url" value={block.data.url || ''} onChange={e => onChange({ url: e.target.value })} className={inputClass} />
            </div>
            
            {/* Button Style Preset Picker */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Knopstijl</label>
              <ButtonStylePicker 
                label="Kies een voorgedefinieerde stijl"
                value={block.data.stylePreset || ''} 
                onChange={v => onChange({ stylePreset: v })} 
              />
            </div>
            
            {/* Custom styling (shown when no preset selected) */}
            {!block.data.stylePreset && (
              <>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelClass}>Basis stijl</label>
                    <select value={block.data.style || 'primary'} onChange={e => onChange({ style: e.target.value })} className={inputClass}>
                      <option value="primary">Primair</option>
                      <option value="secondary">Secundair</option>
                      <option value="outline">Outline</option>
                      <option value="ghost">Ghost</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Grootte</label>
                    <select value={block.data.size || 'medium'} onChange={e => onChange({ size: e.target.value })} className={inputClass}>
                      <option value="small">Klein</option>
                      <option value="medium">Medium</option>
                      <option value="large">Groot</option>
                    </select>
                  </div>
                </div>
                
                {/* Custom colors */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <ColorPicker label="Achtergrond kleur" value={block.data.bgColor || ''} onChange={v => onChange({ bgColor: v })} />
                  <ColorPicker label="Tekst kleur" value={block.data.textColor || ''} onChange={v => onChange({ textColor: v })} />
                  <ColorPicker label="Rand kleur" value={block.data.borderColor || ''} onChange={v => onChange({ borderColor: v })} />
                  <ColorPicker label="Hover achtergrond" value={block.data.hoverBgColor || ''} onChange={v => onChange({ hoverBgColor: v })} />
                </div>
              </>
            )}
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Target</label>
                <select value={block.data.target || '_self'} onChange={e => onChange({ target: e.target.value })} className={inputClass}>
                  <option value="_self">Zelfde tabblad</option>
                  <option value="_blank">Nieuw tabblad</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Uitlijning</label>
                <select value={block.data.alignment || 'left'} onChange={e => onChange({ alignment: e.target.value })} className={inputClass}>
                  <option value="left">Links</option>
                  <option value="center">Midden</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" checked={block.data.fullWidth || false}
                onChange={e => onChange({ fullWidth: e.target.checked })} />
              Volledige breedte
            </label>
          </div>
        );

      case 'spacer':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Hoogte (px)</label>
              <input type="number" value={block.data.height || 40} onChange={e => onChange({ height: parseInt(e.target.value) })}
                min={0} max={500} className={inputClass} />
            </div>
            <input type="range" value={block.data.height || 40} onChange={e => onChange({ height: parseInt(e.target.value) })}
              min={0} max={500} className="w-full" />
          </div>
        );

      case 'divider':
        return (
          <div className={sectionClass}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Ruimte boven (px)</label>
                <input type="number" value={block.data.spacingTop ?? 16} 
                  onChange={e => onChange({ spacingTop: parseInt(e.target.value) || 0 })}
                  className={inputClass} min={0} max={200} />
              </div>
              <div>
                <label className={labelClass}>Ruimte onder (px)</label>
                <input type="number" value={block.data.spacingBottom ?? 16} 
                  onChange={e => onChange({ spacingBottom: parseInt(e.target.value) || 0 })}
                  className={inputClass} min={0} max={200} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Stijl</label>
              <select value={block.data.style || 'solid'} onChange={e => onChange({ style: e.target.value })} className={inputClass}>
                <option value="solid">Doorgetrokken</option>
                <option value="dashed">Gestreept</option>
                <option value="dotted">Gestippeld</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Dikte (px)</label>
              <input type="number" value={block.data.thickness ?? 1} 
                onChange={e => onChange({ thickness: parseInt(e.target.value) || 1 })}
                className={inputClass} min={1} max={20} />
            </div>
            <div>
              <label className={labelClass}>Kleur</label>
              <input type="color" value={block.data.color || '#e2e8f0'} onChange={e => onChange({ color: e.target.value })}
                className="w-full h-8 rounded cursor-pointer" />
            </div>
          </div>
        );

      case 'html':
        return (
          <div className={sectionClass}>
            <label className={labelClass}>HTML Code</label>
            <textarea value={block.data.code || ''} onChange={e => onChange({ code: e.target.value })}
              rows={10} className={`${inputClass} font-mono text-xs`}
              placeholder="<div>Jouw HTML code...</div>" />
          </div>
        );

      case 'heroBanner':
        const heroBannerCards = block.data.cards || [];
        const heroBannerCardCount = block.data.cardCount || 3;
        
        // Ensure we have enough card objects
        const ensureCards = (count) => {
          const existing = [...heroBannerCards];
          while (existing.length < count) {
            existing.push({
              icon: '',
              counter: '',
              suffix: '',
              title: '',
              subtitle: '',
              effect: '',
              bgColor: '#ffffff',
              iconColor: '#3b82f6',
              counterColor: '#111827',
              titleColor: '#111827',
              subtitleColor: '#6b7280',
              borderColor: '',
              styledTexts: [],
            });
          }
          return existing;
        };
        
        const updateCard = (index, field, value) => {
          const updatedCards = ensureCards(heroBannerCardCount);
          updatedCards[index] = { ...updatedCards[index], [field]: value };
          onChange({ cards: updatedCards });
        };
        
        // Background effect options for heroBanner
        const HEROBANNER_BG_EFFECTS = [
          { id: 'none', name: 'Geen effect', icon: '✕' },
          { id: 'waves', name: 'Golven', icon: '🌊' },
          { id: 'wavyRotate', name: 'Draaiende Golf', icon: '🔄' },
          { id: 'circles', name: 'Pulserende Cirkels', icon: '⭕' },
          { id: 'triangles', name: 'Vliegende Driehoeken', icon: '🔺' },
          { id: 'particles', name: 'Deeltjes', icon: '✨' },
          { id: 'gradient', name: 'Bewegende Gradiënt', icon: '🌈' },
          { id: 'aurora', name: 'Aurora Borealis', icon: '🌌' },
          { id: 'mesh', name: 'Mesh Gradiënt', icon: '🎨' },
        ];
        
        // Height presets for heroBanner
        const HEROBANNER_HEIGHT_PRESETS = [
          { id: 'small', value: '300px', label: 'Klein (300px)' },
          { id: 'medium', value: '450px', label: 'Medium (450px)' },
          { id: 'large', value: '600px', label: 'Groot (600px)' },
          { id: 'xlarge', value: '80vh', label: 'Extra groot (80vh)' },
          { id: 'fullscreen', value: '100vh', label: 'Volledig scherm (100vh)' },
          { id: 'custom', value: 'custom', label: 'Aangepast...' },
        ];
        
        const heroBannerHeightPreset = HEROBANNER_HEIGHT_PRESETS.find(p => p.value === block.data.height)?.id || 'custom';
        
        return (
          <div className={sectionClass}>
            {/* ═══════════════════════════════════════════════════════════════
                HEROBANNER LAYOUT & SIZING
               ═══════════════════════════════════════════════════════════════ */}
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg space-y-3 border border-indigo-200">
              <h4 className="text-xs font-semibold text-indigo-800 flex items-center gap-2">📐 Layout & Grootte</h4>
              
              {/* Height preset */}
              <div>
                <label className={labelClass}>Hoogte</label>
                <select 
                  value={heroBannerHeightPreset} 
                  onChange={e => {
                    const preset = HEROBANNER_HEIGHT_PRESETS.find(p => p.id === e.target.value);
                    if (preset && preset.value !== 'custom') {
                      onChange({ height: preset.value, heightPreset: e.target.value });
                    } else {
                      onChange({ heightPreset: 'custom' });
                    }
                  }} 
                  className={inputClass}
                >
                  {HEROBANNER_HEIGHT_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Custom height input */}
              {heroBannerHeightPreset === 'custom' && (
                <div>
                  <label className={labelClass}>Aangepaste hoogte</label>
                  <input 
                    type="text" 
                    value={block.data.height || '500px'} 
                    onChange={e => onChange({ height: e.target.value })} 
                    className={inputClass}
                    placeholder="bijv. 500px of 70vh"
                  />
                </div>
              )}
              
              {/* Full bleed / transparent navbar */}
              <div className="pt-2 border-t border-indigo-200">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={block.data.fullBleed || false}
                    onChange={e => onChange({ fullBleed: e.target.checked })} 
                    className="rounded"
                  />
                  <span className="text-xs">
                    🖼️ <strong>Full-bleed modus</strong>
                    <span className="text-gray-500 block text-[10px]">Banner achter transparante navbar</span>
                  </span>
                </label>
              </div>
              
              {/* Rounded corners */}
              <div>
                <label className={labelClass}>Hoeken</label>
                <select 
                  value={block.data.borderRadius || 'xl'} 
                  onChange={e => onChange({ borderRadius: e.target.value })} 
                  className={inputClass}
                >
                  <option value="none">Geen afronding</option>
                  <option value="sm">Klein</option>
                  <option value="md">Medium</option>
                  <option value="lg">Groot</option>
                  <option value="xl">Extra groot</option>
                  <option value="2xl">Maximaal</option>
                </select>
              </div>
            </div>

            {/* Background type selector */}
            <div>
              <label className={labelClass}>Achtergrond type</label>
              <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'image' })}
                  className={`flex-1 min-w-[60px] px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'image' || (!block.data.backgroundType && !block.data.backgroundEffect) ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🖼️ Afbeelding
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'splitImages' })}
                  className={`flex-1 min-w-[60px] px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'splitImages' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📸 Split
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'video' })}
                  className={`flex-1 min-w-[60px] px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'video' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🎬 Video
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'effect' })}
                  className={`flex-1 min-w-[60px] px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'effect' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✨ Effect
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'color' })}
                  className={`flex-1 min-w-[60px] px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'color' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🎨 Kleur
                </button>
              </div>
            </div>

            {/* SPLIT IMAGES BACKGROUND */}
            {block.data.backgroundType === 'splitImages' && (
              <div className="space-y-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <h4 className="text-xs font-semibold text-orange-800">📸 Split Foto&apos;s Achtergrond</h4>
                <p className="text-[10px] text-orange-600">Kies 1-4 afbeeldingen voor een creatieve split layout</p>
                
                {/* Number of images selector */}
                <div>
                  <label className={labelClass}>Aantal afbeeldingen</label>
                  <select 
                    value={block.data.splitImageCount || 2} 
                    onChange={e => {
                      const count = parseInt(e.target.value);
                      const currentImages = block.data.splitImages || [];
                      // Pad or trim the array
                      let newImages = [...currentImages];
                      while (newImages.length < count) newImages.push('');
                      newImages = newImages.slice(0, count);
                      onChange({ splitImageCount: count, splitImages: newImages });
                    }} 
                    className={inputClass}
                  >
                    <option value={1}>1 afbeelding (volledig)</option>
                    <option value={2}>2 afbeeldingen (diagonale split)</option>
                    <option value={3}>3 afbeeldingen (puzzle grid)</option>
                    <option value={4}>4 afbeeldingen (creative panels)</option>
                  </select>
                </div>
                
                {/* Animation option */}
                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    checked={block.data.splitImagesAnimated || false}
                    onChange={e => onChange({ splitImagesAnimated: e.target.checked })} 
                    className="rounded"
                  />
                  Animatie bij hover (panel expand)
                </label>
                
                {/* Image selectors */}
                <div className="space-y-2">
                  {Array.from({ length: block.data.splitImageCount || 2 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">#{idx + 1}</span>
                      {(block.data.splitImages || [])[idx] ? (
                        <div className="flex-1 relative">
                          <img 
                            src={(block.data.splitImages || [])[idx]} 
                            alt="" 
                            className="w-full h-16 object-cover rounded" 
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const newImages = [...(block.data.splitImages || [])];
                              newImages[idx] = '';
                              onChange({ splitImages: newImages });
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >✕</button>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => openMedia(`split-image-${idx}`)}
                          className="flex-1 py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-400 hover:border-orange-400 text-xs"
                        >
                          Selecteer afbeelding {idx + 1}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EFFECT BACKGROUND */}
            {block.data.backgroundType === 'effect' && (
              <div className="space-y-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                <h4 className="text-xs font-semibold text-cyan-800">✨ Achtergrond Effect</h4>
                
                {/* Effect selector */}
                <div>
                  <label className={labelClass}>Effect type</label>
                  <select 
                    value={block.data.backgroundEffect || 'waves'} 
                    onChange={e => onChange({ backgroundEffect: e.target.value })} 
                    className={inputClass}
                  >
                    {HEROBANNER_BG_EFFECTS.map(e => (
                      <option key={e.id} value={e.id}>{e.icon} {e.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Effect colors */}
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker 
                    label="Primaire kleur" 
                    value={block.data.effectColor1 || '#1e3a5f'} 
                    onChange={v => onChange({ effectColor1: v })} 
                  />
                  <ColorPicker 
                    label="Secundaire kleur" 
                    value={block.data.effectColor2 || '#3b82f6'} 
                    onChange={v => onChange({ effectColor2: v })} 
                  />
                </div>
                
                {(block.data.backgroundEffect === 'gradient' || block.data.backgroundEffect === 'aurora' || block.data.backgroundEffect === 'waves') && (
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Derde kleur" 
                      value={block.data.effectColor3 || '#8b5cf6'} 
                      onChange={v => onChange({ effectColor3: v })} 
                    />
                    <ColorPicker 
                      label="Vierde kleur" 
                      value={block.data.effectColor4 || '#ec4899'} 
                      onChange={v => onChange({ effectColor4: v })} 
                    />
                  </div>
                )}
                
                {/* Wave specific settings */}
                {(block.data.backgroundEffect === 'waves' || block.data.backgroundEffect === 'wavyRotate') && (
                  <ColorPicker 
                    label="Golf kleur" 
                    value={block.data.waveColor || 'rgba(255,255,255,0.25)'} 
                    onChange={v => onChange({ waveColor: v })} 
                  />
                )}
                
                {/* Circles specific settings */}
                {block.data.backgroundEffect === 'circles' && (
                  <ColorPicker 
                    label="Cirkel kleur" 
                    value={block.data.circleColor || 'rgba(255,255,255,0.3)'} 
                    onChange={v => onChange({ circleColor: v })} 
                  />
                )}
                
                {/* Animation speed */}
                <div>
                  <label className={labelClass}>Animatie snelheid</label>
                  <select 
                    value={block.data.effectSpeed || 'normal'} 
                    onChange={e => onChange({ effectSpeed: e.target.value })} 
                    className={inputClass}
                  >
                    <option value="slow">Langzaam</option>
                    <option value="normal">Normaal</option>
                    <option value="fast">Snel</option>
                  </select>
                </div>
                
                {/* Effect opacity */}
                <div>
                  <label className={labelClass}>Effect dekking: {block.data.effectOpacity ?? 100}%</label>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={block.data.effectOpacity ?? 100}
                    onChange={e => onChange({ effectOpacity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Transparant</span>
                    <span>Volledig</span>
                  </div>
                </div>
                
                {/* Background image UNDER effect */}
                <div className="border-t border-cyan-200 pt-3 mt-3">
                  <label className={labelClass}>Achtergrondafbeelding (onder effect)</label>
                  {block.data.backgroundImage ? (
                    <div className="relative">
                      <img src={block.data.backgroundImage} alt="" className="w-full h-32 object-cover rounded-lg" />
                      <button type="button" onClick={() => onChange({ backgroundImage: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => openMedia('heroBanner-bg')}
                      className="w-full py-4 border-2 border-dashed border-cyan-300 rounded-lg text-cyan-500 hover:border-cyan-400 text-sm">
                      📷 Optioneel: Afbeelding onder effect
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* COLOR BACKGROUND */}
            {block.data.backgroundType === 'color' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker 
                    label="Achtergrondkleur" 
                    value={block.data.backgroundColor || '#1e3a5f'} 
                    onChange={v => onChange({ backgroundColor: v })} 
                  />
                  <div>
                    <label className={labelClass}>Gradiënt</label>
                    <select 
                      value={block.data.colorGradient || 'none'} 
                      onChange={e => onChange({ colorGradient: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="none">Geen</option>
                      <option value="to-r">Naar rechts</option>
                      <option value="to-l">Naar links</option>
                      <option value="to-b">Naar beneden</option>
                      <option value="to-t">Naar boven</option>
                      <option value="to-br">Diagonaal ↘</option>
                      <option value="to-bl">Diagonaal ↙</option>
                    </select>
                  </div>
                </div>
                {block.data.colorGradient && block.data.colorGradient !== 'none' && (
                  <ColorPicker 
                    label="Gradiënt eind kleur" 
                    value={block.data.backgroundColor2 || '#3b82f6'} 
                    onChange={v => onChange({ backgroundColor2: v })} 
                  />
                )}
              </div>
            )}

            {/* VIDEO BACKGROUND */}
            {block.data.backgroundType === 'video' && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Achtergrondvideo</label>
                  {block.data.backgroundVideo ? (
                    <div className="relative">
                      <video src={block.data.backgroundVideo} className="w-full h-32 object-cover rounded-lg" muted />
                      <button type="button" onClick={() => onChange({ backgroundVideo: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => openMedia('heroBanner-video', 'video')}
                      className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 text-sm">
                      🎬 Selecteer video
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={block.data.videoMuted !== false}
                      onChange={e => onChange({ videoMuted: e.target.checked })} />
                    Gedempt
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={block.data.videoLoop !== false}
                      onChange={e => onChange({ videoLoop: e.target.checked })} />
                    Herhalen
                  </label>
                </div>
              </div>
            )}

            {/* IMAGE BACKGROUND (default or explicit) */}
            {(block.data.backgroundType === 'image' || (!block.data.backgroundType && !block.data.backgroundEffect)) && (
              <div>
                <label className={labelClass}>Achtergrondafbeelding</label>
                {block.data.backgroundImage ? (
                  <div className="relative">
                    <img src={block.data.backgroundImage} alt="" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => onChange({ backgroundImage: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => openMedia('heroBanner-bg')}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 text-sm">
                    Selecteer afbeelding
                  </button>
                )}
              </div>
            )}
            
            {/* Fallback color for image/video */}
            {(block.data.backgroundType !== 'color' && block.data.backgroundType !== 'effect') && (
              <ColorPicker label="Achtergrond kleur (fallback)" value={block.data.backgroundColor || '#1e3a5f'} onChange={v => onChange({ backgroundColor: v })} />
            )}
            
            {/* Titel & Ondertitel */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Tekst</label>
              <div className="hero-editor-wrapper bg-gray-800 rounded-lg p-1 mb-2">
                <RichTextEditor
                  content={block.data.titleHtml || block.data.title || ''}
                  onChange={val => onChange({ titleHtml: val })}
                  placeholder="Banner titel..."
                />
              </div>
              <div className="hero-editor-wrapper bg-gray-800 rounded-lg p-1">
                <RichTextEditor
                  content={block.data.subtitleHtml || block.data.subtitle || ''}
                  onChange={val => onChange({ subtitleHtml: val })}
                  placeholder="Banner ondertitel..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <ColorPicker label="Titel kleur" value={block.data.titleColor || '#ffffff'} onChange={v => onChange({ titleColor: v })} />
              <ColorPicker label="Ondertitel kleur" value={block.data.subtitleColor || 'rgba(255,255,255,0.9)'} onChange={v => onChange({ subtitleColor: v })} />
            </div>
            
            {/* Overlay */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={block.data.overlay !== false}
                  onChange={e => onChange({ overlay: e.target.checked })} />
                Donkere overlay
              </label>
              <div>
                <input type="range" min="0" max="100" value={block.data.overlayOpacity ?? 50}
                  onChange={e => onChange({ overlayOpacity: parseInt(e.target.value) })}
                  className="w-full" />
                <span className="text-xs text-gray-400">{block.data.overlayOpacity ?? 50}%</span>
              </div>
            </div>
            
            {/* Tekst Positie */}
            <div className="p-3 bg-cyan-50 rounded-lg space-y-2">
              <h4 className="text-xs font-semibold text-cyan-800">📍 Tekst Positie</h4>
              <PositionPicker 
                value={block.data.contentPosition || 'center-center'}
                onChange={val => onChange({ contentPosition: val })}
              />
            </div>
            
            {/* Kaarten configuratie */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Kaarten</label>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Kaart type</label>
                <select value={block.data.cardType || 'counter'} onChange={e => onChange({ cardType: e.target.value })} className={inputClass}>
                  <option value="counter">Counter kaarten</option>
                  <option value="flip">Flip kaarten</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Aantal kaarten</label>
                <select value={heroBannerCardCount} onChange={e => onChange({ cardCount: parseInt(e.target.value) })} className={inputClass}>
                  <option value={2}>2 kaarten</option>
                  <option value={3}>3 kaarten</option>
                  <option value={4}>4 kaarten</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Kaarten positie</label>
                <select value={block.data.cardsPosition || 'inline'} onChange={e => onChange({ cardsPosition: e.target.value })} className={inputClass}>
                  <option value="inline">In banner</option>
                  <option value="bottom-overlap">Onder (50% overlap)</option>
                  <option value="top-overlap">Boven (50% overlap)</option>
                </select>
              </div>
              {block.data.cardType === 'flip' && (
                <div>
                  <label className={labelClass}>Flip kaart hoogte</label>
                  <input 
                    type="number" 
                    value={block.data.flipCardHeight || 280} 
                    onChange={e => onChange({ flipCardHeight: parseInt(e.target.value) })} 
                    className={inputClass}
                    min="150"
                    max="500"
                  />
                </div>
              )}
            </div>
            
            {/* Card Effects - only for counter cards */}
            {(!block.data.cardType || block.data.cardType === 'counter') && (
            <div>
              <label className={labelClass}>Standaard effect (alle kaarten)</label>
              <select value={block.data.defaultCardEffect || 'none'} onChange={e => onChange({ defaultCardEffect: e.target.value })} className={inputClass}>
                <option value="none">Geen effect</option>
                <option value="lift">Lift bij hover</option>
                <option value="glow">Glow bij hover</option>
                <option value="border-pulse">Rand puls</option>
                <option value="scale">Schaal bij hover</option>
                <option value="shine">Shine effect</option>
              </select>
            </div>
            )}
            
            {/* Flip card settings */}
            {block.data.cardType === 'flip' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Flip richting</label>
                    <select value={block.data.flipDirection || 'horizontal'} onChange={e => onChange({ flipDirection: e.target.value })} className={inputClass}>
                      <option value="horizontal">Horizontaal (links/rechts)</option>
                      <option value="vertical">Verticaal (boven/onder)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Kaart design</label>
                    <select value={block.data.flipDesign || 'basic'} onChange={e => onChange({ flipDesign: e.target.value })} className={inputClass}>
                      <option value="basic">Basis flip</option>
                      <option value="gradientGlow">Gradiënt Glow</option>
                      <option value="animatedDot">Animated Dot</option>
                    </select>
                  </div>
                </div>
                {/* Schuine hoek rand voor heroBanner flip cards */}
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <h6 className="text-xs font-bold text-amber-700 mb-2">📐 Schuine Hoek Rand</h6>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Hoek positie</label>
                      <select value={block.data.flipCornerPosition || 'none'} onChange={e => onChange({ flipCornerPosition: e.target.value })} className={inputClass}>
                        <option value="none">Geen</option>
                        <option value="top-left">Linksboven</option>
                        <option value="top-right">Rechtsboven</option>
                        <option value="bottom-left">Linksonder</option>
                        <option value="bottom-right">Rechtsonder</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Grootte (px)</label>
                      <input type="number" value={block.data.flipCornerSize || 40} min={10} max={150}
                        onChange={e => onChange({ flipCornerSize: parseInt(e.target.value) })} className={inputClass} />
                    </div>
                  </div>
                  {block.data.flipCornerPosition && block.data.flipCornerPosition !== 'none' && (
                    <div className="mt-2">
                      <ColorPicker label="Hoek kleur" value={block.data.flipCornerColor || '#3b82f6'} onChange={c => onChange({ flipCornerColor: c })} />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Individuele counter kaarten */}
            {(!block.data.cardType || block.data.cardType === 'counter') && ensureCards(heroBannerCardCount).slice(0, heroBannerCardCount).map((card, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2 border">
                <h5 className="text-xs font-semibold text-gray-700">Kaart {idx + 1}</h5>
                
                <IconPicker 
                  label="Icoon" 
                  value={card.icon || ''} 
                  onChange={v => updateCard(idx, 'icon', v)} 
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Counter getal</label>
                    <input type="text" value={card.counter || ''} onChange={e => updateCard(idx, 'counter', e.target.value)} 
                      placeholder="bijv. 12" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Suffix</label>
                    <input type="text" value={card.suffix || ''} onChange={e => updateCard(idx, 'suffix', e.target.value)} 
                      placeholder="bijv. +" className={inputClass} />
                  </div>
                </div>
                
                <div>
                  <label className={labelClass}>Titel</label>
                  <input type="text" value={card.title || ''} onChange={e => updateCard(idx, 'title', e.target.value)} 
                    placeholder="Kaart titel" className={inputClass} />
                </div>
                
                <div>
                  <label className={labelClass}>Ondertitel</label>
                  <input type="text" value={card.subtitle || ''} onChange={e => updateCard(idx, 'subtitle', e.target.value)} 
                    placeholder="Kaart ondertitel" className={inputClass} />
                </div>
                
                <div>
                  <label className={labelClass}>Effect (overschrijft standaard)</label>
                  <select value={card.effect || ''} onChange={e => updateCard(idx, 'effect', e.target.value)} className={inputClass}>
                    <option value="">Gebruik standaard</option>
                    <option value="none">Geen effect</option>
                    <option value="lift">Lift bij hover</option>
                    <option value="glow">Glow bij hover</option>
                    <option value="border-pulse">Rand puls</option>
                    <option value="scale">Schaal bij hover</option>
                    <option value="shine">Shine effect</option>
                  </select>
                </div>
                
                <div>
                  <label className={labelClass}>Laad animatie (bij in beeld komen)</label>
                  <select value={card.loadEffect || ''} onChange={e => updateCard(idx, 'loadEffect', e.target.value)} className={inputClass}>
                    <option value="">Geen animatie</option>
                    <option value="fade-in">Fade in</option>
                    <option value="fade-up">Fade in omhoog</option>
                    <option value="fade-down">Fade in omlaag</option>
                    <option value="fade-left">Fade in links</option>
                    <option value="fade-right">Fade in rechts</option>
                    <option value="zoom-in">Zoom in</option>
                    <option value="zoom-out">Zoom out</option>
                    <option value="flip-up">Flip omhoog</option>
                    <option value="flip-down">Flip omlaag</option>
                    <option value="slide-up">Slide omhoog</option>
                    <option value="slide-down">Slide omlaag</option>
                    <option value="bounce-in">Bounce in</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Animatie delay (ms)</label>
                    <input type="number" value={card.loadDelay || 0} onChange={e => updateCard(idx, 'loadDelay', parseInt(e.target.value) || 0)} 
                      placeholder="0" className={inputClass} min={0} max={2000} step={100} />
                  </div>
                  <div>
                    <label className={labelClass}>Animatie duur (ms)</label>
                    <input type="number" value={card.loadDuration || 600} onChange={e => updateCard(idx, 'loadDuration', parseInt(e.target.value) || 600)} 
                      placeholder="600" className={inputClass} min={200} max={2000} step={100} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker label="Achtergrond" value={card.bgColor || '#ffffff'} onChange={v => updateCard(idx, 'bgColor', v)} />
                  <ColorPicker label="Icoon kleur" value={card.iconColor || '#3b82f6'} onChange={v => updateCard(idx, 'iconColor', v)} />
                  <ColorPicker label="Counter kleur" value={card.counterColor || '#111827'} onChange={v => updateCard(idx, 'counterColor', v)} />
                  <ColorPicker label="Rand kleur" value={card.borderColor || ''} onChange={v => updateCard(idx, 'borderColor', v)} />
                </div>

                {/* ✨ PER-KAART GESTILEERDE TEKSTEN */}
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                      ✨ Gestileerde Teksten ({(card.styledTexts || []).length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newTexts = [...(card.styledTexts || []), {
                          text: 'Nieuwe tekst',
                          textStyle: 'simple',
                          fontSize: 14,
                          fontWeight: 'normal',
                          textColor: '#374151',
                          gradientFrom: '#3b82f6',
                          gradientTo: '#8b5cf6',
                          glowColor: '#3b82f6',
                          textAlign: 'center',
                          marginBottom: 4,
                        }];
                        updateCard(idx, 'styledTexts', newTexts);
                      }}
                      className="text-[10px] text-purple-500 hover:text-purple-700"
                    >
                      + Toevoegen
                    </button>
                  </div>
                  {(card.styledTexts || []).map((st, stIdx) => {
                    const CARD_TEXT_STYLES = [
                      { id: 'simple', name: 'Simpel' },
                      { id: 'gradient', name: 'Gradiënt' },
                      { id: 'aurora', name: 'Aurora' },
                      { id: 'glow', name: 'Glow' },
                      { id: 'outline', name: 'Outline' },
                      { id: 'shadow3d', name: '3D Schaduw' },
                      { id: 'sliced', name: 'Gesneden' },
                      { id: 'dual', name: 'Dual Color' },
                    ];
                    const updateCardStyledText = (updates) => {
                      const newTexts = [...(card.styledTexts || [])];
                      newTexts[stIdx] = { ...newTexts[stIdx], ...updates };
                      updateCard(idx, 'styledTexts', newTexts);
                    };
                    const removeCardStyledText = () => {
                      const newTexts = (card.styledTexts || []).filter((_, i) => i !== stIdx);
                      updateCard(idx, 'styledTexts', newTexts);
                    };
                    return (
                      <div key={stIdx} className="p-2 bg-purple-50 rounded border border-purple-200 space-y-2 mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-medium text-purple-600">Tekst {stIdx + 1}</span>
                          <button type="button" onClick={removeCardStyledText} className="text-red-400 text-[10px]">✕</button>
                        </div>
                        <textarea value={st.text || ''} onChange={e => updateCardStyledText({ text: e.target.value })} rows={2} className={inputClass} placeholder="Tekst..." />
                        <div className="grid grid-cols-2 gap-1">
                          <select value={st.textStyle || 'simple'} onChange={e => updateCardStyledText({ textStyle: e.target.value })} className={inputClass}>
                            {CARD_TEXT_STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <input type="number" value={st.fontSize || 14} min={8} max={48} onChange={e => updateCardStyledText({ fontSize: parseInt(e.target.value) })} className={inputClass} placeholder="px" />
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <ColorPicker label="Kleur" value={st.textColor || '#374151'} onChange={c => updateCardStyledText({ textColor: c })} />
                          {(st.textStyle === 'gradient' || st.textStyle === 'aurora' || st.textStyle === 'dual') && (
                            <ColorPicker label="Gradiënt" value={st.gradientFrom || '#3b82f6'} onChange={c => updateCardStyledText({ gradientFrom: c })} />
                          )}
                          {(st.textStyle === 'glow' || st.textStyle === 'outline') && (
                            <ColorPicker label="Glow" value={st.glowColor || '#3b82f6'} onChange={c => updateCardStyledText({ glowColor: c })} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* Flip kaarten configuratie */}
            {block.data.cardType === 'flip' && (
              <div className="space-y-3">
                {ensureCards(heroBannerCardCount).slice(0, heroBannerCardCount).map((card, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg space-y-3 border border-purple-200">
                    <h5 className="text-xs font-bold text-purple-700">🔄 Flip Kaart {idx + 1}</h5>
                    
                    {/* VOORKANT */}
                    <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                      <h6 className="text-xs font-semibold text-blue-600 mb-2">👁️ VOORKANT</h6>
                      <div className="mb-2">
                        <label className={labelClass}>Achtergrond afbeelding</label>
                        {card.frontImage ? (
                          <div className="flex items-center gap-2">
                            <img src={card.frontImage} alt="" className="w-16 h-16 rounded object-cover" />
                            <button type="button" onClick={() => updateCard(idx, 'frontImage', '')} className="text-red-400 text-xs">✕</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => openMedia(`heroBanner-flipFront-${idx}`)}
                            className="w-full py-2 border border-dashed rounded text-sm text-gray-400">Selecteer afbeelding</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Titel</label>
                          <input type="text" value={card.frontTitle || ''} onChange={e => updateCard(idx, 'frontTitle', e.target.value)}
                            className={inputClass} placeholder="Titel voorkant" />
                        </div>
                        <div>
                          <label className={labelClass}>Subtitel</label>
                          <input type="text" value={card.frontSubtitle || ''} onChange={e => updateCard(idx, 'frontSubtitle', e.target.value)}
                            className={inputClass} placeholder="Subtitel" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <label className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={card.frontOverlay !== false}
                            onChange={e => updateCard(idx, 'frontOverlay', e.target.checked)} />
                          Overlay
                        </label>
                        <div>
                          <label className={labelClass}>Overlay %</label>
                          <input type="range" min="0" max="100" value={card.frontOverlayOpacity ?? 60}
                            onChange={e => updateCard(idx, 'frontOverlayOpacity', parseInt(e.target.value))} className="w-full" />
                        </div>
                      </div>
                    </div>
                    
                    {/* ACHTERKANT */}
                    <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                      <h6 className="text-xs font-semibold text-purple-600 mb-2">🔙 ACHTERKANT</h6>
                      <div className="mb-2">
                        <label className={labelClass}>Achtergrond afbeelding (optioneel)</label>
                        {card.backImage ? (
                          <div className="flex items-center gap-2">
                            <img src={card.backImage} alt="" className="w-16 h-16 rounded object-cover" />
                            <button type="button" onClick={() => updateCard(idx, 'backImage', '')} className="text-red-400 text-xs">✕</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => openMedia(`heroBanner-flipBack-${idx}`)}
                            className="w-full py-2 border border-dashed rounded text-sm text-gray-400">Selecteer afbeelding</button>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Titel</label>
                        <input type="text" value={card.backTitle || ''} onChange={e => updateCard(idx, 'backTitle', e.target.value)}
                          className={inputClass} placeholder="Titel achterkant" />
                      </div>
                      <div>
                        <label className={labelClass}>Beschrijving</label>
                        <textarea value={card.backDescription || ''} onChange={e => updateCard(idx, 'backDescription', e.target.value)}
                          rows={2} className={inputClass} placeholder="Beschrijving tekst..." />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className={labelClass}>Knop tekst</label>
                          <input type="text" value={card.backButtonText || ''} onChange={e => updateCard(idx, 'backButtonText', e.target.value)}
                            className={inputClass} placeholder="Bijv: Meer info" />
                        </div>
                        <div>
                          <label className={labelClass}>Knop URL</label>
                          <input type="text" value={card.backButtonUrl || ''} onChange={e => updateCard(idx, 'backButtonUrl', e.target.value)}
                            className={inputClass} placeholder="/pagina" />
                        </div>
                      </div>
                      {!card.backImage && (
                        <div className="mt-2">
                          <label className={labelClass}>Achtergrond kleur</label>
                          <ColorPicker label="" value={card.backBgColor || '#1e3a5f'} onChange={v => updateCard(idx, 'backBgColor', v)} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════════
                GESTILEERDE TEKSTEN / STYLED TEXTS
               ═══════════════════════════════════════════════════════════════ */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  ✨ Gestileerde Teksten ({(block.data.styledTexts || []).length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newTexts = [...(block.data.styledTexts || []), {
                      text: 'Nieuwe tekst',
                      textStyle: 'simple',
                      fontSize: 48,
                      fontWeight: 'bold',
                      textColor: '#ffffff',
                      gradientFrom: '#00c2ff',
                      gradientTo: '#00fdcf',
                      glowColor: '#00c2ff',
                      textAlign: 'center',
                      wrapMode: 'wrap',
                      marginBottom: 16,
                    }];
                    onChange({ styledTexts: newTexts });
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  + Toevoegen
                </button>
              </div>
              
              {(block.data.styledTexts || []).length > 0 && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {(block.data.styledTexts || []).map((st, stIdx) => {
                    const TEXT_STYLE_OPTIONS = [
                      { id: 'simple', name: 'Simpel' },
                      { id: 'gradient', name: 'Gradiënt' },
                      { id: 'aurora', name: 'Aurora' },
                      { id: 'glow', name: 'Glow' },
                      { id: 'outline', name: 'Outline' },
                      { id: 'shadow3d', name: '3D Schaduw' },
                      { id: 'sliced', name: 'Gesneden' },
                      { id: 'dual', name: 'Dual Color' },
                    ];
                    
                    const updateStyledText = (updates) => {
                      const newTexts = [...(block.data.styledTexts || [])];
                      newTexts[stIdx] = { ...newTexts[stIdx], ...updates };
                      onChange({ styledTexts: newTexts });
                    };
                    
                    const removeStyledText = () => {
                      const newTexts = (block.data.styledTexts || []).filter((_, i) => i !== stIdx);
                      onChange({ styledTexts: newTexts });
                    };
                    
                    return (
                      <div key={stIdx} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-purple-700">Tekst {stIdx + 1}</span>
                          <button type="button" onClick={removeStyledText} className="text-red-400 text-xs hover:text-red-600">✕</button>
                        </div>
                        
                        <div>
                          <label className={labelClass}>Tekst (Enter = nieuwe regel)</label>
                          <textarea
                            value={st.text || ''}
                            onChange={e => updateStyledText({ text: e.target.value })}
                            rows={2}
                            className={inputClass}
                            placeholder="Typ je tekst hier..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>Stijl</label>
                            <select value={st.textStyle || 'simple'} onChange={e => updateStyledText({ textStyle: e.target.value })} className={inputClass}>
                              {TEXT_STYLE_OPTIONS.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Wrap mode</label>
                            <select value={st.wrapMode || 'wrap'} onChange={e => updateStyledText({ wrapMode: e.target.value })} className={inputClass}>
                              <option value="wrap">Word wrap</option>
                              <option value="nowrap">Geen wrap</option>
                              <option value="preserve">Behoud enters</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className={labelClass}>Grootte</label>
                            <input type="number" value={st.fontSize || 48} min={12} max={200}
                              onChange={e => updateStyledText({ fontSize: parseInt(e.target.value) })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Gewicht</label>
                            <select value={st.fontWeight || 'bold'} onChange={e => updateStyledText({ fontWeight: e.target.value })} className={inputClass}>
                              <option value="normal">Normaal</option>
                              <option value="medium">Medium</option>
                              <option value="semibold">Semi-bold</option>
                              <option value="bold">Bold</option>
                              <option value="extrabold">Extra bold</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Uitlijning</label>
                            <select value={st.textAlign || 'center'} onChange={e => updateStyledText({ textAlign: e.target.value })} className={inputClass}>
                              <option value="left">Links</option>
                              <option value="center">Midden</option>
                              <option value="right">Rechts</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <ColorPicker label="Tekstkleur" value={st.textColor || '#ffffff'} onChange={c => updateStyledText({ textColor: c })} />
                          {(st.textStyle === 'gradient' || st.textStyle === 'aurora' || st.textStyle === 'dual') && (
                            <>
                              <ColorPicker label="Gradiënt van" value={st.gradientFrom || '#00c2ff'} onChange={c => updateStyledText({ gradientFrom: c })} />
                              <ColorPicker label="Gradiënt naar" value={st.gradientTo || '#00fdcf'} onChange={c => updateStyledText({ gradientTo: c })} />
                            </>
                          )}
                          {(st.textStyle === 'glow' || st.textStyle === 'outline') && (
                            <ColorPicker label="Glow/Outline kleur" value={st.glowColor || '#00c2ff'} onChange={c => updateStyledText({ glowColor: c })} />
                          )}
                        </div>
                        
                        <div>
                          <label className={labelClass}>Marge onder (px)</label>
                          <input type="number" value={st.marginBottom || 0} min={0} max={100}
                            onChange={e => updateStyledText({ marginBottom: parseInt(e.target.value) })} className={inputClass} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* ═══════════════════════════════════════════════════════════════
                OFFERTE KAART / QUOTE CARD
               ═══════════════════════════════════════════════════════════════ */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  🧮 Offerte Formulier
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={block.data.showQuoteCard || false}
                    onChange={e => onChange({ showQuoteCard: e.target.checked })} 
                    className="rounded"
                  />
                  Tonen
                </label>
              </div>
              
              {block.data.showQuoteCard && (
                <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                  {/* Position */}
                  <div>
                    <label className={labelClass}>Positie</label>
                    <select 
                      value={block.data.quoteCardPosition || 'right'} 
                      onChange={e => onChange({ quoteCardPosition: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="left">Links</option>
                      <option value="center">Midden</option>
                      <option value="right">Rechts</option>
                    </select>
                  </div>
                  
                  {/* Card Title */}
                  <div>
                    <label className={labelClass}>Kaart titel</label>
                    <input 
                      type="text" 
                      value={block.data.quoteCardTitle || 'Bereken uw transport'} 
                      onChange={e => onChange({ quoteCardTitle: e.target.value })} 
                      className={inputClass} 
                      placeholder="Bereken uw transport"
                    />
                  </div>
                  
                  {/* Submit button text */}
                  <div>
                    <label className={labelClass}>Knop tekst</label>
                    <input 
                      type="text" 
                      value={block.data.quoteCardButtonText || 'Bereken prijs →'} 
                      onChange={e => onChange({ quoteCardButtonText: e.target.value })} 
                      className={inputClass} 
                      placeholder="Bereken prijs →"
                    />
                  </div>
                  
                  {/* Calculator page URL */}
                  <div>
                    <label className={labelClass}>Calculator pagina URL</label>
                    <input 
                      type="text" 
                      value={block.data.quoteCardUrl || '/transport-calculator'} 
                      onChange={e => onChange({ quoteCardUrl: e.target.value })} 
                      className={inputClass} 
                      placeholder="/transport-calculator"
                    />
                  </div>
                  
                  {/* Visible fields */}
                  <div>
                    <label className={labelClass}>Zichtbare velden</label>
                    <div className="space-y-1.5 bg-white p-2 rounded border">
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={block.data.quoteShowFrom !== false} 
                          onChange={e => onChange({ quoteShowFrom: e.target.checked })} />
                        Van (vertrekadres)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={block.data.quoteShowTo !== false} 
                          onChange={e => onChange({ quoteShowTo: e.target.checked })} />
                        Naar (bestemmingsadres)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={block.data.quoteShowType !== false} 
                          onChange={e => onChange({ quoteShowType: e.target.checked })} />
                        Binnenlands / Internationaal
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={block.data.quoteShowVehicle !== false} 
                          onChange={e => onChange({ quoteShowVehicle: e.target.checked })} />
                        Voertuigtype selector
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3 mt-3">
                    <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2 block">Styling</label>
                  </div>
                  
                  {/* Card styling */}
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Kaart achtergrond" 
                      value={block.data.quoteCardBg || 'rgba(255,255,255,0.95)'} 
                      onChange={v => onChange({ quoteCardBg: v })} 
                    />
                    <div>
                      <label className={labelClass}>Transparantie</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" min="0" max="100" 
                          value={block.data.quoteCardOpacity ?? 85} 
                          onChange={e => onChange({ quoteCardOpacity: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-500 w-8">{block.data.quoteCardOpacity ?? 85}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Titel kleur" 
                      value={block.data.quoteCardTitleColor || '#1e3a5f'} 
                      onChange={v => onChange({ quoteCardTitleColor: v })} 
                    />
                    <ColorPicker 
                      label="Label kleur" 
                      value={block.data.quoteCardLabelColor || '#4b5563'} 
                      onChange={v => onChange({ quoteCardLabelColor: v })} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Veld achtergrond" 
                      value={block.data.quoteCardInputBg || '#ffffff'} 
                      onChange={v => onChange({ quoteCardInputBg: v })} 
                    />
                    <ColorPicker 
                      label="Veld rand" 
                      value={block.data.quoteCardInputBorder || '#e5e7eb'} 
                      onChange={v => onChange({ quoteCardInputBorder: v })} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Knop achtergrond" 
                      value={block.data.quoteCardButtonBg || '#2563eb'} 
                      onChange={v => onChange({ quoteCardButtonBg: v })} 
                    />
                    <ColorPicker 
                      label="Knop tekst" 
                      value={block.data.quoteCardButtonColor || '#ffffff'} 
                      onChange={v => onChange({ quoteCardButtonColor: v })} 
                    />
                  </div>
                  
                  {/* Border radius */}
                  <div>
                    <label className={labelClass}>Hoeken afronden</label>
                    <select 
                      value={block.data.quoteCardRadius || 'xl'} 
                      onChange={e => onChange({ quoteCardRadius: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="none">Geen</option>
                      <option value="sm">Klein</option>
                      <option value="md">Medium</option>
                      <option value="lg">Groot</option>
                      <option value="xl">Extra groot</option>
                      <option value="2xl">Maximaal</option>
                    </select>
                  </div>
                  
                  {/* Shadow */}
                  <div>
                    <label className={labelClass}>Schaduw</label>
                    <select 
                      value={block.data.quoteCardShadow || 'xl'} 
                      onChange={e => onChange({ quoteCardShadow: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="none">Geen</option>
                      <option value="sm">Klein</option>
                      <option value="md">Medium</option>
                      <option value="lg">Groot</option>
                      <option value="xl">Extra groot</option>
                      <option value="2xl">Maximaal</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'hero':
        // Background effect options
        const HERO_BG_EFFECTS = [
          { id: 'none', name: 'Geen effect', icon: '✕' },
          { id: 'waves', name: 'Golven', icon: '🌊' },
          { id: 'wavyRotate', name: 'Draaiende Golf', icon: '🔄' },
          { id: 'circles', name: 'Pulserende Cirkels', icon: '⭕' },
          { id: 'triangles', name: 'Vliegende Driehoeken', icon: '🔺' },
          { id: 'particles', name: 'Deeltjes', icon: '✨' },
          { id: 'gradient', name: 'Bewegende Gradiënt', icon: '🌈' },
          { id: 'aurora', name: 'Aurora Borealis', icon: '🌌' },
          { id: 'mesh', name: 'Mesh Gradiënt', icon: '🎨' },
        ];
        
        // Height presets
        const HEIGHT_PRESETS = [
          { id: 'small', value: '300px', label: 'Klein (300px)' },
          { id: 'medium', value: '450px', label: 'Medium (450px)' },
          { id: 'large', value: '600px', label: 'Groot (600px)' },
          { id: 'xlarge', value: '80vh', label: 'Extra groot (80vh)' },
          { id: 'fullscreen', value: '100vh', label: 'Volledig scherm (100vh)' },
          { id: 'custom', value: 'custom', label: 'Aangepast...' },
        ];
        
        const currentHeightPreset = HEIGHT_PRESETS.find(p => p.value === block.data.height)?.id || 'custom';
        
        return (
          <div className={sectionClass}>
            {/* ═══════════════════════════════════════════════════════════════
                HERO LAYOUT & SIZING
               ═══════════════════════════════════════════════════════════════ */}
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg space-y-3 border border-indigo-200">
              <h4 className="text-xs font-semibold text-indigo-800 flex items-center gap-2">📐 Layout & Grootte</h4>
              
              {/* Height preset */}
              <div>
                <label className={labelClass}>Hoogte</label>
                <select 
                  value={currentHeightPreset} 
                  onChange={e => {
                    const preset = HEIGHT_PRESETS.find(p => p.id === e.target.value);
                    if (preset && preset.value !== 'custom') {
                      onChange({ height: preset.value, heightPreset: e.target.value });
                    } else {
                      onChange({ heightPreset: 'custom' });
                    }
                  }} 
                  className={inputClass}
                >
                  {HEIGHT_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Custom height input */}
              {currentHeightPreset === 'custom' && (
                <div>
                  <label className={labelClass}>Aangepaste hoogte</label>
                  <input 
                    type="text" 
                    value={block.data.height || '400px'} 
                    onChange={e => onChange({ height: e.target.value })} 
                    className={inputClass}
                    placeholder="bijv. 500px of 70vh"
                  />
                </div>
              )}
              
              {/* Full bleed / transparent navbar */}
              <div className="pt-2 border-t border-indigo-200">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={block.data.fullBleed || false}
                    onChange={e => onChange({ fullBleed: e.target.checked })} 
                    className="rounded"
                  />
                  <span className="text-xs">
                    🖼️ <strong>Full-bleed modus</strong>
                    <span className="text-gray-500 block text-[10px]">Banner achter transparante navbar</span>
                  </span>
                </label>
              </div>
              
              {/* Rounded corners */}
              <div>
                <label className={labelClass}>Hoeken</label>
                <select 
                  value={block.data.borderRadius || 'xl'} 
                  onChange={e => onChange({ borderRadius: e.target.value })} 
                  className={inputClass}
                >
                  <option value="none">Geen afronding</option>
                  <option value="sm">Klein</option>
                  <option value="md">Medium</option>
                  <option value="lg">Groot</option>
                  <option value="xl">Extra groot</option>
                  <option value="2xl">Maximaal</option>
                </select>
              </div>
            </div>
            
            {/* Title with full rich text editor */}
            <div>
              <label className={labelClass}>Titel</label>
              <div className="hero-editor-wrapper bg-gray-800 rounded-lg p-1">
                <RichTextEditor
                  content={block.data.titleHtml || block.data.title || ''}
                  onChange={val => onChange({ titleHtml: val })}
                  placeholder="Hero titel..."
                />
              </div>
            </div>
            
            {/* Subtitle with full rich text editor */}
            <div>
              <label className={labelClass}>Ondertitel</label>
              <div className="hero-editor-wrapper bg-gray-800 rounded-lg p-1">
                <RichTextEditor
                  content={block.data.subtitleHtml || block.data.subtitle || ''}
                  onChange={val => onChange({ subtitleHtml: val })}
                  placeholder="Hero ondertitel..."
                />
              </div>
            </div>
            
            {/* Background type selector */}
            <div>
              <label className={labelClass}>Achtergrond type</label>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'image' })}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'image' || (!block.data.backgroundType && !block.data.backgroundEffect) ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🖼️ Afbeelding
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'video' })}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'video' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🎬 Video
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'effect' })}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'effect' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✨ Effect
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ backgroundType: 'color' })}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                    block.data.backgroundType === 'color' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🎨 Kleur
                </button>
              </div>
            </div>

            {/* EFFECT BACKGROUND */}
            {block.data.backgroundType === 'effect' && (
              <div className="space-y-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                <h4 className="text-xs font-semibold text-cyan-800">✨ Achtergrond Effect</h4>
                
                {/* Effect selector */}
                <div>
                  <label className={labelClass}>Effect type</label>
                  <select 
                    value={block.data.backgroundEffect || 'waves'} 
                    onChange={e => onChange({ backgroundEffect: e.target.value })} 
                    className={inputClass}
                  >
                    {HERO_BG_EFFECTS.map(e => (
                      <option key={e.id} value={e.id}>{e.icon} {e.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Effect colors */}
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker 
                    label="Primaire kleur" 
                    value={block.data.effectColor1 || '#1e3a5f'} 
                    onChange={v => onChange({ effectColor1: v })} 
                  />
                  <ColorPicker 
                    label="Secundaire kleur" 
                    value={block.data.effectColor2 || '#3b82f6'} 
                    onChange={v => onChange({ effectColor2: v })} 
                  />
                </div>
                
                {(block.data.backgroundEffect === 'gradient' || block.data.backgroundEffect === 'aurora' || block.data.backgroundEffect === 'waves') && (
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Derde kleur" 
                      value={block.data.effectColor3 || '#8b5cf6'} 
                      onChange={v => onChange({ effectColor3: v })} 
                    />
                    <ColorPicker 
                      label="Vierde kleur" 
                      value={block.data.effectColor4 || '#ec4899'} 
                      onChange={v => onChange({ effectColor4: v })} 
                    />
                  </div>
                )}
                
                {/* Wave specific settings */}
                {(block.data.backgroundEffect === 'waves' || block.data.backgroundEffect === 'wavyRotate') && (
                  <ColorPicker 
                    label="Golf kleur" 
                    value={block.data.waveColor || 'rgba(255,255,255,0.25)'} 
                    onChange={v => onChange({ waveColor: v })} 
                  />
                )}
                
                {/* Circles specific settings */}
                {block.data.backgroundEffect === 'circles' && (
                  <ColorPicker 
                    label="Cirkel kleur" 
                    value={block.data.circleColor || 'rgba(255,255,255,0.3)'} 
                    onChange={v => onChange({ circleColor: v })} 
                  />
                )}
                
                {/* Animation speed */}
                <div>
                  <label className={labelClass}>Animatie snelheid</label>
                  <select 
                    value={block.data.effectSpeed || 'normal'} 
                    onChange={e => onChange({ effectSpeed: e.target.value })} 
                    className={inputClass}
                  >
                    <option value="slow">Langzaam</option>
                    <option value="normal">Normaal</option>
                    <option value="fast">Snel</option>
                  </select>
                </div>
                
                {/* Effect opacity */}
                <div>
                  <label className={labelClass}>Effect dekking: {block.data.effectOpacity ?? 100}%</label>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={block.data.effectOpacity ?? 100}
                    onChange={e => onChange({ effectOpacity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Transparant</span>
                    <span>Volledig</span>
                  </div>
                </div>
                
                {/* Background image UNDER effect */}
                <div className="border-t border-cyan-200 pt-3 mt-3">
                  <label className={labelClass}>Achtergrondafbeelding (onder effect)</label>
                  {block.data.backgroundImage ? (
                    <div className="relative">
                      <img src={block.data.backgroundImage} alt="" className="w-full h-32 object-cover rounded-lg" />
                      <button type="button" onClick={() => onChange({ backgroundImage: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => openMedia('hero-bg')}
                      className="w-full py-4 border-2 border-dashed border-cyan-300 rounded-lg text-cyan-500 hover:border-cyan-400 text-sm">
                      📷 Optioneel: Afbeelding onder effect
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* COLOR BACKGROUND */}
            {block.data.backgroundType === 'color' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker 
                    label="Achtergrondkleur" 
                    value={block.data.backgroundColor || '#1e3a5f'} 
                    onChange={v => onChange({ backgroundColor: v })} 
                  />
                  <div>
                    <label className={labelClass}>Gradiënt</label>
                    <select 
                      value={block.data.colorGradient || 'none'} 
                      onChange={e => onChange({ colorGradient: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="none">Geen</option>
                      <option value="to-r">Naar rechts</option>
                      <option value="to-l">Naar links</option>
                      <option value="to-b">Naar beneden</option>
                      <option value="to-t">Naar boven</option>
                      <option value="to-br">Diagonaal ↘</option>
                      <option value="to-bl">Diagonaal ↙</option>
                    </select>
                  </div>
                </div>
                {block.data.colorGradient && block.data.colorGradient !== 'none' && (
                  <ColorPicker 
                    label="Gradiënt eind kleur" 
                    value={block.data.backgroundColor2 || '#3b82f6'} 
                    onChange={v => onChange({ backgroundColor2: v })} 
                  />
                )}
              </div>
            )}

            {block.data.backgroundType === 'video' ? (
              /* Video background */
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Achtergrondvideo</label>
                  {block.data.backgroundVideo ? (
                    <div className="relative">
                      <video src={block.data.backgroundVideo} className="w-full h-32 object-cover rounded-lg" muted />
                      <button type="button" onClick={() => onChange({ backgroundVideo: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => openMedia('hero-video', 'video')}
                      className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 text-sm">
                      🎬 Selecteer video
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={block.data.videoMuted !== false}
                      onChange={e => onChange({ videoMuted: e.target.checked })} />
                    Gedempt
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={block.data.videoLoop !== false}
                      onChange={e => onChange({ videoLoop: e.target.checked })} />
                    Herhalen
                  </label>
                </div>
                <p className="text-xs text-gray-400">Video speelt automatisch af zonder controls</p>
              </div>
            ) : (
              /* Image background */
              <div>
                <label className={labelClass}>Achtergrondafbeelding</label>
                {block.data.backgroundImage ? (
                  <div className="relative">
                    <img src={block.data.backgroundImage} alt="" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => onChange({ backgroundImage: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => openMedia('hero-bg')}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 text-sm">
                    Selecteer afbeelding
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Uitlijning</label>
                <select value={block.data.alignment || 'center'} onChange={e => onChange({ alignment: e.target.value })} className={inputClass}>
                  <option value="left">Links</option>
                  <option value="center">Midden</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Titel schaduw</label>
                <select value={block.data.titleShadow || ''} onChange={e => onChange({ titleShadow: e.target.value })} className={inputClass}>
                  <option value="">Geen</option>
                  <option value="sm">Klein</option>
                  <option value="md">Medium</option>
                  <option value="lg">Groot</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={block.data.overlay !== false}
                onChange={e => onChange({ overlay: e.target.checked })} />
              Donkere overlay
            </label>
            <div>
              <label className={labelClass}>Overlay sterkte</label>
              <input type="range" min="0" max="100" value={block.data.overlayOpacity ?? 50}
                onChange={e => onChange({ overlayOpacity: parseInt(e.target.value) })}
                className="w-full" />
              <span className="text-xs text-gray-400">{block.data.overlayOpacity ?? 50}%</span>
            </div>

            {/* Text Position */}
            <div className="p-3 bg-cyan-50 rounded-lg space-y-2">
              <h4 className="text-xs font-semibold text-cyan-800">📍 Tekst Positie</h4>
              <PositionPicker 
                value={block.data.contentPosition || 'center-center'}
                onChange={val => onChange({ contentPosition: val })}
              />
            </div>

            {/* Button styling */}
            <div className="p-3 bg-green-50 rounded-lg space-y-3">
              <h4 className="text-xs font-semibold text-green-800">🔘 Knop Styling</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Knoptekst</label>
                  <input type="text" value={block.data.buttonText || ''} onChange={e => onChange({ buttonText: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Knop URL</label>
                  <input type="text" value={block.data.buttonUrl || ''} onChange={e => onChange({ buttonUrl: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Knop uitlijning</label>
                <select value={block.data.buttonAlign || 'center'} onChange={e => onChange({ buttonAlign: e.target.value })} className={inputClass}>
                  <option value="left">Links</option>
                  <option value="center">Midden</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Achtergrond</label>
                  <div className="flex gap-2">
                    <input type="color" value={block.data.buttonBg || '#ffffff'} 
                      onChange={e => onChange({ buttonBg: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer border" />
                    <input type="text" value={block.data.buttonBg || '#ffffff'} 
                      onChange={e => onChange({ buttonBg: e.target.value })}
                      className={`${inputClass} flex-1`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tekstkleur</label>
                  <div className="flex gap-2">
                    <input type="color" value={block.data.buttonColor || '#111827'} 
                      onChange={e => onChange({ buttonColor: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer border" />
                    <input type="text" value={block.data.buttonColor || '#111827'} 
                      onChange={e => onChange({ buttonColor: e.target.value })}
                      className={`${inputClass} flex-1`} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* ═══════════════════════════════════════════════════════════════
                OFFERTE KAART / QUOTE CARD (also in regular hero)
               ═══════════════════════════════════════════════════════════════ */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  🧮 Offerte Formulier
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={block.data.showQuoteCard || false}
                    onChange={e => onChange({ showQuoteCard: e.target.checked })} 
                    className="rounded"
                  />
                  Tonen
                </label>
              </div>
              
              {block.data.showQuoteCard && (
                <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                  {/* Position */}
                  <div>
                    <label className={labelClass}>Positie</label>
                    <select 
                      value={block.data.quoteCardPosition || 'right'} 
                      onChange={e => onChange({ quoteCardPosition: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="left">Links</option>
                      <option value="center">Midden</option>
                      <option value="right">Rechts</option>
                    </select>
                  </div>
                  
                  {/* Card Title */}
                  <div>
                    <label className={labelClass}>Kaart titel</label>
                    <input 
                      type="text" 
                      value={block.data.quoteCardTitle || 'Bereken uw transport'} 
                      onChange={e => onChange({ quoteCardTitle: e.target.value })} 
                      className={inputClass} 
                      placeholder="Bereken uw transport"
                    />
                  </div>
                  
                  {/* Submit button text */}
                  <div>
                    <label className={labelClass}>Knop tekst</label>
                    <input 
                      type="text" 
                      value={block.data.quoteCardButtonText || 'Bereken prijs →'} 
                      onChange={e => onChange({ quoteCardButtonText: e.target.value })} 
                      className={inputClass} 
                      placeholder="Bereken prijs →"
                    />
                  </div>
                  
                  {/* Calculator page URL */}
                  <div>
                    <label className={labelClass}>Calculator pagina URL</label>
                    <input 
                      type="text" 
                      value={block.data.quoteCardUrl || '/transport-calculator'} 
                      onChange={e => onChange({ quoteCardUrl: e.target.value })} 
                      className={inputClass} 
                      placeholder="/transport-calculator"
                    />
                  </div>
                  
                  {/* Visible fields */}
                  <div>
                    <label className={labelClass}>Zichtbare velden</label>
                    <div className="space-y-1.5 bg-white p-2 rounded border">
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={block.data.quoteShowFrom !== false} 
                          onChange={e => onChange({ quoteShowFrom: e.target.checked })} />
                        Van (vertrekadres)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={block.data.quoteShowTo !== false} 
                          onChange={e => onChange({ quoteShowTo: e.target.checked })} />
                        Naar (bestemmingsadres)
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={block.data.quoteShowType !== false} 
                          onChange={e => onChange({ quoteShowType: e.target.checked })} />
                        Binnenlands / Internationaal
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={block.data.quoteShowVehicle !== false} 
                          onChange={e => onChange({ quoteShowVehicle: e.target.checked })} />
                        Voertuigtype selector
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3 mt-3">
                    <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2 block">Styling</label>
                  </div>
                  
                  {/* Card styling */}
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Kaart achtergrond" 
                      value={block.data.quoteCardBg || 'rgba(255,255,255,0.85)'} 
                      onChange={v => onChange({ quoteCardBg: v })} 
                    />
                    <div>
                      <label className={labelClass}>Transparantie</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" min="0" max="100" 
                          value={block.data.quoteCardOpacity ?? 85} 
                          onChange={e => onChange({ quoteCardOpacity: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-500 w-8">{block.data.quoteCardOpacity ?? 85}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Titel kleur" 
                      value={block.data.quoteCardTitleColor || '#1e3a5f'} 
                      onChange={v => onChange({ quoteCardTitleColor: v })} 
                    />
                    <ColorPicker 
                      label="Label kleur" 
                      value={block.data.quoteCardLabelColor || '#4b5563'} 
                      onChange={v => onChange({ quoteCardLabelColor: v })} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Veld achtergrond" 
                      value={block.data.quoteCardInputBg || 'rgba(255,255,255,0.9)'} 
                      onChange={v => onChange({ quoteCardInputBg: v })} 
                    />
                    <ColorPicker 
                      label="Veld rand" 
                      value={block.data.quoteCardInputBorder || 'rgba(255,255,255,0.5)'} 
                      onChange={v => onChange({ quoteCardInputBorder: v })} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <ColorPicker 
                      label="Knop achtergrond" 
                      value={block.data.quoteCardButtonBg || '#2563eb'} 
                      onChange={v => onChange({ quoteCardButtonBg: v })} 
                    />
                    <ColorPicker 
                      label="Knop tekst" 
                      value={block.data.quoteCardButtonColor || '#ffffff'} 
                      onChange={v => onChange({ quoteCardButtonColor: v })} 
                    />
                  </div>
                  
                  {/* Border radius */}
                  <div>
                    <label className={labelClass}>Hoeken afronden</label>
                    <select 
                      value={block.data.quoteCardRadius || 'xl'} 
                      onChange={e => onChange({ quoteCardRadius: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="none">Geen</option>
                      <option value="sm">Klein</option>
                      <option value="md">Medium</option>
                      <option value="lg">Groot</option>
                      <option value="xl">Extra groot</option>
                      <option value="2xl">Maximaal</option>
                    </select>
                  </div>
                  
                  {/* Shadow */}
                  <div>
                    <label className={labelClass}>Schaduw</label>
                    <select 
                      value={block.data.quoteCardShadow || 'xl'} 
                      onChange={e => onChange({ quoteCardShadow: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="none">Geen</option>
                      <option value="sm">Klein</option>
                      <option value="md">Medium</option>
                      <option value="lg">Groot</option>
                      <option value="xl">Extra groot</option>
                      <option value="2xl">Maximaal</option>
                    </select>
                  </div>
                  
                  {/* Blur effect */}
                  <label className="flex items-center gap-2 text-xs">
                    <input 
                      type="checkbox" 
                      checked={block.data.quoteCardBlur !== false} 
                      onChange={e => onChange({ quoteCardBlur: e.target.checked })} 
                    />
                    Glasmorfisme effect (blur achtergrond)
                  </label>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                HERO KOLOMMEN SYSTEEM / COLUMN LAYOUT
               ═══════════════════════════════════════════════════════════════ */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  📊 Hero Kolommen
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={block.data.useHeroColumns || false}
                    onChange={e => {
                      if (e.target.checked && (!block.data.heroColumns || block.data.heroColumns.length === 0)) {
                        // Initialize with single column
                        onChange({ 
                          useHeroColumns: true, 
                          heroLayout: [12],
                          heroColumns: [{ id: 'hc-' + Date.now(), width: 12, blocks: [] }]
                        });
                      } else {
                        onChange({ useHeroColumns: e.target.checked });
                      }
                    }} 
                    className="rounded"
                  />
                  Gebruik kolommen
                </label>
              </div>
              
              {block.data.useHeroColumns && (
                <div className="space-y-4 bg-gradient-to-br from-slate-50 to-gray-50 p-3 rounded-lg border border-slate-200">
                  {/* Column layout selector */}
                  <div>
                    <label className={labelClass}>Kolom indeling</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { cols: [12], label: '1 kolom', visual: '▰▰▰▰' },
                        { cols: [6, 6], label: '50/50', visual: '▰▰ ▰▰' },
                        { cols: [4, 4, 4], label: '3 kolommen', visual: '▰ ▰ ▰' },
                        { cols: [3, 3, 3, 3], label: '4 kolommen', visual: '▰▰▰▰' },
                        { cols: [8, 4], label: '2/3 + 1/3', visual: '▰▰▰ ▰' },
                        { cols: [4, 8], label: '1/3 + 2/3', visual: '▰ ▰▰▰' },
                        { cols: [3, 6, 3], label: '1/4+1/2+1/4', visual: '▰ ▰▰ ▰' },
                        { cols: [3, 9], label: '1/4 + 3/4', visual: '▰ ▰▰▰' },
                        { cols: [9, 3], label: '3/4 + 1/4', visual: '▰▰▰ ▰' },
                      ].map((layout, idx) => {
                        const isActive = JSON.stringify(block.data.heroLayout || [12]) === JSON.stringify(layout.cols);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              // Redistribute existing blocks to new columns
                              const existingBlocks = (block.data.heroColumns || []).flatMap(c => c.blocks || []);
                              const newColumns = layout.cols.map((w, i) => ({
                                id: 'hc-' + Date.now() + '-' + i,
                                width: w,
                                blocks: i === 0 ? existingBlocks : []
                              }));
                              onChange({ heroLayout: layout.cols, heroColumns: newColumns });
                            }}
                            className={`p-2 rounded border text-center transition-all ${
                              isActive 
                                ? 'bg-blue-500 text-white border-blue-600' 
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex justify-center gap-0.5 mb-1">
                              {layout.cols.map((w, i) => (
                                <div 
                                  key={i} 
                                  className={`h-3 rounded-sm ${isActive ? 'bg-white/50' : 'bg-gray-300'}`}
                                  style={{ width: `${(w / 12) * 100}%` }}
                                />
                              ))}
                            </div>
                            <span className="text-[9px]">{layout.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Hero columns vertical alignment */}
                  <div>
                    <label className={labelClass}>Verticale uitlijning kolommen</label>
                    <select 
                      value={block.data.heroColumnsAlign || 'center'} 
                      onChange={e => onChange({ heroColumnsAlign: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="start">Boven</option>
                      <option value="center">Midden</option>
                      <option value="end">Onder</option>
                      <option value="stretch">Uitrekken</option>
                    </select>
                  </div>
                  
                  {/* Column editors */}
                  <div className="space-y-4">
                    {(block.data.heroColumns || []).map((col, colIdx) => {
                      // Block types available in hero columns (expanded list)
                      const HERO_BLOCK_TYPES = [
                        { type: 'text', label: 'Tekst', icon: '📝' },
                        { type: 'styledText', label: 'Gestileerde Tekst', icon: '✨' },
                        { type: 'image', label: 'Afbeelding', icon: '🖼️' },
                        { type: 'button', label: 'Knop', icon: '🔘' },
                        { type: 'icon', label: 'Icoon', icon: '🎯' },
                        { type: 'spacer', label: 'Spacer', icon: '↕️' },
                        { type: 'divider', label: 'Scheidingslijn', icon: '➖' },
                        { type: 'counter', label: 'Teller', icon: '🔢' },
                        { type: 'countdown', label: 'Countdown', icon: '⏱️' },
                        { type: 'video', label: 'Video', icon: '🎬' },
                        { type: 'social', label: 'Social Icons', icon: '📱' },
                        { type: 'list', label: 'Lijst', icon: '📋' },
                        { type: 'badge', label: 'Badge', icon: '🏷️' },
                      ];
                      
                      return (
                        <div key={col.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <div className="bg-slate-100 px-3 py-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">
                              Kolom {colIdx + 1} ({col.width}/12 = {Math.round((col.width / 12) * 100)}%)
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {(col.blocks || []).length} blok(ken)
                            </span>
                          </div>
                          
                          <div className="p-3 space-y-2">
                            {/* Blocks in this column */}
                            {(col.blocks || []).map((heroBlock, blockIdx) => (
                              <div 
                                key={heroBlock.id || blockIdx} 
                                className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200"
                              >
                                <span className="text-xs flex-1">
                                  {HERO_BLOCK_TYPES.find(t => t.type === heroBlock.type)?.icon || '📦'} {' '}
                                  {HERO_BLOCK_TYPES.find(t => t.type === heroBlock.type)?.label || heroBlock.type}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Move up
                                    if (blockIdx > 0) {
                                      const newBlocks = [...col.blocks];
                                      [newBlocks[blockIdx], newBlocks[blockIdx - 1]] = [newBlocks[blockIdx - 1], newBlocks[blockIdx]];
                                      const newColumns = [...block.data.heroColumns];
                                      newColumns[colIdx] = { ...col, blocks: newBlocks };
                                      onChange({ heroColumns: newColumns });
                                    }
                                  }}
                                  className="text-slate-400 hover:text-slate-600 text-[10px] disabled:opacity-30"
                                  disabled={blockIdx === 0}
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Move down
                                    if (blockIdx < col.blocks.length - 1) {
                                      const newBlocks = [...col.blocks];
                                      [newBlocks[blockIdx], newBlocks[blockIdx + 1]] = [newBlocks[blockIdx + 1], newBlocks[blockIdx]];
                                      const newColumns = [...block.data.heroColumns];
                                      newColumns[colIdx] = { ...col, blocks: newBlocks };
                                      onChange({ heroColumns: newColumns });
                                    }
                                  }}
                                  className="text-slate-400 hover:text-slate-600 text-[10px] disabled:opacity-30"
                                  disabled={blockIdx === col.blocks.length - 1}
                                >
                                  ▼
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Edit block - set it as editing
                                    const newColumns = [...block.data.heroColumns];
                                    newColumns[colIdx] = {
                                      ...col,
                                      blocks: col.blocks.map((b, i) => ({
                                        ...b,
                                        _editing: i === blockIdx
                                      }))
                                    };
                                    onChange({ heroColumns: newColumns, _editingHeroBlock: { colIdx, blockIdx } });
                                  }}
                                  className="text-blue-400 hover:text-blue-600 text-xs"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Delete block
                                    const newBlocks = col.blocks.filter((_, i) => i !== blockIdx);
                                    const newColumns = [...block.data.heroColumns];
                                    newColumns[colIdx] = { ...col, blocks: newBlocks };
                                    onChange({ heroColumns: newColumns });
                                  }}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            
                            {/* Add block dropdown */}
                            <div className="relative">
                              <select
                                value=""
                                onChange={e => {
                                  if (!e.target.value) return;
                                  const newBlock = {
                                    id: 'hb-' + Date.now(),
                                    type: e.target.value,
                                    data: getHeroBlockDefaults(e.target.value)
                                  };
                                  const newColumns = [...block.data.heroColumns];
                                  newColumns[colIdx] = {
                                    ...col,
                                    blocks: [...(col.blocks || []), newBlock]
                                  };
                                  onChange({ heroColumns: newColumns });
                                  e.target.value = '';
                                }}
                                className="w-full text-xs border border-dashed border-slate-300 rounded p-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 focus:outline-none"
                              >
                                <option value="">+ Blok toevoegen...</option>
                                {HERO_BLOCK_TYPES.map(t => (
                                  <option key={t.type} value={t.type}>{t.icon} {t.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Inline hero block editor */}
                  {block.data._editingHeroBlock && (() => {
                    const { colIdx, blockIdx } = block.data._editingHeroBlock;
                    const heroCol = block.data.heroColumns?.[colIdx];
                    const heroBlock = heroCol?.blocks?.[blockIdx];
                    if (!heroBlock) return null;
                    
                    const updateHeroBlock = (updates) => {
                      const newColumns = [...block.data.heroColumns];
                      const newBlocks = [...newColumns[colIdx].blocks];
                      newBlocks[blockIdx] = { ...newBlocks[blockIdx], data: { ...newBlocks[blockIdx].data, ...updates } };
                      newColumns[colIdx] = { ...newColumns[colIdx], blocks: newBlocks };
                      onChange({ heroColumns: newColumns });
                    };
                    
                    const closeHeroBlockEditor = () => {
                      onChange({ _editingHeroBlock: null });
                    };
                    
                    return (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-blue-700">
                            ✏️ Bewerk: {heroBlock.type}
                          </span>
                          <button type="button" onClick={closeHeroBlockEditor} className="text-blue-500 hover:text-blue-700 text-sm">
                            ✕ Sluiten
                          </button>
                        </div>
                        
                        {/* Simple inline editors per type */}
                        {heroBlock.type === 'text' && (
                          <div className="space-y-2">
                            <label className={labelClass}>Tekst</label>
                            <div className="hero-column-editor rounded-lg border border-gray-200 overflow-hidden bg-white">
                              <RichTextEditor
                                content={heroBlock.data.html || ''}
                                onChange={val => updateHeroBlock({ html: val })}
                                placeholder="Typ hier je tekst..."
                              />
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'styledText' && (
                          <div className="space-y-2">
                            <div>
                              <label className={labelClass}>Tekst</label>
                              <textarea
                                value={heroBlock.data.text || ''}
                                onChange={e => updateHeroBlock({ text: e.target.value })}
                                rows={2}
                                className={inputClass}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Stijl</label>
                                <select value={heroBlock.data.textStyle || 'simple'} onChange={e => updateHeroBlock({ textStyle: e.target.value })} className={inputClass}>
                                  <option value="simple">📝 Simpel</option>
                                  <option value="gradient">🌈 Gradiënt</option>
                                  <option value="aurora">🌌 Aurora</option>
                                  <option value="glow">💡 Glow</option>
                                  <option value="outline">🔲 Outline</option>
                                  <option value="shadow3d">🏔️ 3D Schaduw</option>
                                  <option value="sliced">🔪 Gesneden</option>
                                  <option value="dual">🎭 Dual Color</option>
                                  <option value="fancy">🎨 Fancy Gradient</option>
                                  <option value="lightness">☀️ Lightness</option>
                                  <option value="glitch">📺 Glitch</option>
                                  <option value="neon">🌃 Neon Sign</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelClass}>Grootte (px)</label>
                                <input type="number" value={heroBlock.data.fontSize || 48} min={12} max={200} onChange={e => updateHeroBlock({ fontSize: parseInt(e.target.value) })} className={inputClass} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Gewicht</label>
                                <select value={heroBlock.data.fontWeight || 'bold'} onChange={e => updateHeroBlock({ fontWeight: e.target.value })} className={inputClass}>
                                  <option value="normal">Normaal</option>
                                  <option value="medium">Medium</option>
                                  <option value="semibold">Semi-bold</option>
                                  <option value="bold">Bold</option>
                                  <option value="extrabold">Extra bold</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelClass}>Uitlijning</label>
                                <select value={heroBlock.data.textAlign || 'center'} onChange={e => updateHeroBlock({ textAlign: e.target.value })} className={inputClass}>
                                  <option value="left">Links</option>
                                  <option value="center">Midden</option>
                                  <option value="right">Rechts</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <ColorPicker label="Tekstkleur" value={heroBlock.data.textColor || '#ffffff'} onChange={v => updateHeroBlock({ textColor: v })} />
                              {(heroBlock.data.textStyle === 'gradient' || heroBlock.data.textStyle === 'aurora' || heroBlock.data.textStyle === 'dual' || heroBlock.data.textStyle === 'fancy') && (
                                <ColorPicker label="Gradiënt van" value={heroBlock.data.gradientFrom || '#00c2ff'} onChange={v => updateHeroBlock({ gradientFrom: v })} />
                              )}
                            </div>
                            {(heroBlock.data.textStyle === 'gradient' || heroBlock.data.textStyle === 'aurora' || heroBlock.data.textStyle === 'dual' || heroBlock.data.textStyle === 'fancy') && (
                              <ColorPicker label="Gradiënt naar" value={heroBlock.data.gradientTo || '#00fdcf'} onChange={v => updateHeroBlock({ gradientTo: v })} />
                            )}
                            {(heroBlock.data.textStyle === 'glow' || heroBlock.data.textStyle === 'neon' || heroBlock.data.textStyle === 'outline') && (
                              <ColorPicker label="Glow/Outline kleur" value={heroBlock.data.glowColor || '#00c2ff'} onChange={v => updateHeroBlock({ glowColor: v })} />
                            )}
                            <div>
                              <label className={labelClass}>Wrap modus</label>
                              <select value={heroBlock.data.wrapMode || 'wrap'} onChange={e => updateHeroBlock({ wrapMode: e.target.value })} className={inputClass}>
                                <option value="wrap">Word wrap</option>
                                <option value="nowrap">Geen wrap (1 regel)</option>
                                <option value="preserve">Behoud enters</option>
                              </select>
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'image' && (
                          <div className="space-y-2">
                            {heroBlock.data.src ? (
                              <div className="relative">
                                <img src={heroBlock.data.src} alt="" className="w-full h-32 object-cover rounded" />
                                <button type="button" onClick={() => updateHeroBlock({ src: '' })} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">✕</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => openMedia(`hero-col-${colIdx}-block-${blockIdx}`)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded text-gray-400 hover:border-blue-400 text-sm">
                                🖼️ Selecteer afbeelding
                              </button>
                            )}
                          </div>
                        )}
                        
                        {heroBlock.type === 'button' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Tekst</label>
                                <input type="text" value={heroBlock.data.text || ''} onChange={e => updateHeroBlock({ text: e.target.value })} className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>URL</label>
                                <input type="text" value={heroBlock.data.url || ''} onChange={e => updateHeroBlock({ url: e.target.value })} className={inputClass} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <ColorPicker label="Achtergrond" value={heroBlock.data.backgroundColor || '#ffffff'} onChange={v => updateHeroBlock({ backgroundColor: v })} />
                              <ColorPicker label="Tekstkleur" value={heroBlock.data.textColor || '#000000'} onChange={v => updateHeroBlock({ textColor: v })} />
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'spacer' && (
                          <div>
                            <label className={labelClass}>Hoogte (px)</label>
                            <input type="number" value={heroBlock.data.height || 40} onChange={e => updateHeroBlock({ height: parseInt(e.target.value) })} className={inputClass} />
                          </div>
                        )}
                        
                        {heroBlock.type === 'counter' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className={labelClass}>Nummer</label>
                                <input type="number" value={heroBlock.data.number || 0} onChange={e => updateHeroBlock({ number: parseInt(e.target.value) })} className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>Suffix</label>
                                <input type="text" value={heroBlock.data.suffix || ''} onChange={e => updateHeroBlock({ suffix: e.target.value })} className={inputClass} placeholder="+" />
                              </div>
                              <div>
                                <label className={labelClass}>Label</label>
                                <input type="text" value={heroBlock.data.label || ''} onChange={e => updateHeroBlock({ label: e.target.value })} className={inputClass} />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'countdown' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Datum</label>
                                <input type="date" value={heroBlock.data.targetDate || ''} onChange={e => updateHeroBlock({ targetDate: e.target.value })} className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>Tijd</label>
                                <input type="time" value={heroBlock.data.targetTime || '00:00'} onChange={e => updateHeroBlock({ targetTime: e.target.value })} className={inputClass} />
                              </div>
                            </div>
                            <div>
                              <label className={labelClass}>Stijl</label>
                              <select value={heroBlock.data.style || 'cards'} onChange={e => updateHeroBlock({ style: e.target.value })} className={inputClass}>
                                <option value="cards">Cards</option>
                                <option value="flip">Flip</option>
                                <option value="minimal">Minimal</option>
                                <option value="circular">Circular</option>
                              </select>
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'icon' && (
                          <div className="space-y-2">
                            <IconPicker 
                              label="Icoon" 
                              value={heroBlock.data.icon || '⭐'} 
                              onChange={v => updateHeroBlock({ icon: v })} 
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Grootte (px)</label>
                                <input type="number" value={heroBlock.data.size || 48} onChange={e => updateHeroBlock({ size: parseInt(e.target.value) })} className={inputClass} min={12} max={200} />
                              </div>
                              <ColorPicker label="Kleur" value={heroBlock.data.color || '#ffffff'} onChange={v => updateHeroBlock({ color: v })} />
                            </div>
                            <div>
                              <label className={labelClass}>Uitlijning</label>
                              <select value={heroBlock.data.align || 'center'} onChange={e => updateHeroBlock({ align: e.target.value })} className={inputClass}>
                                <option value="left">Links</option>
                                <option value="center">Midden</option>
                                <option value="right">Rechts</option>
                              </select>
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'divider' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Breedte</label>
                                <input type="text" value={heroBlock.data.width || '100%'} onChange={e => updateHeroBlock({ width: e.target.value })} className={inputClass} placeholder="100% of 200px" />
                              </div>
                              <div>
                                <label className={labelClass}>Dikte (px)</label>
                                <input type="number" value={heroBlock.data.thickness || 1} onChange={e => updateHeroBlock({ thickness: parseInt(e.target.value) })} className={inputClass} min={1} max={20} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <ColorPicker label="Kleur" value={heroBlock.data.color || 'rgba(255,255,255,0.3)'} onChange={v => updateHeroBlock({ color: v })} />
                              <div>
                                <label className={labelClass}>Stijl</label>
                                <select value={heroBlock.data.style || 'solid'} onChange={e => updateHeroBlock({ style: e.target.value })} className={inputClass}>
                                  <option value="solid">Solid</option>
                                  <option value="dashed">Dashed</option>
                                  <option value="dotted">Dotted</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'video' && (
                          <div className="space-y-2">
                            <div>
                              <label className={labelClass}>Video URL</label>
                              <input type="text" value={heroBlock.data.url || ''} onChange={e => updateHeroBlock({ url: e.target.value })} className={inputClass} placeholder="YouTube/Vimeo URL" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Type</label>
                                <select value={heroBlock.data.type || 'youtube'} onChange={e => updateHeroBlock({ type: e.target.value })} className={inputClass}>
                                  <option value="youtube">YouTube</option>
                                  <option value="vimeo">Vimeo</option>
                                  <option value="direct">Direct</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelClass}>Max breedte</label>
                                <input type="text" value={heroBlock.data.maxWidth || '100%'} onChange={e => updateHeroBlock({ maxWidth: e.target.value })} className={inputClass} />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'badge' && (
                          <div className="space-y-2">
                            <div>
                              <label className={labelClass}>Tekst</label>
                              <input type="text" value={heroBlock.data.text || ''} onChange={e => updateHeroBlock({ text: e.target.value })} className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <ColorPicker label="Achtergrond" value={heroBlock.data.backgroundColor || '#3b82f6'} onChange={v => updateHeroBlock({ backgroundColor: v })} />
                              <ColorPicker label="Tekstkleur" value={heroBlock.data.textColor || '#ffffff'} onChange={v => updateHeroBlock({ textColor: v })} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Hoeken</label>
                                <select value={heroBlock.data.borderRadius || 'full'} onChange={e => updateHeroBlock({ borderRadius: e.target.value })} className={inputClass}>
                                  <option value="none">Geen</option>
                                  <option value="sm">Klein</option>
                                  <option value="md">Medium</option>
                                  <option value="lg">Groot</option>
                                  <option value="full">Pill</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelClass}>Grootte</label>
                                <select value={heroBlock.data.size || 'medium'} onChange={e => updateHeroBlock({ size: e.target.value })} className={inputClass}>
                                  <option value="small">Klein</option>
                                  <option value="medium">Medium</option>
                                  <option value="large">Groot</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {heroBlock.type === 'list' && (
                          <div className="space-y-2">
                            <div>
                              <label className={labelClass}>Items (één per regel)</label>
                              <textarea
                                value={(heroBlock.data.items || []).join('\n')}
                                onChange={e => updateHeroBlock({ items: e.target.value.split('\n').filter(s => s.trim()) })}
                                rows={4}
                                className={inputClass}
                                placeholder="Item 1&#10;Item 2&#10;Item 3"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Stijl</label>
                                <select value={heroBlock.data.listStyle || 'check'} onChange={e => updateHeroBlock({ listStyle: e.target.value })} className={inputClass}>
                                  <option value="check">✓ Vinkjes</option>
                                  <option value="bullet">• Bullets</option>
                                  <option value="arrow">→ Pijlen</option>
                                  <option value="star">★ Sterren</option>
                                  <option value="number">1. Genummerd</option>
                                </select>
                              </div>
                              <ColorPicker label="Tekstkleur" value={heroBlock.data.textColor || '#ffffff'} onChange={v => updateHeroBlock({ textColor: v })} />
                            </div>
                            <ColorPicker label="Icoon kleur" value={heroBlock.data.iconColor || '#10b981'} onChange={v => updateHeroBlock({ iconColor: v })} />
                          </div>
                        )}
                        
                        {heroBlock.type === 'social' && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">Social icons kunnen via de volledige editor worden toegevoegd.</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Icoon grootte (px)</label>
                                <input type="number" value={heroBlock.data.iconSize || 24} onChange={e => updateHeroBlock({ iconSize: parseInt(e.target.value) })} className={inputClass} min={16} max={64} />
                              </div>
                              <ColorPicker label="Icoon kleur" value={heroBlock.data.iconColor || '#ffffff'} onChange={v => updateHeroBlock({ iconColor: v })} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                GESTILEERDE TEKSTEN / STYLED TEXTS (for regular hero)
               ═══════════════════════════════════════════════════════════════ */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  ✨ Gestileerde Teksten ({(block.data.styledTexts || []).length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newTexts = [...(block.data.styledTexts || []), {
                      text: 'Nieuwe tekst',
                      textStyle: 'simple',
                      fontSize: 48,
                      fontWeight: 'bold',
                      textColor: '#ffffff',
                      gradientFrom: '#00c2ff',
                      gradientTo: '#00fdcf',
                      glowColor: '#00c2ff',
                      textAlign: 'center',
                      wrapMode: 'wrap',
                      marginBottom: 16,
                    }];
                    onChange({ styledTexts: newTexts });
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  + Toevoegen
                </button>
              </div>
              
              {(block.data.styledTexts || []).length > 0 && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {(block.data.styledTexts || []).map((st, stIdx) => {
                    const TEXT_STYLE_OPTIONS = [
                      { id: 'simple', name: 'Simpel' },
                      { id: 'gradient', name: 'Gradiënt' },
                      { id: 'aurora', name: 'Aurora' },
                      { id: 'glow', name: 'Glow' },
                      { id: 'outline', name: 'Outline' },
                      { id: 'shadow3d', name: '3D Schaduw' },
                      { id: 'sliced', name: 'Gesneden' },
                      { id: 'dual', name: 'Dual Color' },
                    ];
                    
                    const updateStyledText = (updates) => {
                      const newTexts = [...(block.data.styledTexts || [])];
                      newTexts[stIdx] = { ...newTexts[stIdx], ...updates };
                      onChange({ styledTexts: newTexts });
                    };
                    
                    const removeStyledText = () => {
                      const newTexts = (block.data.styledTexts || []).filter((_, i) => i !== stIdx);
                      onChange({ styledTexts: newTexts });
                    };
                    
                    return (
                      <div key={stIdx} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-purple-700">Tekst {stIdx + 1}</span>
                          <button type="button" onClick={removeStyledText} className="text-red-400 text-xs hover:text-red-600">✕</button>
                        </div>
                        
                        <div>
                          <label className={labelClass}>Tekst (Enter = nieuwe regel)</label>
                          <textarea
                            value={st.text || ''}
                            onChange={e => updateStyledText({ text: e.target.value })}
                            rows={2}
                            className={inputClass}
                            placeholder="Typ je tekst hier..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>Stijl</label>
                            <select value={st.textStyle || 'simple'} onChange={e => updateStyledText({ textStyle: e.target.value })} className={inputClass}>
                              {TEXT_STYLE_OPTIONS.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Wrap mode</label>
                            <select value={st.wrapMode || 'wrap'} onChange={e => updateStyledText({ wrapMode: e.target.value })} className={inputClass}>
                              <option value="wrap">Word wrap</option>
                              <option value="nowrap">Geen wrap</option>
                              <option value="preserve">Behoud enters</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className={labelClass}>Grootte</label>
                            <input type="number" value={st.fontSize || 48} min={12} max={200}
                              onChange={e => updateStyledText({ fontSize: parseInt(e.target.value) })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Gewicht</label>
                            <select value={st.fontWeight || 'bold'} onChange={e => updateStyledText({ fontWeight: e.target.value })} className={inputClass}>
                              <option value="normal">Normaal</option>
                              <option value="medium">Medium</option>
                              <option value="semibold">Semi-bold</option>
                              <option value="bold">Bold</option>
                              <option value="extrabold">Extra bold</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Uitlijning</label>
                            <select value={st.textAlign || 'center'} onChange={e => updateStyledText({ textAlign: e.target.value })} className={inputClass}>
                              <option value="left">Links</option>
                              <option value="center">Midden</option>
                              <option value="right">Rechts</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <ColorPicker label="Tekstkleur" value={st.textColor || '#ffffff'} onChange={c => updateStyledText({ textColor: c })} />
                          {(st.textStyle === 'gradient' || st.textStyle === 'aurora' || st.textStyle === 'dual') && (
                            <>
                              <ColorPicker label="Gradiënt van" value={st.gradientFrom || '#00c2ff'} onChange={c => updateStyledText({ gradientFrom: c })} />
                              <ColorPicker label="Gradiënt naar" value={st.gradientTo || '#00fdcf'} onChange={c => updateStyledText({ gradientTo: c })} />
                            </>
                          )}
                          {(st.textStyle === 'glow' || st.textStyle === 'outline') && (
                            <ColorPicker label="Glow/Outline kleur" value={st.glowColor || '#00c2ff'} onChange={c => updateStyledText({ glowColor: c })} />
                          )}
                        </div>
                        
                        <div>
                          <label className={labelClass}>Marge onder (px)</label>
                          <input type="number" value={st.marginBottom || 0} min={0} max={100}
                            onChange={e => updateStyledText({ marginBottom: parseInt(e.target.value) })} className={inputClass} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Kolommen</label>
              <select value={block.data.columns || 3} onChange={e => onChange({ columns: parseInt(e.target.value) })} className={inputClass}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <label className={labelClass}>Kaarten ({block.data.items?.length || 0})</label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(block.data.items || []).map((item, i) => (
                <CardItemEditor
                  key={i}
                  item={item}
                  index={i}
                  onUpdate={(updatedItem) => {
                    const items = [...block.data.items];
                    items[i] = updatedItem;
                    onChange({ items });
                  }}
                  onDelete={() => onChange({ items: block.data.items.filter((_, j) => j !== i) })}
                  onSelectImage={() => openMedia(`card-${i}`)}
                />
              ))}
            </div>
            <button type="button" onClick={() => onChange({ items: [...(block.data.items || []), { title: '', description: '', image: '', link: '', effects: {} }] })}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">+ Kaart toevoegen</button>
          </div>
        );

      case 'flipCards': {
        const flipItems = block.data.items || [];
        const updateFlipItem = (index, updates) => {
          const items = [...flipItems];
          items[index] = { ...items[index], ...updates };
          onChange({ items });
        };
        const addFlipItem = () => {
          onChange({
            items: [...flipItems, {
              frontImage: '',
              frontTitle: '',
              frontSubtitle: '',
              frontOverlay: true,
              frontOverlayOpacity: 60,
              frontTitleColor: '#ffffff',
              frontSubtitleColor: 'rgba(255,255,255,0.8)',
              frontStyledTexts: [],
              backImage: '',
              backImageOverlay: true,
              backImageOverlayOpacity: 40,
              backTitle: '',
              backDescription: '',
              backButtonText: '',
              backButtonUrl: '',
              backBgColor: '#1e3a5f',
              backBgGradient: '',
              backTextColor: '#ffffff',
              backButtonBg: '#ffffff',
              backButtonColor: '#1e3a5f',
              backStyledTexts: [],
            }]
          });
        };
        const removeFlipItem = (index) => {
          onChange({ items: flipItems.filter((_, i) => i !== index) });
        };

        return (
          <div className={sectionClass}>
            {/* Globale instellingen */}
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">⚙️ Instellingen</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kolommen</label>
                <select value={block.data.columns || 3} onChange={e => onChange({ columns: parseInt(e.target.value) })} className={inputClass}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Kaarthoogte (px)</label>
                <input type="number" value={block.data.cardHeight || 320} min={200} max={600}
                  onChange={e => onChange({ cardHeight: parseInt(e.target.value) })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Flip richting</label>
                <select value={block.data.flipDirection || 'horizontal'} onChange={e => onChange({ flipDirection: e.target.value })} className={inputClass}>
                  <option value="horizontal">Horizontaal (links/rechts)</option>
                  <option value="vertical">Verticaal (boven/onder)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Flip trigger</label>
                <select value={block.data.flipTrigger || 'hover'} onChange={e => onChange({ flipTrigger: e.target.value })} className={inputClass}>
                  <option value="hover">Bij hover</option>
                  <option value="click">Bij klik</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kaart design</label>
                <select value={block.data.cardDesign || 'basic'} onChange={e => onChange({ cardDesign: e.target.value })} className={inputClass}>
                  <option value="basic">Basis flip</option>
                  <option value="gradientGlow">Gradient glow</option>
                  <option value="animatedDot">Animated dot</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Kaart breedte</label>
                <select value={block.data.cardWidth || '100'} onChange={e => onChange({ cardWidth: e.target.value })} className={inputClass}>
                  <option value="100">100% (volledige breedte)</option>
                  <option value="75">75%</option>
                  <option value="50">50%</option>
                  <option value="25">25%</option>
                </select>
              </div>
            </div>

            {/* Schuine hoek rand */}
            <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <h5 className="text-xs font-bold text-amber-700 mb-2">📐 Schuine Hoek Rand</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Hoek positie</label>
                  <select value={block.data.cornerPosition || 'none'} onChange={e => onChange({ cornerPosition: e.target.value })} className={inputClass}>
                    <option value="none">Geen</option>
                    <option value="top-left">Linksboven</option>
                    <option value="top-right">Rechtsboven</option>
                    <option value="bottom-left">Linksonder</option>
                    <option value="bottom-right">Rechtsonder</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Grootte (px)</label>
                  <input type="number" value={block.data.cornerSize || 40} min={10} max={150}
                    onChange={e => onChange({ cornerSize: parseInt(e.target.value) })} className={inputClass} />
                </div>
              </div>
              {block.data.cornerPosition && block.data.cornerPosition !== 'none' && (
                <div className="mt-2">
                  <ColorPicker label="Hoek kleur" value={block.data.cornerColor || '#3b82f6'} onChange={c => onChange({ cornerColor: c })} />
                </div>
              )}
            </div>

            {/* Kaarten */}
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mt-4">🔄 Flip Kaarten ({flipItems.length})</h4>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {flipItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-3 border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Kaart {idx + 1}</span>
                    <button type="button" onClick={() => removeFlipItem(idx)} className="text-red-400 text-xs hover:text-red-600">✕ Verwijderen</button>
                  </div>

                  {/* VOORKANT */}
                  <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                    <h5 className="text-xs font-semibold text-blue-600 mb-2">📸 VOORKANT</h5>
                    <div>
                      <label className={labelClass}>Achtergrond afbeelding</label>
                      {item.frontImage ? (
                        <div className="flex items-center gap-2">
                          <img src={item.frontImage} alt="" className="w-16 h-16 rounded object-cover" />
                          <button type="button" onClick={() => updateFlipItem(idx, { frontImage: '' })} className="text-red-400 text-xs">✕</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => openMedia(`flipcard-front-${idx}`)}
                          className="w-full py-2 border border-dashed rounded text-sm text-gray-400">Selecteer afbeelding</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className={labelClass}>Titel</label>
                        <input type="text" value={item.frontTitle || ''} onChange={e => updateFlipItem(idx, { frontTitle: e.target.value })}
                          className={inputClass} placeholder="Titel voorkant" />
                      </div>
                      <div>
                        <label className={labelClass}>Subtitel</label>
                        <input type="text" value={item.frontSubtitle || ''} onChange={e => updateFlipItem(idx, { frontSubtitle: e.target.value })}
                          className={inputClass} placeholder="Subtitel" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <label className="flex items-center gap-1 text-xs col-span-1">
                        <input type="checkbox" checked={item.frontOverlay !== false}
                          onChange={e => updateFlipItem(idx, { frontOverlay: e.target.checked })} />
                        Overlay
                      </label>
                      <div>
                        <label className={labelClass}>Overlay %</label>
                        <input type="range" min="0" max="100" value={item.frontOverlayOpacity ?? 60}
                          onChange={e => updateFlipItem(idx, { frontOverlayOpacity: parseInt(e.target.value) })} className="w-full" />
                      </div>
                      <ColorPicker
                        label="Titel kleur"
                        value={item.frontTitleColor || '#ffffff'}
                        onChange={(c) => updateFlipItem(idx, { frontTitleColor: c })}
                      />
                    </div>

                    {/* ✨ VOORKANT GESTILEERDE TEKSTEN */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                          ✨ Gestileerde Teksten ({(item.frontStyledTexts || []).length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newTexts = [...(item.frontStyledTexts || []), {
                              text: 'Nieuwe tekst',
                              textStyle: 'simple',
                              fontSize: 24,
                              fontWeight: 'bold',
                              textColor: '#ffffff',
                              gradientFrom: '#00c2ff',
                              gradientTo: '#00fdcf',
                              glowColor: '#00c2ff',
                              textAlign: 'center',
                              marginBottom: 8,
                            }];
                            updateFlipItem(idx, { frontStyledTexts: newTexts });
                          }}
                          className="text-[10px] text-blue-500 hover:text-blue-700"
                        >
                          + Toevoegen
                        </button>
                      </div>
                      {(item.frontStyledTexts || []).map((st, stIdx) => {
                        const FLIP_TEXT_STYLES = [
                          { id: 'simple', name: 'Simpel' },
                          { id: 'gradient', name: 'Gradiënt' },
                          { id: 'aurora', name: 'Aurora' },
                          { id: 'glow', name: 'Glow' },
                          { id: 'outline', name: 'Outline' },
                          { id: 'shadow3d', name: '3D Schaduw' },
                          { id: 'sliced', name: 'Gesneden' },
                          { id: 'dual', name: 'Dual Color' },
                        ];
                        const updateFrontStyledText = (updates) => {
                          const newTexts = [...(item.frontStyledTexts || [])];
                          newTexts[stIdx] = { ...newTexts[stIdx], ...updates };
                          updateFlipItem(idx, { frontStyledTexts: newTexts });
                        };
                        const removeFrontStyledText = () => {
                          const newTexts = (item.frontStyledTexts || []).filter((_, i) => i !== stIdx);
                          updateFlipItem(idx, { frontStyledTexts: newTexts });
                        };
                        return (
                          <div key={stIdx} className="p-2 bg-blue-50 rounded border border-blue-200 space-y-2 mb-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-medium text-blue-600">Tekst {stIdx + 1}</span>
                              <button type="button" onClick={removeFrontStyledText} className="text-red-400 text-[10px]">✕</button>
                            </div>
                            <textarea value={st.text || ''} onChange={e => updateFrontStyledText({ text: e.target.value })} rows={2} className={inputClass} placeholder="Tekst..." />
                            <div className="grid grid-cols-2 gap-1">
                              <select value={st.textStyle || 'simple'} onChange={e => updateFrontStyledText({ textStyle: e.target.value })} className={inputClass}>
                                {FLIP_TEXT_STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <input type="number" value={st.fontSize || 24} min={10} max={100} onChange={e => updateFrontStyledText({ fontSize: parseInt(e.target.value) })} className={inputClass} placeholder="px" />
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <ColorPicker label="Kleur" value={st.textColor || '#ffffff'} onChange={c => updateFrontStyledText({ textColor: c })} />
                              {(st.textStyle === 'gradient' || st.textStyle === 'aurora' || st.textStyle === 'dual') && (
                                <ColorPicker label="Gradiënt" value={st.gradientFrom || '#00c2ff'} onChange={c => updateFrontStyledText({ gradientFrom: c })} />
                              )}
                              {(st.textStyle === 'glow' || st.textStyle === 'outline') && (
                                <ColorPicker label="Glow" value={st.glowColor || '#00c2ff'} onChange={c => updateFrontStyledText({ glowColor: c })} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ACHTERKANT */}
                  <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                    <h5 className="text-xs font-semibold text-purple-600 mb-2">🔙 ACHTERKANT</h5>
                    
                    {/* Back Image */}
                    <div className="mb-3">
                      <label className={labelClass}>Achtergrond afbeelding (optioneel)</label>
                      {item.backImage ? (
                        <div className="flex items-center gap-2">
                          <img src={item.backImage} alt="" className="w-16 h-16 rounded object-cover" />
                          <button type="button" onClick={() => updateFlipItem(idx, { backImage: '' })} className="text-red-400 text-xs">✕</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => openMedia(`flipcard-back-${idx}`)}
                          className="w-full py-2 border border-dashed rounded text-sm text-gray-400">Selecteer afbeelding</button>
                      )}
                      {item.backImage && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <label className="flex items-center gap-1 text-xs">
                            <input type="checkbox" checked={item.backImageOverlay !== false}
                              onChange={e => updateFlipItem(idx, { backImageOverlay: e.target.checked })} />
                            Overlay
                          </label>
                          <div>
                            <input type="range" min="0" max="100" value={item.backImageOverlayOpacity ?? 40}
                              onChange={e => updateFlipItem(idx, { backImageOverlayOpacity: parseInt(e.target.value) })} className="w-full" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className={labelClass}>Titel</label>
                      <input type="text" value={item.backTitle || ''} onChange={e => updateFlipItem(idx, { backTitle: e.target.value })}
                        className={inputClass} placeholder="Titel achterkant" />
                    </div>
                    <div>
                      <label className={labelClass}>Beschrijving</label>
                      <textarea value={item.backDescription || ''} onChange={e => updateFlipItem(idx, { backDescription: e.target.value })}
                        rows={3} className={inputClass} placeholder="Beschrijving tekst..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className={labelClass}>Knop tekst</label>
                        <input type="text" value={item.backButtonText || ''} onChange={e => updateFlipItem(idx, { backButtonText: e.target.value })}
                          className={inputClass} placeholder="Bijv: Meer info" />
                      </div>
                      <div>
                        <label className={labelClass}>Knop URL</label>
                        <input type="text" value={item.backButtonUrl || ''} onChange={e => updateFlipItem(idx, { backButtonUrl: e.target.value })}
                          className={inputClass} placeholder="/pagina of https://..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <ColorPicker
                        label="Achtergrond"
                        value={item.backBgColor || '#1e3a5f'}
                        onChange={(c) => updateFlipItem(idx, { backBgColor: c })}
                      />
                      <ColorPicker
                        label="Tekst kleur"
                        value={item.backTextColor || '#ffffff'}
                        onChange={(c) => updateFlipItem(idx, { backTextColor: c })}
                      />
                    </div>
                    <div className="mt-2">
                      <label className={labelClass}>Achtergrond gradiënt (optioneel)</label>
                      <select value={item.backBgGradient || ''} onChange={e => updateFlipItem(idx, { backBgGradient: e.target.value })} className={inputClass}>
                        <option value="">Geen gradiënt</option>
                        <option value="linear-gradient(45deg, #1e3a5f 0%, #4a6fa5 100%)">Blauw diagonaal</option>
                        <option value="linear-gradient(45deg, #667eea 0%, #764ba2 100%)">Paars diagonaal</option>
                        <option value="linear-gradient(45deg, #f093fb 0%, #f5576c 100%)">Roze diagonaal</option>
                        <option value="linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)">Cyaan diagonaal</option>
                        <option value="linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)">Groen diagonaal</option>
                        <option value="linear-gradient(45deg, #fa709a 0%, #fee140 100%)">Sunset diagonaal</option>
                        <option value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">Paars 135°</option>
                        <option value="linear-gradient(to bottom, #1e3a5f 0%, #0a1628 100%)">Donkerblauw verticaal</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <ColorPicker
                        label="Knop achtergrond"
                        value={item.backButtonBg || '#ffffff'}
                        onChange={(c) => updateFlipItem(idx, { backButtonBg: c })}
                      />
                      <ColorPicker
                        label="Knop tekst"
                        value={item.backButtonColor || '#1e3a5f'}
                        onChange={(c) => updateFlipItem(idx, { backButtonColor: c })}
                      />
                    </div>

                    {/* ✨ ACHTERKANT GESTILEERDE TEKSTEN */}
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                          ✨ Gestileerde Teksten ({(item.backStyledTexts || []).length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newTexts = [...(item.backStyledTexts || []), {
                              text: 'Nieuwe tekst',
                              textStyle: 'simple',
                              fontSize: 18,
                              fontWeight: 'bold',
                              textColor: '#ffffff',
                              gradientFrom: '#00c2ff',
                              gradientTo: '#00fdcf',
                              glowColor: '#00c2ff',
                              textAlign: 'center',
                              marginBottom: 8,
                            }];
                            updateFlipItem(idx, { backStyledTexts: newTexts });
                          }}
                          className="text-[10px] text-purple-500 hover:text-purple-700"
                        >
                          + Toevoegen
                        </button>
                      </div>
                      {(item.backStyledTexts || []).map((st, stIdx) => {
                        const FLIP_TEXT_STYLES = [
                          { id: 'simple', name: 'Simpel' },
                          { id: 'gradient', name: 'Gradiënt' },
                          { id: 'aurora', name: 'Aurora' },
                          { id: 'glow', name: 'Glow' },
                          { id: 'outline', name: 'Outline' },
                          { id: 'shadow3d', name: '3D Schaduw' },
                          { id: 'sliced', name: 'Gesneden' },
                          { id: 'dual', name: 'Dual Color' },
                        ];
                        const updateBackStyledText = (updates) => {
                          const newTexts = [...(item.backStyledTexts || [])];
                          newTexts[stIdx] = { ...newTexts[stIdx], ...updates };
                          updateFlipItem(idx, { backStyledTexts: newTexts });
                        };
                        const removeBackStyledText = () => {
                          const newTexts = (item.backStyledTexts || []).filter((_, i) => i !== stIdx);
                          updateFlipItem(idx, { backStyledTexts: newTexts });
                        };
                        return (
                          <div key={stIdx} className="p-2 bg-purple-50 rounded border border-purple-200 space-y-2 mb-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-medium text-purple-600">Tekst {stIdx + 1}</span>
                              <button type="button" onClick={removeBackStyledText} className="text-red-400 text-[10px]">✕</button>
                            </div>
                            <textarea value={st.text || ''} onChange={e => updateBackStyledText({ text: e.target.value })} rows={2} className={inputClass} placeholder="Tekst..." />
                            <div className="grid grid-cols-2 gap-1">
                              <select value={st.textStyle || 'simple'} onChange={e => updateBackStyledText({ textStyle: e.target.value })} className={inputClass}>
                                {FLIP_TEXT_STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <input type="number" value={st.fontSize || 18} min={10} max={100} onChange={e => updateBackStyledText({ fontSize: parseInt(e.target.value) })} className={inputClass} placeholder="px" />
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <ColorPicker label="Kleur" value={st.textColor || '#ffffff'} onChange={c => updateBackStyledText({ textColor: c })} />
                              {(st.textStyle === 'gradient' || st.textStyle === 'aurora' || st.textStyle === 'dual') && (
                                <ColorPicker label="Gradiënt" value={st.gradientFrom || '#00c2ff'} onChange={c => updateBackStyledText({ gradientFrom: c })} />
                              )}
                              {(st.textStyle === 'glow' || st.textStyle === 'outline') && (
                                <ColorPicker label="Glow" value={st.glowColor || '#00c2ff'} onChange={c => updateBackStyledText({ glowColor: c })} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addFlipItem}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm hover:border-blue-400 hover:text-blue-400 transition-colors">
              + Flip kaart toevoegen
            </button>
          </div>
        );
      }

      case 'textCards': {
        const textCardsItems = block.data.items || [];
        
        // TEXT_STYLES available for selection
        const TEXT_STYLES = [
          { id: 'simple', name: 'Simpel', description: 'Gewone tekst met kleur' },
          { id: 'gradient', name: 'Gradiënt', description: 'Tekst met kleurverloop' },
          { id: 'aurora', name: 'Aurora', description: 'Animerende aurora kleuren' },
          { id: 'glow', name: 'Glow', description: 'Oplichtende neon tekst' },
          { id: 'outline', name: 'Outline', description: 'Tekst met omlijning' },
          { id: 'shadow3d', name: '3D Schaduw', description: 'Tekst met 3D schaduw' },
          { id: 'sliced', name: 'Gesneden', description: 'Gesneden tekst effect' },
          { id: 'dual', name: 'Dual Color', description: 'Twee kleuren effect' },
          { id: 'blur', name: 'Blur Focus', description: 'Blur focus effect' },
        ];

        const updateTextCard = (index, updates) => {
          const items = [...textCardsItems];
          items[index] = { ...items[index], ...updates };
          onChange({ items });
        };

        const addTextCard = () => {
          onChange({
            items: [...textCardsItems, {
              bgColor: '#1e3a5f',
              bgGradient: '',
              borderRadius: 12,
              padding: 32,
              minHeight: 200,
              elements: [
                {
                  text: 'Nieuwe tekst',
                  textStyle: 'simple',
                  fontSize: 24,
                  fontWeight: 'bold',
                  textColor: '#ffffff',
                  gradientFrom: '#00c2ff',
                  gradientTo: '#00fdcf',
                  glowColor: '#00c2ff',
                  textAlign: 'left',
                  wrapMode: 'wrap',
                  marginBottom: 16,
                }
              ]
            }]
          });
        };

        const removeTextCard = (index) => {
          onChange({ items: textCardsItems.filter((_, i) => i !== index) });
        };

        const updateTextElement = (cardIndex, elementIndex, updates) => {
          const items = [...textCardsItems];
          const elements = [...(items[cardIndex].elements || [])];
          elements[elementIndex] = { ...elements[elementIndex], ...updates };
          items[cardIndex] = { ...items[cardIndex], elements };
          onChange({ items });
        };

        const addTextElement = (cardIndex) => {
          const items = [...textCardsItems];
          const elements = [...(items[cardIndex].elements || [])];
          elements.push({
            text: '',
            textStyle: 'simple',
            fontSize: 16,
            fontWeight: 'normal',
            textColor: '#ffffff',
            gradientFrom: '#00c2ff',
            gradientTo: '#00fdcf',
            glowColor: '#00c2ff',
            textAlign: 'left',
            wrapMode: 'wrap',
            marginBottom: 8,
          });
          items[cardIndex] = { ...items[cardIndex], elements };
          onChange({ items });
        };

        const removeTextElement = (cardIndex, elementIndex) => {
          const items = [...textCardsItems];
          const elements = items[cardIndex].elements.filter((_, i) => i !== elementIndex);
          items[cardIndex] = { ...items[cardIndex], elements };
          onChange({ items });
        };

        return (
          <div className={sectionClass}>
            {/* Global Settings */}
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">⚙️ Instellingen</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kolommen</label>
                <select value={block.data.columns || 2} onChange={e => onChange({ columns: parseInt(e.target.value) })} className={inputClass}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tussenruimte (px)</label>
                <input type="number" value={block.data.gap || 24} min={0} max={100}
                  onChange={e => onChange({ gap: parseInt(e.target.value) })} className={inputClass} />
              </div>
            </div>

            {/* Text Cards */}
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mt-4">📐 Tekst Kaarten ({textCardsItems.length})</h4>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {textCardsItems.map((card, cardIdx) => (
                <div key={cardIdx} className="p-3 bg-gray-50 rounded-lg space-y-3 border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Kaart {cardIdx + 1}</span>
                    <button type="button" onClick={() => removeTextCard(cardIdx)} className="text-red-400 text-xs hover:text-red-600">✕ Verwijderen</button>
                  </div>

                  {/* Card Styling */}
                  <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                    <h5 className="text-xs font-semibold text-blue-600 mb-2">🎨 KAART STYLING</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <ColorPicker
                        label="Achtergrondkleur"
                        value={card.bgColor || '#1e3a5f'}
                        onChange={(c) => updateTextCard(cardIdx, { bgColor: c })}
                      />
                      <div>
                        <label className={labelClass}>Border radius</label>
                        <input type="number" value={card.borderRadius || 12} min={0} max={50}
                          onChange={e => updateTextCard(cardIdx, { borderRadius: parseInt(e.target.value) })} className={inputClass} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className={labelClass}>Padding (px)</label>
                        <input type="number" value={card.padding || 32} min={0} max={100}
                          onChange={e => updateTextCard(cardIdx, { padding: parseInt(e.target.value) })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Min hoogte (px)</label>
                        <input type="number" value={card.minHeight || 200} min={50} max={800}
                          onChange={e => updateTextCard(cardIdx, { minHeight: parseInt(e.target.value) })} className={inputClass} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className={labelClass}>Achtergrond gradiënt (optioneel)</label>
                      <select value={card.bgGradient || ''} onChange={e => updateTextCard(cardIdx, { bgGradient: e.target.value })} className={inputClass}>
                        <option value="">Geen gradiënt</option>
                        <option value="linear-gradient(45deg, #1e3a5f 0%, #4a6fa5 100%)">Blauw diagonaal</option>
                        <option value="linear-gradient(45deg, #667eea 0%, #764ba2 100%)">Paars diagonaal</option>
                        <option value="linear-gradient(45deg, #f093fb 0%, #f5576c 100%)">Roze diagonaal</option>
                        <option value="linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)">Cyaan diagonaal</option>
                        <option value="linear-gradient(45deg, #000000 0%, #434343 100%)">Donker diagonaal</option>
                        <option value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">Paars 135°</option>
                        <option value="linear-gradient(to right, #00c2ff, #00fdcf)">Aurora horizontaal</option>
                      </select>
                    </div>
                  </div>

                  {/* Text Elements */}
                  <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                    <h5 className="text-xs font-semibold text-purple-600 mb-2">📝 TEKST ELEMENTEN ({card.elements?.length || 0})</h5>
                    <div className="space-y-3">
                      {(card.elements || []).map((el, elIdx) => (
                        <div key={elIdx} className="p-2 bg-purple-50 rounded border space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-purple-700">Element {elIdx + 1}</span>
                            <button type="button" onClick={() => removeTextElement(cardIdx, elIdx)} className="text-red-400 text-xs">✕</button>
                          </div>
                          
                          {/* Text Input - textarea for multiline support */}
                          <div>
                            <label className={labelClass}>Tekst (gebruik Enter voor nieuwe regels)</label>
                            <textarea
                              value={el.text || ''}
                              onChange={e => updateTextElement(cardIdx, elIdx, { text: e.target.value })}
                              rows={3}
                              className={inputClass}
                              placeholder="Typ je tekst hier... (Enter = nieuwe regel)"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Text Style */}
                            <div>
                              <label className={labelClass}>Tekst stijl</label>
                              <select value={el.textStyle || 'simple'} onChange={e => updateTextElement(cardIdx, elIdx, { textStyle: e.target.value })} className={inputClass}>
                                {TEXT_STYLES.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Wrap Mode */}
                            <div>
                              <label className={labelClass}>Tekst wrap</label>
                              <select value={el.wrapMode || 'wrap'} onChange={e => updateTextElement(cardIdx, elIdx, { wrapMode: e.target.value })} className={inputClass}>
                                <option value="wrap">Word wrap (automatisch)</option>
                                <option value="nowrap">Geen wrap (1 regel)</option>
                                <option value="preserve">Behoud enters</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {/* Font Size */}
                            <div>
                              <label className={labelClass}>Grootte (px)</label>
                              <input type="number" value={el.fontSize || 16} min={8} max={120}
                                onChange={e => updateTextElement(cardIdx, elIdx, { fontSize: parseInt(e.target.value) })} className={inputClass} />
                            </div>
                            
                            {/* Font Weight */}
                            <div>
                              <label className={labelClass}>Gewicht</label>
                              <select value={el.fontWeight || 'normal'} onChange={e => updateTextElement(cardIdx, elIdx, { fontWeight: e.target.value })} className={inputClass}>
                                <option value="normal">Normaal</option>
                                <option value="medium">Medium</option>
                                <option value="semibold">Semi-bold</option>
                                <option value="bold">Bold</option>
                                <option value="extrabold">Extra bold</option>
                              </select>
                            </div>

                            {/* Text Align */}
                            <div>
                              <label className={labelClass}>Uitlijning</label>
                              <select value={el.textAlign || 'left'} onChange={e => updateTextElement(cardIdx, elIdx, { textAlign: e.target.value })} className={inputClass}>
                                <option value="left">Links</option>
                                <option value="center">Midden</option>
                                <option value="right">Rechts</option>
                              </select>
                            </div>
                          </div>

                          {/* Colors based on style */}
                          <div className="grid grid-cols-2 gap-2">
                            <ColorPicker
                              label="Tekstkleur"
                              value={el.textColor || '#ffffff'}
                              onChange={(c) => updateTextElement(cardIdx, elIdx, { textColor: c })}
                            />
                            
                            {/* Show gradient colors for gradient/aurora style */}
                            {(el.textStyle === 'gradient' || el.textStyle === 'aurora' || el.textStyle === 'dual') && (
                              <>
                                <ColorPicker
                                  label="Gradiënt van"
                                  value={el.gradientFrom || '#00c2ff'}
                                  onChange={(c) => updateTextElement(cardIdx, elIdx, { gradientFrom: c })}
                                />
                                <ColorPicker
                                  label="Gradiënt naar"
                                  value={el.gradientTo || '#00fdcf'}
                                  onChange={(c) => updateTextElement(cardIdx, elIdx, { gradientTo: c })}
                                />
                              </>
                            )}
                            
                            {/* Show glow color for glow/outline style */}
                            {(el.textStyle === 'glow' || el.textStyle === 'outline') && (
                              <ColorPicker
                                label="Glow/Outline kleur"
                                value={el.glowColor || '#00c2ff'}
                                onChange={(c) => updateTextElement(cardIdx, elIdx, { glowColor: c })}
                              />
                            )}
                          </div>

                          {/* Margin bottom */}
                          <div>
                            <label className={labelClass}>Marge onder (px)</label>
                            <input type="number" value={el.marginBottom || 0} min={0} max={100}
                              onChange={e => updateTextElement(cardIdx, elIdx, { marginBottom: parseInt(e.target.value) })} className={inputClass} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => addTextElement(cardIdx)}
                      className="w-full mt-2 py-1.5 border border-dashed border-purple-300 rounded text-purple-400 text-xs hover:border-purple-500 hover:text-purple-500">
                      + Tekst element toevoegen
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addTextCard}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm hover:border-blue-400 hover:text-blue-400 transition-colors">
              + Tekst kaart toevoegen
            </button>
          </div>
        );
      }

      case 'testimonial':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Citaat</label>
              <textarea value={block.data.quote || ''} onChange={e => onChange({ quote: e.target.value })}
                rows={4} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Auteur</label>
              <input type="text" value={block.data.author || ''} onChange={e => onChange({ author: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Functie</label>
              <input type="text" value={block.data.role || ''} onChange={e => onChange({ role: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Avatar</label>
              {block.data.avatar ? (
                <div className="flex items-center gap-3">
                  <img src={block.data.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <button type="button" onClick={() => onChange({ avatar: '' })} className="text-red-400 text-sm">Verwijderen</button>
                </div>
              ) : (
                <button type="button" onClick={() => openMedia('avatar')}
                  className="py-2 px-4 border border-dashed rounded text-sm text-gray-400">Selecteer avatar</button>
              )}
            </div>
          </div>
        );

      case 'accordion':
        return (
          <div className={sectionClass}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={block.data.allowMultiple || false}
                onChange={e => onChange({ allowMultiple: e.target.checked })} />
              Meerdere open tegelijk
            </label>
            <label className={labelClass}>Items ({block.data.items?.length || 0})</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(block.data.items || []).map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
                    <button type="button" onClick={() => onChange({ items: block.data.items.filter((_, j) => j !== i) })}
                      className="text-red-400 text-xs">✕</button>
                  </div>
                  <input type="text" value={item.title || ''} placeholder="Vraag / Titel"
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], title: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                  <textarea value={item.content || ''} placeholder="Antwoord / Inhoud" rows={3}
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], content: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ items: [...(block.data.items || []), { title: '', content: '' }] })}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">+ Item toevoegen</button>
          </div>
        );

      case 'counter':
        return (
          <div className={sectionClass}>
            {/* Globale instellingen */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kolommen</label>
                <select value={block.data.columns || 3} onChange={e => onChange({ columns: parseInt(e.target.value) })} className={inputClass}>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Animatieduur (ms)</label>
                <input type="number" value={block.data.duration || 2000} step={100} min={500} max={5000}
                  onChange={e => onChange({ duration: parseInt(e.target.value) })}
                  className={inputClass} />
              </div>
            </div>
            
            {/* Standaard kleuren */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <span className="text-xs font-medium text-gray-500">Standaard kleuren (voor alle tellers)</span>
              <div className="grid grid-cols-2 gap-2">
                <ColorPicker label="Icoon kleur" value={block.data.defaultIconColor || '#3b82f6'} 
                  onChange={v => onChange({ defaultIconColor: v })} />
                <ColorPicker label="Nummer kleur" value={block.data.defaultNumberColor || '#111827'} 
                  onChange={v => onChange({ defaultNumberColor: v })} />
                <ColorPicker label="Label kleur" value={block.data.defaultLabelColor || '#6b7280'} 
                  onChange={v => onChange({ defaultLabelColor: v })} />
                <ColorPicker label="Achtergrond" value={block.data.defaultBgColor || 'transparent'} 
                  onChange={v => onChange({ defaultBgColor: v })} />
              </div>
            </div>

            <label className={labelClass}>Tellers ({block.data.items?.length || 0})</label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(block.data.items || []).map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600">Teller {i + 1}</span>
                    <button type="button" onClick={() => onChange({ items: block.data.items.filter((_, j) => j !== i) })}
                      className="text-red-400 text-xs hover:text-red-600">✕ Verwijderen</button>
                  </div>
                  
                  {/* Icoon */}
                  <IconPicker 
                    label="Icoon" 
                    value={item.icon || ''} 
                    onChange={v => {
                      const items = [...block.data.items]; 
                      items[i] = { ...items[i], icon: v }; 
                      onChange({ items });
                    }} 
                  />
                  
                  {/* Nummer en affix */}
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={item.prefix || ''} placeholder="Voorvoegsel (€)"
                      onChange={e => {
                        const items = [...block.data.items]; items[i] = { ...items[i], prefix: e.target.value }; onChange({ items });
                      }} className="px-2 py-1 border rounded text-xs" />
                    <input type="number" value={item.number || 0} placeholder="Nummer"
                      onChange={e => {
                        const items = [...block.data.items]; items[i] = { ...items[i], number: parseInt(e.target.value) || 0 }; onChange({ items });
                      }} className="px-2 py-1 border rounded text-xs" />
                    <input type="text" value={item.suffix || ''} placeholder="Achtervoegsel (+)"
                      onChange={e => {
                        const items = [...block.data.items]; items[i] = { ...items[i], suffix: e.target.value }; onChange({ items });
                      }} className="px-2 py-1 border rounded text-xs" />
                  </div>
                  
                  {/* Label */}
                  <input type="text" value={item.label || ''} placeholder="Label tekst"
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], label: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                  
                  {/* Kleuren per item (optioneel) */}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:underline">Aangepaste kleuren</summary>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <ColorPicker label="Icoon" value={item.iconColor || ''} 
                        onChange={v => {
                          const items = [...block.data.items]; items[i] = { ...items[i], iconColor: v }; onChange({ items });
                        }} />
                      <ColorPicker label="Nummer" value={item.numberColor || ''} 
                        onChange={v => {
                          const items = [...block.data.items]; items[i] = { ...items[i], numberColor: v }; onChange({ items });
                        }} />
                      <ColorPicker label="Label" value={item.labelColor || ''} 
                        onChange={v => {
                          const items = [...block.data.items]; items[i] = { ...items[i], labelColor: v }; onChange({ items });
                        }} />
                      <ColorPicker label="Achtergrond" value={item.bgColor || ''} 
                        onChange={v => {
                          const items = [...block.data.items]; items[i] = { ...items[i], bgColor: v }; onChange({ items });
                        }} />
                    </div>
                  </details>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ items: [...(block.data.items || []), { icon: '', number: 0, prefix: '', suffix: '', label: '' }] })}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm hover:border-blue-400 hover:text-blue-500 transition-colors">+ Teller toevoegen</button>
          </div>
        );

      case 'iconBox':
        return (
          <div className={sectionClass}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kolommen</label>
                <select value={block.data.columns || 3} onChange={e => onChange({ columns: parseInt(e.target.value) })} className={inputClass}>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Stijl</label>
                <select value={block.data.style || 'default'} onChange={e => onChange({ style: e.target.value })} className={inputClass}>
                  <option value="default">Standaard</option>
                  <option value="bordered">Met rand</option>
                  <option value="filled">Gevuld</option>
                </select>
              </div>
            </div>
            <label className={labelClass}>Items ({block.data.items?.length || 0})</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(block.data.items || []).map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
                    <button type="button" onClick={() => onChange({ items: block.data.items.filter((_, j) => j !== i) })}
                      className="text-red-400 text-xs">✕</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="text" value={item.icon || ''} placeholder="Emoji of icoon"
                      onChange={e => {
                        const items = [...block.data.items]; items[i] = { ...items[i], icon: e.target.value }; onChange({ items });
                      }} className="w-16 px-2 py-1 border rounded text-center" />
                    <span className="text-xs text-gray-400">of</span>
                    <button type="button" onClick={() => openMedia(`iconbox-${i}`)}
                      className="text-xs text-blue-600 hover:underline">Afbeelding kiezen</button>
                  </div>
                  <input type="text" value={item.title || ''} placeholder="Titel"
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], title: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                  <textarea value={item.description || ''} placeholder="Beschrijving" rows={2}
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], description: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ items: [...(block.data.items || []), { icon: '⭐', title: '', description: '' }] })}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">+ Item toevoegen</button>
          </div>
        );

      case 'countdown':
        // Countdown style options
        const COUNTDOWN_STYLES = [
          { id: 'cards', name: 'Kaart stijl', desc: 'Elk getal in een kaart' },
          { id: 'flip', name: 'Flip stijl', desc: 'Animerende flip kaartjes' },
          { id: 'minimal', name: 'Minimaal', desc: 'Eenvoudige getallen' },
          { id: 'circular', name: 'Cirkel', desc: 'Met circulaire voortgang' },
        ];
        
        return (
          <div className={sectionClass}>
            {/* Target date & time */}
            <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg space-y-3 border border-red-200">
              <h4 className="text-xs font-semibold text-red-800">⏱️ Countdown Doel</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Datum</label>
                  <input 
                    type="date" 
                    value={block.data.targetDate || ''} 
                    onChange={e => onChange({ targetDate: e.target.value })} 
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tijd</label>
                  <input 
                    type="time" 
                    value={block.data.targetTime || '00:00'} 
                    onChange={e => onChange({ targetTime: e.target.value })} 
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            
            {/* Style selector */}
            <div>
              <label className={labelClass}>Countdown stijl</label>
              <select 
                value={block.data.style || 'cards'} 
                onChange={e => onChange({ style: e.target.value })} 
                className={inputClass}
              >
                {COUNTDOWN_STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.desc}</option>
                ))}
              </select>
            </div>
            
            {/* Title & subtitle */}
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className={labelClass}>Titel (optioneel)</label>
                <input 
                  type="text" 
                  value={block.data.title || ''} 
                  onChange={e => onChange({ title: e.target.value })} 
                  className={inputClass}
                  placeholder="bijv. Nog maar..."
                />
              </div>
              <div>
                <label className={labelClass}>Ondertitel (optioneel)</label>
                <input 
                  type="text" 
                  value={block.data.subtitle || ''} 
                  onChange={e => onChange({ subtitle: e.target.value })} 
                  className={inputClass}
                  placeholder="bijv. tot de grote lancering!"
                />
              </div>
            </div>
            
            {/* Show/hide units */}
            <div>
              <label className={labelClass}>Toon eenheden</label>
              <div className="grid grid-cols-4 gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input 
                    type="checkbox" 
                    checked={block.data.showDays !== false} 
                    onChange={e => onChange({ showDays: e.target.checked })} 
                  />
                  Dagen
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input 
                    type="checkbox" 
                    checked={block.data.showHours !== false} 
                    onChange={e => onChange({ showHours: e.target.checked })} 
                  />
                  Uren
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input 
                    type="checkbox" 
                    checked={block.data.showMinutes !== false} 
                    onChange={e => onChange({ showMinutes: e.target.checked })} 
                  />
                  Min
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input 
                    type="checkbox" 
                    checked={block.data.showSeconds !== false} 
                    onChange={e => onChange({ showSeconds: e.target.checked })} 
                  />
                  Sec
                </label>
              </div>
            </div>
            
            {/* Custom labels */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <h4 className="text-xs font-semibold text-gray-700">Labels (optioneel)</h4>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className={labelClass}>Dagen</label>
                  <input 
                    type="text" 
                    value={block.data.daysLabel || 'Dagen'} 
                    onChange={e => onChange({ daysLabel: e.target.value })} 
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Uren</label>
                  <input 
                    type="text" 
                    value={block.data.hoursLabel || 'Uren'} 
                    onChange={e => onChange({ hoursLabel: e.target.value })} 
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Minuten</label>
                  <input 
                    type="text" 
                    value={block.data.minutesLabel || 'Minuten'} 
                    onChange={e => onChange({ minutesLabel: e.target.value })} 
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Seconden</label>
                  <input 
                    type="text" 
                    value={block.data.secondsLabel || 'Seconden'} 
                    onChange={e => onChange({ secondsLabel: e.target.value })} 
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            
            {/* Colors */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg space-y-3 border border-purple-200">
              <h4 className="text-xs font-semibold text-purple-800">🎨 Kleuren</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <ColorPicker 
                  label="Achtergrond" 
                  value={block.data.bgColor || '#1e3a5f'} 
                  onChange={v => onChange({ bgColor: v })} 
                />
                <ColorPicker 
                  label="Tekst kleur" 
                  value={block.data.textColor || '#ffffff'} 
                  onChange={v => onChange({ textColor: v })} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <ColorPicker 
                  label="Nummer kleur" 
                  value={block.data.numberColor || '#ffffff'} 
                  onChange={v => onChange({ numberColor: v })} 
                />
                <ColorPicker 
                  label="Label kleur" 
                  value={block.data.labelColor || 'rgba(255,255,255,0.7)'} 
                  onChange={v => onChange({ labelColor: v })} 
                />
              </div>
              
              {(block.data.style === 'cards' || block.data.style === 'flip') && (
                <div className="grid grid-cols-2 gap-2">
                  <ColorPicker 
                    label="Kaart achtergrond" 
                    value={block.data.cardBg || 'rgba(255,255,255,0.1)'} 
                    onChange={v => onChange({ cardBg: v })} 
                  />
                  <ColorPicker 
                    label="Kaart rand" 
                    value={block.data.cardBorder || 'rgba(255,255,255,0.2)'} 
                    onChange={v => onChange({ cardBorder: v })} 
                  />
                </div>
              )}
              
              {block.data.style === 'circular' && (
                <ColorPicker 
                  label="Voortgang kleur" 
                  value={block.data.accentColor || '#3b82f6'} 
                  onChange={v => onChange({ accentColor: v })} 
                />
              )}
            </div>
            
            {/* Expired settings */}
            <div className="p-3 bg-yellow-50 rounded-lg space-y-2 border border-yellow-200">
              <h4 className="text-xs font-semibold text-yellow-800">⌛ Na afloop</h4>
              
              <div>
                <label className={labelClass}>Verlopen titel</label>
                <input 
                  type="text" 
                  value={block.data.expiredTitle || 'De tijd is verstreken!'} 
                  onChange={e => onChange({ expiredTitle: e.target.value })} 
                  className={inputClass}
                />
              </div>
              
              <div>
                <label className={labelClass}>Verlopen bericht (optioneel)</label>
                <textarea 
                  value={block.data.expiredMessage || ''} 
                  onChange={e => onChange({ expiredMessage: e.target.value })} 
                  className={inputClass}
                  rows={2}
                  placeholder="Optioneel extra bericht..."
                />
              </div>
              
              <label className="flex items-center gap-2 text-xs">
                <input 
                  type="checkbox" 
                  checked={block.data.hideWhenExpired || false} 
                  onChange={e => onChange({ hideWhenExpired: e.target.checked })} 
                />
                Verberg countdown na afloop
              </label>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Geen editor beschikbaar voor dit bloktype.</p>;
    }
  };

  const handleEffectsChange = (effects) => {
    onChange({ effects });
  };

  return (
    <div className="space-y-4">
      {renderEditor()}
      
      {/* Block-level Overlay Settings */}
      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
        <h4 className="text-xs font-semibold text-orange-800 mb-2">📐 Blok Overlay / Overlap</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Overlap boven (px)</label>
            <input 
              type="number" 
              value={block.data.overlapTop || 0}
              onChange={e => onChange({ overlapTop: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 border rounded text-sm" 
              placeholder="0 = geen" 
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Negatief = schuift omhoog</p>
          </div>
          <div>
            <label className="text-xs text-gray-600">Z-index</label>
            <input 
              type="number" 
              value={block.data.zIndex || 0}
              onChange={e => onChange({ zIndex: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 border rounded text-sm" 
              placeholder="0 = standaard" 
            />
          </div>
        </div>
      </div>
      
      {/* Effects Panel - available for all block types */}
      <EffectsPanel 
        effects={block.data.effects || {}} 
        onChange={handleEffectsChange} 
      />
      
      <MediaLibrary isOpen={showMedia} onClose={() => { setShowMedia(false); setMediaTarget(null); setMediaFilterType(null); }} onSelect={handleMediaSelect} filterType={mediaFilterType} />
    </div>
  );
}

/* ============================================================================
   CardItemEditor - Individual card editor with per-card effects
   ============================================================================ */
const CARD_EFFECTS = {
  hover: [
    { value: '', label: 'Geen hover' },
    { value: 'effect-hover-zoom', label: 'Zoom' },
    { value: 'effect-hover-lift', label: 'Optillen' },
    { value: 'effect-hover-glow', label: 'Gloed (blauw)' },
    { value: 'effect-hover-glow-success', label: 'Gloed (groen)' },
    { value: 'effect-hover-glow-warning', label: 'Gloed (oranje)' },
    { value: 'effect-hover-shine', label: 'Schijnen' },
    { value: 'effect-hover-pulse', label: 'Pulseren' },
    { value: 'effect-hover-tilt', label: '3D Kantelen' },
  ],
  flip: [
    { value: '', label: 'Geen flip' },
    { value: 'horizontal', label: 'Horizontaal draaien' },
    { value: 'vertical', label: 'Verticaal draaien' },
  ],
  animation: [
    { value: '', label: 'Geen animatie' },
    { value: 'effect-anim-fade-in-up', label: 'Fade In Up' },
    { value: 'effect-anim-zoom-in', label: 'Zoom In' },
    { value: 'effect-anim-bounce', label: 'Bounce' },
  ],
};

function CardItemEditor({ item, index, onUpdate, onDelete, onSelectImage }) {
  const [showEffects, setShowEffects] = useState(false);
  const effects = item.effects || {};
  
  const updateField = (field, value) => {
    onUpdate({ ...item, [field]: value });
  };
  
  const updateEffect = (key, value) => {
    onUpdate({ 
      ...item, 
      effects: { ...effects, [key]: value }
    });
  };

  const updateFlipSetting = (key, value) => {
    onUpdate({
      ...item,
      effects: {
        ...effects,
        flipSettings: { ...(effects.flipSettings || {}), [key]: value }
      }
    });
  };

  const inputClass = "w-full px-2 py-1 border border-gray-300 rounded text-xs";
  const selectClass = "w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white";
  const hasEffects = effects.hover || effects.flip || effects.animation;

  return (
    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500">Kaart {index + 1}</span>
        <button type="button" onClick={onDelete} className="text-red-400 hover:text-red-600 text-xs">✕</button>
      </div>
      
      {/* Image */}
      {item.image ? (
        <img src={item.image} alt="" className="w-full h-20 object-cover rounded cursor-pointer" onClick={onSelectImage} />
      ) : (
        <button type="button" onClick={onSelectImage}
          className="w-full py-3 border border-dashed rounded text-xs text-gray-400 hover:border-blue-400">+ Afbeelding</button>
      )}
      
      {/* Basic fields */}
      <input type="text" value={item.title || ''} placeholder="Titel"
        onChange={e => updateField('title', e.target.value)} className={inputClass} />
      <textarea value={item.description || ''} placeholder="Beschrijving" rows={2}
        onChange={e => updateField('description', e.target.value)} className={inputClass} />
      <input type="text" value={item.link || ''} placeholder="Link URL"
        onChange={e => updateField('link', e.target.value)} className={inputClass} />
      
      {/* Effects toggle */}
      <button
        type="button"
        onClick={() => setShowEffects(!showEffects)}
        className={`w-full py-1.5 text-xs rounded flex items-center justify-center gap-1 transition-colors ${
          hasEffects ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        ✨ Effecten {hasEffects && '●'} {showEffects ? '▲' : '▼'}
      </button>
      
      {/* Effects panel */}
      {showEffects && (
        <div className="p-2 bg-white rounded border border-gray-200 space-y-2">
          {/* Hover effect */}
          <div>
            <label className="text-xs text-gray-500">Hover effect</label>
            <select value={effects.hover || ''} onChange={e => updateEffect('hover', e.target.value)} className={selectClass}>
              {CARD_EFFECTS.hover.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {/* Animation */}
          <div>
            <label className="text-xs text-gray-500">Animatie (bij laden)</label>
            <select value={effects.animation || ''} onChange={e => updateEffect('animation', e.target.value)} className={selectClass}>
              {CARD_EFFECTS.animation.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {/* Card flip */}
          <div>
            <label className="text-xs text-gray-500">Kaart omdraaien</label>
            <select value={effects.flip || ''} onChange={e => updateEffect('flip', e.target.value)} className={selectClass}>
              {CARD_EFFECTS.flip.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {/* Flip settings */}
          {effects.flip && (
            <div className="p-2 bg-gray-50 rounded space-y-2">
              <p className="text-xs font-medium text-gray-500">Achterkant kaart</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400">Achtergrond</label>
                  <input
                    type="color"
                    value={effects.flipSettings?.backgroundColor || '#2563eb'}
                    onChange={e => updateFlipSetting('backgroundColor', e.target.value)}
                    className="w-full h-7 rounded cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400">Tekstkleur</label>
                  <input
                    type="color"
                    value={effects.flipSettings?.textColor || '#ffffff'}
                    onChange={e => updateFlipSetting('textColor', e.target.value)}
                    className="w-full h-7 rounded cursor-pointer"
                  />
                </div>
              </div>
              <input
                type="text"
                value={effects.flipSettings?.backTitle || ''}
                onChange={e => updateFlipSetting('backTitle', e.target.value)}
                placeholder="Titel achterkant (optioneel)"
                className={inputClass}
              />
              <textarea
                value={effects.flipSettings?.backContent || ''}
                onChange={e => updateFlipSetting('backContent', e.target.value)}
                placeholder="Tekst achterkant"
                rows={2}
                className={inputClass}
              />
              <input
                type="text"
                value={effects.flipSettings?.buttonText || ''}
                onChange={e => updateFlipSetting('buttonText', e.target.value)}
                placeholder="Button tekst (optioneel)"
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}