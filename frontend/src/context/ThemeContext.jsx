import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const res = await api.get('/public/theme');
      if (res.data) {
        setTheme(res.data);
        applyTheme(res.data);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const applyTheme = (themeData) => {
    if (!themeData?.colors) return;
    
    const root = document.documentElement;
    const colors = themeData.colors;
    
    root.style.setProperty('--color-primary', colors.primary || '#1e40af');
    root.style.setProperty('--color-primary-light', colors.primaryLight || '#3b82f6');
    root.style.setProperty('--color-primary-dark', colors.primaryDark || '#1e3a8a');
    root.style.setProperty('--color-secondary', colors.secondary || '#0f172a');
    root.style.setProperty('--color-accent', colors.accent || '#06b6d4');
    root.style.setProperty('--color-background', colors.background || '#ffffff');
    root.style.setProperty('--color-background-alt', colors.backgroundAlt || '#f8fafc');
    root.style.setProperty('--color-surface', colors.surface || '#ffffff');
    root.style.setProperty('--color-surface-hover', colors.surfaceHover || '#f1f5f9');
    root.style.setProperty('--color-text', colors.text || '#0f172a');
    root.style.setProperty('--color-text-light', colors.textLight || '#64748b');
    root.style.setProperty('--color-text-inverse', colors.textInverse || '#ffffff');
    root.style.setProperty('--color-border', colors.border || '#e2e8f0');
    root.style.setProperty('--color-border-dark', colors.borderDark || '#cbd5e1');
    root.style.setProperty('--color-success', colors.success || '#10b981');
    root.style.setProperty('--color-warning', colors.warning || '#f59e0b');
    root.style.setProperty('--color-error', colors.error || '#ef4444');
    root.style.setProperty('--color-info', colors.info || '#3b82f6');
    root.style.setProperty('--color-header-bg', colors.headerBg || '#1e40af');
    root.style.setProperty('--color-header-text', colors.headerText || '#ffffff');
    root.style.setProperty('--color-footer-bg', colors.footerBg || '#0f172a');
    root.style.setProperty('--color-footer-text', colors.footerText || '#e2e8f0');
    root.style.setProperty('--color-nav-bg', colors.navBg || '#ffffff');
    root.style.setProperty('--color-nav-text', colors.navText || '#0f172a');
    root.style.setProperty('--color-nav-hover', colors.navHover || '#1e40af');
    root.style.setProperty('--color-button-primary', colors.buttonPrimary || '#1e40af');
    root.style.setProperty('--color-button-primary-text', colors.buttonPrimaryText || '#ffffff');
    root.style.setProperty('--color-link', colors.linkColor || '#1e40af');
    root.style.setProperty('--color-link-hover', colors.linkHover || '#3b82f6');

    // Navbar customization
    if (colors.navbarHoverColor) root.style.setProperty('--navbar-hover-color', colors.navbarHoverColor);
    if (colors.navbarHeight) root.style.setProperty('--navbar-height', colors.navbarHeight + 'px');
    if (colors.navbarFontSize) root.style.setProperty('--navbar-font-size', colors.navbarFontSize + 'px');
    if (colors.navbarFontWeight) root.style.setProperty('--navbar-font-weight', colors.navbarFontWeight);
    if (colors.navbarLetterSpacing) root.style.setProperty('--navbar-letter-spacing', colors.navbarLetterSpacing + 'em');
    if (colors.navbarGap) root.style.setProperty('--navbar-gap', colors.navbarGap + 'px');

    if (themeData.fonts) {
      root.style.setProperty('--font-heading', themeData.fonts.heading || "'Inter', sans-serif");
      root.style.setProperty('--font-body', themeData.fonts.body || "'Inter', sans-serif");
    }
  };

  const refreshTheme = () => loadTheme();

  return (
    <ThemeContext.Provider value={{ theme, applyTheme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
