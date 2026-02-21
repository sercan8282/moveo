import { useState } from 'react';

/* ============================================================================
   EffectsPanel - UI for configuring block effects
   ============================================================================ */

const EFFECT_CATEGORIES = {
  hover: {
    label: '🎯 Hover Effecten',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-hover-zoom', label: 'Zoom In' },
      { value: 'effect-hover-zoom-lg', label: 'Zoom In (groot)' },
      { value: 'effect-hover-zoom-out', label: 'Zoom Out' },
      { value: 'effect-hover-lift', label: 'Optillen' },
      { value: 'effect-hover-lift-sm', label: 'Optillen (klein)' },
      { value: 'effect-hover-rotate', label: 'Roteren' },
      { value: 'effect-hover-rotate-reverse', label: 'Roteren (omgekeerd)' },
      { value: 'effect-hover-tilt', label: '3D Kantelen' },
      { value: 'effect-hover-glow', label: 'Gloed (blauw)' },
      { value: 'effect-hover-glow-success', label: 'Gloed (groen)' },
      { value: 'effect-hover-glow-warning', label: 'Gloed (oranje)' },
      { value: 'effect-hover-glow-danger', label: 'Gloed (rood)' },
      { value: 'effect-hover-shine', label: 'Schijnen' },
      { value: 'effect-hover-pulse', label: 'Pulseren' },
      { value: 'effect-hover-shake', label: 'Schudden' },
      { value: 'effect-hover-bounce', label: 'Stuiteren' },
    ]
  },
  overlay: {
    label: '🎨 Hover Overlay',
    description: 'Toon een kleur met tekst bij hover',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-hover-overlay', label: 'Fade In' },
      { value: 'effect-hover-overlay effect-hover-overlay-slide-up', label: 'Slide Up' },
      { value: 'effect-hover-overlay effect-hover-overlay-slide-down', label: 'Slide Down' },
      { value: 'effect-hover-overlay effect-hover-overlay-slide-left', label: 'Slide Left' },
      { value: 'effect-hover-overlay effect-hover-overlay-slide-right', label: 'Slide Right' },
      { value: 'effect-hover-overlay effect-hover-overlay-zoom', label: 'Zoom In' },
    ]
  },
  cardFlip: {
    label: '🃏 Kaart Omdraaien',
    description: 'Draai de kaart om bij hover om achterkant te tonen',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-card-flip', label: 'Horizontaal draaien' },
      { value: 'effect-card-flip effect-card-flip-vertical', label: 'Verticaal draaien' },
    ]
  },
  text: {
    label: '✨ Tekst Effecten',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-text-gradient', label: 'Gradient (paars)' },
      { value: 'effect-text-gradient-rainbow', label: 'Gradient (regenboog)' },
      { value: 'effect-text-gradient-gold', label: 'Gradient (goud)' },
      { value: 'effect-text-gradient-ocean', label: 'Gradient (oceaan)' },
      { value: 'effect-text-gradient-fire', label: 'Gradient (vuur)' },
      { value: 'effect-text-shadow', label: 'Schaduw' },
      { value: 'effect-text-shadow-lg', label: 'Schaduw (groot)' },
      { value: 'effect-text-shadow-glow', label: 'Gloed (blauw)' },
      { value: 'effect-text-shadow-glow-white', label: 'Gloed (wit)' },
      { value: 'effect-text-shadow-neon', label: 'Neon' },
      { value: 'effect-text-shadow-retro', label: 'Retro 3D' },
      { value: 'effect-text-outline', label: 'Outline' },
      { value: 'effect-text-outline-thick', label: 'Outline (dik)' },
    ]
  },
  shadow: {
    label: '🌑 Schaduw Effecten',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-shadow-sm', label: 'Klein' },
      { value: 'effect-shadow', label: 'Normaal' },
      { value: 'effect-shadow-md', label: 'Medium' },
      { value: 'effect-shadow-lg', label: 'Groot' },
      { value: 'effect-shadow-xl', label: 'Extra groot' },
      { value: 'effect-shadow-2xl', label: 'Mega' },
      { value: 'effect-shadow-inner', label: 'Inward' },
      { value: 'effect-shadow-blue', label: 'Blauw' },
      { value: 'effect-shadow-green', label: 'Groen' },
      { value: 'effect-shadow-red', label: 'Rood' },
      { value: 'effect-shadow-purple', label: 'Paars' },
      { value: 'effect-shadow-orange', label: 'Oranje' },
      { value: 'effect-shadow-neumorphism', label: 'Neumorfisme' },
    ]
  },
  animation: {
    label: '🎬 Animatie Effecten',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-anim-fade-in', label: 'Fade In' },
      { value: 'effect-anim-fade-in-up', label: 'Fade In (omhoog)' },
      { value: 'effect-anim-fade-in-down', label: 'Fade In (omlaag)' },
      { value: 'effect-anim-fade-in-left', label: 'Fade In (links)' },
      { value: 'effect-anim-fade-in-right', label: 'Fade In (rechts)' },
      { value: 'effect-anim-zoom-in', label: 'Zoom In' },
      { value: 'effect-anim-zoom-out', label: 'Zoom Out' },
      { value: 'effect-anim-bounce', label: 'Bounce' },
      { value: 'effect-anim-flip', label: 'Flip' },
      { value: 'effect-anim-rotate', label: 'Roteren' },
      { value: 'effect-anim-slide-up', label: 'Slide Up' },
      { value: 'effect-anim-slide-down', label: 'Slide Down' },
    ]
  },
  continuous: {
    label: '🔄 Continue Animaties',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-anim-pulse', label: 'Pulseren' },
      { value: 'effect-anim-float', label: 'Zweven' },
      { value: 'effect-anim-swing', label: 'Slingeren' },
      { value: 'effect-anim-heartbeat', label: 'Hartslag' },
      { value: 'effect-anim-spin', label: 'Draaien' },
    ]
  },
  filter: {
    label: '🎭 Filter Effecten',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-filter-grayscale', label: 'Zwart-wit (kleur bij hover)' },
      { value: 'effect-filter-sepia', label: 'Sepia' },
      { value: 'effect-filter-blur', label: 'Blur (scherp bij hover)' },
      { value: 'effect-filter-brightness', label: 'Donker (licht bij hover)' },
      { value: 'effect-filter-contrast', label: 'Hoog contrast' },
      { value: 'effect-filter-saturate', label: 'Verzadigd' },
      { value: 'effect-filter-hue-rotate', label: 'Kleur roteren (bij hover)' },
    ]
  },
  border: {
    label: '🔲 Border Effecten',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-border-glow', label: 'Gloed bij hover' },
      { value: 'effect-border-gradient', label: 'Gradient border' },
    ]
  },
  glass: {
    label: '🪟 Glasmorfisme',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-glass', label: 'Glas (licht)' },
      { value: 'effect-glass-dark', label: 'Glas (donker)' },
    ]
  },
  reveal: {
    label: '👁️ Scroll Reveal',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-reveal', label: 'Fade Up' },
      { value: 'effect-reveal-left', label: 'Van links' },
      { value: 'effect-reveal-right', label: 'Van rechts' },
      { value: 'effect-reveal-scale', label: 'Schaal' },
    ]
  },
  delay: {
    label: '⏱️ Animatie Vertraging',
    options: [
      { value: '', label: 'Geen' },
      { value: 'effect-delay-100', label: '0.1s' },
      { value: 'effect-delay-200', label: '0.2s' },
      { value: 'effect-delay-300', label: '0.3s' },
      { value: 'effect-delay-400', label: '0.4s' },
      { value: 'effect-delay-500', label: '0.5s' },
      { value: 'effect-delay-700', label: '0.7s' },
      { value: 'effect-delay-1000', label: '1s' },
    ]
  },
  duration: {
    label: '⚡ Animatie Snelheid',
    options: [
      { value: '', label: 'Normaal' },
      { value: 'effect-duration-fast', label: 'Snel' },
      { value: 'effect-duration-slow', label: 'Langzaam' },
      { value: 'effect-duration-slower', label: 'Zeer langzaam' },
    ]
  }
};

