import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function ThemeSettings() {
  const { t } = useLanguage();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    primaryColor: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    secondaryColor: '#64748B',
    accentColor: '#F59E0B',
    bgColor: '#FFFFFF',
    surfaceColor: '#F8FAFC',
    textColor: '#0F172A',
    textLight: '#64748B',
    borderColor: '#E2E8F0',
    headerBg: '#FFFFFF',
    headerText: '#0F172A',
    footerBg: '#0F172A',
    footerText: '#F8FAFC',
    fontFamily: 'Inter',
    borderRadius: '8',
    // Site layout settings
    siteLayout: 'full',            // full | boxed
    boxedMaxWidth: '1400',         // px for boxed layout
    // Menu layout settings
    menuLayout: 'standard',        // standard | boxed | floating
    floatingPosition: 'right',     // left | right
    floatingOffset: '12',          // px from edge
    menuItemShape: 'none',         // none | square | round | parallelogram
    menuItemSpacing: '8',          // px between floating items
    // Top Bar settings
    topBarEnabled: false,
    topBarBgColor: '#0f172a',
    topBarTextColor: '#ffffff',
    topBarHeight: '40',
    topBarContent: '',
    topBarPhone: '',
    topBarEmail: '',
    // Footer theme settings
    footerTheme: 'classic',
    footerColumns: '3',
    footerGradient: 'none',
    footerBlur: false,
    footerSocialStyle: 'circle',
    footerAnimatedColor1: '#0f172a',
    footerAnimatedColor2: '#3b82f6',
    footerAnimationSpeed: 10,
  });

  useEffect(() => { loadThemes(); }, []);

  const loadThemes = async () => {
    try {
      const res = await api.get('/settings/themes');
      setThemes(res.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const activateTheme = async (id) => {
    try {
      await api.post(`/settings/themes/${id}/activate`);
      toast.success(t('savedSuccess'));
      loadThemes();
      // Force theme reload
      window.location.reload();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleEdit = (theme) => {
    const colors = typeof theme.colors === 'string' ? JSON.parse(theme.colors) : theme.colors;
    setEditing(theme);
    setForm({
      name: theme.name || '',
      primaryColor: colors.primary || '#2563EB',
      primaryLight: colors.primaryLight || '#3B82F6',
      primaryDark: colors.primaryDark || '#1D4ED8',
      secondaryColor: colors.secondary || '#64748B',
      accentColor: colors.accent || '#F59E0B',
      bgColor: colors.background || '#FFFFFF',
      surfaceColor: colors.surface || '#F8FAFC',
      textColor: colors.text || '#0F172A',
      textLight: colors.textLight || '#64748B',
      borderColor: colors.border || '#E2E8F0',
      headerBg: colors.headerBg || '#FFFFFF',
      headerText: colors.headerText || '#0F172A',
      footerBg: colors.footerBg || '#0F172A',
      footerText: colors.footerText || '#F8FAFC',
      fontFamily: colors.fontFamily || 'Inter',
      borderRadius: colors.borderRadius || '8',
      siteLayout: colors.siteLayout || 'full',
      boxedMaxWidth: colors.boxedMaxWidth || '1400',
      menuLayout: colors.menuLayout || 'standard',
      floatingPosition: colors.floatingPosition || 'right',
      floatingOffset: colors.floatingOffset || '12',
      menuItemShape: colors.menuItemShape || 'none',
      menuItemSpacing: colors.menuItemSpacing || '8',
      // Top Bar
      topBarEnabled: colors.topBarEnabled || false,
      topBarBgColor: colors.topBarBgColor || '#0f172a',
      topBarTextColor: colors.topBarTextColor || '#ffffff',
      topBarHeight: colors.topBarHeight || '40',
      topBarContent: colors.topBarContent || '',
      topBarPhone: colors.topBarPhone || '',
      topBarEmail: colors.topBarEmail || '',
      // Footer theme
      footerTheme: colors.footerTheme || 'classic',
      footerColumns: colors.footerColumns || '3',
      footerGradient: colors.footerGradient || 'none',
      footerBlur: colors.footerBlur || false,
      footerSocialStyle: colors.footerSocialStyle || 'circle',
      footerAnimatedColor1: colors.footerAnimatedColor1 || colors.footerBg || '#0f172a',
      footerAnimatedColor2: colors.footerAnimatedColor2 || colors.primary || '#3b82f6',
      footerAnimationSpeed: colors.footerAnimationSpeed || 10,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setForm({
      name: '', primaryColor: '#2563EB', primaryLight: '#3B82F6', primaryDark: '#1D4ED8',
      secondaryColor: '#64748B', accentColor: '#F59E0B', bgColor: '#FFFFFF',
      surfaceColor: '#F8FAFC', textColor: '#0F172A', textLight: '#64748B',
      borderColor: '#E2E8F0', headerBg: '#FFFFFF', headerText: '#0F172A',
      footerBg: '#0F172A', footerText: '#F8FAFC', fontFamily: 'Inter', borderRadius: '8',
      siteLayout: 'full', boxedMaxWidth: '1400',
      menuLayout: 'standard', floatingPosition: 'right', floatingOffset: '12', menuItemShape: 'none', menuItemSpacing: '8',
      topBarEnabled: false, topBarBgColor: '#0f172a', topBarTextColor: '#ffffff', topBarHeight: '40',
      topBarContent: '', topBarPhone: '', topBarEmail: '',
      footerTheme: 'classic', footerColumns: '3', footerGradient: 'none', footerBlur: false, footerSocialStyle: 'circle',
      footerAnimatedColor1: '#0f172a', footerAnimatedColor2: '#3b82f6', footerAnimationSpeed: 10,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Theme name is required'); return; }

    const colors = {
      primary: form.primaryColor,
      primaryLight: form.primaryLight,
      primaryDark: form.primaryDark,
      secondary: form.secondaryColor,
      accent: form.accentColor,
      background: form.bgColor,
      surface: form.surfaceColor,
      text: form.textColor,
      textLight: form.textLight,
      border: form.borderColor,
      headerBg: form.headerBg,
      headerText: form.headerText,
      footerBg: form.footerBg,
      footerText: form.footerText,
      fontFamily: form.fontFamily,
      borderRadius: form.borderRadius,
      siteLayout: form.siteLayout,
      boxedMaxWidth: form.boxedMaxWidth,
      menuLayout: form.menuLayout,
      floatingPosition: form.floatingPosition,
      floatingOffset: form.floatingOffset,
      menuItemShape: form.menuItemShape,
      menuItemSpacing: form.menuItemSpacing,
      // Top Bar
      topBarEnabled: form.topBarEnabled,
      topBarBgColor: form.topBarBgColor,
      topBarTextColor: form.topBarTextColor,
      topBarHeight: form.topBarHeight,
      topBarContent: form.topBarContent,
      topBarPhone: form.topBarPhone,
      topBarEmail: form.topBarEmail,
      // Footer theme
      footerTheme: form.footerTheme,
      footerColumns: form.footerColumns,
      footerGradient: form.footerGradient,
      footerBlur: form.footerBlur,
      footerSocialStyle: form.footerSocialStyle,
      footerAnimatedColor1: form.footerAnimatedColor1,
      footerAnimatedColor2: form.footerAnimatedColor2,
      footerAnimationSpeed: form.footerAnimationSpeed,
    };

    try {
      if (editing) {
        await api.put(`/settings/themes/${editing.id}`, { name: form.name, colors });
      } else {
        await api.post('/settings/themes', { name: form.name, colors });
      }
      toast.success(t('savedSuccess'));
      setShowForm(false);
      loadThemes();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    }
  };

  const deleteTheme = async (id) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/settings/themes/${id}`);
      toast.success(t('deletedSuccess'));
      loadThemes();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  // ============================================================
  // FULL PAGE EDITOR VIEW
  // ============================================================
  if (showForm) {
    return (
      <div className="animate-fade-in">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setShowForm(false)} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            <span>←</span>
            <span>Terug naar overzicht</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {editing ? `Thema bewerken: ${form.name}` : 'Nieuw thema'}
          </h2>
        </div>

        {/* Full page form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Theme Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('themeName')}</label>
            <input type="text" value={form.name} onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg text-base" placeholder="Bijv: Modern Blauw" />
          </div>

          {/* === KLEUREN SECTIE === */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm">🎨</span>
              Kleuren
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { key: 'primaryColor', label: 'Primary' },
                { key: 'primaryLight', label: 'Primary Light' },
                { key: 'primaryDark', label: 'Primary Dark' },
                { key: 'secondaryColor', label: 'Secondary' },
                { key: 'accentColor', label: 'Accent' },
                { key: 'bgColor', label: 'Background' },
                { key: 'surfaceColor', label: 'Surface' },
                { key: 'textColor', label: 'Text' },
                { key: 'textLight', label: 'Text Light' },
                { key: 'borderColor', label: 'Border' },
                { key: 'headerBg', label: 'Header BG' },
                { key: 'headerText', label: 'Header Text' },
                { key: 'footerBg', label: 'Footer BG' },
                { key: 'footerText', label: 'Footer Text' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form[key]} onChange={(e) => setForm(prev => ({...prev, [key]: e.target.value}))}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
                    <input type="text" value={form[key]} onChange={(e) => setForm(prev => ({...prev, [key]: e.target.value}))}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* === TYPOGRAPHY SECTIE === */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white text-sm">Aa</span>
              Typografie & Stijl
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                <select value={form.fontFamily} onChange={(e) => setForm(prev => ({...prev, fontFamily: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Playfair Display">Playfair Display</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius (px)</label>
                <input type="number" value={form.borderRadius} onChange={(e) => setForm(prev => ({...prev, borderRadius: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" max="24" />
              </div>
            </div>
          </div>

          {/* === TOP BAR SECTIE === */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">📣</span>
                Top Bar (boven navigatie)
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.topBarEnabled || false}
                  onChange={(e) => setForm(prev => ({...prev, topBarEnabled: e.target.checked}))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {form.topBarEnabled && (
              <div className="animate-fade-in grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Achtergrond</label>
                  <input type="color" value={form.topBarBgColor || '#0f172a'}
                    onChange={(e) => setForm(prev => ({...prev, topBarBgColor: e.target.value}))}
                    className="w-full h-10 rounded cursor-pointer border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tekstkleur</label>
                  <input type="color" value={form.topBarTextColor || '#ffffff'}
                    onChange={(e) => setForm(prev => ({...prev, topBarTextColor: e.target.value}))}
                    className="w-full h-10 rounded cursor-pointer border border-gray-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hoogte (px)</label>
                  <input type="number" value={form.topBarHeight || '40'}
                    onChange={(e) => setForm(prev => ({...prev, topBarHeight: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="24" max="80" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">📞 Telefoonnummer</label>
                  <input type="text" value={form.topBarPhone || ''}
                    onChange={(e) => setForm(prev => ({...prev, topBarPhone: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="+31 6 12345678" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">✉️ E-mailadres</label>
                  <input type="email" value={form.topBarEmail || ''}
                    onChange={(e) => setForm(prev => ({...prev, topBarEmail: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="info@bedrijf.nl" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">📍 Extra tekst</label>
                  <input type="text" value={form.topBarContent || ''}
                    onChange={(e) => setForm(prev => ({...prev, topBarContent: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="🚚 Gratis verzending!" />
                </div>
              </div>
            )}
          </div>

          {/* === SITE LAYOUT SECTIE === */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm">📐</span>
              Site Layout
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { value: 'full', label: 'Volledige Breedte', icon: '📐', desc: '100% breedte' },
                { value: 'boxed', label: 'Boxed', icon: '📦', desc: 'Gecentreerd met max breedte' },
              ].map(layout => (
                <button
                  key={layout.value}
                  type="button"
                  onClick={() => setForm(prev => ({...prev, siteLayout: layout.value}))}
                  className={`p-4 rounded-xl text-sm border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    form.siteLayout === layout.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-xl font-mono">{layout.icon}</span>
                  <span className="font-semibold">{layout.label}</span>
                  <span className="text-[10px] opacity-70">{layout.desc}</span>
                </button>
              ))}
            </div>
            {form.siteLayout === 'boxed' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Breedte (px)</label>
                <input type="range" min="1000" max="1800" value={form.boxedMaxWidth} 
                  onChange={(e) => setForm(prev => ({...prev, boxedMaxWidth: e.target.value}))}
                  className="w-full max-w-md" />
                <div className="flex justify-between text-xs text-gray-400 max-w-md">
                  <span>1000px</span>
                  <span className="font-medium text-gray-600">{form.boxedMaxWidth}px</span>
                  <span>1800px</span>
                </div>
              </div>
            )}
          </div>

          {/* === MENU LAYOUT SECTIE === */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-sm">📱</span>
              Menu Layout
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { value: 'standard', label: 'Standaard', icon: '☰', desc: 'Horizontaal in header' },
                { value: 'boxed', label: 'Boxed', icon: '▣', desc: 'Met achtergrond' },
                { value: 'floating', label: 'Zwevend', icon: '║', desc: 'Verticaal aan zijkant' },
              ].map(layout => (
                <button
                  key={layout.value}
                  type="button"
                  onClick={() => setForm(prev => ({...prev, menuLayout: layout.value}))}
                  className={`p-4 rounded-xl text-sm border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    form.menuLayout === layout.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-xl font-mono">{layout.icon}</span>
                  <span className="font-semibold">{layout.label}</span>
                  <span className="text-[10px] opacity-70">{layout.desc}</span>
                </button>
              ))}
            </div>

            {form.menuLayout === 'floating' && (
              <div className="grid grid-cols-3 gap-3 animate-fade-in">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Positie</label>
                  <select value={form.floatingPosition} onChange={(e) => setForm(prev => ({...prev, floatingPosition: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="left">Links</option>
                    <option value="right">Rechts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Afstand Rand (px)</label>
                  <input type="number" value={form.floatingOffset} onChange={(e) => setForm(prev => ({...prev, floatingOffset: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" max="200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item Spacing (px)</label>
                  <input type="number" value={form.menuItemSpacing} onChange={(e) => setForm(prev => ({...prev, menuItemSpacing: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="4" max="24" />
                </div>
              </div>
            )}

            {/* Menu Item Shape */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Menu Item Vorm</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'none', label: 'Geen', preview: 'Abc' },
                  { value: 'square', label: 'Vierkant', preview: '▢' },
                  { value: 'round', label: 'Rond', preview: '○' },
                  { value: 'parallelogram', label: 'Schuin', preview: '▱' },
                ].map(shape => (
                  <button
                    key={shape.value}
                    type="button"
                    onClick={() => setForm(prev => ({...prev, menuItemShape: shape.value}))}
                    className={`p-3 rounded-lg text-xs border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                      form.menuItemShape === shape.value
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-xl">{shape.preview}</span>
                    <span>{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* === FOOTER THEMA SECTIE === */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">🦶</span>
              Footer Thema
            </h3>

            {/* Footer Theme Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Thema Stijl</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { value: 'classic', label: 'Klassiek', icon: '📋', desc: 'Eenvoudig & clean' },
                  { value: 'modern', label: 'Modern', icon: '✨', desc: 'Strak & minimaal' },
                  { value: 'gradient', label: 'Gradient', icon: '🌈', desc: 'Kleurovergang' },
                  { value: 'glass', label: 'Glass', icon: '💎', desc: 'Blur effect' },
                  { value: 'animated', label: 'Geanimeerd', icon: '🎬', desc: 'Bewegende gradient' },
                ].map(theme => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => setForm(prev => ({...prev, footerTheme: theme.value}))}
                    className={`p-4 rounded-xl text-sm border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      form.footerTheme === theme.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl font-mono">{theme.icon}</span>
                    <span className="font-semibold">{theme.label}</span>
                    <span className="text-[10px] opacity-70">{theme.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient/Glass options */}
            {(form.footerTheme === 'gradient' || form.footerTheme === 'glass') && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-fade-in">
                <div className="col-span-2 md:col-span-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Gradient Richting</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'none', label: 'Geen', icon: '⬛' },
                      { value: 'to-top', label: 'Omhoog', icon: '⬆️' },
                      { value: 'to-right', label: 'Rechts', icon: '➡️' },
                      { value: 'diagonal', label: 'Diagonaal', icon: '↗️' },
                    ].map(dir => (
                      <button
                        key={dir.value}
                        type="button"
                        onClick={() => setForm(prev => ({...prev, footerGradient: dir.value}))}
                        className={`p-2 rounded-lg text-xs border-2 transition-all ${
                          form.footerGradient === dir.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span className="text-lg block">{dir.icon}</span>
                        <span className="text-[10px]">{dir.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.footerTheme === 'glass' && (
              <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 animate-fade-in">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.footerBlur || false}
                    onChange={(e) => setForm(prev => ({...prev, footerBlur: e.target.checked}))}
                    className="w-5 h-5 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-semibold text-emerald-800">✨ Blur Effect</span>
                    <p className="text-xs text-gray-600">Glassmorphism stijl met blur</p>
                  </div>
                </label>
              </div>
            )}

            {/* Animated Footer Options */}
            {form.footerTheme === 'animated' && (
              <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200 animate-fade-in">
                <p className="text-sm font-semibold text-emerald-800 mb-3">🎬 Animated Gradient Instellingen</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kleur 1</label>
                    <input
                      type="color"
                      value={form.footerAnimatedColor1 || form.footerBg || '#0f172a'}
                      onChange={(e) => setForm(prev => ({...prev, footerAnimatedColor1: e.target.value}))}
                      className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kleur 2</label>
                    <input
                      type="color"
                      value={form.footerAnimatedColor2 || form.primary || '#3b82f6'}
                      onChange={(e) => setForm(prev => ({...prev, footerAnimatedColor2: e.target.value}))}
                      className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs text-gray-600 mb-1">
                    Animatie Snelheid: {form.footerAnimationSpeed || 10}s
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={form.footerAnimationSpeed || 10}
                    onChange={(e) => setForm(prev => ({...prev, footerAnimationSpeed: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Snel</span>
                    <span>Langzaam</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Columns & Social Style */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Aantal Kolommen</label>
                <div className="grid grid-cols-4 gap-2">
                  {['2', '3', '4', '5'].map(cols => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => setForm(prev => ({...prev, footerColumns: cols}))}
                      className={`p-2 rounded-lg text-sm font-bold border-2 transition-all ${
                        form.footerColumns === cols
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Social Icons Stijl</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'circle', label: 'Rond', icon: '●' },
                    { value: 'square', label: 'Vierkant', icon: '■' },
                    { value: 'outline', label: 'Outline', icon: '○' },
                    { value: 'minimal', label: 'Minimaal', icon: '—' },
                  ].map(style => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setForm(prev => ({...prev, footerSocialStyle: style.value}))}
                      className={`p-2 rounded-lg text-xs border-2 transition-all ${
                        form.footerSocialStyle === style.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-lg block">{style.icon}</span>
                      <span className="text-[10px]">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button onClick={() => setShowForm(false)} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              {t('cancel')}
            </button>
            <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {t('save')} Thema
            </button>
          </div>
        </div>
      </div>
    );
  }

  // •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
  // LIST VIEW
  // •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('themes')}</h2>
        <button onClick={handleNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          + {t('newTheme')}
        </button>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes.map(theme => {
          const colors = typeof theme.colors === 'string' ? JSON.parse(theme.colors) : theme.colors;
          return (
            <div key={theme.id} className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
              theme.isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            }`}>
              {/* Preview */}
              <div className="h-32 relative" style={{ backgroundColor: colors.background || '#fff' }}>
                <div className="h-8 flex items-center px-3" style={{ backgroundColor: colors.headerBg || '#fff' }}>
                  <span className="text-xs font-bold" style={{ color: colors.headerText || '#000' }}>Header</span>
                </div>
                <div className="px-3 pt-2">
                  <div className="h-3 rounded-full w-24 mb-1.5" style={{ backgroundColor: colors.primary }}></div>
                  <div className="h-2 rounded-full w-full mb-1" style={{ backgroundColor: colors.border || '#E2E8F0' }}></div>
                  <div className="h-2 rounded-full w-3/4 mb-2" style={{ backgroundColor: colors.border || '#E2E8F0' }}></div>
                  <div className="flex gap-1">
                    <div className="h-5 w-16 rounded text-xs flex items-center justify-center text-white" style={{ backgroundColor: colors.primary }}>Button</div>
                    <div className="h-5 w-12 rounded" style={{ backgroundColor: colors.accent || '#F59E0B' }}></div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center px-3" style={{ backgroundColor: colors.footerBg || '#0F172A' }}>
                  <span className="text-[8px]" style={{ color: colors.footerText || '#F8FAFC' }}>Footer</span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{theme.name}</h3>
                    {theme.isActive && <span className="text-xs text-blue-600 font-medium">{t('activeTheme')}</span>}
                  </div>
                </div>

                {/* Color swatches */}
                <div className="flex gap-1.5 mb-3">
                  {[colors.primary, colors.primaryLight, colors.secondary, colors.accent, colors.text, colors.background].map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: c }}></div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {!theme.isActive && (
                    <button onClick={() => activateTheme(theme.id)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                      {t('activate')}
                    </button>
                  )}
                  <button onClick={() => handleEdit(theme)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors">
                    {t('edit')}
                  </button>
                  {!theme.isActive && (
                    <button onClick={() => deleteTheme(theme.id)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 transition-colors">
                      {t('delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
