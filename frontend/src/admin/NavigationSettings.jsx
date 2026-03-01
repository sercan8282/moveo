import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const BUTTON_EFFECTS = [
  // Basic
  { value: 'none', label: 'Geen', category: 'basic' },
  { value: 'scale', label: 'Scale', category: 'basic' },
  { value: 'lift', label: 'Lift', category: 'basic' },
  { value: 'scalePop', label: 'Pop', category: 'basic' },
  { value: 'press3d', label: '3D Press', category: 'basic' },
  // Fill
  { value: 'fillLR', label: '→ Links naar Rechts', category: 'fill' },
  { value: 'fillRL', label: '← Rechts naar Links', category: 'fill' },
  { value: 'fillCenter', label: '↔ Vanuit Midden', category: 'fill' },
  { value: 'fillDiagonal', label: '⤡ Diagonaal', category: 'fill' },
  { value: 'fillBT', label: '↑ Omhoog', category: 'fill' },
  { value: 'fillTB', label: '↓ Omlaag', category: 'fill' },
  { value: 'shine', label: '✨ Shine', category: 'fill' },
  { value: 'ripple', label: '◎ Ripple', category: 'fill' },
  { value: 'pillFill', label: '💊 Pill Fill', category: 'fill' },
  { value: 'skewFill', label: '⟋ Skew Fill', category: 'fill' },
  { value: 'slideFill', label: '▶ Slide Fill', category: 'fill' },
  { value: 'expandUp', label: '⬆ Expand Up', category: 'fill' },
  { value: 'circleExpand', label: '◉ Circle Expand', category: 'fill' },
  // Glow
  { value: 'glowPulse', label: '💡 Glow Pulse', category: 'glow' },
  { value: 'glowBorder', label: '✨ Glow Border', category: 'glow' },
  { value: 'glowCorners', label: '⊡ Glow Corners', category: 'glow' },
  // Border
  { value: 'borderDraw', label: '🔲 Border Draw', category: 'border' },
  { value: 'borderGlow', label: '🌟 Border Glow', category: 'border' },
  { value: 'borderExpand', label: '📐 Border Expand', category: 'border' },
  { value: 'borderBox', label: '📦 Border Box', category: 'border' },
  { value: 'cornerFold', label: '📄 Corner Fold', category: 'border' },
  { value: 'borderTrace', label: '〰 Border Trace', category: 'border' },
  // Neon
  { value: 'neonGlow', label: '💜 Neon Glow', category: 'neon' },
  { value: 'neonFlicker', label: '💡 Neon Flicker', category: 'neon' },
  { value: 'neonPulse', label: '💚 Neon Pulse', category: 'neon' },
  // Gradient
  { value: 'gradientShift', label: '🌈 Gradient Shift', category: 'gradient' },
  { value: 'gradientRotate', label: '🔄 Gradient Rotate', category: 'gradient' },
  { value: 'rainbow', label: '🌈 Rainbow', category: 'gradient' },
  // Special
  { value: 'spotlight', label: '🔦 Spotlight', category: 'special' },
];

const BUTTON_SHAPES = [
  { value: 'none', label: 'Geen achtergrond', icon: 'ab' },
  { value: 'square', label: 'Vierkant', icon: '▢' },
  { value: 'round', label: 'Rond', icon: '○' },
  { value: 'pill', label: 'Pill', icon: '⬭' },
  { value: 'parallelogram', label: 'Schuin', icon: '▱' },
];

