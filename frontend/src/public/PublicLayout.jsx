import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import api from '../api/client';

export default function PublicLayout() {
  const [menu, setMenu] = useState([]);
  const [footer, setFooter] = useState({ columns: [], menus: {} });
  const [settings, setSettings] = useState({});
  const [theme, setTheme] = useState(null);
  const [navbarSettings, setNavbarSettings] = useState({});
  const [footerSettings, setFooterSettings] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [hasFullBleedHero, setHasFullBleedHero] = useState(false);
  const location = useLocation();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Detect full-bleed hero on page
  useEffect(() => {
    const checkFullBleed = () => {
      const fullBleedHero = document.querySelector('.hero-full-bleed');
      setHasFullBleedHero(!!fullBleedHero);
    };
    // Check after a short delay to allow content to render
    const timer = setTimeout(checkFullBleed, 100);
    // Also observe DOM changes
    const observer = new MutationObserver(checkFullBleed);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

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
        setThemeLoaded(true);
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
            sticky: colors.navbarSticky !== false, // Sticky navigation
            siteLayout: colors.siteLayout || 'full',
            boxedMaxWidth: colors.boxedMaxWidth || '1400',
            menuLayout: colors.menuLayout || 'standard',
            floatingPosition: colors.floatingPosition || 'right',
            floatingOffset: colors.floatingOffset || '12',
            menuItemShape: colors.menuItemShape || 'none',
            menuItemSpacing: colors.menuItemSpacing || '8',
            // Top Bar settings
            topBarEnabled: colors.topBarEnabled || false,
            topBarBgColor: colors.topBarBgColor || '#0f172a',
            topBarTextColor: colors.topBarTextColor || '#ffffff',
            topBarHeight: colors.topBarHeight || '40',
            topBarContent: colors.topBarContent || '',
            topBarPhone: colors.topBarPhone || '',
            topBarEmail: colors.topBarEmail || '',
            topBarShowSocials: colors.topBarShowSocials || false,
            // Navigation template
            navTemplate: colors.navTemplate || 'standard',
            navUnderlineStyle: colors.navUnderlineStyle || 'slide',
            navIconsEnabled: colors.navIconsEnabled || false,
            navUppercase: colors.navUppercase || false,
          });
        }
        // Extract footer settings from theme
        setFooterSettings({
          theme: colors.footerTheme || 'classic',
          columns: colors.footerColumns || '3',
          gradient: colors.footerGradient || 'none',
          blur: colors.footerBlur || false,
          socialStyle: colors.footerSocialStyle || 'circle',
          animatedColor1: colors.footerAnimatedColor1 || colors.footerBg || '#0f172a',
          animatedColor2: colors.footerAnimatedColor2 || colors.primary || '#3b82f6',
          animationSpeed: colors.footerAnimationSpeed || 10,
        });
      } else {
        // No theme data, still mark as loaded to show header with defaults
        setThemeLoaded(true);
      }

      // Override with Navigation Settings from PageBuilder if enabled
      if (siteSettings.navigation_settings) {
        const navSettings = typeof siteSettings.navigation_settings === 'string'
          ? JSON.parse(siteSettings.navigation_settings)
          : siteSettings.navigation_settings;
        
        if (navSettings.enabled) {
          setNavbarSettings(prev => ({
            ...prev,
            // Override with custom navigation settings
            customEnabled: true,
            bgColor: navSettings.bgColor || prev.headerBg || '#1e40af',
            bgOpacity: navSettings.bgOpacity ?? 100,
            bgEffect: navSettings.bgEffect || 'none',
            bgGradientFrom: navSettings.bgGradientFrom || navSettings.bgColor || '#1e40af',
            bgGradientTo: navSettings.bgGradientTo || '#3b82f6',
            bgGradientDirection: navSettings.bgGradientDirection || 'to-right',
            bgBlurStrength: navSettings.bgBlurStrength || 20,
            bgEffectOpacity: navSettings.bgEffectOpacity ?? 70,
            bgAnimationSpeed: navSettings.bgAnimationSpeed || 8,
            textColor: navSettings.textColor || '#ffffff',
            sticky: navSettings.sticky ?? prev.sticky,
            height: navSettings.height || prev.height || '72',
            fontSize: navSettings.fontSize || prev.fontSize || '15',
            fontWeight: navSettings.fontWeight || prev.fontWeight || '500',
            letterSpacing: navSettings.letterSpacing || prev.letterSpacing || '0.01',
            uppercase: navSettings.uppercase || false,
            gap: navSettings.gap || prev.gap || '32',
            // Button settings
            buttonShape: navSettings.buttonShape || 'none',
            buttonBgColor: navSettings.buttonBgColor || '#3b82f6',
            buttonBgOpacity: navSettings.buttonBgOpacity ?? 100,
            buttonTextColor: navSettings.buttonTextColor || '#ffffff',
            buttonHoverColor: navSettings.buttonHoverColor || '#2563eb',
            buttonHoverTextColor: navSettings.buttonHoverTextColor || '#ffffff',
            buttonEffect: navSettings.buttonEffect || 'none',
            buttonEffectColor: navSettings.buttonEffectColor || navSettings.buttonBgColor || '#3b82f6',
            buttonBorderRadius: navSettings.buttonBorderRadius || 8,
            buttonPaddingX: navSettings.buttonPaddingX || 16,
            buttonPaddingY: navSettings.buttonPaddingY || 8,
            // Logo settings
            logoMaxHeight: navSettings.logoMaxHeight || 48,
            logoMaxWidth: navSettings.logoMaxWidth || 200,
            // Mobile menu
            mobileMenuBgOpacity: navSettings.mobileMenuBgOpacity ?? 100,
            mobileItemPadding: navSettings.mobileItemPadding || 12,
          }));
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
      
      // Dynamic document title
      if (siteSettings.site_name) {
        const rawName = typeof siteSettings.site_name === 'string' 
          ? siteSettings.site_name.replace(/^["']+|["']+$/g, '') 
          : siteSettings.site_name;
        document.title = rawName;
      }
    } catch (error) {
      console.error('Failed to load public data:', error);
      setThemeLoaded(true); // Show header even on error
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
  
  // Boxed layout wrapper styles
  const boxedWrapperStyle = isSiteBoxed ? {
    maxWidth: `${boxedMaxWidth}px`,
    margin: '0 auto',
    boxShadow: '0 0 50px rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
  } : {};

  return (
    <div 
      className={`min-h-screen ${themeLoaded ? 'theme-loaded' : 'theme-loading'}`} 
      style={{ 
        fontFamily: 'var(--font-family, Inter, sans-serif)',
        backgroundColor: isSiteBoxed ? '#f1f5f9' : undefined,
      }}
    >
      <div className="min-h-screen flex flex-col" style={boxedWrapperStyle}>
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
              
              // Map effect to CSS class
              const effectClass = effect && effect !== 'none' 
                ? `nav-btn-effect nav-btn-effect-${effect}` 
                : '';
              
              return (
                <Link
                  key={item.id}
                  to={item.url || '/'}
                  target={item.target === '_blank' ? '_blank' : undefined}
                  className={`floating-menu-item floating-item-${shape} ${effectClass} floating-text-${textEffect} ${isActive ? 'floating-item-active' : ''} transition-all duration-300`}
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    fontSize: `${navFontSize}px`,
                    fontWeight: navFontWeight,
                    letterSpacing: `${navLetterSpacing}em`,
                    padding: '12px 20px',
                    '--btn-color': bgColor,
                    '--btn-hover-color': hoverColor,
                    '--btn-glow-color': `${bgColor}80`,
                    '--btn-shadow-color': hoverColor,
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

      {/* Top Bar - Optional bar above navigation */}
      {navbarSettings.topBarEnabled && (
        <div 
          className="top-bar w-full"
          style={{
            backgroundColor: navbarSettings.topBarBgColor || '#0f172a',
            color: navbarSettings.topBarTextColor || '#ffffff',
            height: `${navbarSettings.topBarHeight || 40}px`,
          }}
        >
          <div className={isSiteBoxed ? 'px-4 sm:px-6 lg:px-8 h-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full'}>
            <div className="top-bar-content h-full text-sm">
              {/* Custom content */}
              {navbarSettings.topBarContent && (
                <span dangerouslySetInnerHTML={{ __html: navbarSettings.topBarContent }} />
              )}
              
              {/* Phone */}
              {navbarSettings.topBarPhone && (
                <a 
                  href={`tel:${navbarSettings.topBarPhone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2"
                  style={{ color: navbarSettings.topBarTextColor || '#ffffff' }}
                >
                  <span>📞</span>
                  <span>{navbarSettings.topBarPhone}</span>
                </a>
              )}
              
              {/* Email */}
              {navbarSettings.topBarEmail && (
                <a 
                  href={`mailto:${navbarSettings.topBarEmail}`}
                  className="flex items-center gap-2"
                  style={{ color: navbarSettings.topBarTextColor || '#ffffff' }}
                >
                  <span>✉️</span>
                  <span>{navbarSettings.topBarEmail}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header 
        className={`${navbarSettings.sticky && !isSiteBoxed ? 'sticky top-0' : ''} z-40 transition-all duration-300 ${hasFullBleedHero && !scrolled ? 'navbar-transparent' : ''} ${navbarSettings.customEnabled && navbarSettings.bgEffect === 'animated' ? 'nav-bg-animated' : ''}`} 
        style={{
          background: hasFullBleedHero && !scrolled 
            ? 'transparent' 
            : navbarSettings.customEnabled 
              ? navbarSettings.bgEffect === 'none'
                ? 'transparent'
              : navbarSettings.bgEffect === 'solid'
                ? `${navbarSettings.bgColor}${Math.round((navbarSettings.bgOpacity ?? 100) * 2.55).toString(16).padStart(2, '0')}`
              : navbarSettings.bgEffect === 'gradient'
                ? `linear-gradient(${
                    navbarSettings.bgGradientDirection === 'to-right' ? 'to right' :
                    navbarSettings.bgGradientDirection === 'to-left' ? 'to left' :
                    navbarSettings.bgGradientDirection === 'to-bottom' ? 'to bottom' :
                    navbarSettings.bgGradientDirection === 'to-top' ? 'to top' :
                    navbarSettings.bgGradientDirection === 'diagonal' ? '135deg' :
                    navbarSettings.bgGradientDirection === 'diagonal-reverse' ? '-135deg' : 'to right'
                  }, ${navbarSettings.bgGradientFrom || navbarSettings.bgColor}, ${navbarSettings.bgGradientTo || '#3b82f6'})`
              : navbarSettings.bgEffect === 'glass'
                ? `rgba(${parseInt(navbarSettings.bgColor?.slice(1,3), 16) || 30}, ${parseInt(navbarSettings.bgColor?.slice(3,5), 16) || 64}, ${parseInt(navbarSettings.bgColor?.slice(5,7), 16) || 175}, ${(navbarSettings.bgEffectOpacity ?? 70) / 100})`
              : navbarSettings.bgEffect === 'blur'
                ? `rgba(${parseInt(navbarSettings.bgColor?.slice(1,3), 16) || 30}, ${parseInt(navbarSettings.bgColor?.slice(3,5), 16) || 64}, ${parseInt(navbarSettings.bgColor?.slice(5,7), 16) || 175}, ${(navbarSettings.bgOpacity ?? 100) / 100})`
              : navbarSettings.bgEffect === 'animated'
                ? undefined // CSS animation handles this
                : `${navbarSettings.bgColor}${Math.round((navbarSettings.bgOpacity ?? 100) * 2.55).toString(16).padStart(2, '0')}`
            : 'var(--color-header-bg, #1e40af)',
          '--nav-gradient-from': navbarSettings.bgGradientFrom || navbarSettings.bgColor || '#3b82f6',
          '--nav-gradient-to': navbarSettings.bgGradientTo || '#8b5cf6',
          '--nav-animation-speed': `${navbarSettings.bgAnimationSpeed || 8}s`,
          color: navbarSettings.customEnabled ? navbarSettings.textColor : 'var(--color-header-text, #ffffff)',
          boxShadow: scrolled && !isSiteBoxed ? '0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)' : (hasFullBleedHero && !scrolled ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'),
          backdropFilter: (hasFullBleedHero && !scrolled) 
            ? 'none' 
            : (navbarSettings.customEnabled && navbarSettings.bgEffect === 'glass') 
              ? `blur(${navbarSettings.bgBlurStrength || 20}px) saturate(180%)`
              : (navbarSettings.customEnabled && navbarSettings.bgEffect === 'blur')
                ? `blur(${navbarSettings.bgBlurStrength || 12}px)`
                : 'none',
        }}
      >
          <div className={isSiteBoxed ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
            <div className="flex items-center justify-between" style={{ height: `${navHeight}px` }}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" style={{ color: navbarSettings.customEnabled ? navbarSettings.textColor : 'var(--color-header-text, #ffffff)' }}>
              {siteLogo ? (
                <img 
                  src={siteLogo} 
                  alt={siteName} 
                  className="object-contain transition-transform duration-300 group-hover:scale-105" 
                  style={{
                    maxHeight: navbarSettings.customEnabled ? `${navbarSettings.logoMaxHeight || 48}px` : '48px',
                    maxWidth: navbarSettings.customEnabled ? `${navbarSettings.logoMaxWidth || 200}px` : '200px',
                  }}
                />
              ) : (
                <span className="text-xl font-bold tracking-tight">{siteName}</span>
              )}
            </Link>

            {/* Desktop Navigation (not shown when floating) */}
            {!isFloating && (
              <nav className={`hidden md:flex items-center ${isBoxed ? 'boxed-nav' : ''} nav-template-${navbarSettings.navTemplate || 'standard'} nav-underline-${navbarSettings.navUnderlineStyle || 'slide'}`} style={{ gap: `${navGap}px` }}>
                {filteredMenu.map(item => {
                  const isActive = location.pathname === (item.url || '/');
                  // Use custom button settings if enabled
                  const useCustomButtons = navbarSettings.customEnabled && navbarSettings.buttonShape !== 'none';
                  const buttonEffect = navbarSettings.customEnabled ? navbarSettings.buttonEffect : 'none';
                  const hasEffect = buttonEffect && buttonEffect !== 'none';
                  const effectClass = hasEffect
                    ? `nav-btn-effect nav-btn-effect-${buttonEffect}` 
                    : '';
                  
                  // Only apply hoverClass when using standard template and not custom buttons
                  const navTemplateClass = !useCustomButtons && (navbarSettings.navTemplate || 'standard') === 'standard' ? hoverClass : '';
                  
                  // CSS variables for effects - always pass when effect is enabled
                  const effectVars = hasEffect ? {
                    '--btn-color': navbarSettings.buttonEffectColor || navbarSettings.buttonBgColor || '#3b82f6',
                    '--btn-hover-color': navbarSettings.buttonHoverColor || '#2563eb',
                    '--btn-glow-color': `${navbarSettings.buttonEffectColor || navbarSettings.buttonBgColor || '#3b82f6'}80`,
                    '--btn-text-hover': navbarSettings.buttonHoverTextColor || '#ffffff',
                    '--surface-color': navbarSettings.bgColor || '#f5f5f5',
                  } : {};
                  
                  // Build button styles for custom navigation
                  const buttonStyles = useCustomButtons ? {
                    backgroundColor: `${navbarSettings.buttonBgColor}${Math.round((navbarSettings.buttonBgOpacity || 100) * 2.55).toString(16).padStart(2, '0')}`,
                    color: navbarSettings.buttonTextColor,
                    padding: `${navbarSettings.buttonPaddingY}px ${navbarSettings.buttonPaddingX}px`,
                    borderRadius: navbarSettings.buttonShape === 'round' ? '50%' :
                                  navbarSettings.buttonShape === 'pill' ? '9999px' :
                                  `${navbarSettings.buttonBorderRadius}px`,
                    transform: navbarSettings.buttonShape === 'parallelogram' ? 'skewX(-12deg)' : 'none',
                    ...effectVars,
                  } : effectVars;
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.url || '/'}
                      target={item.target === '_blank' ? '_blank' : undefined}
                      className={`nav-item ${navTemplateClass} ${effectClass} ${getShapeClass(useCustomButtons ? 'none' : menuItemShape)} ${isActive ? 'nav-active' : ''} ${useCustomButtons ? '' : 'py-2 px-1'} inline-flex items-center transition-all duration-300 relative z-10`}
                      style={{
                        color: useCustomButtons ? navbarSettings.buttonTextColor : (navbarSettings.customEnabled ? navbarSettings.textColor : 'var(--color-header-text, #ffffff)'),
                        fontSize: `${navFontSize}px`,
                        fontWeight: navFontWeight,
                        letterSpacing: `${navLetterSpacing}em`,
                        textTransform: navbarSettings.customEnabled ? (navbarSettings.uppercase ? 'uppercase' : 'none') : (navbarSettings.navUppercase ? 'uppercase' : 'none'),
                        ...buttonStyles,
                      }}
                    >
                      <span className={navbarSettings.buttonShape === 'parallelogram' ? 'skew-x-[12deg] inline-block' : ''}>
                        {navbarSettings.navIconsEnabled && item.icon && (
                          <span className="mr-2">{item.icon}</span>
                        )}
                        {item.label}
                      </span>
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
                color: navbarSettings.customEnabled ? navbarSettings.textColor : 'var(--color-header-text, #ffffff)'
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
              <div 
                className="flex flex-col gap-1 rounded-xl overflow-hidden" 
                style={{ 
                  backgroundColor: navbarSettings.customEnabled 
                    ? `rgba(255,255,255,${(navbarSettings.mobileMenuBgOpacity || 100) / 1000})` 
                    : 'rgba(255,255,255,0.06)' 
                }}
              >
                {filteredMenu.map(item => {
                  const isActive = location.pathname === (item.url || '/');
                  return (
                    <Link
                      key={item.id}
                      to={item.url || '/'}
                      className={`font-medium transition-all duration-200 ${getShapeClass(menuItemShape)}`}
                      style={{
                        color: navbarSettings.customEnabled ? navbarSettings.textColor : 'var(--color-header-text, #ffffff)',
                        fontSize: `${navFontSize}px`,
                        padding: navbarSettings.customEnabled 
                          ? `${navbarSettings.mobileItemPadding || 12}px 16px` 
                          : '12px 16px',
                        backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                        borderLeft: isActive 
                          ? `3px solid ${navbarSettings.customEnabled ? navbarSettings.buttonHoverColor : 'var(--navbar-hover-color, #3b82f6)'}` 
                          : '3px solid transparent',
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
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer 
        className={`footer-theme-${footerSettings.theme || 'classic'} ${footerSettings.blur ? 'footer-blur' : ''} ${footerSettings.theme === 'animated' ? 'footer-bg-animated' : ''}`}
        style={{
          '--footer-bg': 'var(--color-footer-bg, #0f172a)',
          '--footer-text': 'var(--color-footer-text, #f8fafc)',
          '--footer-primary': 'var(--color-primary, #3b82f6)',
          '--footer-animated-color1': footerSettings.animatedColor1 || 'var(--color-footer-bg, #0f172a)',
          '--footer-animated-color2': footerSettings.animatedColor2 || 'var(--color-primary, #3b82f6)',
          '--footer-animation-speed': `${footerSettings.animationSpeed || 10}s`,
          background: footerSettings.theme === 'animated' 
            ? undefined // CSS animation handles this
            : (footerSettings.theme === 'gradient' || footerSettings.theme === 'glass')
              ? footerSettings.gradient === 'to-top' 
                ? 'linear-gradient(to top, var(--color-footer-bg, #0f172a), var(--color-primary, #3b82f6))'
                : footerSettings.gradient === 'to-right'
                ? 'linear-gradient(to right, var(--color-footer-bg, #0f172a), var(--color-primary, #3b82f6))'
                : footerSettings.gradient === 'diagonal'
                ? 'linear-gradient(135deg, var(--color-footer-bg, #0f172a), var(--color-primary, #3b82f6))'
                : 'var(--color-footer-bg, #0f172a)'
              : 'var(--color-footer-bg, #0f172a)',
          color: 'var(--color-footer-text, #f8fafc)',
        }}
      >
        <div className={isSiteBoxed ? 'px-4 sm:px-6 lg:px-8 py-12' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'}>
          {/* Footer Columns */}
          <div 
            className={`grid gap-8 ${
              parseInt(footerSettings.columns || '3') === 2 ? 'grid-cols-1 md:grid-cols-2' :
              parseInt(footerSettings.columns || '3') === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
              parseInt(footerSettings.columns || '3') === 5 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
              'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {(footer.columns || []).map((col, i) => (
              <div 
                key={col.id || i} 
                className={`footer-column ${footerSettings.theme === 'glass' ? 'glass-column' : ''}`}
              >
                {col.title && (
                  <h4 className={`font-bold text-lg mb-4 ${footerSettings.theme === 'modern' ? 'border-l-4 pl-3' : ''}`}
                    style={{ borderColor: footerSettings.theme === 'modern' ? 'var(--color-primary, #3b82f6)' : 'transparent' }}>
                    {col.title}
                  </h4>
                )}
                {col.content && (
                  <div className="text-sm opacity-80 prose prose-invert prose-sm"
                    dangerouslySetInnerHTML={{ __html: typeof col.content === 'string' ? col.content : (col.content?.html || '') }} />
                )}
                {col.menuItems && col.menuItems.length > 0 && (
                  <nav className="mt-3 space-y-2">
                    {col.menuItems.map(item => {
                      const itemStyles = typeof item.styles === 'string' ? JSON.parse(item.styles) : (item.styles || {});
                      const effect = itemStyles.effect || 'none';
                      const shape = itemStyles.shape || 'square';
                      const bgColor = itemStyles.bgColor;
                      const textColor = itemStyles.textColor;
                      const hoverColor = itemStyles.hoverColor || bgColor;
                      
                      const hasEffect = effect && effect !== 'none';
                      const effectClass = hasEffect ? `nav-btn-effect nav-btn-effect-${effect}` : '';
                      const shapeClass = hasEffect ? `floating-item-${shape}` : '';
                      
                      return (
                        <Link 
                          key={item.id} 
                          to={item.url || '/'} 
                          className={`block text-sm transition-all duration-200 ${hasEffect ? `${effectClass} ${shapeClass} py-2 px-3 inline-block` : 'opacity-70 hover:opacity-100 hover:translate-x-1'}`}
                          style={hasEffect ? {
                            backgroundColor: bgColor || 'var(--color-primary, #3b82f6)',
                            color: textColor || '#ffffff',
                            '--btn-color': bgColor || 'var(--color-primary, #3b82f6)',
                            '--btn-hover-color': hoverColor,
                            '--btn-glow-color': `${bgColor || '#3b82f6'}80`,
                            '--btn-shadow-color': hoverColor,
                          } : undefined}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className={`mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
            footerSettings.theme === 'glass' ? 'border-white/20' : 'border-white/10'
          }`}>
            <p className="text-sm opacity-60">
              &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
            
            {/* Social Icons with Theme Styles */}
            <div className={`flex items-center gap-3 social-icons-${footerSettings.socialStyle || 'circle'}`}>
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="social-icon" title="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
                </a>
              )}
              {settings.social_linkedin && (
                <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="social-icon" title="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              )}
              {settings.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="social-icon" title="X">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
