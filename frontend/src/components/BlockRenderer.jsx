import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ContactForm from './ContactForm';
import GoogleMap from './GoogleMap';

/* ====================================================================
   BlockRenderer – renders Page Builder rows/columns/blocks on the
   public-facing site.  Import and pass `rows` from the page content:
     <BlockRenderer rows={page.content.rows} />
   ==================================================================== */

export default function BlockRenderer({ rows = [] }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="block-renderer">
      {rows.map(row => (
        <RowRenderer key={row.id} row={row} />
      ))}
    </div>
  );
}

/* ── Row ─────────────────────────────────────────────────────────── */
function RowRenderer({ row }) {
  const s = row.settings || {};
  const style = {
    paddingTop: s.paddingTop ?? 20,
    paddingBottom: s.paddingBottom ?? 20,
    marginTop: s.marginTop ?? 0,
    marginBottom: s.marginBottom ?? 0,
    backgroundColor: s.backgroundColor || undefined,
    backgroundImage: s.backgroundImage ? `url(${s.backgroundImage})` : undefined,
    backgroundSize: s.backgroundImage ? 'cover' : undefined,
    backgroundPosition: s.backgroundImage ? 'center' : undefined,
  };

  return (
    <section style={style}>
      <div className={s.fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className="flex flex-wrap -mx-2">
          {row.columns.map(col => (
            <div
              key={col.id}
              className="px-2"
              style={{ width: `${(col.width / 12) * 100}%` }}
            >
              {col.blocks.map(block => (
                <BlockComponent key={block.id} block={block} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Block dispatcher ────────────────────────────────────────────── */
function BlockComponent({ block }) {
  const bs = block.settings || {};
  const wrapStyle = {
    padding: bs.padding || undefined,
    margin: bs.margin || undefined,
    backgroundColor: bs.backgroundColor || undefined,
    color: bs.textColor || undefined,
  };

  return (
    <div style={wrapStyle}>
      {renderBlock(block)}
    </div>
  );
}

function renderBlock(block) {
  const d = block.data || {};

  switch (block.type) {
    /* ── Text ───────────────────────────────────────── */
    case 'text':
      return (
        <div
          className="prose prose-lg max-w-none page-content"
          dangerouslySetInnerHTML={{ __html: d.html || '' }}
        />
      );

    /* ── Image ──────────────────────────────────────── */
    case 'image':
      if (!d.src) return null;
      return (
        <figure>
          <img
            src={d.src}
            alt={d.alt || ''}
            className="w-full rounded-xl shadow-lg"
            style={{ objectFit: d.objectFit || 'cover' }}
          />
          {d.caption && (
            <figcaption className="text-sm text-center mt-2" style={{ color: 'var(--color-text-light, #64748b)' }}>
              {d.caption}
            </figcaption>
          )}
        </figure>
      );

    /* ── Carousel ───────────────────────────────────── */
    case 'carousel':
      return <Carousel data={d} />;

    /* ── Video ─────────────────────────────────────── */
    case 'video':
      return <VideoBlock data={d} />;

    /* ── Hero Banner ───────────────────────────────── */
    case 'hero':
      return <HeroBlock data={d} />;

    /* ── Button ────────────────────────────────────── */
    case 'button':
      return <ButtonBlock data={d} />;

    /* ── Cards ─────────────────────────────────────── */
    case 'cards':
      return <CardsBlock data={d} />;

    /* ── Counter/Stats ─────────────────────────────── */
    case 'counter':
      return <CounterBlock data={d} />;

    /* ── Testimonial ───────────────────────────────── */
    case 'testimonial':
      return <TestimonialBlock data={d} />;

    /* ── Accordion / FAQ ──────────────────────────── */
    case 'accordion':
      return <AccordionBlock data={d} />;

    /* ── Icon Box ──────────────────────────────────── */
    case 'iconBox':
      return <IconBoxBlock data={d} />;

    /* ── Contact Form ──────────────────────────────── */
    case 'contactForm':
      return (
        <div className="max-w-2xl mx-auto">
          <ContactForm />
        </div>
      );

    /* ── Company Info (dynamic from settings) ──────── */
    case 'companyInfo':
      return <CompanyInfoBlock data={d} />;

    /* ── Google Map ─────────────────────────────────── */
    case 'googleMap':
      return <DynamicGoogleMap data={d} />;

    /* ── Spacer ────────────────────────────────────── */
    case 'spacer':
      return <div style={{ height: d.height || 40 }} />;

    /* ── Divider ───────────────────────────────────── */
    case 'divider':
      return (
        <hr
          className="my-4"
          style={{
            borderStyle: d.style || 'solid',
            borderColor: d.color || '#e2e8f0',
          }}
        />
      );

    /* ── Raw HTML ──────────────────────────────────── */
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: d.code || '' }} />;

    default:
      return null;
  }
}

/* ================================================================
   Sub-components for complex block types
   ================================================================ */

/* ── Hero Banner ─────────────────────────────────────────────── */
function HeroBlock({ data }) {
  const align = data.alignment || 'center';
  const textAlign = { left: 'text-left', center: 'text-center', right: 'text-right' }[align] || 'text-center';
  const justify = { left: 'items-start', center: 'items-center', right: 'items-end' }[align] || 'items-center';

  return (
    <div
      className={`relative flex flex-col ${justify} justify-center bg-cover bg-center rounded-xl overflow-hidden`}
      style={{
        backgroundImage: data.backgroundImage ? `url(${data.backgroundImage})` : undefined,
        backgroundColor: data.backgroundImage ? undefined : 'var(--color-primary, #2563eb)',
        minHeight: data.height || '400px',
      }}
    >
      {data.overlay !== false && data.backgroundImage && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div className={`relative z-10 max-w-3xl px-8 py-12 ${textAlign}`}>
        {data.title && (
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">{data.title}</h1>
        )}
        {data.subtitle && (
          <p className="text-lg md:text-xl text-white/90 mb-8">{data.subtitle}</p>
        )}
        {data.buttonText && (
          <Link
            to={data.buttonUrl || '/'}
            className="inline-block px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            {data.buttonText}
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Carousel ────────────────────────────────────────────────── */
function Carousel({ data }) {
  const images = data.images || [];
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (data.autoplay !== false && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrent(prev => (prev + 1) % images.length);
      }, data.interval || 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [images.length, data.autoplay, data.interval]);

  if (images.length === 0) return null;

  const go = (dir) => {
    clearInterval(intervalRef.current);
    setCurrent(prev => (prev + dir + images.length) % images.length);
  };

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        {images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt || ''}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {data.showArrows !== false && images.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          >
            ›
          </button>
        </>
      )}

      {data.showDots !== false && images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearInterval(intervalRef.current); setCurrent(i); }}
              className={`w-3 h-3 rounded-full transition-all ${
                i === current ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Video ────────────────────────────────────────────────────── */
function VideoBlock({ data }) {
  if (!data.url) return null;

  if (data.type === 'direct') {
    return (
      <video
        src={data.url}
        controls
        autoPlay={data.autoplay || false}
        className="w-full rounded-xl"
      />
    );
  }

  // YouTube or Vimeo
  let embedUrl = data.url;
  if (data.type === 'youtube' || data.url.includes('youtube') || data.url.includes('youtu.be')) {
    const match = data.url.match(/(?:youtu\.be\/|v=)([^&\s]+)/);
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}${data.autoplay ? '?autoplay=1' : ''}`;
  } else if (data.type === 'vimeo' || data.url.includes('vimeo')) {
    const match = data.url.match(/vimeo\.com\/(\d+)/);
    if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}${data.autoplay ? '?autoplay=1' : ''}`;
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </div>
  );
}

/* ── Button ───────────────────────────────────────────────────── */
function ButtonBlock({ data }) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50',
  };
  const sizes = {
    small: 'px-4 py-1.5 text-sm',
    medium: 'px-6 py-2.5 text-base',
    large: 'px-8 py-3 text-lg',
  };

  const isExternal = data.target === '_blank';
  const className = `inline-block rounded-lg font-semibold transition-colors ${styles[data.style || 'primary']} ${sizes[data.size || 'medium']} ${data.fullWidth ? 'w-full text-center' : ''}`;

  if (isExternal) {
    return <a href={data.url || '#'} target="_blank" rel="noopener noreferrer" className={className}>{data.text || 'Klik hier'}</a>;
  }
  return <Link to={data.url || '#'} className={className}>{data.text || 'Klik hier'}</Link>;
}

/* ── Cards ────────────────────────────────────────────────────── */
function CardsBlock({ data }) {
  const cols = data.columns || 3;
  const gridClass = cols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                    cols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {(data.items || []).map((item, i) => (
        <CardItem key={i} item={item} />
      ))}
    </div>
  );
}

function CardItem({ item }) {
  const inner = (
    <div
      className="rounded-xl overflow-hidden shadow-md border transition-transform hover:-translate-y-1"
      style={{ borderColor: 'var(--color-border, #e2e8f0)', backgroundColor: 'var(--color-bg, #fff)' }}
    >
      {item.image && (
        <img src={item.image} alt={item.title || ''} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        {item.title && <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text, #0f172a)' }}>{item.title}</h3>}
        {item.description && <p style={{ color: 'var(--color-text-light, #64748b)' }}>{item.description}</p>}
      </div>
    </div>
  );

  if (item.link) {
    return <Link to={item.link} className="block">{inner}</Link>;
  }
  return inner;
}

/* ── Counter / Statistics ─────────────────────────────────────── */
function CounterBlock({ data }) {
  const cols = data.columns || 4;
  const gridClass = cols === 2 ? 'grid-cols-2' :
                    cols === 3 ? 'grid-cols-2 md:grid-cols-3' :
                    'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {(data.items || []).map((item, i) => (
        <div key={i} className="text-center p-6 rounded-xl" style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
          <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'var(--color-primary, #2563eb)' }}>
            {item.number}{item.suffix || ''}
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-light, #64748b)' }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Testimonial ──────────────────────────────────────────────── */
function TestimonialBlock({ data }) {
  return (
    <blockquote className="max-w-2xl mx-auto text-center p-8 rounded-xl" style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
      {data.avatar && (
        <img src={data.avatar} alt={data.author || ''} className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
      )}
      <p className="text-lg italic mb-4" style={{ color: 'var(--color-text, #0f172a)' }}>"{data.quote}"</p>
      {data.author && (
        <footer className="font-semibold" style={{ color: 'var(--color-text, #0f172a)' }}>
          — {data.author}
          {data.role && <span className="font-normal ml-2" style={{ color: 'var(--color-text-light, #64748b)' }}>{data.role}</span>}
        </footer>
      )}
    </blockquote>
  );
}

/* ── Accordion / FAQ ──────────────────────────────────────────── */
function AccordionBlock({ data }) {
  const [openItems, setOpenItems] = useState([]);

  const toggle = (idx) => {
    if (data.allowMultiple) {
      setOpenItems(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    } else {
      setOpenItems(prev => prev.includes(idx) ? [] : [idx]);
    }
  };

  return (
    <div className="space-y-2">
      {(data.items || []).map((item, i) => (
        <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left font-medium transition-colors hover:bg-gray-50"
            style={{ color: 'var(--color-text, #0f172a)' }}
          >
            {item.title}
            <span className={`transition-transform duration-200 ${openItems.includes(i) ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {openItems.includes(i) && (
            <div className="px-5 pb-4 text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Company Info (dynamic from settings) ─────────────────────── */
function CompanyInfoBlock({ data }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch('/api/public/settings')
      .then(r => r.json())
      .then(settings => {
        // Try company_info JSON object first, fall back to individual fields
        let ci = settings.company_info;
        if (typeof ci === 'string') try { ci = JSON.parse(ci); } catch { ci = null; }
        if (ci) {
          setInfo(ci);
        } else {
          setInfo({
            name: settings.site_name || '',
            address: settings.company_address || '',
            phone: settings.company_phone || '',
            email: settings.company_email || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!info) return null;

  const showFields = data.fields || ['name', 'address', 'phone', 'email', 'hours', 'business'];

  return (
    <div className="space-y-4">
      {data.title && (
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text, #0f172a)' }}>{data.title}</h2>
      )}

      {showFields.includes('name') && info.name && (
        <p className="text-lg font-bold" style={{ color: 'var(--color-text, #0f172a)' }}>{info.name}</p>
      )}

      {showFields.includes('address') && info.address && (
        <div className="flex items-start gap-3">
          <span className="text-xl">📍</span>
          <p style={{ color: 'var(--color-text-light, #64748b)' }}>
            {info.address}{info.postalCode || info.city ? <br/> : ''}
            {[info.postalCode, info.city].filter(Boolean).join(' ')}
            {info.country ? <><br/>{info.country}</> : ''}
          </p>
        </div>
      )}

      {showFields.includes('phone') && info.phone && (
        <div className="flex items-start gap-3">
          <span className="text-xl">📞</span>
          <a href={`tel:${info.phone}`} className="hover:underline" style={{ color: 'var(--color-text-light, #64748b)' }}>{info.phone}</a>
        </div>
      )}

      {showFields.includes('email') && info.email && (
        <div className="flex items-start gap-3">
          <span className="text-xl">✉️</span>
          <a href={`mailto:${info.email}`} className="hover:underline" style={{ color: 'var(--color-text-light, #64748b)' }}>{info.email}</a>
        </div>
      )}

      {showFields.includes('hours') && info.openingHours && info.openingHours.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--color-text, #0f172a)' }}>Openingstijden</h3>
          <div className="space-y-1">
            {info.openingHours.map((h, i) => (
              <div key={i} className="flex justify-between text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>
                <span className="font-medium">{h.day}</span>
                <span>{h.hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showFields.includes('business') && (info.kvk || info.btw) && (
        <div>
          <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--color-text, #0f172a)' }}>Bedrijfsgegevens</h3>
          <div className="text-sm space-y-1" style={{ color: 'var(--color-text-light, #64748b)' }}>
            {info.kvk && <p>KvK: {info.kvk}</p>}
            {info.btw && <p>BTW: {info.btw}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Dynamic Google Map (supports company address from settings) ── */
function DynamicGoogleMap({ data }) {
  const [address, setAddress] = useState(data.address || '');

  useEffect(() => {
    // If useCompanyAddress is true or no static address provided, fetch from settings
    if (data.useCompanyAddress || !data.address) {
      fetch('/api/public/settings')
        .then(r => r.json())
        .then(settings => {
          let ci = settings.company_info;
          if (typeof ci === 'string') try { ci = JSON.parse(ci); } catch { ci = null; }
          const mapAddr = ci?.mapAddress || settings.google_maps_address || settings.company_address || '';
          if (mapAddr) setAddress(mapAddr);
        })
        .catch(() => {});
    }
  }, [data.useCompanyAddress, data.address]);

  return <GoogleMap address={address} height={data.height || '400px'} />;
}

/* ── Icon Box ──────────────────────────────────────────────────── */
function IconBoxBlock({ data }) {
  const cols = data.columns || 3;
  const gridClass = cols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    cols === 4 ? 'grid-cols-2 lg:grid-cols-4' :
                    'grid-cols-1 md:grid-cols-3';

  const bordered = data.style === 'bordered';
  const filled = data.style === 'filled';

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {(data.items || []).map((item, i) => (
        <div
          key={i}
          className={`p-6 rounded-xl text-center ${bordered ? 'border' : ''}`}
          style={{
            borderColor: bordered ? 'var(--color-border, #e2e8f0)' : undefined,
            backgroundColor: filled ? 'var(--color-surface, #f8fafc)' : undefined,
          }}
        >
          {item.icon && (
            item.icon.startsWith('/') || item.icon.startsWith('http')
              ? <img src={item.icon} alt="" className="w-12 h-12 mx-auto mb-3 object-contain" />
              : <div className="text-4xl mb-3">{item.icon}</div>
          )}
          {item.title && <h4 className="font-bold mb-2" style={{ color: 'var(--color-text, #0f172a)' }}>{item.title}</h4>}
          {item.description && <p className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>{item.description}</p>}
        </div>
      ))}
    </div>
  );
}
