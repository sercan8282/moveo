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
    // Navbar settings
    navbarStyle: 'solid',
    navbarHoverEffect: 'slide-up',
    navbarHoverColor: '#3B82F6',
    navbarHeight: '72',
    navbarFontSize: '15',
    navbarFontWeight: '500',
    navbarLetterSpacing: '0.01',
    navbarGap: '32',
    // Site layout settings
    siteLayout: 'full',            // full | boxed
    boxedMaxWidth: '1400',         // px for boxed layout
    // Menu layout settings
    menuLayout: 'standard',        // standard | boxed | floating
    floatingPosition: 'right',     // left | right
    floatingOffset: '12',          // px from edge
    menuItemShape: 'none',         // none | square | round | parallelogram
    menuItemSpacing: '8',          // px between floating items
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
      navbarStyle: colors.navbarStyle || 'solid',
      navbarHoverEffect: colors.navbarHoverEffect || 'slide-up',
      navbarHoverColor: colors.navbarHoverColor || '#3B82F6',
      navbarHeight: colors.navbarHeight || '72',
      navbarFontSize: colors.navbarFontSize || '15',
      navbarFontWeight: colors.navbarFontWeight || '500',
      navbarLetterSpacing: colors.navbarLetterSpacing || '0.01',
      navbarGap: colors.navbarGap || '32',
      siteLayout: colors.siteLayout || 'full',
      boxedMaxWidth: colors.boxedMaxWidth || '1400',
      menuLayout: colors.menuLayout || 'standard',
      floatingPosition: colors.floatingPosition || 'right',
      floatingOffset: colors.floatingOffset || '12',
      menuItemShape: colors.menuItemShape || 'none',
      menuItemSpacing: colors.menuItemSpacing || '8',
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
      navbarStyle: 'solid', navbarHoverEffect: 'slide-up', navbarHoverColor: '#3B82F6',
      navbarHeight: '72', navbarFontSize: '15', navbarFontWeight: '500',
      navbarLetterSpacing: '0.01', navbarGap: '32',
      siteLayout: 'full', boxedMaxWidth: '1400',
      menuLayout: 'standard', floatingPosition: 'right', floatingOffset: '12', menuItemShape: 'none', menuItemSpacing: '8',
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
      navbarStyle: form.navbarStyle,
      navbarHoverEffect: form.navbarHoverEffect,
      navbarHoverColor: form.navbarHoverColor,
      navbarHeight: form.navbarHeight,
      navbarFontSize: form.navbarFontSize,
      navbarFontWeight: form.navbarFontWeight,
      navbarLetterSpacing: form.navbarLetterSpacing,
      navbarGap: form.navbarGap,
      siteLayout: form.siteLayout,
      boxedMaxWidth: form.boxedMaxWidth,
      menuLayout: form.menuLayout,
      floatingPosition: form.floatingPosition,
      floatingOffset: form.floatingOffset,
      menuItemShape: form.menuItemShape,
      menuItemSpacing: form.menuItemSpacing,
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

      {/* Theme Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">{editing ? t('editTheme') : t('newTheme')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('themeName')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                      <input type="text" value={form[key]} onChange={(e) => setForm(prev => ({...prev, [key]: e.target.value}))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              {/* ═══ Navigatiebalk Instellingen ═══ */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center text-xs">☰</span>
                  Navigatiebalk
                </h4>

                {/* Hover Effect Selection with Visual Preview */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Hover Effect</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'slide-up', label: 'Slide Up', icon: '▁' },
                      { value: 'glow', label: 'Glow', icon: '✦' },
                      { value: 'pill', label: 'Pill', icon: '●' },
                      { value: 'bracket', label: 'Bracket', icon: '[ ]' },
                      { value: 'fill', label: 'Fill', icon: '█' },
                      { value: 'border', label: 'Border', icon: '▬' },
                      { value: 'scale', label: 'Scale', icon: '⤢' },
                    ].map(effect => (
                      <button
                        key={effect.value}
                        type="button"
                        onClick={() => setForm(prev => ({...prev, navbarHoverEffect: effect.value}))}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                          form.navbarHoverEffect === effect.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base leading-none">{effect.icon}</span>
                        <span>{effect.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hover Color */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hover Kleur</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.navbarHoverColor} onChange={(e) => setForm(prev => ({...prev, navbarHoverColor: e.target.value}))}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                    <input type="text" value={form.navbarHoverColor} onChange={(e) => setForm(prev => ({...prev, navbarHoverColor: e.target.value}))}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono" />
                    {/* Quick color presets */}
                    <div className="flex gap-1">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'].map(c => (
                        <button key={c} type="button" onClick={() => setForm(prev => ({...prev, navbarHoverColor: c}))}
                          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 ${form.navbarHoverColor === c ? 'border-gray-800 scale-125' : 'border-gray-200'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navbar dimensions grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hoogte (px)</label>
                    <input type="number" value={form.navbarHeight} onChange={(e) => setForm(prev => ({...prev, navbarHeight: e.target.value}))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" min="48" max="120" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font Size (px)</label>
                    <input type="number" value={form.navbarFontSize} onChange={(e) => setForm(prev => ({...prev, navbarFontSize: e.target.value}))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" min="12" max="22" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font Weight</label>
                    <select value={form.navbarFontWeight} onChange={(e) => setForm(prev => ({...prev, navbarFontWeight: e.target.value}))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Spacing (px)</label>
                    <input type="number" value={form.navbarGap} onChange={(e) => setForm(prev => ({...prev, navbarGap: e.target.value}))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" min="12" max="64" />
                  </div>
                </div>

                {/* Site Layout Section */}
                <div className="mb-4 pt-3 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Site Layout</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { value: 'full', label: 'Volledige Breedte', icon: '▬▬▬▬▬', desc: '100% breedte' },
                      { value: 'boxed', label: 'Boxed', icon: '│▬▬▬│', desc: 'Gecentreerd met max breedte' },
                    ].map(layout => (
                      <button
                        key={layout.value}
                        type="button"
                        onClick={() => setForm(prev => ({...prev, siteLayout: layout.value}))}
                        className={`p-3 rounded-lg text-xs border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                          form.siteLayout === layout.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span className="text-lg font-mono">{layout.icon}</span>
                        <span className="font-medium">{layout.label}</span>
                        <span className="text-[10px] opacity-70">{layout.desc}</span>
                      </button>
                    ))}
                  </div>
                  {form.siteLayout === 'boxed' && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Max Breedte (px)</label>
                      <input type="range" min="1000" max="1800" value={form.boxedMaxWidth} 
                        onChange={(e) => setForm(prev => ({...prev, boxedMaxWidth: e.target.value}))}
                        className="w-full" />
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>1000px</span>
                        <span className="font-medium text-gray-600">{form.boxedMaxWidth}px</span>
                        <span>1800px</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu Layout Section */}
                <div className="mb-4 pt-3 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Menu Layout</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { value: 'standard', label: 'Standaard', icon: '═══', desc: 'Horizontaal in header' },
                      { value: 'boxed', label: 'Boxed', icon: '▣═▣', desc: 'Met achtergrond' },
                      { value: 'floating', label: 'Zwevend', icon: '║', desc: 'Verticaal aan zijkant' },
                    ].map(layout => (
                      <button
                        key={layout.value}
                        type="button"
                        onClick={() => setForm(prev => ({...prev, menuLayout: layout.value}))}
                        className={`p-3 rounded-lg text-xs border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                          form.menuLayout === layout.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span className="text-lg font-mono">{layout.icon}</span>
                        <span className="font-medium">{layout.label}</span>
                        <span className="text-[10px] text-gray-400">{layout.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Floating menu position (only show when floating is selected) */}
                  {form.menuLayout === 'floating' && (
                    <div className="grid grid-cols-3 gap-2 mb-3 animate-fade-in">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Positie</label>
                        <select value={form.floatingPosition} onChange={(e) => setForm(prev => ({...prev, floatingPosition: e.target.value}))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs">
                          <option value="left">Links</option>
                          <option value="right">Rechts</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Afstand Rand (px)</label>
                        <input type="number" value={form.floatingOffset} onChange={(e) => setForm(prev => ({...prev, floatingOffset: e.target.value}))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" min="0" max="200" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Item Spacing (px)</label>
                        <input type="number" value={form.menuItemSpacing} onChange={(e) => setForm(prev => ({...prev, menuItemSpacing: e.target.value}))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs" min="4" max="24" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu Item Shape */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Menu Item Vorm</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'none', label: 'Geen', preview: 'text' },
                      { value: 'square', label: 'Vierkant', preview: '▢' },
                      { value: 'round', label: 'Rond', preview: '○' },
                      { value: 'parallelogram', label: 'Schuin', preview: '▱' },
                    ].map(shape => (
                      <button
                        key={shape.value}
                        type="button"
                        onClick={() => setForm(prev => ({...prev, menuItemShape: shape.value}))}
                        className={`p-2.5 rounded-lg text-xs border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                          form.menuItemShape === shape.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span className="text-xl">{shape.preview}</span>
                        <span>{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Strip */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="text-[10px] text-gray-400 px-2 py-1 bg-gray-50 border-b border-gray-200">Voorbeeld</div>
                  
                  {/* Standard/Boxed navbar preview */}
                  {form.menuLayout !== 'floating' && (
                    <div className={`flex items-center justify-center gap-6 px-4 ${form.menuLayout === 'boxed' ? 'py-2' : ''}`} style={{
                      height: `${Math.min(form.navbarHeight, 72)}px`,
                      backgroundColor: form.headerBg || '#1e40af',
                    }}>
                      <span className="text-xs font-bold" style={{ color: form.headerText || '#ffffff' }}>Logo</span>
                      <div className={`flex items-center ${form.menuLayout === 'boxed' ? 'bg-white/10 px-3 py-1 rounded-full' : ''}`} style={{ gap: `${Math.min(form.navbarGap, 24)}px` }}>
                        {['Home', 'Over ons', 'Contact'].map((label, i) => (
                          <span key={label}
                            className={`nav-link-hover-${form.navbarHoverEffect} menu-shape-${form.menuItemShape} ${i === 0 ? 'nav-active' : ''} py-1 px-1 cursor-default`}
                            style={{
                              color: form.headerText || '#ffffff',
                              fontSize: `${Math.min(form.navbarFontSize, 14)}px`,
                              fontWeight: form.navbarFontWeight || '500',
                              '--navbar-hover-color': form.navbarHoverColor || '#3b82f6',
                            }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floating menu preview */}
                  {form.menuLayout === 'floating' && (
                    <div className="relative h-24" style={{ backgroundColor: '#f1f5f9' }}>
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col py-2 px-1 rounded-lg shadow-lg"
                        style={{ 
                          [form.floatingPosition]: `${Math.min(form.floatingOffset || 12, 40)}px`,
                          gap: `${form.menuItemSpacing}px`,
                          backgroundColor: form.headerBg || '#1e40af',
                          borderRadius: form.floatingPosition === 'left' ? '0 8px 8px 0' : '8px 0 0 8px',
                        }}
                      >
                        {['◂', '○', '●'].map((icon, i) => (
                          <span key={icon}
                            className={`menu-shape-${form.menuItemShape} px-2 py-1 text-center cursor-default ${i === 1 ? 'nav-active' : ''}`}
                            style={{
                              color: form.headerText || '#ffffff',
                              fontSize: '10px',
                              '--navbar-hover-color': form.navbarHoverColor || '#3b82f6',
                            }}
                          >
                            {icon}
                          </span>
                        ))}
                      </div>
                      <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400">
                        Zwevend menu ({form.floatingPosition === 'left' ? 'links' : 'rechts'}, {form.floatingOffset || 12}px van rand)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