export default function NavigationSettings() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  
  const [settings, setSettings] = useState({
    // Enable override
    enabled: false,
    
    // General
    bgColor: '#1e40af',
    bgOpacity: 100,
    bgEffect: 'none', // none, solid, gradient, glass, animated, blur
    bgGradientFrom: '#1e40af',
    bgGradientTo: '#3b82f6',
    bgGradientDirection: 'to-right',
    bgBlurStrength: 20,
    bgEffectOpacity: 70,
    bgAnimationSpeed: 8,
    bgImage: null, // background image URL
    bgBlur: false,
    textColor: '#ffffff',
    sticky: true,
    height: 72,
    
    // Typography
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.01,
    uppercase: false,
    
    // Spacing
    gap: 32,
    itemPadding: 8,
    
    // Button style (applies to all nav items)
    globalButtonStyle: true, // Use global style or per-item
    buttonShape: 'none',
    buttonBgColor: '#3b82f6',
    buttonBgOpacity: 100,
    buttonTextColor: '#ffffff',
    buttonHoverColor: '#2563eb',
    buttonHoverTextColor: '#ffffff', // NEW: hover text color
    buttonEffect: 'none',
    buttonEffectColor: '#3b82f6', // NEW: effect color (neon, border, etc.)
    buttonBorderRadius: 8,
    buttonPaddingX: 16,
    buttonPaddingY: 8,
    
    // Hover effects
    hoverEffect: 'slide-up',
    hoverColor: '#3b82f6',
    
    // Logo
    logoMaxHeight: 48,
    logoMaxWidth: 200,
    
    // Mobile menu
    mobileMenuBgOpacity: 100,
    mobileItemPadding: 12,
  });

  useEffect(() => {
    loadSettings();
    loadMenuItems();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.navigation_settings) {
        const navSettings = typeof res.data.navigation_settings === 'string' 
          ? JSON.parse(res.data.navigation_settings) 
          : res.data.navigation_settings;
        setSettings(prev => ({ ...prev, ...navSettings }));
      }
    } catch (error) {
      console.error('Failed to load navigation settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const res = await api.get('/public/menus/header');
      setMenuItems(res.data?.items || []);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings/navigation_settings', { value: settings });
      toast.success('Navigatie instellingen opgeslagen!');
    } catch (error) {
      toast.error('Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Preview styles
  const previewBgStyle = {
    backgroundColor: settings.bgColor,
    opacity: settings.bgOpacity / 100,
  };

  const previewButtonStyle = settings.buttonShape !== 'none' ? {
    backgroundColor: `${settings.buttonBgColor}${Math.round(settings.buttonBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
    color: settings.buttonTextColor,
    padding: `${settings.buttonPaddingY}px ${settings.buttonPaddingX}px`,
    borderRadius: settings.buttonShape === 'round' ? '50%' : 
                  settings.buttonShape === 'pill' ? '9999px' : 
                  `${settings.buttonBorderRadius}px`,
    transform: settings.buttonShape === 'parallelogram' ? 'skewX(-12deg)' : 'none',
  } : {
    color: settings.textColor,
    padding: `${settings.buttonPaddingY}px ${settings.buttonPaddingX}px`,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Navigatie Instellingen</h2>
          <p className="text-sm text-gray-500 mt-1">
            Beheer de styling van je navigatiemenu vanuit één plek
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Opslaan...
            </>
          ) : (
            'Opslaan'
          )}
        </button>
      </div>

      {/* Enable Override Toggle */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => updateSetting('enabled', e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <div>
            <span className="font-semibold text-gray-800">Navigatie instellingen activeren</span>
            <p className="text-sm text-gray-600">
              Wanneer actief, overschrijven deze instellingen de thema-instellingen voor de navigatie
            </p>
          </div>
        </label>
      </div>

      {/* Preview */}
      <div className="bg-gray-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-medium text-gray-500 mb-3">PREVIEW</p>
        <div 
          className="rounded-lg overflow-hidden"
          style={{ 
            backgroundColor: settings.bgColor,
          }}
        >
          <div 
            className="flex items-center justify-between px-6"
            style={{ 
              height: `${settings.height}px`,
              opacity: settings.bgOpacity / 100,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
              <span className="text-white font-bold">Logo</span>
            </div>
            <nav className="flex items-center" style={{ gap: `${settings.gap}px` }}>
              {['Home', 'Over Ons', 'Diensten', 'Contact'].map((item, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className={`nav-btn-effect nav-btn-effect-${settings.buttonEffect} transition-all duration-300 relative overflow-hidden`}
                  style={{
                    ...previewButtonStyle,
                    fontSize: `${settings.fontSize}px`,
                    fontWeight: settings.fontWeight,
                    letterSpacing: `${settings.letterSpacing}em`,
                    textTransform: settings.uppercase ? 'uppercase' : 'none',
                    '--btn-color': settings.buttonEffectColor || settings.buttonBgColor,
                    '--btn-hover-color': settings.buttonHoverColor,
                    '--btn-glow-color': `${settings.buttonEffectColor || settings.buttonBgColor}80`,
                    '--btn-text-hover': settings.buttonHoverTextColor || '#ffffff',
                    '--surface-color': settings.bgColor,
                  }}
                >
                  <span className={`relative z-10 ${settings.buttonShape === 'parallelogram' ? 'skew-x-[12deg] inline-block' : ''}`}>
                    {item}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'general', label: 'Algemeen', icon: '⚙️' },
          { id: 'buttons', label: 'Buttons', icon: '🔘' },
          { id: 'typography', label: 'Typografie', icon: '🔤' },
          { id: 'spacing', label: 'Spacing', icon: '↔️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Background */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>🎨</span> Achtergrond
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kleur</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.bgColor}
                      onChange={(e) => updateSetting('bgColor', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={settings.bgColor}
                      onChange={(e) => updateSetting('bgColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Transparantie: {settings.bgOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.bgOpacity}
                    onChange={(e) => updateSetting('bgOpacity', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Transparant</span>
                    <span>Volledig</span>
                  </div>
                </div>
              </div>
              
              {/* Background Effect Type */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Achtergrond Effect</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { value: 'none', label: 'Geen', icon: '◻️' },
                    { value: 'solid', label: 'Solid', icon: '⬛' },
                    { value: 'gradient', label: 'Gradient', icon: '🌈' },
                    { value: 'glass', label: 'Glass', icon: '🪟' },
                    { value: 'animated', label: 'Animated', icon: '✨' },
                    { value: 'blur', label: 'Blur', icon: '🌫️' },
                  ].map(effect => (
                    <button
                      key={effect.value}
                      type="button"
                      onClick={() => updateSetting('bgEffect', effect.value)}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        settings.bgEffect === effect.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-lg">{effect.icon}</span>
                      <span className="text-xs font-medium">{effect.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Gradient Options */}
              {settings.bgEffect === 'gradient' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-3">Gradient Instellingen</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Van</label>
                      <input
                        type="color"
                        value={settings.bgGradientFrom || settings.bgColor}
                        onChange={(e) => updateSetting('bgGradientFrom', e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Naar</label>
                      <input
                        type="color"
                        value={settings.bgGradientTo || '#3b82f6'}
                        onChange={(e) => updateSetting('bgGradientTo', e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Richting</label>
                      <select
                        value={settings.bgGradientDirection || 'to-right'}
                        onChange={(e) => updateSetting('bgGradientDirection', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="to-right">→ Rechts</option>
                        <option value="to-left">← Links</option>
                        <option value="to-bottom">↓ Onder</option>
                        <option value="to-top">↑ Boven</option>
                        <option value="diagonal">↘ Diagonaal</option>
                        <option value="diagonal-reverse">↗ Diagonaal (omgekeerd)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Glass Options */}
              {settings.bgEffect === 'glass' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <p className="text-xs font-medium text-gray-600">Glass Effect</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Blur Sterkte: {settings.bgBlurStrength || 20}px
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={settings.bgBlurStrength || 20}
                      onChange={(e) => updateSetting('bgBlurStrength', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Effect Transparantie: {settings.bgEffectOpacity ?? 70}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bgEffectOpacity ?? 70}
                      onChange={(e) => updateSetting('bgEffectOpacity', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              )}
              
              {/* Blur Only Options */}
              {settings.bgEffect === 'blur' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <p className="text-xs font-medium text-gray-600">Blur Achtergrond</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Blur Sterkte: {settings.bgBlurStrength || 12}px
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={settings.bgBlurStrength || 12}
                      onChange={(e) => updateSetting('bgBlurStrength', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              )}
              
              {/* Animated Options */}
              {settings.bgEffect === 'animated' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-2">Animated Gradient</p>
                  <p className="text-xs text-gray-500 mb-3">Bewegende gradient achtergrond</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Kleur 1</label>
                      <input
                        type="color"
                        value={settings.bgGradientFrom || '#3b82f6'}
                        onChange={(e) => updateSetting('bgGradientFrom', e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Kleur 2</label>
                      <input
                        type="color"
                        value={settings.bgGradientTo || '#8b5cf6'}
                        onChange={(e) => updateSetting('bgGradientTo', e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs text-gray-500 mb-1">
                      Animatie Snelheid: {settings.bgAnimationSpeed || 8}s
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={settings.bgAnimationSpeed || 8}
                      onChange={(e) => updateSetting('bgAnimationSpeed', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Snel</span>
                      <span>Langzaam</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Text Color */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>✏️</span> Tekst Kleur
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => updateSetting('textColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={(e) => updateSetting('textColor', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            {/* Height & Sticky */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hoogte: {settings.height}px
                </label>
                <input
                  type="range"
                  min="48"
                  max="120"
                  value={settings.height}
                  onChange={(e) => updateSetting('height', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={settings.sticky}
                    onChange={(e) => updateSetting('sticky', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Sticky navigatie</span>
                </label>
              </div>
            </div>

            {/* Logo Settings */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>🖼️</span> Logo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Max Hoogte: {settings.logoMaxHeight}px
                  </label>
                  <input
                    type="range"
                    min="24"
                    max="80"
                    value={settings.logoMaxHeight}
                    onChange={(e) => updateSetting('logoMaxHeight', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Max Breedte: {settings.logoMaxWidth}px
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="300"
                    value={settings.logoMaxWidth}
                    onChange={(e) => updateSetting('logoMaxWidth', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Tab */}
        {activeTab === 'buttons' && (
          <div className="space-y-6">
            {/* Button Shape */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>🔲</span> Button Vorm
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {BUTTON_SHAPES.map(shape => (
                  <button
                    key={shape.value}
                    type="button"
                    onClick={() => updateSetting('buttonShape', shape.value)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      settings.buttonShape === shape.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{shape.icon}</span>
                    <span className="text-xs font-medium">{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Button Colors - shown when shape or effect is selected */}
            {(settings.buttonShape !== 'none' || settings.buttonEffect !== 'none') && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🎨</span> Button Kleuren
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Achtergrond</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.buttonBgColor}
                        onChange={(e) => updateSetting('buttonBgColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                      <input
                        type="text"
                        value={settings.buttonBgColor}
                        onChange={(e) => updateSetting('buttonBgColor', e.target.value)}
                        className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tekst</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.buttonTextColor}
                        onChange={(e) => updateSetting('buttonTextColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                      <input
                        type="text"
                        value={settings.buttonTextColor}
                        onChange={(e) => updateSetting('buttonTextColor', e.target.value)}
                        className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hover</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.buttonHoverColor}
                        onChange={(e) => updateSetting('buttonHoverColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                      />
                      <input
                        type="text"
                        value={settings.buttonHoverColor}
                        onChange={(e) => updateSetting('buttonHoverColor', e.target.value)}
                        className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Button Opacity */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Button Transparantie: {settings.buttonBgOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.buttonBgOpacity}
                    onChange={(e) => updateSetting('buttonBgOpacity', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Button Border Radius & Padding */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Border Radius: {settings.buttonBorderRadius}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={settings.buttonBorderRadius}
                      onChange={(e) => updateSetting('buttonBorderRadius', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Padding X: {settings.buttonPaddingX}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={settings.buttonPaddingX}
                      onChange={(e) => updateSetting('buttonPaddingX', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Padding Y: {settings.buttonPaddingY}px
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="16"
                      value={settings.buttonPaddingY}
                      onChange={(e) => updateSetting('buttonPaddingY', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Button Effects */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>✨</span> Button Effect
              </h3>
              
              {/* Basic Effects */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Basis</p>
                <div className="grid grid-cols-5 gap-2">
                  {BUTTON_EFFECTS.filter(e => e.category === 'basic').map(effect => (
                    <button
                      key={effect.value}
                      type="button"
                      onClick={() => updateSetting('buttonEffect', effect.value)}
                      className={`px-3 py-2 rounded-lg text-xs border-2 transition-all ${
                        settings.buttonEffect === effect.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fill Effects */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Fill Animaties</p>
                <div className="grid grid-cols-4 gap-2">
                  {BUTTON_EFFECTS.filter(e => e.category === 'fill').map(effect => (
                    <button
                      key={effect.value}
                      type="button"
                      onClick={() => updateSetting('buttonEffect', effect.value)}
                      className={`px-3 py-2 rounded-lg text-xs border-2 transition-all ${
                        settings.buttonEffect === effect.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glow & Neon Effects */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Glow & Neon</p>
                <div className="grid grid-cols-5 gap-2">
                  {BUTTON_EFFECTS.filter(e => ['glow', 'neon'].includes(e.category)).map(effect => (
                    <button
                      key={effect.value}
                      type="button"
                      onClick={() => updateSetting('buttonEffect', effect.value)}
                      className={`px-3 py-2 rounded-lg text-xs border-2 transition-all ${
                        settings.buttonEffect === effect.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Effects */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Border Effecten</p>
                <div className="grid grid-cols-5 gap-2">
                  {BUTTON_EFFECTS.filter(e => e.category === 'border').map(effect => (
                    <button
                      key={effect.value}
                      type="button"
                      onClick={() => updateSetting('buttonEffect', effect.value)}
                      className={`px-3 py-2 rounded-lg text-xs border-2 transition-all ${
                        settings.buttonEffect === effect.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient Effects */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Gradient Effecten</p>
                <div className="grid grid-cols-5 gap-2">
                  {BUTTON_EFFECTS.filter(e => e.category === 'gradient').map(effect => (
                    <button
                      key={effect.value}
                      type="button"
                      onClick={() => updateSetting('buttonEffect', effect.value)}
                      className={`px-3 py-2 rounded-lg text-xs border-2 transition-all ${
                        settings.buttonEffect === effect.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Effects */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Speciaal</p>
                <div className="grid grid-cols-5 gap-2">
                  {BUTTON_EFFECTS.filter(e => e.category === 'special').map(effect => (
                    <button
                      key={effect.value}
                      type="button"
                      onClick={() => updateSetting('buttonEffect', effect.value)}
                      className={`px-3 py-2 rounded-lg text-xs border-2 transition-all ${
                        settings.buttonEffect === effect.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Effect Color Settings - shown when effect is selected */}
              {settings.buttonEffect !== 'none' && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>🎨</span> Effect Kleuren
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Effect Kleur</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.buttonEffectColor || settings.buttonBgColor}
                          onChange={(e) => updateSetting('buttonEffectColor', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                        />
                        <input
                          type="text"
                          value={settings.buttonEffectColor || settings.buttonBgColor}
                          onChange={(e) => updateSetting('buttonEffectColor', e.target.value)}
                          className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Neon glow, border kleur, etc.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hover Tekst Kleur</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.buttonHoverTextColor || '#ffffff'}
                          onChange={(e) => updateSetting('buttonHoverTextColor', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                        />
                        <input
                          type="text"
                          value={settings.buttonHoverTextColor || '#ffffff'}
                          onChange={(e) => updateSetting('buttonHoverTextColor', e.target.value)}
                          className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Tekst kleur bij hover</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Lettergrootte: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Letter Spacing</label>
                <select
                  value={settings.letterSpacing}
                  onChange={(e) => updateSetting('letterSpacing', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="0">Normaal</option>
                  <option value="0.01">Licht (0.01em)</option>
                  <option value="0.02">Medium (0.02em)</option>
                  <option value="0.05">Wijd (0.05em)</option>
                  <option value="0.1">Extra Wijd (0.1em)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Font Weight</label>
                <select
                  value={settings.fontWeight}
                  onChange={(e) => updateSetting('fontWeight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="400">Normaal (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    checked={settings.uppercase}
                    onChange={(e) => updateSetting('uppercase', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Hoofdletters</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Spacing Tab */}
        {activeTab === 'spacing' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ruimte tussen items: {settings.gap}px
              </label>
              <input
                type="range"
                min="8"
                max="64"
                value={settings.gap}
                onChange={(e) => updateSetting('gap', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Item Padding: {settings.itemPadding}px
              </label>
              <input
                type="range"
                min="0"
                max="24"
                value={settings.itemPadding}
                onChange={(e) => updateSetting('itemPadding', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Mobiel Menu</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Achtergrond Transparantie: {settings.mobileMenuBgOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.mobileMenuBgOpacity}
                    onChange={(e) => updateSetting('mobileMenuBgOpacity', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Item Padding: {settings.mobileItemPadding}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="24"
                    value={settings.mobileItemPadding}
                    onChange={(e) => updateSetting('mobileItemPadding', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