export default function EffectsPanel({ effects = {}, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('hover');

  const handleEffectChange = (category, value) => {
    onChange({
      ...effects,
      [category]: value
    });
  };

  const handleOverlaySettingChange = (key, value) => {
    onChange({
      ...effects,
      overlaySettings: {
        ...(effects.overlaySettings || {}),
        [key]: value
      }
    });
  };

  const handleCardFlipSettingChange = (key, value) => {
    onChange({
      ...effects,
      cardFlipSettings: {
        ...(effects.cardFlipSettings || {}),
        [key]: value
      }
    });
  };

  const activeEffectsCount = Object.values(effects).filter(v => v && typeof v === 'string' && v !== '').length;

  const tabs = [
    { id: 'hover', label: '🎯 Hover', categories: ['hover', 'overlay'] },
    { id: 'visual', label: '✨ Visueel', categories: ['shadow', 'filter', 'border', 'glass'] },
    { id: 'text', label: '📝 Tekst', categories: ['text'] },
    { id: 'animation', label: '🎬 Animatie', categories: ['animation', 'continuous', 'reveal', 'delay', 'duration'] },
    { id: 'special', label: '🃏 Speciaal', categories: ['cardFlip'] },
  ];

  const inputClass = "w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const selectClass = "w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center justify-between hover:from-purple-100 hover:to-blue-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          ✨ Effecten
          {activeEffectsCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeEffectsCount}
            </span>
          )}
        </span>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-3 bg-gray-50 space-y-3">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category panels */}
          <div className="space-y-3">
            {tabs.find(t => t.id === activeTab)?.categories.map(categoryKey => {
              const category = EFFECT_CATEGORIES[categoryKey];
              if (!category) return null;

              return (
                <div key={categoryKey} className="bg-white rounded-lg p-3 space-y-2">
                  <label className={labelClass}>{category.label}</label>
                  {category.description && (
                    <p className="text-xs text-gray-400 mb-2">{category.description}</p>
                  )}
                  
                  <select
                    value={effects[categoryKey] || ''}
                    onChange={(e) => handleEffectChange(categoryKey, e.target.value)}
                    className={selectClass}
                  >
                    {category.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {/* Overlay settings */}
                  {categoryKey === 'overlay' && effects.overlay && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <p className="text-xs font-medium text-gray-500">Overlay Instellingen</p>
                      <div>
                        <label className={labelClass}>Achtergrondkleur</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={effects.overlaySettings?.backgroundColor || '#2563eb'}
                            onChange={(e) => handleOverlaySettingChange('backgroundColor', e.target.value)}
                            className="w-10 h-8 rounded border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={effects.overlaySettings?.backgroundColor || '#2563eb'}
                            onChange={(e) => handleOverlaySettingChange('backgroundColor', e.target.value)}
                            className={inputClass}
                            placeholder="#2563eb"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Transparantie</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={effects.overlaySettings?.opacity ?? 85}
                          onChange={(e) => handleOverlaySettingChange('opacity', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{effects.overlaySettings?.opacity ?? 85}%</span>
                      </div>
                      <div>
                        <label className={labelClass}>Titel</label>
                        <input
                          type="text"
                          value={effects.overlaySettings?.title || ''}
                          onChange={(e) => handleOverlaySettingChange('title', e.target.value)}
                          className={inputClass}
                          placeholder="Hover tekst titel"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Beschrijving</label>
                        <textarea
                          value={effects.overlaySettings?.description || ''}
                          onChange={(e) => handleOverlaySettingChange('description', e.target.value)}
                          className={inputClass}
                          rows={2}
                          placeholder="Hover tekst beschrijving"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Tekstkleur</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={effects.overlaySettings?.textColor || '#ffffff'}
                            onChange={(e) => handleOverlaySettingChange('textColor', e.target.value)}
                            className="w-10 h-8 rounded border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={effects.overlaySettings?.textColor || '#ffffff'}
                            onChange={(e) => handleOverlaySettingChange('textColor', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card flip settings */}
                  {categoryKey === 'cardFlip' && effects.cardFlip && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <p className="text-xs font-medium text-gray-500">Achterkant Kaart</p>
                      <div>
                        <label className={labelClass}>Achtergrondkleur</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={effects.cardFlipSettings?.backgroundColor || '#2563eb'}
                            onChange={(e) => handleCardFlipSettingChange('backgroundColor', e.target.value)}
                            className="w-10 h-8 rounded border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={effects.cardFlipSettings?.backgroundColor || '#2563eb'}
                            onChange={(e) => handleCardFlipSettingChange('backgroundColor', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Titel (achterkant)</label>
                        <input
                          type="text"
                          value={effects.cardFlipSettings?.backTitle || ''}
                          onChange={(e) => handleCardFlipSettingChange('backTitle', e.target.value)}
                          className={inputClass}
                          placeholder="Titel op achterkant"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Tekst (achterkant)</label>
                        <textarea
                          value={effects.cardFlipSettings?.backContent || ''}
                          onChange={(e) => handleCardFlipSettingChange('backContent', e.target.value)}
                          className={inputClass}
                          rows={3}
                          placeholder="Inhoud op achterkant van de kaart"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Tekstkleur</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={effects.cardFlipSettings?.textColor || '#ffffff'}
                            onChange={(e) => handleCardFlipSettingChange('textColor', e.target.value)}
                            className="w-10 h-8 rounded border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={effects.cardFlipSettings?.textColor || '#ffffff'}
                            onChange={(e) => handleCardFlipSettingChange('textColor', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Button tekst (optioneel)</label>
                        <input
                          type="text"
                          value={effects.cardFlipSettings?.buttonText || ''}
                          onChange={(e) => handleCardFlipSettingChange('buttonText', e.target.value)}
                          className={inputClass}
                          placeholder="Bijv. 'Meer info'"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Button link (optioneel)</label>
                        <input
                          type="text"
                          value={effects.cardFlipSettings?.buttonLink || ''}
                          onChange={(e) => handleCardFlipSettingChange('buttonLink', e.target.value)}
                          className={inputClass}
                          placeholder="/pagina of https://..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reset button */}
          {activeEffectsCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="w-full py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            >
              🗑️ Alle effecten verwijderen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to build effect classes from settings
export function buildEffectClasses(effects = {}) {
  if (!effects || typeof effects !== 'object') return '';
  
  const classes = [];
  
  // Add simple effect classes
  ['hover', 'overlay', 'cardFlip', 'text', 'shadow', 'animation', 'continuous', 'filter', 'border', 'glass', 'reveal', 'delay', 'duration'].forEach(key => {
    if (effects[key]) {
      classes.push(effects[key]);
    }
  });
  
  return classes.join(' ');
}

// Helper function to build overlay style
export function buildOverlayStyle(overlaySettings = {}) {
  const opacity = (overlaySettings.opacity ?? 85) / 100;
  const bgColor = overlaySettings.backgroundColor || '#2563eb';
  
  // Convert hex to rgba
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
    color: overlaySettings.textColor || '#ffffff'
  };
}
