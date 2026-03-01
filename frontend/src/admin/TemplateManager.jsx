import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

// ============================================
// MODAL COMPONENT
// ============================================
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full transform transition-all animate-modal-in max-h-[90vh] flex flex-col`}>
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TEMPLATE CARD COMPONENT
// ============================================
const TemplateCard = ({ template, onPreview, onApply, onEdit, onDelete, onExport, onDuplicate, isApplying }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={template.thumbnail || 'https://via.placeholder.com/400x300?text=Template'}
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
          {template.category || 'Template'}
        </span>
        
        {/* Version Badge */}
        <span className="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded">
          v{template.version || '1.0'}
        </span>

        {/* Menu Button */}
        <div className="absolute bottom-3 right-3" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-xl border py-1 z-10">
              <button
                onClick={() => { onPreview(template); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
              <button
                onClick={() => { onEdit(template); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bewerken
              </button>
              <button
                onClick={() => { onDuplicate(template); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Dupliceren
              </button>
              <button
                onClick={() => { onExport(template); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Exporteren
              </button>
              <hr className="my-1" />
              <button
                onClick={() => { onDelete(template); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Verwijderen
              </button>
            </div>
          )}
        </div>
        
        {/* Hover Actions */}
        <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
          <button
            onClick={() => onPreview(template)}
            className="bg-white text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
        
        {/* Features/Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          {template.data?.pages && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {template.data.pages.length} Pagina's
            </span>
          )}
          {template.data?.homepage?.sections && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              {template.data.homepage.sections.length} Secties
            </span>
          )}
        </div>

        {/* Apply Button */}
        <button
          onClick={() => onApply(template)}
          disabled={isApplying}
          className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isApplying ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Toepassen...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Toepassen
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================
// PREVIEW CONTENT COMPONENT
// ============================================
const PreviewContent = ({ template }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!template?.data) return <p>Geen preview beschikbaar</p>;

  const { theme, pages, homepage, menus, settings, footer } = template.data;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg flex-wrap">
        {['overview', 'pages', 'sections', 'theme', 'footer'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all min-w-[80px] ${
              activeTab === tab
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'overview' && 'Overzicht'}
            {tab === 'pages' && "Pagina's"}
            {tab === 'sections' && 'Secties'}
            {tab === 'theme' && 'Thema'}
            {tab === 'footer' && 'Footer'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="relative h-64 rounded-xl overflow-hidden">
            <img
              src={homepage?.sections?.[0]?.data?.backgroundImage || template.thumbnail}
              alt="Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-2">{homepage?.sections?.[0]?.data?.title || settings?.siteName}</h2>
                <p className="text-lg opacity-90">{homepage?.sections?.[0]?.data?.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{pages?.length || 0}</div>
              <div className="text-sm text-gray-600">Pagina's</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{homepage?.sections?.length || 0}</div>
              <div className="text-sm text-gray-600">Secties</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{menus?.header?.items?.length || 0}</div>
              <div className="text-sm text-gray-600">Menu Items</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{template.data?.posts?.length || 0}</div>
              <div className="text-sm text-gray-600">Blog Posts</div>
            </div>
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pages?.map((page, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{page.title}</h4>
                <p className="text-sm text-gray-500">/{page.slug}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {homepage?.sections?.map((section, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 capitalize">{section.type?.replace(/-/g, ' ')}</h4>
                <p className="text-sm text-gray-500">{section.data?.title || `Sectie ${index + 1}`}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Kleuren</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Primary', color: theme?.primaryColor || '#f26522' },
                { name: 'Secondary', color: theme?.secondaryColor || '#0a1628' },
                { name: 'Accent', color: theme?.accentColor || '#1a365d' },
                { name: 'Background', color: theme?.backgroundColor || '#ffffff' },
                { name: 'Text', color: theme?.textColor || '#333333' },
                { name: 'Header', color: theme?.headerBg || '#0a1628' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border shadow-inner" style={{ backgroundColor: item.color }} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.color}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Tab */}
      {activeTab === 'footer' && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p><strong>Beschrijving:</strong> {footer?.description || '-'}</p>
            <p><strong>Copyright:</strong> {footer?.copyright || '-'}</p>
          </div>
          {footer?.openingHours && (
            <div>
              <h4 className="font-semibold mb-2">Openingstijden</h4>
              <ul className="space-y-1 text-sm">
                {footer.openingHours.map((h, i) => (
                  <li key={i}><strong>{h.days}:</strong> {h.hours}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// TEMPLATE EDITOR COMPONENT
// ============================================
const TemplateEditor = ({ template, onSave, onCancel, isSaving }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: template?.name || '',
    slug: template?.slug || '',
    description: template?.description || '',
    thumbnail: template?.thumbnail || '',
    category: template?.category || '',
    version: template?.version || '1.0',
    data: template?.data || {
      theme: {
        primaryColor: '#f26522',
        secondaryColor: '#0a1628',
        accentColor: '#1a365d',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        headerBg: '#0a1628',
        footerBg: '#0a1628',
        fontFamily: 'Inter, sans-serif'
      },
      pages: [],
      homepage: { sections: [] },
      menus: { header: { items: [] }, footer: { columns: [] } },
      footer: {
        logo: '',
        description: '',
        copyright: '',
        openingHours: [],
        contactInfo: {}
      },
      settings: {
        siteName: '',
        siteDescription: '',
        email: '',
        phone: '',
        address: ''
      }
    }
  });

  const updateData = (path, value) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let current = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const tabs = [
    { id: 'general', label: 'Algemeen' },
    { id: 'theme', label: 'Thema' },
    { id: 'pages', label: "Pagina's" },
    { id: 'homepage', label: 'Homepage' },
    { id: 'menus', label: "Menu's" },
    { id: 'footer', label: 'Footer' },
    { id: 'settings', label: 'Settings' },
    { id: 'json', label: 'JSON' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="template-naam"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="logistics, restaurant, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Versie</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="1.0"
              />
            </div>
          </div>
          {formData.thumbnail && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
              <img src={formData.thumbnail} alt="Thumbnail" className="h-32 rounded-lg object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Kleuren</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'primaryColor', label: 'Primary' },
              { key: 'secondaryColor', label: 'Secondary' },
              { key: 'accentColor', label: 'Accent' },
              { key: 'backgroundColor', label: 'Achtergrond' },
              { key: 'textColor', label: 'Tekst' },
              { key: 'headerBg', label: 'Header Achtergrond' },
              { key: 'footerBg', label: 'Footer Achtergrond' }
            ].map((color) => (
              <div key={color.key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.data?.theme?.[color.key] || '#000000'}
                  onChange={(e) => updateData(`data.theme.${color.key}`, e.target.value)}
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">{color.label}</label>
                  <input
                    type="text"
                    value={formData.data?.theme?.[color.key] || ''}
                    onChange={(e) => updateData(`data.theme.${color.key}`, e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
            <input
              type="text"
              value={formData.data?.theme?.fontFamily || ''}
              onChange={(e) => updateData('data.theme.fontFamily', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Inter, sans-serif"
            />
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-900">Pagina's ({formData.data?.pages?.length || 0})</h4>
            <button
              type="button"
              onClick={() => {
                const pages = formData.data?.pages || [];
                updateData('data.pages', [...pages, { title: 'Nieuwe Pagina', slug: 'nieuwe-pagina', content: { blocks: [] } }]);
              }}
              className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              + Pagina Toevoegen
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {formData.data?.pages?.map((page, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => {
                      const pages = [...formData.data.pages];
                      pages[index] = { ...pages[index], title: e.target.value };
                      updateData('data.pages', pages);
                    }}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="Titel"
                  />
                  <input
                    type="text"
                    value={page.slug}
                    onChange={(e) => {
                      const pages = [...formData.data.pages];
                      pages[index] = { ...pages[index], slug: e.target.value };
                      updateData('data.pages', pages);
                    }}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="slug"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const pages = formData.data.pages.filter((_, i) => i !== index);
                    updateData('data.pages', pages);
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Homepage Tab */}
      {activeTab === 'homepage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-900">Homepage Secties ({formData.data?.homepage?.sections?.length || 0})</h4>
            <button
              type="button"
              onClick={() => {
                const sections = formData.data?.homepage?.sections || [];
                updateData('data.homepage.sections', [...sections, { type: 'content', enabled: true, data: { title: 'Nieuwe Sectie' } }]);
              }}
              className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              + Sectie Toevoegen
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {formData.data?.homepage?.sections?.map((section, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded font-bold text-sm">
                  {index + 1}
                </span>
                <select
                  value={section.type}
                  onChange={(e) => {
                    const sections = [...formData.data.homepage.sections];
                    sections[index] = { ...sections[index], type: e.target.value };
                    updateData('data.homepage.sections', sections);
                  }}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="hero">Hero</option>
                  <option value="services">Services</option>
                  <option value="about">About</option>
                  <option value="features">Features</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="cta">CTA</option>
                  <option value="contact">Contact</option>
                  <option value="stats">Stats</option>
                  <option value="team">Team</option>
                  <option value="gallery">Gallery</option>
                </select>
                <input
                  type="text"
                  value={section.data?.title || ''}
                  onChange={(e) => {
                    const sections = [...formData.data.homepage.sections];
                    sections[index] = { ...sections[index], data: { ...sections[index].data, title: e.target.value } };
                    updateData('data.homepage.sections', sections);
                  }}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  placeholder="Titel"
                />
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={section.enabled !== false}
                    onChange={(e) => {
                      const sections = [...formData.data.homepage.sections];
                      sections[index] = { ...sections[index], enabled: e.target.checked };
                      updateData('data.homepage.sections', sections);
                    }}
                  />
                  Actief
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const sections = formData.data.homepage.sections.filter((_, i) => i !== index);
                    updateData('data.homepage.sections', sections);
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menus Tab */}
      {activeTab === 'menus' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Header Menu</h4>
            <div className="space-y-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const items = formData.data?.menus?.header?.items || [];
                    updateData('data.menus.header.items', [...items, { title: 'Nieuw Item', url: '/' }]);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  + Menu Item
                </button>
              </div>
              {formData.data?.menus?.header?.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const items = [...formData.data.menus.header.items];
                      items[index] = { ...items[index], title: e.target.value };
                      updateData('data.menus.header.items', items);
                    }}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    placeholder="Label"
                  />
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => {
                      const items = [...formData.data.menus.header.items];
                      items[index] = { ...items[index], url: e.target.value };
                      updateData('data.menus.header.items', items);
                    }}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    placeholder="/url"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = formData.data.menus.header.items.filter((_, i) => i !== index);
                      updateData('data.menus.header.items', items);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Tab */}
      {activeTab === 'footer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={formData.data?.footer?.logo || ''}
                onChange={(e) => updateData('data.footer.logo', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Copyright</label>
              <input
                type="text"
                value={formData.data?.footer?.copyright || ''}
                onChange={(e) => updateData('data.footer.copyright', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
            <textarea
              value={formData.data?.footer?.description || ''}
              onChange={(e) => updateData('data.footer.description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Openingstijden</label>
              <button
                type="button"
                onClick={() => {
                  const hours = formData.data?.footer?.openingHours || [];
                  updateData('data.footer.openingHours', [...hours, { days: '', hours: '' }]);
                }}
                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
              >
                + Toevoegen
              </button>
            </div>
            {formData.data?.footer?.openingHours?.map((h, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={h.days}
                  onChange={(e) => {
                    const hours = [...formData.data.footer.openingHours];
                    hours[index] = { ...hours[index], days: e.target.value };
                    updateData('data.footer.openingHours', hours);
                  }}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  placeholder="Ma-Vr"
                />
                <input
                  type="text"
                  value={h.hours}
                  onChange={(e) => {
                    const hours = [...formData.data.footer.openingHours];
                    hours[index] = { ...hours[index], hours: e.target.value };
                    updateData('data.footer.openingHours', hours);
                  }}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  placeholder="08:00 - 18:00"
                />
                <button
                  type="button"
                  onClick={() => {
                    const hours = formData.data.footer.openingHours.filter((_, i) => i !== index);
                    updateData('data.footer.openingHours', hours);
                  }}
                  className="p-1 text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Naam</label>
              <input
                type="text"
                value={formData.data?.settings?.siteName || ''}
                onChange={(e) => updateData('data.settings.siteName', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={formData.data?.settings?.email || ''}
                onChange={(e) => updateData('data.settings.email', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Beschrijving</label>
            <textarea
              value={formData.data?.settings?.siteDescription || ''}
              onChange={(e) => updateData('data.settings.siteDescription', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
              <input
                type="text"
                value={formData.data?.settings?.phone || ''}
                onChange={(e) => updateData('data.settings.phone', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
              <input
                type="text"
                value={formData.data?.settings?.address || ''}
                onChange={(e) => updateData('data.settings.address', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* JSON Tab */}
      {activeTab === 'json' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bewerk de volledige template data als JSON. Wees voorzichtig met wijzigingen!</p>
          <textarea
            value={JSON.stringify(formData.data, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData({ ...formData, data: parsed });
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            rows={20}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Opslaan...
            </>
          ) : (
            'Opslaan'
          )}
        </button>
      </div>
    </form>
  );
};

// ============================================
// CONFIRM MODAL COMPONENT
// ============================================
const ConfirmModal = ({ isOpen, onClose, onConfirm, template, isLoading }) => {
  const [preserveContent, setPreserveContent] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Template Toepassen" size="md">
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-amber-800">Let op!</h4>
              <p className="text-sm text-amber-700">
                Het toepassen van een template zal uw huidige website inhoud overschrijven.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <img src={template?.thumbnail} alt={template?.name} className="w-16 h-16 rounded-lg object-cover" />
          <div>
            <h4 className="font-semibold text-gray-900">{template?.name}</h4>
            <p className="text-sm text-gray-500">{template?.category} • v{template?.version}</p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={preserveContent}
            onChange={(e) => setPreserveContent(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary"
          />
          <div>
            <span className="font-medium text-gray-900">Huidige content behouden</span>
            <p className="text-sm text-gray-500">Behoud bestaande pagina's en posts</p>
          </div>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Annuleren
          </button>
          <button
            onClick={() => onConfirm(preserveContent)}
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Toepassen...' : 'Template Toepassen'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// DELETE CONFIRM MODAL
// ============================================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, template, isLoading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Template Verwijderen" size="sm">
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">
          Weet je zeker dat je <strong>{template?.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-50">
          Annuleren
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? 'Verwijderen...' : 'Verwijderen'}
        </button>
      </div>
    </div>
  </Modal>
);

// ============================================
// IMPORT MODAL
// ============================================
const ImportModal = ({ isOpen, onClose, onImport, isLoading }) => {
  const [jsonData, setJsonData] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const text = await file.text();
      setJsonData(text);
    }
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonData);
      onImport(parsed);
    } catch (err) {
      alert('Ongeldige JSON data');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Template Importeren" size="lg">
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json"
            className="hidden"
          />
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 mb-2">
            {fileName || 'Sleep een JSON bestand hierheen of klik om te selecteren'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Bestand Selecteren
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Of plak JSON data:</label>
          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            rows={10}
            placeholder='{"name": "Mijn Template", "data": {...}}'
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 px-4 border rounded-lg hover:bg-gray-50">
            Annuleren
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonData || isLoading}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
          >
            {isLoading ? 'Importeren...' : 'Importeren'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// EXPORT CURRENT SITE MODAL
// ============================================
const ExportCurrentModal = ({ isOpen, onClose, onExport, isLoading }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('custom');
  const [templateDescription, setTemplateDescription] = useState('');

  const handleExport = () => {
    onExport({
      name: templateName,
      category: templateCategory,
      description: templateDescription
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Huidige Site Exporteren als Template" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Exporteer uw huidige website configuratie als een herbruikbare template.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Naam *</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Mijn Custom Template"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
          <input
            type="text"
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="custom"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
          <textarea
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="flex-1 py-3 px-4 border rounded-lg hover:bg-gray-50">
            Annuleren
          </button>
          <button
            onClick={handleExport}
            disabled={!templateName || isLoading}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
          >
            {isLoading ? 'Exporteren...' : 'Exporteren & Downloaden'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// MAIN TEMPLATE MANAGER COMPONENT
// ============================================
export default function TemplateManager() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [confirmTemplate, setConfirmTemplate] = useState(null);
  const [editTemplate, setEditTemplate] = useState(null);
  const [deleteTemplate, setDeleteTemplate] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showExportCurrent, setShowExportCurrent] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/templates');
      setTemplates(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Kon templates niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (template) => {
    try {
      const response = await api.get(`/templates/${template.id}`);
      setPreviewTemplate(response.data);
    } catch (err) {
      setError('Kon template details niet laden');
    }
  };

  const handleApplyClick = (template) => {
    setConfirmTemplate(template);
  };

  const handleApplyConfirm = async (preserveContent) => {
    if (!confirmTemplate) return;
    try {
      setIsApplying(true);
      await api.post(`/templates/${confirmTemplate.id}/apply`, { preserveContent });
      setConfirmTemplate(null);
      setSuccess(`Template "${confirmTemplate.name}" is succesvol toegepast!`);
    } catch (err) {
      setError('Kon template niet toepassen: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsApplying(false);
    }
  };

  const handleEdit = async (template) => {
    try {
      const response = await api.get(`/templates/${template.id}`);
      setEditTemplate(response.data);
    } catch (err) {
      setError('Kon template niet laden voor bewerken');
    }
  };

  const handleCreate = () => {
    setEditTemplate({ id: null, name: '', data: {} });
  };

  const handleSave = async (formData) => {
    try {
      setIsSaving(true);
      if (editTemplate.id) {
        await api.put(`/templates/${editTemplate.id}`, formData);
        setSuccess('Template succesvol bijgewerkt!');
      } else {
        await api.post('/templates', formData);
        setSuccess('Template succesvol aangemaakt!');
      }
      setEditTemplate(null);
      fetchTemplates();
    } catch (err) {
      setError('Kon template niet opslaan: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (template) => {
    setDeleteTemplate(template);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTemplate) return;
    try {
      setIsDeleting(true);
      await api.delete(`/templates/${deleteTemplate.id}`);
      setSuccess(`Template "${deleteTemplate.name}" is verwijderd.`);
      setDeleteTemplate(null);
      fetchTemplates();
    } catch (err) {
      setError('Kon template niet verwijderen: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (template) => {
    try {
      setIsSaving(true);
      await api.post(`/templates/${template.id}/duplicate`);
      setSuccess(`Template "${template.name}" is gedupliceerd!`);
      fetchTemplates();
    } catch (err) {
      setError('Kon template niet dupliceren');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportTemplate = async (template) => {
    try {
      const response = await api.get(`/templates/${template.id}`);
      const data = response.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${template.slug || template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Template geëxporteerd!');
    } catch (err) {
      setError('Kon template niet exporteren');
    }
  };

  const handleImport = async (data) => {
    try {
      setIsImporting(true);
      await api.post('/templates/import', data);
      setSuccess('Template succesvol geïmporteerd!');
      setShowImport(false);
      fetchTemplates();
    } catch (err) {
      setError('Kon template niet importeren: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCurrent = async (options) => {
    try {
      setIsExporting(true);
      const response = await api.post('/templates/export', options);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${options.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Huidige site geëxporteerd als template!');
      setShowExportCurrent(false);
    } catch (err) {
      setError('Kon site niet exporteren: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsExporting(false);
    }
  };

  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin w-12 h-12 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-600">Templates laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Bibliotheek</h1>
          <p className="text-gray-600">Beheer, importeer en exporteer website templates</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowExportCurrent(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export Site
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Importeren
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nieuwe Template
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Zoek templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === category
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'Alle' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen templates gevonden</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Probeer een andere zoekterm' : 'Maak uw eerste template aan'}
          </p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Template Aanmaken
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={handlePreview}
              onApply={handleApplyClick}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onExport={handleExportTemplate}
              onDuplicate={handleDuplicate}
              isApplying={isApplying && confirmTemplate?.id === template.id}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={`Preview: ${previewTemplate?.name || ''}`}
        size="lg"
      >
        <PreviewContent template={previewTemplate} />
      </Modal>

      <Modal
        isOpen={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        title={editTemplate?.id ? 'Template Bewerken' : 'Nieuwe Template'}
        size="xl"
      >
        <TemplateEditor
          template={editTemplate}
          onSave={handleSave}
          onCancel={() => setEditTemplate(null)}
          isSaving={isSaving}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!confirmTemplate}
        onClose={() => setConfirmTemplate(null)}
        onConfirm={handleApplyConfirm}
        template={confirmTemplate}
        isLoading={isApplying}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTemplate}
        onClose={() => setDeleteTemplate(null)}
        onConfirm={handleDeleteConfirm}
        template={deleteTemplate}
        isLoading={isDeleting}
      />

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        isLoading={isImporting}
      />

      <ExportCurrentModal
        isOpen={showExportCurrent}
        onClose={() => setShowExportCurrent(false)}
        onExport={handleExportCurrent}
        isLoading={isExporting}
      />

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in { animation: modal-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
