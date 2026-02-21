import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import api from '../api/client';

export default function PublicLayout() {
  const [menu, setMenu] = useState([]);
  const [footer, setFooter] = useState({ columns: [], menus: {} });
  const [settings, setSettings] = useState({});
  const [theme, setTheme] = useState(null);
  const [navbarSettings, setNavbarSettings] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Scroll detection for navbar shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadData = async () => {
    try {
      const [menuRes, footerRes, settingsRes, themeRes] = await Promise.all([
        api.get('/public/menus/header').catch(() => ({ data: { items: [] } })),
        api.get('/public/footer').catch(() => ({ data: { columns: [] } })),
        api.get('/public/settings').catch(() => ({ data: {} })),
        api.get('/public/theme').catch(() => ({ data: null }))
      ]);

      setMenu(menuRes.data?.items || []);
      setFooter(footerRes.data || { columns: [] });
      const siteSettings = settingsRes.data || {};
      setSettings(siteSettings);

      if (themeRes.data?.colors) {
        const colors = typeof themeRes.data.colors === 'string' ? JSON.parse(themeRes.data.colors) : themeRes.data.colors;
        setTheme(colors);
        applyTheme(colors);
        // Extract navbar settings from theme
        if (colors.navbarStyle || colors.navbarHoverEffect) {
          setNavbarSettings({
            style: colors.navbarStyle || 'solid',
            hoverEffect: colors.navbarHoverEffect || 'slide-up',
            hoverColor: colors.navbarHoverColor || colors.primary || '#3b82f6',
            height: colors.navbarHeight || '72',
            fontSize: colors.navbarFontSize || '15',
            fontWeight: colors.navbarFontWeight || '500',
            letterSpacing: colors.navbarLetterSpacing || '0.01',
            gap: colors.navbarGap || '32',
            siteLayout: colors.siteLayout || 'full',
            boxedMaxWidth: colors.boxedMaxWidth || '1400',
            menuLayout: colors.menuLayout || 'standard',
            floatingPosition: colors.floatingPosition || 'right',
            floatingOffset: colors.floatingOffset || '12',
            menuItemShape: colors.menuItemShape || 'none',
            menuItemSpacing: colors.menuItemSpacing || '8',
          });
        }
      }

      // Dynamic favicon
      if (siteSettings.site_favicon) {
        const faviconLink = document.querySelector('link[rel="icon"]');
        if (faviconLink) {
          faviconLink.href = siteSettings.site_favicon;
          // Detect type from extension
          const ext = siteSettings.site_favicon.split('.').pop()?.toLowerCase();
          if (ext === 'svg') faviconLink.type = 'image/svg+xml';
          else if (ext === 'png') faviconLink.type = 'image/png';
          else if (ext === 'ico') faviconLink.type = 'image/x-icon';
          else faviconLink.type = 'image/png';
        }
      }
    } catch (error) {
      console.error('Failed to load public data:', error);
    }
  };

  const applyTheme = (colors) => {
    const root = document.documentElement;
    const mappings = {
      primary: '--color-primary', primaryLight: '--color-primary-light', primaryDark: '--color-primary-dark',
      secondary: '--color-secondary', accent: '--color-accent', background: '--color-bg',
      surface: '--color-surface', text: '--color-text', textLight: '--color-text-light',
      border: '--color-border', headerBg: '--color-header-bg', headerText: '--color-header-text',
      footerBg: '--color-footer-bg', footerText: '--color-footer-text',
      navbarHoverColor: '--navbar-hover-color'
    };
    Object.entries(mappings).forEach(([key, cssVar]) => {
      if (colors[key]) root.style.setProperty(cssVar, colors[key]);
    });
    if (colors.fontFamily) root.style.setProperty('--font-family', colors.fontFamily + ', sans-serif');
    if (colors.borderRadius) root.style.setProperty('--border-radius', colors.borderRadius + 'px');
    if (colors.navbarHeight) root.style.setProperty('--navbar-height', colors.navbarHeight + 'px');
    if (colors.navbarFontSize) root.style.setProperty('--navbar-font-size', colors.navbarFontSize + 'px');
    if (colors.navbarFontWeight) root.style.setProperty('--navbar-font-weight', colors.navbarFontWeight);
    if (colors.navbarLetterSpacing) root.style.setProperty('--navbar-letter-spacing', colors.navbarLetterSpacing + 'em');
    if (colors.navbarGap) root.style.setProperty('--navbar-gap', colors.navbarGap + 'px');
  };

  // Strip extra quotes from site name (JSON serialization quirk)
  const rawName = settings.site_name || 'Moveo BV';
  const siteName = typeof rawName === 'string' ? rawName.replace(/^["']+|["']+$/g, '') : rawName;
  const siteLogo = settings.site_logo || '';

  const hoverClass = `nav-link-hover-${navbarSettings.hoverEffect || 'slide-up'}`;
  const navHeight = navbarSettings.height || '72';
  const navFontSize = navbarSettings.fontSize || '15';
  const navFontWeight = navbarSettings.fontWeight || '500';
  const navLetterSpacing = navbarSettings.letterSpacing || '0.01';
  const navGap = navbarSettings.gap || '32';
  const menuLayout = navbarSettings.menuLayout || 'standard';
  const floatingPosition = navbarSettings.floatingPosition || 'right';
  const floatingOffset = navbarSettings.floatingOffset || '12';
  const menuItemShape = navbarSettings.menuItemShape || 'none';
  const menuItemSpacing = navbarSettings.menuItemSpacing || '8';
  const siteLayout = navbarSettings.siteLayout || 'full';
  const boxedMaxWidth = navbarSettings.boxedMaxWidth || '1400';

  // Menu item shape class
  const getShapeClass = (shape) => {
    switch (shape) {
      case 'square': return 'menu-shape-square';
      case 'round': return 'menu-shape-round';
      case 'parallelogram': return 'menu-shape-parallelogram';
      default: return '';
    }
  };

  // Filter menu items based on calculator setting
  const filteredMenu = menu.filter(item => 
    !(settings.calculator_enabled === 'false' && (item.url === '/calculator' || item.url === 'calculator'))
  );

  // Is floating layout?
  const isFloating = menuLayout === 'floating';
  const isBoxed = menuLayout === 'boxed';
  const isSiteBoxed = siteLayout === 'boxed';
  const containerStyle = isSiteBoxed ? { maxWidth: `${boxedMaxWidth}px`, margin: '0 auto' } : {};

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-family, Inter, sans-serif)' }}>
      {/* Floating Menu (when layout is floating) - Hidden on mobile */}
      {isFloating && (
        <nav 
          className={`fixed top-1/2 -translate-y-1/2 z-50 floating-menu floating-menu-${floatingPosition} hidden md:flex`}
          style={{
            [floatingPosition]: `${floatingOffset}px`,
          }}
        >
          <div 
            className="flex flex-col"
            style={{ 
              gap: `${menuItemSpacing}px`,
            }}
          >
            {filteredMenu.map(item => {
              const isActive = location.pathname === (item.url || '/');
              const itemStyles = typeof item.styles === 'string' ? JSON.parse(item.styles) : (item.styles || {});
              const bgColor = itemStyles.bgColor || 'var(--color-header-bg, #3b82f6)';
              const textColor = itemStyles.textColor || '#ffffff';
              const hoverColor = itemStyles.hoverColor || '#2563eb';
              const shape = itemStyles.shape || 'square';
              const effect = itemStyles.effect || 'none';
              const textEffect = itemStyles.textEffect || 'none';
              
              return (
                <Link
                  key={item.id}
                  to={item.url || '/'}
                  target={item.target === '_blank' ? '_blank' : undefined}
                  className={`floating-menu-item floating-item-${shape} floating-effect-${effect} floating-text-${textEffect} ${isActive ? 'floating-item-active' : ''} transition-all duration-300`}
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    fontSize: `${navFontSize}px`,
                    fontWeight: navFontWeight,
                    letterSpacing: `${navLetterSpacing}em`,
                    padding: '12px 20px',
                    '--hover-color': hoverColor,
                    '--bg-color': bgColor,
                  }}
                  title={item.label}
                >
                  <span className={shape === 'parallelogram' ? 'skew-x-[12deg] inline-block' : ''}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 transition-all duration-300" style={{
        backgroundColor: 'var(--color-header-bg, #1e40af)',
        color: 'var(--color-header-text, #ffffff)',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={containerStyle}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between" style={{ height: `${navHeight}px` }}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" style={{ color: 'var(--color-header-text, #ffffff)' }}>
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="max-h-12 max-w-[200px] object-contain transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <span className="text-xl font-bold tracking-tight">{siteName}</span>
              )}
            </Link>

            {/* Desktop Navigation (not shown when floating) */}
            {!isFloating && (
              <nav className={`hidden md:flex items-center ${isBoxed ? 'boxed-nav' : ''}`} style={{ gap: `${navGap}px` }}>
                {isBoxed && (
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      margin: '8px 0',
                    }}
                  />
                )}
                {filteredMenu.map(item => {
                  const isActive = location.pathname === (item.url || '/');
                  return (
                    <Link
                      key={item.id}
                      to={item.url || '/'}
                      target={item.target === '_blank' ? '_blank' : undefined}
                      className={`${hoverClass} ${getShapeClass(menuItemShape)} ${isActive ? 'nav-active' : ''} py-2 px-1 inline-flex items-center transition-all duration-300 relative z-10`}
                      style={{
                        color: 'var(--color-header-text, #ffffff)',
                        fontSize: `${navFontSize}px`,
                        fontWeight: navFontWeight,
                        letterSpacing: `${navLetterSpacing}em`,
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Mobile menu button (shown on mobile for all layouts) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: mobileMenuOpen ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: 'var(--color-header-text, #ffffff)'
              }}
            >
              <svg className="w-6 h-6 transition-transform duration-300" style={{ transform: mobileMenuOpen ? 'rotate(90deg)' : 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation (shown on mobile for all layouts) */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-5 pt-1 animate-fade-in">
              <div className="flex flex-col gap-1 rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                {filteredMenu.map(item => {
                  const isActive = location.pathname === (item.url || '/');
                  return (
                    <Link
                      key={item.id}
                      to={item.url || '/'}
                      className={`px-4 py-3 font-medium transition-all duration-200 ${getShapeClass(menuItemShape)}`}
                      style={{
                        color: 'var(--color-header-text, #ffffff)',
                        fontSize: `${navFontSize}px`,
                        backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                        borderLeft: isActive ? `3px solid var(--navbar-hover-color, #3b82f6)` : '3px solid transparent',
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-10" style={containerStyle}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--color-footer-bg, #0f172a)',
        color: 'var(--color-footer-text, #f8fafc)'
      }}>
        <div style={containerStyle}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(footer.columns || []).map((col, i) => (
              <div key={col.id || i}>
                {col.title && <h4 className="font-bold text-lg mb-4">{col.title}</h4>}
                {col.content && (
                  <div className="text-sm opacity-80 prose prose-invert prose-sm"
                    dangerouslySetInnerHTML={{ __html: typeof col.content === 'string' ? col.content : (col.content?.html || '') }} />
                )}
                {col.menuItems && col.menuItems.length > 0 && (
                  <nav className="mt-3 space-y-2">
                    {col.menuItems.map(item => (
                      <Link key={item.id} to={item.url || '/'} className="block text-sm opacity-70 hover:opacity-100 transition-opacity">
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm opacity-60">
              &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {settings.social_facebook && <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 text-sm">Facebook</a>}
              {settings.social_instagram && <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 text-sm">Instagram</a>}
              {settings.social_linkedin && <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 text-sm">LinkedIn</a>}
              {settings.social_twitter && <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 text-sm">X</a>}
            </div>
          </div>
        </div>
        </div>
      </footer>
    </div>
  );
}
