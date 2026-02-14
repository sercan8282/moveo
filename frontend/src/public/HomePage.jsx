import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import BlockRenderer from '../components/BlockRenderer';

export default function HomePage() {
  const [pageContent, setPageContent] = useState(null);   // builder rows from page system
  const [sections, setSections] = useState([]);             // legacy HomepageSection
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHomepage(); }, []);

  const loadHomepage = async () => {
    try {
      // 1) Try loading the "home" page from the page system
      const pageRes = await api.get('/public/pages/home');
      const page = pageRes.data;
      let content = page.content;
      if (typeof content === 'string') {
        try { content = JSON.parse(content); } catch { content = null; }
      }
      if (content?.mode === 'builder' && content.rows?.length > 0) {
        setPageContent(content.rows);
        document.title = page.metaTitle || page.title || 'Home';
        setLoading(false);
        return;
      }
      if (content?.html) {
        setSections([{ id: 'html', type: 'text', title: '', content: { text: content.html } }]);
        setLoading(false);
        return;
      }
    } catch {
      // Page "home" doesn't exist, fall through to HomepageSections
    }

    // 2) Fallback: load legacy HomepageSections
    try {
      const res = await api.get('/public/homepage');
      setSections(res.data || []);
    } catch (error) {
      console.error('Failed to load homepage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  }

  // Render builder content (from Page system)
  if (pageContent) {
    return <BlockRenderer rows={pageContent} />;
  }

  // Render legacy HomepageSections
  if (sections.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text, #0f172a)' }}>Welcome</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-light, #64748b)' }}>
            Configureer uw homepage in het admin paneel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {sections.map(section => (
        <Section key={section.id} section={section} />
      ))}
    </div>
  );
}

function Section({ section }) {
  const settings = typeof section.settings === 'string' ? JSON.parse(section.settings) : (section.settings || {});
  const content = typeof section.content === 'string' ? section.content : (section.content?.text || section.content?.html || '');

  switch (section.type) {
    case 'hero':
      return (
        <section
          className="relative py-24 md:py-32 bg-cover bg-center"
          style={{
            backgroundImage: settings.imageUrl ? `url(${settings.imageUrl})` : undefined,
            backgroundColor: settings.imageUrl ? undefined : 'var(--color-primary, #2563eb)'
          }}
        >
          {settings.imageUrl && <div className="absolute inset-0 bg-black/50"></div>}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {section.title && (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in">
                {section.title}
              </h1>
            )}
            {section.subtitle && (
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
                {section.subtitle}
              </p>
            )}
            {settings.buttonText && (
              <Link
                to={settings.buttonUrl || '/'}
                className="inline-block px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                {settings.buttonText}
              </Link>
            )}
          </div>
        </section>
      );

    case 'featured': {
      const items = typeof section.content === 'object' && section.content?.items 
        ? section.content.items 
        : [];
      const isStats = settings.style === 'stats';
      const cols = settings.columns || 3;
      const gridClass = cols === 4 ? 'grid-cols-2 md:grid-cols-4' : cols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3';

      return (
        <section className="py-16 md:py-20" style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: 'var(--color-text, #0f172a)' }}>
                {section.title}
              </h2>
            )}
            {section.subtitle && (
              <p className="text-center max-w-2xl mx-auto mb-10" style={{ color: 'var(--color-text-light, #64748b)' }}>
                {section.subtitle}
              </p>
            )}
            {items.length > 0 ? (
              <div className={`grid ${gridClass} gap-8`}>
                {items.map((item, i) => (
                  isStats ? (
                    <div key={i} className="text-center p-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg, #fff)' }}>
                      <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'var(--color-primary, #2563eb)' }}>
                        {item.title}
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-light, #64748b)' }}>{item.description}</p>
                    </div>
                  ) : (
                    <div key={i} className="rounded-xl overflow-hidden shadow-md border transition-transform hover:-translate-y-1"
                      style={{ borderColor: 'var(--color-border, #e2e8f0)', backgroundColor: 'var(--color-bg, #fff)' }}>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text, #0f172a)' }}>{item.title}</h3>
                        <p style={{ color: 'var(--color-text-light, #64748b)' }}>{item.description}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : content ? (
              <div className="prose prose-lg max-w-none page-content" dangerouslySetInnerHTML={{ __html: content }} />
            ) : null}
          </div>
        </section>
      );
    }

    case 'content': {
      const contentImageUrl = settings.imageUrl;
      const imagePos = settings.imagePosition || 'right';
      
      return (
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text, #0f172a)' }}>
                {section.title}
              </h2>
            )}
            {contentImageUrl ? (
              <div className={`flex flex-col ${imagePos === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-10 items-center`}>
                <div className="flex-1 prose prose-lg max-w-none page-content" dangerouslySetInnerHTML={{ __html: content }} />
                <div className="flex-1">
                  <img src={contentImageUrl} alt={section.title || ''} className="rounded-xl shadow-lg w-full" />
                </div>
              </div>
            ) : content ? (
              <div className="prose prose-lg max-w-none page-content" dangerouslySetInnerHTML={{ __html: content }} />
            ) : null}
          </div>
        </section>
      );
    }

    case 'cta':
      return (
        <section
          className="py-16 md:py-20 bg-cover bg-center relative"
          style={{
            backgroundImage: settings.imageUrl ? `url(${settings.imageUrl})` : undefined,
            backgroundColor: settings.imageUrl ? undefined : 'var(--color-primary, #2563eb)'
          }}
        >
          {settings.imageUrl && <div className="absolute inset-0 bg-black/60"></div>}
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {section.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{section.title}</h2>
            )}
            {section.subtitle && (
              <p className="text-lg text-white/85 mb-8 max-w-xl mx-auto">{section.subtitle}</p>
            )}
            {settings.buttonText && (
              <Link
                to={settings.buttonUrl || '/'}
                className="inline-block px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                {settings.buttonText}
              </Link>
            )}
          </div>
        </section>
      );

    case 'text':
    default:
      return (
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text, #0f172a)' }}>
                {section.title}
              </h2>
            )}
            {section.subtitle && (
              <p className="text-lg mb-6" style={{ color: 'var(--color-text-light, #64748b)' }}>
                {section.subtitle}
              </p>
            )}
            {content && (
              <div className="prose prose-lg max-w-none page-content" dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </div>
        </section>
      );
  }
}
