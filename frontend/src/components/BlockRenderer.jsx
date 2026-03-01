import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ContactForm from './ContactForm';
import GoogleMap from './GoogleMap';
import { buildEffectClasses, buildOverlayStyle } from './PageBuilder/EffectsPanel';
import '../styles/effects.css';

const API = import.meta.env.VITE_API_URL || '/api';

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
  
  // Check if row contains full-width blocks (hero, video) - ONLY when single column
  // Carousels in multi-column layouts should stay in their columns
  const hasFullWidthBlock = row.columns.length === 1 && row.columns.some(col => 
    col.blocks.some(b => ['hero', 'video'].includes(b.type))
  );
  
  // Calculate overlap/overlay style
  const overlapTop = s.overlapTop || 0;
  const isOverlay = s.isOverlay || false;
  const zIndex = isOverlay ? 10 : (s.zIndex || 0);
  
  const style = {
    paddingTop: s.paddingTop ?? 20,
    paddingBottom: s.paddingBottom ?? 20,
    marginTop: overlapTop < 0 ? overlapTop : (s.marginTop ?? 0),
    marginBottom: s.marginBottom ?? 0,
    backgroundColor: s.backgroundColor || undefined,
    backgroundImage: s.backgroundImage ? `url(${s.backgroundImage})` : undefined,
    backgroundSize: s.backgroundImage ? 'cover' : undefined,
    backgroundPosition: s.backgroundImage ? 'center' : undefined,
    position: (zIndex || overlapTop) ? 'relative' : undefined,
    zIndex: zIndex || undefined,
  };

  // Responsive settings
  const mobileLayout = s.mobileLayout || 'stack';
  const tabletLayout = s.tabletLayout || 'stack';
  const mobileOrder = s.mobileOrder || 'default';
  const columnGap = s.columnGap || 16;

  // Determine if columns should stack based on column count
  const hasMultipleColumns = row.columns.length > 1;
  const columnCount = row.columns.length;
  
  // Build grid classes based on column count
  const getGridClasses = () => {
    if (!hasMultipleColumns) {
      return 'grid grid-cols-1';
    }
    
    // Use CSS grid for reliable column layout
    if (columnCount === 2) {
      return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    } else if (columnCount === 3) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    } else if (columnCount === 4) {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
    } else {
      // Fallback for other column counts
      return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(columnCount, 6)} gap-4`;
    }
  };

  // Sort columns for mobile based on content type
  const getSortedColumns = () => {
    if (mobileOrder === 'default' || !hasMultipleColumns) {
      return row.columns;
    }
    
    // Detect column content types
    const columnsWithMeta = row.columns.map((col, idx) => {
      const hasImage = col.blocks.some(b => b.type === 'image' || b.type === 'hero' || b.type === 'carousel');
      const hasText = col.blocks.some(b => b.type === 'text' || b.type === 'contactForm');
      return { ...col, originalIndex: idx, hasImage, hasText };
    });
    
    if (mobileOrder === 'image-first') {
      return [...columnsWithMeta].sort((a, b) => (b.hasImage ? 1 : 0) - (a.hasImage ? 1 : 0));
    } else if (mobileOrder === 'text-first') {
      return [...columnsWithMeta].sort((a, b) => (b.hasText ? 1 : 0) - (a.hasText ? 1 : 0));
    }
    
    return row.columns;
  };

  const sortedColumns = getSortedColumns();
  
  // Force full width for rows with hero/carousel/video blocks
  const isFullWidth = s.fullWidth || hasFullWidthBlock;

  return (
    <section style={style}>
      <div className={isFullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className={hasFullWidthBlock ? '' : getGridClasses()}>
          {sortedColumns.map((col, colIndex) => (
            <GridColumn 
              key={col.id} 
              col={col} 
              forceFullWidth={hasFullWidthBlock}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Grid Column (simplified, uses CSS grid for layout) ──────────── */
function GridColumn({ col, forceFullWidth }) {
  // Force full width for hero/video blocks in single column
  if (forceFullWidth) {
    return (
      <div className="w-full">
        {col.blocks.map(block => (
          <BlockComponent key={block.id} block={block} />
        ))}
      </div>
    );
  }

  // Grid handles column sizing automatically
  return (
    <div className="min-w-0 overflow-hidden">
      {col.blocks.map(block => (
        <BlockComponent key={block.id} block={block} />
      ))}
    </div>
  );
}

/* ── Block dispatcher ────────────────────────────────────────────── */
function BlockComponent({ block }) {
  const bs = block.settings || {};
  const bd = block.data || {};
  const effects = bd.effects || {};
  const effectClasses = buildEffectClasses(effects);
  
  // Block-level overlap settings
  const blockOverlapTop = bd.overlapTop || 0;
  const blockZIndex = bd.zIndex || 0;
  
  const wrapStyle = {
    padding: bs.padding || undefined,
    margin: bs.margin || undefined,
    backgroundColor: bs.backgroundColor || undefined,
    color: bs.textColor || undefined,
    // Block-level overlap
    marginTop: blockOverlapTop !== 0 ? blockOverlapTop : undefined,
    position: blockZIndex !== 0 ? 'relative' : undefined,
    zIndex: blockZIndex !== 0 ? blockZIndex : undefined,
  };

  // Check if this block has overlay or card flip effects
  const hasOverlay = effects.overlay;
  const hasCardFlip = effects.cardFlip;
  const overlaySettings = effects.overlaySettings || {};
  const cardFlipSettings = effects.cardFlipSettings || {};

  // Build overlay style for custom colors
  const overlayStyle = hasOverlay ? buildOverlayStyle(overlaySettings) : {};

  // For card flip effect, render special structure
  if (hasCardFlip) {
    return (
      <div style={wrapStyle} className={effectClasses}>
        <div className="effect-card-flip-inner">
          <div className="effect-card-flip-front">
            {renderBlock(block)}
          </div>
          <div 
            className="effect-card-flip-back"
            style={{ 
              backgroundColor: cardFlipSettings.backgroundColor || '#2563eb',
              color: cardFlipSettings.textColor || '#ffffff'
            }}
          >
            <div className="p-6 flex flex-col items-center justify-center h-full text-center">
              {cardFlipSettings.backTitle && (
                <h3 className="text-xl font-bold mb-3">{cardFlipSettings.backTitle}</h3>
              )}
              {cardFlipSettings.backContent && (
                <p className="text-sm opacity-90 mb-4">{cardFlipSettings.backContent}</p>
              )}
              {cardFlipSettings.buttonText && cardFlipSettings.buttonLink && (
                <Link 
                  to={cardFlipSettings.buttonLink} 
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                >
                  {cardFlipSettings.buttonText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For overlay effect, render with hover overlay
  if (hasOverlay) {
    return (
      <div style={wrapStyle} className={`relative ${effectClasses}`}>
        {renderBlock(block)}
        <div className="effect-hover-overlay-content" style={overlayStyle}>
          {overlaySettings.title && (
            <h3 className="text-xl font-bold mb-2">{overlaySettings.title}</h3>
          )}
          {overlaySettings.description && (
            <p className="text-sm opacity-90">{overlaySettings.description}</p>
          )}
        </div>
      </div>
    );
  }

  // Default rendering with effect classes
  return (
    <div style={wrapStyle} className={effectClasses || undefined}>
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

    /* ── Styled Text ────────────────────────────────── */
    case 'styledText':
      return <StyledTextBlock data={d} />;

    /* ── Image ──────────────────────────────────────── */
    case 'image':
      if (!d.src) return null;
      return <ImageBlock data={d} />;

    /* ── Image Card ─────────────────────────────────── */
    case 'imageCard':
      return <ImageCardBlock data={d} />;

    /* ── Hero Banner (with image cards) ────────────── */
    case 'heroBanner':
      return <HeroBannerBlock data={d} />;

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

    /* ── Flip Cards ────────────────────────────────── */
    case 'flipCards':
      return <FlipCardsBlock data={d} />;

    /* ── Text Cards ────────────────────────────────── */
    case 'textCards':
      return <TextCardsBlock data={d} />;

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
        <div style={{ 
          paddingTop: d.spacingTop ?? 16, 
          paddingBottom: d.spacingBottom ?? 16 
        }}>
          <hr
            style={{
              border: 'none',
              borderTop: `${d.thickness || 1}px ${d.style || 'solid'} ${d.color || '#e2e8f0'}`,
              margin: 0,
            }}
          />
        </div>
      );

    /* ── Raw HTML ──────────────────────────────────── */
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: d.code || '' }} />;

    /* ── Countdown Timer ───────────────────────────── */
    case 'countdown':
      return <CountdownBlock data={d} />;

    default:
      return null;
  }
}

/* ================================================================
   Sub-components for complex block types
   ================================================================ */

/* ── Styled Text Block ───────────────────────────────────────── */
function StyledTextBlock({ data }) {
  const {
    text = '',
    textStyle = 'gradient',
    fontSize = 64,
    fontWeight = 'bold',
    textColor = '#ffffff',
    gradientFrom = '#00c2ff',
    gradientTo = '#00fdcf',
    glowColor = '#00c2ff',
    outlineColor = '#ffffff',
    textAlign = 'center',
    backgroundColor = '',
    backgroundGradient = '',
    padding = 24,
    marginTop = 0,
    marginBottom = 0,
  } = data;

  if (!text) return null;

  const fontWeightClass = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
    'extrabold': 'font-extrabold',
    'black': 'font-black',
  }[fontWeight] || 'font-bold';

  const containerStyle = {
    padding: `${padding}px`,
    marginTop: `${marginTop}px`,
    marginBottom: `${marginBottom}px`,
    background: backgroundGradient || backgroundColor || 'transparent',
    textAlign,
  };

  const baseStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: 1.1,
    fontWeight: fontWeight === 'black' ? 900 : undefined,
  };

  // Render based on text style
  const renderStyledText = () => {
    switch (textStyle) {
      case 'gradient':
        return (
          <span
            className={`styled-text-block styled-block-gradient ${fontWeightClass}`}
            style={{
              ...baseStyle,
              backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {text}
          </span>
        );

      case 'aurora':
        return (
          <span
            className={`styled-text-block styled-block-aurora ${fontWeightClass}`}
            style={{
              ...baseStyle,
              '--aurora-from': gradientFrom,
              '--aurora-to': gradientTo,
            }}
          >
            <span className="aurora-text">{text}</span>
          </span>
        );

      case 'glow':
        return (
          <span
            className={`styled-text-block styled-block-glow ${fontWeightClass}`}
            style={{
              ...baseStyle,
              color: textColor,
              textShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 80px ${glowColor}`,
            }}
          >
            {text}
          </span>
        );

      case 'neon':
        return (
          <span
            className={`styled-text-block styled-block-neon ${fontWeightClass}`}
            style={{
              ...baseStyle,
              color: '#fff',
              textShadow: `
                0 0 5px #fff,
                0 0 10px #fff,
                0 0 20px ${glowColor},
                0 0 40px ${glowColor},
                0 0 80px ${glowColor},
                0 0 90px ${glowColor}
              `,
              animation: 'neon-flicker 2s infinite',
            }}
          >
            {text}
          </span>
        );

      case 'outline':
        return (
          <span
            className={`styled-text-block styled-block-outline ${fontWeightClass}`}
            style={{
              ...baseStyle,
              color: 'transparent',
              WebkitTextStroke: `2px ${outlineColor}`,
            }}
          >
            {text}
          </span>
        );

      case 'shadow3d':
        return (
          <span
            className={`styled-text-block styled-block-shadow3d ${fontWeightClass}`}
            style={{
              ...baseStyle,
              color: textColor,
              textShadow: `
                1px 1px 0 rgba(0,0,0,0.3),
                2px 2px 0 rgba(0,0,0,0.25),
                3px 3px 0 rgba(0,0,0,0.2),
                4px 4px 0 rgba(0,0,0,0.15),
                5px 5px 0 rgba(0,0,0,0.1),
                6px 6px 15px rgba(0,0,0,0.4)
              `,
            }}
          >
            {text}
          </span>
        );

      case 'sliced':
        return (
          <span className={`styled-text-block styled-block-sliced ${fontWeightClass}`} style={baseStyle}>
            <span className="sliced-top" style={{ color: textColor }}>{text}</span>
            <span className="sliced-bottom" style={{ 
              background: `linear-gradient(177deg, transparent 53%, ${textColor} 65%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>{text}</span>
          </span>
        );

      case 'dual':
        const mid = Math.ceil(text.length / 2);
        return (
          <span className={`styled-text-block styled-block-dual ${fontWeightClass}`} style={baseStyle}>
            <span style={{ color: gradientFrom }}>{text.substring(0, mid)}</span>
            <span style={{ color: gradientTo }}>{text.substring(mid)}</span>
          </span>
        );

      case 'fancy':
        return (
          <span
            className={`styled-text-block styled-block-fancy ${fontWeightClass}`}
            style={{
              ...baseStyle,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='2250' height='900' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath fill='${encodeURIComponent(gradientFrom)}' d='M0 0h2255v899H0z'/%3E%3Ccircle cx='366' cy='207' r='366' fill='${encodeURIComponent(gradientTo)}'/%3E%3Ccircle cx='1777.5' cy='318.5' r='477.5' fill='${encodeURIComponent(gradientTo)}'/%3E%3Ccircle cx='1215' cy='737' r='366' fill='${encodeURIComponent(gradientFrom)}'/%3E%3C/g%3E%3C/svg%3E%0A")`,
              backgroundSize: '110% auto',
              backgroundPosition: 'center',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {text}
          </span>
        );

      case 'lightness':
        return (
          <span className={`styled-text-block styled-block-lightness ${fontWeightClass}`} style={baseStyle}>
            <span className="lightness-text" style={{ color: textColor }}>{text}</span>
            <span className="lightness-shadow" style={{ color: 'rgba(150,150,150,0.5)' }}>{text}</span>
          </span>
        );

      case 'glitch':
        return (
          <span className={`styled-text-block styled-block-glitch ${fontWeightClass}`} style={baseStyle} data-text={text}>
            <span style={{ color: textColor }}>{text}</span>
          </span>
        );

      default: // simple
        return (
          <span
            className={`styled-text-block styled-block-simple ${fontWeightClass}`}
            style={{
              ...baseStyle,
              color: textColor,
            }}
          >
            {text}
          </span>
        );
    }
  };

  return (
    <div className="styled-text-container" style={containerStyle}>
      {renderStyledText()}
    </div>
  );
}

/* ── Hero Banner ─────────────────────────────────────────────── */
function HeroBlock({ data }) {
  const navigate = useNavigate();
  const hasVideo = data.backgroundType === 'video' && data.backgroundVideo;
  const hasImage = data.backgroundType === 'image' && data.backgroundImage;
  const hasEffect = data.backgroundType === 'effect' && data.backgroundEffect;
  const hasEffectImage = hasEffect && data.backgroundImage; // Image under effect
  const hasColor = data.backgroundType === 'color';
  const overlayOpacity = (data.overlayOpacity ?? 50) / 100;
  const effectOpacity = (data.effectOpacity ?? 100) / 100;

  // Content position (9-grid)
  const position = data.contentPosition || 'center-center';
  const [vPos, hPos] = position.split('-');
  
  // Vertical alignment (main axis - justify)
  const justifyClass = {
    'top': 'justify-start',
    'center': 'justify-center',
    'bottom': 'justify-end',
  }[vPos] || 'justify-center';

  // Horizontal alignment (cross axis - items)
  const itemsClass = {
    'left': 'items-start',
    'center': 'items-center',
    'right': 'items-end',
  }[hPos] || 'items-center';

  // Text alignment based on horizontal position
  const textAlign = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
  }[hPos] || 'text-center';

  // Button alignment (can override text alignment)
  const buttonAlign = data.buttonAlign || hPos || 'center';
  const buttonAlignClass = {
    'left': 'justify-start',
    'center': 'justify-center',
    'right': 'justify-end',
  }[buttonAlign] || 'justify-center';

  // Calculate content width based on horizontal position
  const contentWidthClass = hPos === 'center' ? 'w-full max-w-4xl' : 'max-w-2xl';

  // Title shadow mapping
  const titleShadowStyle = {
    '': {},
    'sm': { textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
    'md': { textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
    'lg': { textShadow: '0 4px 8px rgba(0,0,0,0.6)' },
  }[data.titleShadow || ''];

  // Quote card configuration
  const showQuoteCard = data.showQuoteCard;
  const quotePosition = data.quoteCardPosition || 'right';
  
  // Flex order for quote card positioning
  const quoteFlexOrder = {
    left: 'order-first',
    center: 'order-1',
    right: 'order-last'
  }[quotePosition] || 'order-last';
  
  const contentFlexOrder = {
    left: 'order-last',
    center: 'order-2',
    right: 'order-first'
  }[quotePosition] || 'order-first';

  // Border radius mapping
  const borderRadiusClass = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    '2xl': 'rounded-2xl',
  }[data.borderRadius || 'xl'] || 'rounded-xl';

  // Full bleed class
  const fullBleedClass = data.fullBleed ? 'hero-full-bleed' : '';

  // Build background style for color/gradient
  const getBackgroundStyle = () => {
    if (hasColor) {
      if (data.colorGradient && data.colorGradient !== 'none') {
        const gradientDir = {
          'to-r': 'to right',
          'to-l': 'to left',
          'to-b': 'to bottom',
          'to-t': 'to top',
          'to-br': 'to bottom right',
          'to-bl': 'to bottom left',
        }[data.colorGradient] || 'to right';
        return `linear-gradient(${gradientDir}, ${data.backgroundColor || '#1e3a5f'}, ${data.backgroundColor2 || '#3b82f6'})`;
      }
      return data.backgroundColor || '#1e3a5f';
    }
    if (hasEffect) {
      // Gradient for effect backgrounds
      const colors = [
        data.effectColor1 || '#1e3a5f',
        data.effectColor2 || '#3b82f6',
        data.effectColor3 || '#8b5cf6',
        data.effectColor4 || '#ec4899',
      ];
      return `linear-gradient(315deg, ${colors[0]} 3%, ${colors[1]} 38%, ${colors[2]} 68%, ${colors[3]} 98%)`;
    }
    if (hasImage) {
      return undefined; // Will use backgroundImage
    }
    return 'var(--color-primary, #2563eb)';
  };

  // Render background effect
  const renderBackgroundEffect = () => {
    if (!hasEffect) return null;
    const effect = data.backgroundEffect || 'waves';
    const speedClass = `hero-effect-${data.effectSpeed || 'normal'}`;
    
    const effectStyle = {
      '--effect-color-1': data.effectColor1 || '#1e3a5f',
      '--effect-color-2': data.effectColor2 || '#3b82f6',
      '--effect-color-3': data.effectColor3 || '#8b5cf6',
      '--effect-color-4': data.effectColor4 || '#ec4899',
      '--wave-color': data.waveColor || 'rgba(255,255,255,0.25)',
      '--circle-color': data.circleColor || 'rgba(255,255,255,0.3)',
      opacity: effectOpacity,
    };

    switch (effect) {
      case 'waves':
        return (
          <div className={`hero-effect-container hero-effect-waves ${speedClass}`} style={effectStyle}>
            <div className="hero-wave"></div>
            <div className="hero-wave"></div>
            <div className="hero-wave"></div>
          </div>
        );

      case 'wavyRotate':
        return (
          <div className="hero-effect-container hero-effect-wavy-rotate" style={effectStyle}>
            <div className="hero-wavy-rotate-container">
              <div className="hero-wavy-rotate-circle"></div>
              <div className="hero-wavy-rotate-circle"></div>
              <div className="hero-wavy-rotate-circle"></div>
            </div>
          </div>
        );

      case 'circles':
        return (
          <div className="hero-effect-container hero-effect-circles" style={effectStyle}>
            <div className="hero-circles-container">
              <div className="hero-circle hero-circle-small"></div>
              <div className="hero-circle hero-circle-medium"></div>
              <div className="hero-circle hero-circle-large"></div>
              <div className="hero-circle hero-circle-xlarge"></div>
              <div className="hero-circle hero-circle-xxlarge"></div>
            </div>
          </div>
        );

      case 'triangles':
        return (
          <div className="hero-effect-container hero-effect-triangles" style={effectStyle}>
            {Array.from({ length: 20 }).map((_, i) => {
              const size = 20 + Math.random() * 60;
              const colors = [
                data.effectColor1 || '#fff',
                data.effectColor2 || '#3b82f6',
                data.effectColor3 || '#8b5cf6',
                data.effectColor4 || '#ec4899',
              ];
              const color = colors[Math.floor(Math.random() * colors.length)];
              return (
                <div 
                  key={i} 
                  className="hero-triangle animated"
                  style={{
                    borderWidth: `0 ${size/2}px ${size}px ${size/2}px`,
                    borderBottomColor: color,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `hero-triangle-fly ${5 + Math.random() * 10}s linear infinite`,
                    animationDelay: `${Math.random() * 5}s`,
                    filter: `grayscale(${Math.random() > 0.5 ? 0 : 1})`,
                    opacity: 0.3 + Math.random() * 0.7,
                  }}
                />
              );
            })}
          </div>
        );

      case 'particles':
        return (
          <div className="hero-effect-container hero-effect-particles" style={effectStyle}>
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i} 
                className="hero-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        );

      case 'gradient':
        return (
          <div 
            className="hero-effect-container hero-effect-gradient" 
            style={{
              ...effectStyle,
              background: `linear-gradient(315deg, ${data.effectColor1 || '#1e3a5f'} 3%, ${data.effectColor2 || '#3b82f6'} 38%, ${data.effectColor3 || '#8b5cf6'} 68%, ${data.effectColor4 || '#ec4899'} 98%)`,
              backgroundSize: '400% 400%',
            }}
          />
        );

      case 'aurora':
        return (
          <div className="hero-effect-container hero-effect-aurora" style={effectStyle}>
            <div className="hero-aurora-layer">
              <div className="hero-aurora-blob hero-aurora-blob-1"></div>
              <div className="hero-aurora-blob hero-aurora-blob-2"></div>
              <div className="hero-aurora-blob hero-aurora-blob-3"></div>
            </div>
          </div>
        );

      case 'mesh':
        return (
          <div className="hero-effect-container hero-effect-mesh" style={effectStyle} />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative flex flex-col ${justifyClass} ${itemsClass} bg-cover bg-center ${borderRadiusClass} overflow-hidden ${fullBleedClass}`}
      style={{
        backgroundImage: (hasImage || hasEffectImage) ? `url(${data.backgroundImage})` : undefined,
        background: !hasImage && !hasVideo && !hasEffectImage ? getBackgroundStyle() : undefined,
        minHeight: data.height || '400px',
      }}
    >
      {/* Background Effect */}
      {renderBackgroundEffect()}

      {/* Video background */}
      {hasVideo && (
        <video
          src={data.backgroundVideo}
          autoPlay
          muted={data.videoMuted !== false}
          loop={data.videoLoop !== false}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Overlay */}
      {data.overlay !== false && (hasVideo || hasImage || hasEffectImage) && (
        <div 
          className="absolute inset-0" 
          style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
        />
      )}
      
      {/* Content - Hero Columns, Quote Card, or Standard */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 py-12">
        {data.useHeroColumns && data.heroColumns?.length > 0 ? (
          /* Hero Columns Layout */
          <div 
            className="grid gap-6 lg:gap-8"
            style={{
              gridTemplateColumns: (data.heroLayout || [12]).map(w => `${(w / 12) * 100}%`).join(' '),
              alignItems: data.heroColumnsAlign || 'center',
            }}
          >
            {(data.heroColumns || []).map((col, colIdx) => (
              <div key={col.id || colIdx} className="hero-column">
                {(col.blocks || []).map((hBlock, bIdx) => (
                  <HeroColumnBlock key={hBlock.id || bIdx} block={hBlock} />
                ))}
              </div>
            ))}
          </div>
        ) : showQuoteCard ? (
          <div className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${quotePosition === 'center' ? 'justify-center' : 'justify-between'}`}>
            {/* Main content */}
            <div className={`flex-1 ${contentFlexOrder} ${textAlign} ${quotePosition === 'center' ? 'hidden lg:block' : ''}`}>
              {(data.titleHtml || data.title) && (
                <div 
                  className="hero-title mb-4"
                  dangerouslySetInnerHTML={{ __html: data.titleHtml || `<p>${data.title}</p>` }}
                  style={{ 
                    color: data.titleColor || '#ffffff',
                    ...titleShadowStyle 
                  }}
                />
              )}
              {(data.subtitleHtml || data.subtitle) && (
                <div 
                  className="hero-subtitle mb-8"
                  dangerouslySetInnerHTML={{ __html: data.subtitleHtml || `<p>${data.subtitle}</p>` }}
                  style={{ color: data.subtitleColor || 'rgba(255,255,255,0.9)' }}
                />
              )}
              {/* Styled Texts */}
              {(data.styledTexts || []).length > 0 && (
                <div className="hero-styled-texts mb-8">
                  {(data.styledTexts || []).map((st, stIdx) => (
                    <StyledText key={stIdx} element={st} />
                  ))}
                </div>
              )}
              {data.buttonText && (
                <div className={`flex ${buttonAlignClass}`}>
                  <Link
                    to={data.buttonUrl || '/'}
                    className="inline-block px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
                    style={{
                      backgroundColor: data.buttonBg || '#ffffff',
                      color: data.buttonColor || '#111827',
                    }}
                  >
                    {data.buttonText}
                  </Link>
                </div>
              )}
            </div>
            
            {/* Quote Card */}
            <div className={`flex-shrink-0 w-full lg:w-auto ${quoteFlexOrder}`}>
              <QuoteCardEmbed config={data} onNavigate={(url) => navigate(url)} />
            </div>
          </div>
        ) : (
          /* Standard layout without quote card */
          <div className={`${contentWidthClass} mx-auto ${textAlign}`}>
            {(data.titleHtml || data.title) && (
              <div 
                className="hero-title mb-4"
                dangerouslySetInnerHTML={{ __html: data.titleHtml || `<p>${data.title}</p>` }}
                style={{ 
                  color: data.titleColor || '#ffffff',
                  ...titleShadowStyle 
                }}
              />
            )}
            {(data.subtitleHtml || data.subtitle) && (
              <div 
                className="hero-subtitle mb-8"
                dangerouslySetInnerHTML={{ __html: data.subtitleHtml || `<p>${data.subtitle}</p>` }}
                style={{ color: data.subtitleColor || 'rgba(255,255,255,0.9)' }}
              />
            )}
            {/* Styled Texts */}
            {(data.styledTexts || []).length > 0 && (
              <div className="hero-styled-texts mb-8">
                {(data.styledTexts || []).map((st, stIdx) => (
                  <StyledText key={stIdx} element={st} />
                ))}
              </div>
            )}
            {data.buttonText && (
              <div className={`flex ${buttonAlignClass}`}>
                <Link
                  to={data.buttonUrl || '/'}
                  className="inline-block px-8 py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
                  style={{
                    backgroundColor: data.buttonBg || '#ffffff',
                    color: data.buttonColor || '#111827',
                  }}
                >
                  {data.buttonText}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Hero Column Block Renderer ──────────────────────────────── */
function HeroColumnBlock({ block }) {
  const { type, data = {} } = block;
  
  switch (type) {
    case 'text':
      return (
        <div 
          className="hero-col-text prose prose-invert max-w-none mb-4"
          dangerouslySetInnerHTML={{ __html: data.html || '' }}
        />
      );
    
    case 'styledText':
      return (
        <div className="hero-col-styled-text mb-4">
          <StyledText element={data} />
        </div>
      );
    
    case 'image':
      if (!data.src) return null;
      return (
        <div className="hero-col-image mb-4">
          <img 
            src={data.src} 
            alt={data.alt || ''} 
            className="max-w-full h-auto rounded-lg"
            style={{ objectFit: data.objectFit || 'cover' }}
          />
          {data.caption && (
            <p className="text-sm text-white/70 mt-2 text-center">{data.caption}</p>
          )}
        </div>
      );
    
    case 'button':
      return (
        <div className="hero-col-button mb-4">
          <Link
            to={data.url || '#'}
            className="inline-block px-6 py-3 font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: data.backgroundColor || '#ffffff',
              color: data.textColor || '#000000',
              borderRadius: data.borderRadius === 'none' ? '0' : 
                data.borderRadius === 'sm' ? '0.25rem' :
                data.borderRadius === 'md' ? '0.375rem' :
                data.borderRadius === 'lg' ? '0.5rem' :
                data.borderRadius === 'xl' ? '0.75rem' : '0.5rem',
              fontSize: data.size === 'small' ? '0.875rem' : 
                data.size === 'large' ? '1.125rem' : '1rem',
            }}
          >
            {data.text || 'Knop'}
          </Link>
        </div>
      );
    
    case 'spacer':
      return <div style={{ height: data.height || 40 }} />;
    
    case 'counter':
      return (
        <div className="hero-col-counter mb-4 text-center">
          <span 
            className="block text-4xl font-bold"
            style={{ color: data.numberColor || '#ffffff' }}
          >
            {data.number || 0}{data.suffix || ''}
          </span>
          {data.label && (
            <span 
              className="block text-sm mt-1"
              style={{ color: data.labelColor || '#94a3b8' }}
            >
              {data.label}
            </span>
          )}
        </div>
      );
    
    case 'countdown':
      return <HeroCountdown data={data} />;
    
    default:
      return null;
  }
}

/* ── Mini Countdown for Hero Columns ─────────────────────────── */
function HeroCountdown({ data }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!data.targetDate) return;

    const targetDateTime = new Date(`${data.targetDate}T${data.targetTime || '00:00'}:00`);

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDateTime.getTime() - now;

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [data.targetDate, data.targetTime]);

  if (isExpired) {
    return (
      <div className="hero-countdown-expired text-center mb-4">
        <span style={{ color: data.numberColor || '#ffffff' }}>Verlopen</span>
      </div>
    );
  }

  const padNumber = (num) => String(num).padStart(2, '0');

  const units = [];
  if (data.showDays !== false) units.push({ value: timeLeft.days, label: 'd' });
  if (data.showHours !== false) units.push({ value: timeLeft.hours, label: 'u' });
  if (data.showMinutes !== false) units.push({ value: timeLeft.minutes, label: 'm' });
  if (data.showSeconds !== false) units.push({ value: timeLeft.seconds, label: 's' });

  // Minimal style for hero columns
  return (
    <div className="hero-col-countdown flex justify-center gap-2 mb-4">
      {units.map((unit, i) => (
        <span key={i} className="flex items-baseline gap-0.5">
          <span 
            className="text-3xl font-bold"
            style={{ color: data.numberColor || '#ffffff' }}
          >
            {padNumber(unit.value)}
          </span>
          <span 
            className="text-sm"
            style={{ color: data.labelColor || '#94a3b8' }}
          >
            {unit.label}
          </span>
        </span>
      ))}
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
    <div className="relative rounded-xl overflow-hidden w-full max-w-full">
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

/* ── Image with hover effect ─────────────────────────────────── */
function ImageBlock({ data }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const hasHoverEffect = data.hoverBackgroundColor;
  const backgroundColor = isHovered && hasHoverEffect 
    ? data.hoverBackgroundColor 
    : (data.backgroundColor || 'transparent');
  const borderRadius = data.borderRadius ?? 8;
  const padding = data.padding ?? 0;

  return (
    <figure
      className="transition-all duration-300"
      style={{
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={data.src}
        alt={data.alt || ''}
        className="w-full h-auto"
        style={{ 
          objectFit: data.objectFit || 'cover',
          maxHeight: data.maxHeight || 'auto',
          aspectRatio: data.aspectRatio || 'auto',
          borderRadius: padding > 0 ? `${Math.max(0, borderRadius - padding/2)}px` : `${borderRadius}px`,
        }}
      />
      {data.caption && (
        <figcaption className="text-sm text-center mt-2" style={{ color: 'var(--color-text-light, #64748b)' }}>
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ── Image Card with overlapping info box ────────────────────── */
function ImageCardBlock({ data }) {
  // Position classes for the card overlay - 50% on image, 50% outside
  const getCardPositionStyle = () => {
    const pos = data.cardPosition || 'bottom-right';
    const base = {
      position: 'absolute',
      zIndex: 10,
      transform: 'translateY(50%)', // Default for bottom positions
    };
    
    switch (pos) {
      case 'top-left':
        return { ...base, top: 0, left: '1rem', transform: 'translateY(-50%)' };
      case 'top-center':
        return { ...base, top: 0, left: '50%', transform: 'translate(-50%, -50%)' };
      case 'top-right':
        return { ...base, top: 0, right: '1rem', transform: 'translateY(-50%)' };
      case 'bottom-left':
        return { ...base, bottom: 0, left: '1rem', transform: 'translateY(50%)' };
      case 'bottom-center':
        return { ...base, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' };
      case 'bottom-right':
      default:
        return { ...base, bottom: 0, right: '1rem', transform: 'translateY(50%)' };
    }
  };

  // Border style based on settings
  const getBorderStyle = () => {
    const side = data.borderSide || 'right';
    const width = data.borderWidth || 4;
    const color = data.borderColor || '#3b82f6';
    
    if (side === 'none') return {};
    if (side === 'all') return { border: `${width}px solid ${color}` };
    
    const sideMap = {
      left: 'borderLeft',
      right: 'borderRight',
      top: 'borderTop',
      bottom: 'borderBottom'
    };
    
    return { [sideMap[side]]: `${width}px solid ${color}` };
  };

  // Shadow classes
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  // Icon position layout
  const getCardLayout = () => {
    const iconPos = data.iconPosition || 'left';
    switch (iconPos) {
      case 'top':
        return 'flex-col items-center text-center';
      case 'bottom':
        return 'flex-col-reverse items-center text-center';
      case 'right':
        return 'flex-row-reverse items-center';
      case 'left':
      default:
        return 'flex-row items-center';
    }
  };

  const renderIcon = () => {
    if (!data.icon) return null;
    
    const iconColor = data.iconColor || '#3b82f6';
    const iconClass = (data.iconPosition === 'top' || data.iconPosition === 'bottom') 
      ? 'mb-2' 
      : (data.iconPosition === 'right' ? 'ml-3' : 'mr-3');
    
    if (data.icon.startsWith('/') || data.icon.startsWith('http')) {
      return <img src={data.icon} alt="" className={`w-8 h-8 md:w-10 md:h-10 object-contain ${iconClass}`} />;
    } else if (data.icon.startsWith('<svg')) {
      return (
        <div 
          className={`w-8 h-8 md:w-10 md:h-10 flex-shrink-0 ${iconClass}`}
          style={{ color: iconColor }}
          dangerouslySetInnerHTML={{ __html: data.icon }}
        />
      );
    } else {
      return <span className={`text-2xl md:text-3xl ${iconClass}`} style={{ color: iconColor }}>{data.icon}</span>;
    }
  };

  // Calculate margin needed for overlapping card
  const pos = data.cardPosition || 'bottom-right';
  const isTop = pos.startsWith('top');
  const marginStyle = isTop ? { marginTop: '60px' } : { marginBottom: '60px' };

  return (
    <div className="relative px-4 md:px-8" style={marginStyle}>
      {/* Main Image */}
      <div className="relative">
        {data.image && (
          <img
            src={data.image}
            alt={data.imageAlt || ''}
            className="w-full object-cover rounded-lg"
            style={{ 
              height: data.imageHeight === 'auto' ? 'auto' : data.imageHeight,
              minHeight: '200px'
            }}
          />
        )}
        
        {/* Overlapping Card - 50% on image, 50% outside */}
        <div 
          className={`rounded-lg ${shadowClasses[data.cardShadow || 'lg']}`}
          style={{
            ...getCardPositionStyle(),
            backgroundColor: data.cardBgColor || '#ffffff',
            ...getBorderStyle(),
            minWidth: '180px',
            maxWidth: '320px',
          }}
        >
          <div className={`flex ${getCardLayout()} p-4`}>
            {renderIcon()}
            <div className={`${data.iconPosition === 'top' || data.iconPosition === 'bottom' ? '' : 'flex-1'}`}>
              {data.title && (
                <div 
                  className="font-bold text-base md:text-lg leading-tight"
                  style={{ color: data.titleColor || '#111827' }}
                >
                  {data.title}
                </div>
              )}
              {data.subtitle && (
                <div 
                  className="text-sm leading-snug mt-1"
                  style={{ color: data.subtitleColor || '#6b7280' }}
                >
                  {data.subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Quote Card Embed (Mini Calculator for Hero Banner) ─────────── */
function QuoteCardEmbed({ config, onNavigate }) {
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [isDomestic, setIsDomestic] = useState(true);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  
  // Load vehicle types
  useEffect(() => {
    if (config.quoteShowVehicle !== false) {
      fetch(`${API}/vehicle-types/public`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setVehicleTypes(data);
          if (data.length > 0) setSelectedVehicle(data[0].id);
        })
        .catch(() => {});
    }
  }, [config.quoteShowVehicle]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (startAddress) params.set('from', startAddress);
    if (endAddress) params.set('to', endAddress);
    params.set('domestic', isDomestic ? '1' : '0');
    if (selectedVehicle) params.set('vehicle', selectedVehicle);
    
    const url = (config.quoteCardUrl || '/transport-calculator') + '?' + params.toString();
    onNavigate(url);
  };
  
  // Styling from config
  const cardBg = config.quoteCardBg || 'rgba(255,255,255,0.85)';
  const opacity = (config.quoteCardOpacity ?? 85) / 100;
  const titleColor = config.quoteCardTitleColor || '#1e3a5f';
  const labelColor = config.quoteCardLabelColor || '#4b5563';
  const inputBg = config.quoteCardInputBg || '#ffffff';
  const inputBorder = config.quoteCardInputBorder || '#e5e7eb';
  const buttonBg = config.quoteCardButtonBg || '#2563eb';
  const buttonColor = config.quoteCardButtonColor || '#ffffff';
  
  const radiusMap = { none: '0', sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.5rem' };
  const shadowMap = { 
    none: 'none', 
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)', 
    md: '0 4px 6px -1px rgba(0,0,0,0.1)', 
    lg: '0 10px 15px -3px rgba(0,0,0,0.1)', 
    xl: '0 20px 25px -5px rgba(0,0,0,0.1)', 
    '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)' 
  };
  const blurMap = { none: '0', sm: '4px', md: '8px', lg: '12px', xl: '16px' };
  
  const borderRadius = radiusMap[config.quoteCardRadius || 'xl'] || '1rem';
  const boxShadow = shadowMap[config.quoteCardShadow || 'xl'] || shadowMap.xl;
  const blurAmount = blurMap[config.quoteCardBlur || 'md'] || '8px';
  
  // Parse background with opacity
  const getBgWithOpacity = () => {
    if (cardBg.startsWith('rgba')) return cardBg;
    if (cardBg.startsWith('#')) {
      const hex = cardBg.replace('#', '');
      const r = parseInt(hex.substring(0,2), 16);
      const g = parseInt(hex.substring(2,4), 16);
      const b = parseInt(hex.substring(4,6), 16);
      return `rgba(${r},${g},${b},${opacity})`;
    }
    return cardBg;
  };
  
  return (
    <div 
      className="quote-card-embed"
      style={{ 
        backgroundColor: getBgWithOpacity(),
        borderRadius,
        boxShadow,
        backdropFilter: `blur(${blurAmount})`,
        WebkitBackdropFilter: `blur(${blurAmount})`,
        padding: '1.5rem',
        width: '100%',
        maxWidth: '380px',
      }}
    >
      {/* Title */}
      <h3 
        className="text-lg md:text-xl font-bold mb-4"
        style={{ color: titleColor }}
      >
        {config.quoteCardTitle || 'Bereken uw transport'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* From field */}
        {config.quoteShowFrom !== false && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: labelColor }}>
              📍 Vertrekadres
            </label>
            <input 
              type="text"
              value={startAddress}
              onChange={e => setStartAddress(e.target.value)}
              placeholder="Waar wordt opgehaald?"
              className="w-full px-3 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
              style={{ 
                backgroundColor: inputBg, 
                borderColor: inputBorder,
                color: '#1f2937'
              }}
            />
          </div>
        )}
        
        {/* To field */}
        {config.quoteShowTo !== false && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: labelColor }}>
              🎯 Bestemmingsadres
            </label>
            <input 
              type="text"
              value={endAddress}
              onChange={e => setEndAddress(e.target.value)}
              placeholder="Waar moet het naartoe?"
              className="w-full px-3 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
              style={{ 
                backgroundColor: inputBg, 
                borderColor: inputBorder,
                color: '#1f2937'
              }}
            />
          </div>
        )}
        
        {/* Domestic/International toggle */}
        {config.quoteShowType !== false && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: labelColor }}>
              🌍 Type transport
            </label>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: inputBorder }}>
              <button
                type="button"
                onClick={() => setIsDomestic(true)}
                className="flex-1 px-3 py-2 text-xs font-medium transition-all"
                style={{ 
                  backgroundColor: isDomestic ? buttonBg : inputBg,
                  color: isDomestic ? buttonColor : labelColor
                }}
              >
                🇳🇱 Binnenlands
              </button>
              <button
                type="button"
                onClick={() => setIsDomestic(false)}
                className="flex-1 px-3 py-2 text-xs font-medium transition-all"
                style={{ 
                  backgroundColor: !isDomestic ? buttonBg : inputBg,
                  color: !isDomestic ? buttonColor : labelColor
                }}
              >
                🌍 Internationaal
              </button>
            </div>
          </div>
        )}
        
        {/* Vehicle type selector */}
        {config.quoteShowVehicle !== false && vehicleTypes.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: labelColor }}>
              🚛 Voertuigtype
            </label>
            <select 
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
              style={{ 
                backgroundColor: inputBg, 
                borderColor: inputBorder,
                color: '#1f2937'
              }}
            >
              {vehicleTypes.map(vt => (
                <option key={vt.id} value={vt.id}>
                  {vt.icon || '🚛'} {vt.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-3 text-sm font-semibold rounded-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{ 
            backgroundColor: buttonBg,
            color: buttonColor,
            boxShadow: '0 4px 14px -3px rgba(37, 99, 235, 0.4)'
          }}
        >
          {config.quoteCardButtonText || 'Bereken prijs →'}
        </button>
      </form>
    </div>
  );
}

/* ── Hero Banner with Image Cards ─────────────────────────────── */
function HeroBannerBlock({ data }) {
  const navigate = useNavigate();
  const cards = data.cards || [];
  const cardCount = data.cardCount || 3;
  const overlayOpacity = (data.overlayOpacity ?? 50) / 100;
  const effectOpacity = (data.effectOpacity ?? 100) / 100;
  const [visibleCards, setVisibleCards] = useState({});
  const cardRefs = useRef([]);
  
  // Background type detection
  const hasEffect = data.backgroundType === 'effect' && data.backgroundEffect;
  const hasEffectImage = hasEffect && data.backgroundImage; // Image under effect
  const hasVideo = data.backgroundType === 'video' && data.backgroundVideo;
  const hasSplitImages = data.backgroundType === 'splitImages' && (data.splitImages || []).filter(Boolean).length > 0;
  const hasImage = data.backgroundImage && data.backgroundType !== 'effect' && data.backgroundType !== 'color' && data.backgroundType !== 'video' && data.backgroundType !== 'splitImages';
  
  // Full-bleed and border-radius
  const fullBleedClass = data.fullBleed ? 'hero-full-bleed' : '';
  const borderRadiusClass = !data.fullBleed && data.borderRadius ? {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    '2xl': 'rounded-2xl',
  }[data.borderRadius] || 'rounded-xl' : '';
  
  // Intersection Observer for load animations
  useEffect(() => {
    const observers = [];
    cardRefs.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setVisibleCards(prev => ({ ...prev, [index]: true }));
              observer.disconnect();
            }
          },
          { threshold: 0.1 }
        );
        observer.observe(ref);
        observers.push(observer);
      }
    });
    return () => observers.forEach(obs => obs.disconnect());
  }, [cards.length]);
  
  // Get background style for color mode
  const getBackgroundStyle = () => {
    if (data.backgroundType === 'color') {
      const bg1 = data.backgroundColor || '#1e3a5f';
      const bg2 = data.backgroundColor2 || '#3b82f6';
      const gradient = data.colorGradient;
      
      if (gradient && gradient !== 'none') {
        const gradientDir = {
          'to-r': '90deg',
          'to-l': '270deg',
          'to-b': '180deg',
          'to-t': '0deg',
          'to-br': '135deg',
          'to-bl': '225deg',
        }[gradient] || '90deg';
        return `linear-gradient(${gradientDir}, ${bg1}, ${bg2})`;
      }
      return bg1;
    }
    if (hasEffect) {
      const colors = [
        data.effectColor1 || '#1e3a5f',
        data.effectColor2 || '#3b82f6',
        data.effectColor3 || '#8b5cf6',
        data.effectColor4 || '#ec4899',
      ];
      return `linear-gradient(315deg, ${colors[0]} 3%, ${colors[1]} 38%, ${colors[2]} 68%, ${colors[3]} 98%)`;
    }
    if (hasImage) {
      return undefined;
    }
    return data.backgroundColor || '#1e3a5f';
  };
  
  // Render background effect (same as HeroBlock)
  const renderBackgroundEffect = () => {
    if (!hasEffect) return null;
    const effect = data.backgroundEffect || 'waves';
    const speedClass = `hero-effect-${data.effectSpeed || 'normal'}`;
    
    const effectStyle = {
      '--effect-color-1': data.effectColor1 || '#1e3a5f',
      '--effect-color-2': data.effectColor2 || '#3b82f6',
      '--effect-color-3': data.effectColor3 || '#8b5cf6',
      '--effect-color-4': data.effectColor4 || '#ec4899',
      '--wave-color': data.waveColor || 'rgba(255,255,255,0.25)',
      '--circle-color': data.circleColor || 'rgba(255,255,255,0.3)',
      opacity: effectOpacity,
    };

    switch (effect) {
      case 'waves':
        return (
          <div className={`hero-effect-container hero-effect-waves ${speedClass}`} style={effectStyle}>
            <div className="hero-wave"></div>
            <div className="hero-wave"></div>
            <div className="hero-wave"></div>
          </div>
        );
      case 'wavyRotate':
        return (
          <div className="hero-effect-container hero-effect-wavy-rotate" style={effectStyle}>
            <div className="hero-wavy-rotate-container">
              <div className="hero-wavy-rotate-circle"></div>
              <div className="hero-wavy-rotate-circle"></div>
              <div className="hero-wavy-rotate-circle"></div>
            </div>
          </div>
        );
      case 'circles':
        return (
          <div className="hero-effect-container hero-effect-circles" style={effectStyle}>
            <div className="hero-circles-container">
              <div className="hero-circle hero-circle-small"></div>
              <div className="hero-circle hero-circle-medium"></div>
              <div className="hero-circle hero-circle-large"></div>
              <div className="hero-circle hero-circle-xlarge"></div>
              <div className="hero-circle hero-circle-xxlarge"></div>
            </div>
          </div>
        );
      case 'triangles':
        return (
          <div className="hero-effect-container hero-effect-triangles" style={effectStyle}>
            {Array.from({ length: 20 }).map((_, i) => {
              const size = 20 + Math.random() * 60;
              const colors = [
                data.effectColor1 || '#fff',
                data.effectColor2 || '#3b82f6',
                data.effectColor3 || '#8b5cf6',
                data.effectColor4 || '#ec4899',
              ];
              const color = colors[Math.floor(Math.random() * colors.length)];
              return (
                <div 
                  key={i} 
                  className="hero-triangle animated"
                  style={{
                    borderWidth: `0 ${size/2}px ${size}px ${size/2}px`,
                    borderBottomColor: color,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `hero-triangle-fly ${5 + Math.random() * 10}s linear infinite`,
                    animationDelay: `${Math.random() * 5}s`,
                    filter: `grayscale(${Math.random() > 0.5 ? 0 : 1})`,
                    opacity: 0.3 + Math.random() * 0.7,
                  }}
                />
              );
            })}
          </div>
        );
      case 'particles':
        return (
          <div className="hero-effect-container hero-effect-particles" style={effectStyle}>
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i} 
                className="hero-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        );
      case 'gradient':
        return (
          <div 
            className="hero-effect-container hero-effect-gradient" 
            style={{
              ...effectStyle,
              background: `linear-gradient(315deg, ${data.effectColor1 || '#1e3a5f'} 3%, ${data.effectColor2 || '#3b82f6'} 38%, ${data.effectColor3 || '#8b5cf6'} 68%, ${data.effectColor4 || '#ec4899'} 98%)`,
              backgroundSize: '400% 400%',
            }}
          />
        );
      case 'aurora':
        return (
          <div className="hero-effect-container hero-effect-aurora" style={effectStyle}>
            <div className="hero-aurora-layer">
              <div className="hero-aurora-blob hero-aurora-blob-1"></div>
              <div className="hero-aurora-blob hero-aurora-blob-2"></div>
              <div className="hero-aurora-blob hero-aurora-blob-3"></div>
            </div>
          </div>
        );
      case 'mesh':
        return (
          <div className="hero-effect-container hero-effect-mesh" style={effectStyle} />
        );
      default:
        return null;
    }
  };
  
  // Default effect for all cards
  const defaultEffect = data.defaultCardEffect || 'none';
  
  // Position classes for content
  const position = data.contentPosition || 'center-center';
  const [vPos, hPos] = position.split('-');
  
  const justifyClass = {
    'top': 'justify-start',
    'center': 'justify-center',
    'bottom': 'justify-end',
  }[vPos] || 'justify-center';

  const itemsClass = {
    'left': 'items-start',
    'center': 'items-center',
    'right': 'items-end',
  }[hPos] || 'items-center';

  const textAlign = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
  }[hPos] || 'text-center';

  // Render individual card
  const renderCard = (card, index) => {
    const cardEffect = card.effect || defaultEffect;
    const effectClass = cardEffect !== 'none' ? `hero-card-effect-${cardEffect}` : '';
    const loadEffect = card.loadEffect || '';
    const loadDelay = card.loadDelay || (index * 150);
    const loadDuration = card.loadDuration || 600;
    const isVisible = visibleCards[index];
    
    // Load animation class
    const loadAnimationClass = loadEffect && isVisible ? `hero-load-${loadEffect}` : (loadEffect ? 'hero-load-hidden' : '');
    
    // Icon rendering
    const renderCardIcon = () => {
      if (!card.icon) return null;
      const iconColor = card.iconColor || '#3b82f6';
      
      if (card.icon.startsWith('<svg')) {
        return (
          <div 
            className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 mb-2"
            style={{ color: iconColor }}
            dangerouslySetInnerHTML={{ __html: card.icon }}
          />
        );
      }
      return <span className="text-3xl md:text-4xl mb-2" style={{ color: iconColor }}>{card.icon}</span>;
    };

    return (
      <div 
        key={index}
        ref={el => cardRefs.current[index] = el}
        className={`bg-white rounded-xl shadow-xl p-4 md:p-6 flex flex-col items-center text-center transition-all hover:scale-105 ${effectClass} ${loadAnimationClass}`}
        style={{
          backgroundColor: card.bgColor || '#ffffff',
          borderLeft: card.borderColor ? `4px solid ${card.borderColor}` : undefined,
          '--load-duration': loadEffect ? `${loadDuration}ms` : undefined,
          animationDelay: loadEffect ? `${loadDelay}ms` : undefined,
          minWidth: '140px',
        }}
      >
        {renderCardIcon()}
        {card.counter !== undefined && (
          <div 
            className="text-3xl md:text-4xl font-bold mb-1 whitespace-nowrap"
            style={{ color: card.counterColor || '#111827' }}
          >
            {card.counter}{card.suffix || ''}
          </div>
        )}
        {card.title && (
          <div 
            className="font-semibold text-sm md:text-base mb-1"
            style={{ color: card.titleColor || '#111827' }}
          >
            {card.title}
          </div>
        )}
        {card.subtitle && (
          <div 
            className="text-xs md:text-sm text-gray-500"
            style={{ color: card.subtitleColor || '#6b7280' }}
          >
            {card.subtitle}
          </div>
        )}
        {/* Per-card Styled Texts */}
        {(card.styledTexts || []).length > 0 && (
          <div className="card-styled-texts mt-2 w-full">
            {(card.styledTexts || []).map((st, stIdx) => (
              <StyledText key={stIdx} element={st} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render flip card (when cardType is 'flip')
  const renderFlipCard = (card, index) => {
    const flipDirection = data.flipDirection || 'horizontal';
    const flipDesign = data.flipDesign || 'basic';
    const flipHeight = data.flipCardHeight || 280;
    const backBg = card.backBgGradient || card.backBgColor || '#1e3a5f';
    const frontOverlayOpacity = (card.frontOverlayOpacity ?? 60) / 100;
    
    // Corner border settings
    const cornerPosition = data.flipCornerPosition || 'none';
    const cornerSize = data.flipCornerSize || 40;
    const cornerColor = data.flipCornerColor || '#3b82f6';
    
    const flipClass = flipDirection === 'vertical' ? 'flip-card-vertical' : 'flip-card-horizontal';
    const designClass = `flip-card-design-${flipDesign}`;

    // Corner border render function
    const renderCornerBorder = () => {
      if (!cornerPosition || cornerPosition === 'none') return null;
      
      const cornerStyles = {
        'top-left': {
          top: 0,
          left: 0,
          borderTopWidth: `${cornerSize}px`,
          borderRightWidth: `${cornerSize}px`,
          borderTopColor: cornerColor,
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
        },
        'top-right': {
          top: 0,
          right: 0,
          borderTopWidth: `${cornerSize}px`,
          borderLeftWidth: `${cornerSize}px`,
          borderTopColor: cornerColor,
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: 'transparent',
        },
        'bottom-left': {
          bottom: 0,
          left: 0,
          borderBottomWidth: `${cornerSize}px`,
          borderRightWidth: `${cornerSize}px`,
          borderBottomColor: cornerColor,
          borderRightColor: 'transparent',
          borderTopColor: 'transparent',
          borderLeftColor: 'transparent',
        },
        'bottom-right': {
          bottom: 0,
          right: 0,
          borderBottomWidth: `${cornerSize}px`,
          borderLeftWidth: `${cornerSize}px`,
          borderBottomColor: cornerColor,
          borderLeftColor: 'transparent',
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
        },
      };
      
      return (
        <div 
          className="flip-card-corner-border"
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            borderStyle: 'solid',
            zIndex: 10,
            pointerEvents: 'none',
            ...cornerStyles[cornerPosition],
          }}
        />
      );
    };

    return (
      <div 
        key={index}
        className={`flip-card ${flipClass} flip-on-hover ${designClass}`}
        style={{ height: `${flipHeight}px` }}
      >
        {renderCornerBorder()}
        <div className="flip-card-inner">
          {/* FRONT */}
          <div 
            className="flip-card-front"
            style={{
              backgroundImage: card.frontImage ? `url(${card.frontImage})` : undefined,
              backgroundColor: !card.frontImage ? '#374151' : undefined,
            }}
          >
            {card.frontOverlay !== false && card.frontImage && (
              <div className="flip-card-overlay" style={{ backgroundColor: `rgba(0, 0, 0, ${frontOverlayOpacity})` }} />
            )}
            <div className="flip-card-content">
              {card.frontTitle && (
                <h3 className="flip-card-title" style={{ color: card.frontTitleColor || '#ffffff' }}>{card.frontTitle}</h3>
              )}
              {card.frontSubtitle && (
                <span className="flip-card-subtitle" style={{ color: card.frontSubtitleColor || 'rgba(255,255,255,0.8)' }}>{card.frontSubtitle}</span>
              )}
            </div>
          </div>
          
          {/* BACK */}
          <div 
            className={`flip-card-back ${card.backImage ? 'has-back-image' : ''}`}
            style={{
              ...(card.backImage ? {
                backgroundImage: `url(${card.backImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {
                background: backBg,
              }),
              color: card.backTextColor || '#ffffff',
            }}
          >
            {card.backImage && card.backImageOverlay !== false && (
              <div className="flip-card-overlay" style={{ backgroundColor: `rgba(0, 0, 0, ${(card.backImageOverlayOpacity ?? 40) / 100})` }} />
            )}
            {!card.backImage && (
              <div className="flip-card-back-bg" style={{ position: 'absolute', inset: 0, background: backBg, zIndex: 0 }} />
            )}
            <div className="flip-card-content" style={{ position: 'relative', zIndex: 1 }}>
              {card.backTitle && <h3 className="flip-card-back-title">{card.backTitle}</h3>}
              {card.backDescription && <p className="flip-card-back-description">{card.backDescription}</p>}
              {card.backButtonText && card.backButtonUrl && (
                <Link
                  to={card.backButtonUrl}
                  className="flip-card-button"
                  style={{ backgroundColor: card.backButtonBg || '#ffffff', color: card.backButtonColor || '#1e3a5f' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {card.backButtonText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Choose which card renderer to use
  const cardRenderer = data.cardType === 'flip' ? renderFlipCard : renderCard;

  // Grid columns based on card count
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cardCount] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  // Quote card position
  const showQuoteCard = data.showQuoteCard;
  const quotePosition = data.quoteCardPosition || 'right';
  
  // Flex order for quote card positioning
  const quoteFlexOrder = {
    left: 'order-first',
    center: 'order-1',
    right: 'order-last'
  }[quotePosition] || 'order-last';
  
  const contentFlexOrder = {
    left: 'order-last',
    center: 'order-2',
    right: 'order-first'
  }[quotePosition] || 'order-first';

  // Cards position
  const cardsPos = data.cardsPosition || 'inline';
  const isOverlap = cardsPos === 'bottom-overlap' || cardsPos === 'top-overlap' || cardsPos === 'overlap';

  return (
    <div
      className={`relative flex flex-col ${justifyClass} ${itemsClass} bg-cover bg-center ${borderRadiusClass} ${isOverlap ? '' : 'overflow-hidden'} ${fullBleedClass}`}
      style={{
        backgroundImage: (hasImage || hasEffectImage) ? `url(${data.backgroundImage})` : undefined,
        background: !hasImage && !hasVideo && !hasEffectImage ? getBackgroundStyle() : undefined,
        minHeight: data.height || '500px',
        marginBottom: (cardsPos === 'bottom-overlap' || cardsPos === 'overlap') && cards.length > 0 ? '80px' : undefined,
        marginTop: cardsPos === 'top-overlap' && cards.length > 0 ? '80px' : undefined,
      }}
    >
      {/* Background Effect */}
      {renderBackgroundEffect()}
      
      {/* Video background */}
      {hasVideo && (
        <video
          src={data.backgroundVideo}
          autoPlay
          muted={data.videoMuted !== false}
          loop={data.videoLoop !== false}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Split Images Background */}
      {hasSplitImages && (
        <div 
          className={`split-images-bg ${data.splitImagesAnimated ? 'animated' : ''}`}
          data-count={(data.splitImages || []).filter(Boolean).length}
        >
          {(data.splitImages || []).filter(Boolean).map((imgSrc, idx) => (
            <div key={idx} className="split-image">
              <div 
                className="split-image-inner"
                style={{ backgroundImage: `url(${imgSrc})` }}
              />
              <div className="split-image-overlay" />
            </div>
          ))}
        </div>
      )}
      
      {/* Overlay */}
      {data.overlay !== false && (hasVideo || hasImage || hasEffectImage || hasSplitImages) && (
        <div 
          className="absolute inset-0" 
          style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
        />
      )}
      
      {/* Top overlapping cards */}
      {cardsPos === 'top-overlap' && cards.length > 0 && (
        <div 
          className="absolute left-0 right-0 z-20 px-4 sm:px-6 lg:px-8"
          style={{ top: 0, transform: 'translateY(-50%)' }}
        >
          <div className={`max-w-7xl mx-auto grid ${gridCols} gap-4 md:gap-6`}>
            {cards.slice(0, cardCount).map((card, i) => cardRenderer(card, i))}
          </div>
        </div>
      )}
      
      {/* Content with Quote Card */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {showQuoteCard ? (
          <div className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${quotePosition === 'center' ? 'justify-center' : 'justify-between'}`}>
            {/* Main content */}
            <div className={`flex-1 ${contentFlexOrder} ${textAlign} ${quotePosition === 'center' ? 'hidden lg:block' : ''}`}>
              {/* Title */}
              {(data.titleHtml || data.title) && (
                <div 
                  className="hero-title mb-4"
                  dangerouslySetInnerHTML={{ __html: data.titleHtml || `<h2 class="text-3xl md:text-4xl lg:text-5xl font-bold">${data.title}</h2>` }}
                  style={{ color: data.titleColor || '#ffffff' }}
                />
              )}
              
              {/* Subtitle */}
              {(data.subtitleHtml || data.subtitle) && (
                <div 
                  className="hero-subtitle mb-8"
                  dangerouslySetInnerHTML={{ __html: data.subtitleHtml || `<p class="text-lg md:text-xl">${data.subtitle}</p>` }}
                  style={{ color: data.subtitleColor || 'rgba(255,255,255,0.9)' }}
                />
              )}
              
              {/* Styled Texts */}
              {(data.styledTexts || []).length > 0 && (
                <div className="hero-styled-texts mb-8">
                  {(data.styledTexts || []).map((st, stIdx) => (
                    <StyledText key={stIdx} element={st} />
                  ))}
                </div>
              )}
            </div>
            
            {/* Quote Card */}
            <div className={`flex-shrink-0 w-full lg:w-auto ${quoteFlexOrder}`}>
              <QuoteCardEmbed config={data} onNavigate={(url) => navigate(url)} />
            </div>
          </div>
        ) : (
          /* Standard layout without quote card */
          <div className={textAlign}>
            {/* Title */}
            {(data.titleHtml || data.title) && (
              <div 
                className="hero-title mb-4"
                dangerouslySetInnerHTML={{ __html: data.titleHtml || `<h2 class="text-3xl md:text-4xl lg:text-5xl font-bold">${data.title}</h2>` }}
                style={{ color: data.titleColor || '#ffffff' }}
              />
            )}
            
            {/* Subtitle */}
            {(data.subtitleHtml || data.subtitle) && (
              <div 
                className="hero-subtitle mb-8 md:mb-12"
                dangerouslySetInnerHTML={{ __html: data.subtitleHtml || `<p class="text-lg md:text-xl">${data.subtitle}</p>` }}
                style={{ color: data.subtitleColor || 'rgba(255,255,255,0.9)' }}
              />
            )}
            
            {/* Styled Texts */}
            {(data.styledTexts || []).length > 0 && (
              <div className="hero-styled-texts mb-8 md:mb-12">
                {(data.styledTexts || []).map((st, stIdx) => (
                  <StyledText key={stIdx} element={st} />
                ))}
              </div>
            )}
            
            {/* Inline Cards Grid */}
            {cards.length > 0 && cardsPos === 'inline' && (
              <div className={`grid ${gridCols} gap-4 md:gap-6`}>
                {cards.slice(0, cardCount).map((card, i) => cardRenderer(card, i))}
              </div>
            )}
          </div>
        )}
        
        {/* Inline Cards Grid below when quote card is shown */}
        {showQuoteCard && cards.length > 0 && cardsPos === 'inline' && (
          <div className={`mt-8 grid ${gridCols} gap-4 md:gap-6`}>
            {cards.slice(0, cardCount).map((card, i) => cardRenderer(card, i))}
          </div>
        )}
      </div>
      
      {/* Bottom overlapping cards */}
      {(cardsPos === 'bottom-overlap' || cardsPos === 'overlap') && cards.length > 0 && (
        <div 
          className="absolute left-0 right-0 z-20 px-4 sm:px-6 lg:px-8"
          style={{ bottom: 0, transform: 'translateY(50%)' }}
        >
          <div className={`max-w-7xl mx-auto grid ${gridCols} gap-4 md:gap-6`}>
            {cards.slice(0, cardCount).map((card, i) => cardRenderer(card, i))}
          </div>
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

/* ── Countdown Timer ──────────────────────────────────────────── */
function CountdownBlock({ data }) {
  const {
    targetDate = '',
    targetTime = '00:00',
    style = 'cards',
    showDays = true,
    showHours = true,
    showMinutes = true,
    showSeconds = true,
    dayLabel = 'Days',
    hourLabel = 'Hours',
    minuteLabel = 'Minutes',
    secondLabel = 'Seconds',
    numberColor = '#ffffff',
    labelColor = '#94a3b8',
    backgroundColor = '#1e293b',
    borderColor = '#334155',
    showExpiredMessage = true,
    expiredMessage = 'Event has ended',
    expiredAction = 'message',
    expiredRedirectUrl = '',
  } = data;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) return;

    const targetDateTime = new Date(`${targetDate}T${targetTime || '00:00'}:00`);

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDateTime.getTime() - now;

      if (difference <= 0) {
        setIsExpired(true);
        if (expiredAction === 'redirect' && expiredRedirectUrl) {
          window.location.href = expiredRedirectUrl;
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, targetTime, expiredAction, expiredRedirectUrl]);

  if (isExpired && expiredAction === 'hide') {
    return null;
  }

  if (isExpired && showExpiredMessage) {
    return (
      <div className="countdown-expired text-center py-8">
        <p className="text-2xl font-bold" style={{ color: numberColor }}>{expiredMessage}</p>
      </div>
    );
  }

  const units = [];
  if (showDays) units.push({ value: timeLeft.days, label: dayLabel });
  if (showHours) units.push({ value: timeLeft.hours, label: hourLabel });
  if (showMinutes) units.push({ value: timeLeft.minutes, label: minuteLabel });
  if (showSeconds) units.push({ value: timeLeft.seconds, label: secondLabel });

  const padNumber = (num) => String(num).padStart(2, '0');

  // Style: cards
  if (style === 'cards') {
    return (
      <div className="countdown-timer countdown-cards flex justify-center gap-4 flex-wrap">
        {units.map((unit, i) => (
          <div 
            key={i} 
            className="countdown-card flex flex-col items-center p-4 rounded-xl min-w-[80px] shadow-lg"
            style={{ backgroundColor, borderColor, border: `1px solid ${borderColor}` }}
          >
            <span className="countdown-number text-4xl md:text-5xl font-bold" style={{ color: numberColor }}>
              {padNumber(unit.value)}
            </span>
            <span className="countdown-label text-sm uppercase tracking-wider mt-2" style={{ color: labelColor }}>
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Style: flip
  if (style === 'flip') {
    return (
      <div className="countdown-timer countdown-flip flex justify-center gap-4 flex-wrap">
        {units.map((unit, i) => (
          <div key={i} className="countdown-flip-unit flex flex-col items-center">
            <div 
              className="countdown-flip-card relative overflow-hidden rounded-lg min-w-[70px] h-[90px] shadow-lg"
              style={{ backgroundColor, perspective: '300px' }}
            >
              <div className="countdown-flip-top absolute inset-x-0 top-0 h-1/2 overflow-hidden flex items-end justify-center border-b" style={{ borderColor }}>
                <span className="countdown-number text-4xl font-bold translate-y-1/2" style={{ color: numberColor }}>
                  {padNumber(unit.value)}
                </span>
              </div>
              <div className="countdown-flip-bottom absolute inset-x-0 bottom-0 h-1/2 overflow-hidden flex items-start justify-center">
                <span className="countdown-number text-4xl font-bold -translate-y-1/2" style={{ color: numberColor }}>
                  {padNumber(unit.value)}
                </span>
              </div>
            </div>
            <span className="countdown-label text-sm uppercase tracking-wider mt-2" style={{ color: labelColor }}>
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Style: minimal
  if (style === 'minimal') {
    return (
      <div className="countdown-timer countdown-minimal text-center">
        <div className="flex justify-center items-baseline gap-1 flex-wrap">
          {units.map((unit, i) => (
            <span key={i} className="flex items-baseline gap-1">
              <span className="countdown-number text-5xl md:text-6xl font-bold" style={{ color: numberColor }}>
                {padNumber(unit.value)}
              </span>
              <span className="countdown-label text-lg" style={{ color: labelColor }}>
                {unit.label.charAt(0).toLowerCase()}
              </span>
              {i < units.length - 1 && (
                <span className="text-4xl mx-2" style={{ color: labelColor }}>:</span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Style: circular
  if (style === 'circular') {
    const maxValues = { days: 365, hours: 24, minutes: 60, seconds: 60 };
    const unitKeys = ['days', 'hours', 'minutes', 'seconds'].filter((k, i) => 
      [showDays, showHours, showMinutes, showSeconds][i]
    );

    return (
      <div className="countdown-timer countdown-circular flex justify-center gap-6 flex-wrap">
        {units.map((unit, i) => {
          const key = unitKeys[i];
          const percentage = (unit.value / maxValues[key]) * 100;
          const circumference = 2 * Math.PI * 45;
          const offset = circumference - (percentage / 100) * circumference;

          return (
            <div key={i} className="countdown-circular-unit flex flex-col items-center">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    fill="none"
                    stroke={borderColor}
                    strokeWidth="4"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    fill="none"
                    stroke={numberColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="countdown-number text-2xl font-bold" style={{ color: numberColor }}>
                    {padNumber(unit.value)}
                  </span>
                </div>
              </div>
              <span className="countdown-label text-sm uppercase tracking-wider mt-2" style={{ color: labelColor }}>
                {unit.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Default fallback
  return (
    <div className="countdown-timer countdown-cards flex justify-center gap-4 flex-wrap">
      {units.map((unit, i) => (
        <div key={i} className="countdown-card flex flex-col items-center p-4 rounded-xl min-w-[80px]" style={{ backgroundColor }}>
          <span className="countdown-number text-4xl font-bold" style={{ color: numberColor }}>{padNumber(unit.value)}</span>
          <span className="countdown-label text-sm uppercase mt-2" style={{ color: labelColor }}>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Button Style Presets ─────────────────────────────────────── */
const BUTTON_PRESETS = {
  'shadow-lift': { base: 'bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300', hover: 'hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30' },
  'shadow-grow': { base: 'bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md', hover: 'hover:shadow-2xl hover:shadow-purple-500/40' },
  'shadow-soft': { base: 'bg-white text-gray-800 px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-300', hover: 'hover:shadow-2xl hover:-translate-y-0.5' },
  'shadow-neon': { base: 'bg-cyan-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300', hover: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.7)]' },
  'fill-left': { base: 'btn-effect-fill-left relative overflow-hidden bg-transparent border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-lg font-medium transition-all duration-500', hover: 'hover:text-white' },
  'fill-right': { base: 'btn-effect-fill-right relative overflow-hidden bg-transparent border-2 border-emerald-500 text-emerald-500 px-6 py-3 rounded-lg font-medium transition-all duration-500', hover: 'hover:text-white' },
  'fill-up': { base: 'btn-effect-fill-up relative overflow-hidden bg-transparent border-2 border-orange-500 text-orange-500 px-6 py-3 rounded-lg font-medium transition-all duration-500', hover: 'hover:text-white' },
  'fill-down': { base: 'btn-effect-fill-down relative overflow-hidden bg-transparent border-2 border-pink-500 text-pink-500 px-6 py-3 rounded-lg font-medium transition-all duration-500', hover: 'hover:text-white' },
  'fill-center': { base: 'btn-effect-fill-center relative overflow-hidden bg-transparent border-2 border-violet-500 text-violet-500 px-6 py-3 rounded-lg font-medium transition-all duration-500', hover: 'hover:text-white' },
  'fill-diagonal': { base: 'btn-effect-fill-diagonal relative overflow-hidden bg-transparent border-2 border-rose-500 text-rose-500 px-6 py-3 rounded-lg font-medium transition-all duration-500', hover: 'hover:text-white' },
  'gradient-shift': { base: 'px-6 py-3 rounded-lg font-medium text-white transition-all duration-500 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_auto]', hover: 'hover:bg-right' },
  'gradient-sunset': { base: 'px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 transition-all duration-300', hover: 'hover:shadow-lg hover:shadow-red-500/30 hover:scale-105' },
  'gradient-ocean': { base: 'px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300', hover: 'hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105' },
  'border-draw': { base: 'btn-effect-border-draw relative bg-transparent text-blue-500 px-6 py-3 font-medium transition-all duration-300 border-2 border-blue-500', hover: 'hover:text-blue-600' },
  'border-pulse': { base: 'bg-transparent border-2 border-indigo-500 text-indigo-500 px-6 py-3 rounded-lg font-medium transition-all duration-300', hover: 'hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_0_4px_rgba(99,102,241,0.3)]' },
  'border-slide': { base: 'btn-effect-border-slide relative bg-transparent border-2 border-teal-500 text-teal-500 px-6 py-3 rounded-lg font-medium overflow-hidden transition-colors duration-300', hover: 'hover:text-white' },
  'underline-grow': { base: 'btn-effect-underline-grow relative bg-transparent text-gray-800 px-4 py-2 font-medium transition-all duration-300', hover: 'hover:text-blue-600' },
  'underline-slide': { base: 'btn-effect-underline-slide relative bg-transparent text-gray-800 px-4 py-2 font-medium transition-all duration-300', hover: 'hover:text-emerald-600' },
  '3d-push': { base: 'bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-150 shadow-[0_6px_0_#1d4ed8] translate-y-0', hover: 'hover:shadow-[0_4px_0_#1d4ed8] hover:translate-y-[2px] active:shadow-[0_0_0_#1d4ed8] active:translate-y-[6px]' },
  '3d-pop': { base: 'bg-gradient-to-b from-green-400 to-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-[0_8px_0_#15803d,0_12px_10px_rgba(0,0,0,0.2)]', hover: 'hover:shadow-[0_4px_0_#15803d,0_8px_10px_rgba(0,0,0,0.2)] hover:translate-y-1' },
  'minimal-arrow': { base: 'bg-transparent text-gray-700 px-4 py-2 font-medium transition-all duration-300', hover: 'hover:text-blue-600', hasArrow: true },
  'minimal-ghost': { base: 'bg-transparent border border-gray-300 text-gray-600 px-6 py-3 rounded-lg font-medium transition-all duration-300', hover: 'hover:border-gray-800 hover:text-gray-800 hover:bg-gray-50' },
  'shine': { base: 'btn-effect-shine relative overflow-hidden bg-blue-600 text-white px-6 py-3 rounded-lg font-medium', hover: '' },
  'ripple': { base: 'relative overflow-hidden bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300', hover: 'hover:bg-indigo-700' },
};

/* ── Button ───────────────────────────────────────────────────── */
function ButtonBlock({ data }) {
  // If a preset is selected, use preset styles
  if (data.stylePreset && BUTTON_PRESETS[data.stylePreset]) {
    const preset = BUTTON_PRESETS[data.stylePreset];
    const isExternal = data.target === '_blank';
    const alignClass = data.alignment === 'center' ? 'flex justify-center' : 
                       data.alignment === 'right' ? 'flex justify-end' : '';
    
    const buttonContent = (
      <>
        {data.text || 'Klik hier'}
        {preset.hasArrow && <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>}
      </>
    );
    
    const className = `group inline-block ${preset.base} ${preset.hover} ${data.fullWidth ? 'w-full text-center' : ''}`;
    
    return (
      <div className={alignClass}>
        {isExternal ? (
          <a href={data.url || '#'} target="_blank" rel="noopener noreferrer" className={className}>{buttonContent}</a>
        ) : (
          <Link to={data.url || '#'} className={className}>{buttonContent}</Link>
        )}
      </div>
    );
  }
  
  // Custom styling fallback
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
  const alignClass = data.alignment === 'center' ? 'flex justify-center' : 
                     data.alignment === 'right' ? 'flex justify-end' : '';
  
  // Build custom styles
  const customStyles = {};
  if (data.bgColor) customStyles.backgroundColor = data.bgColor;
  if (data.textColor) customStyles.color = data.textColor;
  if (data.borderColor) {
    customStyles.borderColor = data.borderColor;
    customStyles.borderWidth = '2px';
    customStyles.borderStyle = 'solid';
  }
  
  const hasCustomColors = data.bgColor || data.textColor || data.borderColor;
  const className = `inline-block rounded-lg font-semibold transition-all duration-300 ${hasCustomColors ? '' : styles[data.style || 'primary']} ${sizes[data.size || 'medium']} ${data.fullWidth ? 'w-full text-center' : ''}`;

  const buttonElement = isExternal ? (
    <a href={data.url || '#'} target="_blank" rel="noopener noreferrer" className={className} style={customStyles}>{data.text || 'Klik hier'}</a>
  ) : (
    <Link to={data.url || '#'} className={className} style={customStyles}>{data.text || 'Klik hier'}</Link>
  );
  
  return alignClass ? <div className={alignClass}>{buttonElement}</div> : buttonElement;
}

/* ── Cards ────────────────────────────────────────────────────── */
function CardsBlock({ data }) {
  const cols = data.columns || 3;
  const gridClass = cols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                    cols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  // Block-level effects (fallback if no per-card effects)
  const blockEffects = data.effects || {};

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {(data.items || []).map((item, i) => (
        <CardItem 
          key={i} 
          item={item}
          index={i}
          blockEffects={blockEffects}
        />
      ))}
    </div>
  );
}

function CardItem({ item, index, blockEffects = {} }) {
  const cardStyle = { borderColor: 'var(--color-border, #e2e8f0)', backgroundColor: 'var(--color-bg, #fff)' };
  
  // Per-card effects take priority over block-level effects
  const itemEffects = item.effects || {};
  const hasFlip = itemEffects.flip || blockEffects.cardFlip;
  const flipSettings = itemEffects.flipSettings || blockEffects.cardFlipSettings || {};
  const hoverClass = itemEffects.hover || (blockEffects.hover ? buildEffectClasses({ hover: blockEffects.hover }) : '');
  const animationClass = itemEffects.animation || '';
  
  // Combine animation delay based on index for staggered effect
  const delayClass = animationClass ? `effect-delay-${(index % 5) * 100 + 100}` : '';
  
  // Card with flip effect (per-card or block-level)
  if (hasFlip) {
    const isVertical = itemEffects.flip === 'vertical' || (blockEffects.cardFlip && blockEffects.cardFlip.includes('vertical'));
    const flipClass = isVertical ? 'effect-card-flip effect-card-flip-vertical' : 'effect-card-flip';
    
    return (
      <div className={`${flipClass} ${animationClass} ${delayClass}`} style={{ minHeight: '320px' }}>
        <div className="effect-card-flip-inner">
          {/* Front of card */}
          <div 
            className="effect-card-flip-front rounded-xl overflow-hidden shadow-md border"
            style={cardStyle}
          >
            {item.image && (
              <img src={item.image} alt={item.title || ''} className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              {item.title && <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text, #0f172a)' }}>{item.title}</h3>}
              {item.description && <p style={{ color: 'var(--color-text-light, #64748b)' }}>{item.description}</p>}
            </div>
          </div>
          {/* Back of card */}
          <div 
            className="effect-card-flip-back rounded-xl overflow-hidden shadow-md"
            style={{ 
              backgroundColor: flipSettings.backgroundColor || '#2563eb',
              color: flipSettings.textColor || '#ffffff'
            }}
          >
            <div className="p-6 flex flex-col items-center justify-center h-full text-center">
              {flipSettings.backTitle ? (
                <h3 className="text-xl font-bold mb-3">{flipSettings.backTitle}</h3>
              ) : item.title && (
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              )}
              {flipSettings.backContent ? (
                <p className="text-sm opacity-90 mb-4">{flipSettings.backContent}</p>
              ) : item.description && (
                <p className="text-sm opacity-90 mb-4">{item.description}</p>
              )}
              {item.link && (
                <Link 
                  to={item.link} 
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                >
                  {flipSettings.buttonText || 'Bekijk meer'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular card with per-card effects
  const effectClasses = [hoverClass, animationClass, delayClass].filter(Boolean).join(' ');
  
  const inner = (
    <div
      className={`rounded-xl overflow-hidden shadow-md border transition-all ${effectClasses || 'hover:-translate-y-1'}`}
      style={cardStyle}
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

/* ── Flip Cards (3D Parallax Effect) ──────────────────────────── */
function FlipCardsBlock({ data }) {
  const cols = data.columns || 3;
  const cardHeight = data.cardHeight || 320;
  const flipDirection = data.flipDirection || 'horizontal';
  const flipTrigger = data.flipTrigger || 'hover';
  const cardDesign = data.cardDesign || 'basic';
  const cardWidth = data.cardWidth || '100';
  const cornerPosition = data.cornerPosition || 'none';
  const cornerSize = data.cornerSize || 40;
  const cornerColor = data.cornerColor || '#3b82f6';
  
  // Width class for single cards in container
  const widthClass = {
    '100': 'w-full',
    '75': 'w-full md:w-3/4',
    '50': 'w-full md:w-1/2',
    '25': 'w-full md:w-1/4',
  }[cardWidth] || 'w-full';
  
  // For width-based layouts, use flex instead of grid
  const isWidthLayout = cardWidth !== '100';
  
  const gridClass = {
    1: 'grid-cols-1 max-w-lg mx-auto',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  if (isWidthLayout) {
    return (
      <div className="flex flex-wrap justify-center gap-6 py-8 px-4">
        {(data.items || []).map((item, i) => (
          <div key={i} className={widthClass}>
            <FlipCard
              item={item}
              height={cardHeight}
              direction={flipDirection}
              trigger={flipTrigger}
              design={cardDesign}
              cornerPosition={cornerPosition}
              cornerSize={cornerSize}
              cornerColor={cornerColor}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-6 py-8 px-4`}>
      {(data.items || []).map((item, i) => (
        <FlipCard
          key={i}
          item={item}
          height={cardHeight}
          direction={flipDirection}
          trigger={flipTrigger}
          design={cardDesign}
          cornerPosition={cornerPosition}
          cornerSize={cornerSize}
          cornerColor={cornerColor}
        />
      ))}
    </div>
  );
}

function FlipCard({ item, height, direction, trigger, design = 'basic', cornerPosition = 'none', cornerSize = 40, cornerColor = '#3b82f6' }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleClick = () => {
    if (trigger === 'click') {
      setIsFlipped(!isFlipped);
    }
  };

  const handleTouchStart = () => {
    if (trigger === 'hover') {
      setIsFlipped(!isFlipped);
    }
  };
  
  const frontOverlayOpacity = (item.frontOverlayOpacity ?? 60) / 100;
  const backBg = item.backBgGradient || item.backBgColor || '#1e3a5f';
  
  // Direction classes
  const flipClass = direction === 'vertical' ? 'flip-card-vertical' : 'flip-card-horizontal';
  const flippedClass = isFlipped ? 'is-flipped' : '';
  const hoverClass = trigger === 'hover' ? 'flip-on-hover' : '';
  const designClass = `flip-card-design-${design}`;

  // Corner border style
  const renderCornerBorder = () => {
    if (!cornerPosition || cornerPosition === 'none') return null;
    
    const cornerStyles = {
      'top-left': {
        top: 0,
        left: 0,
        borderTopWidth: `${cornerSize}px`,
        borderRightWidth: `${cornerSize}px`,
        borderTopColor: cornerColor,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
      },
      'top-right': {
        top: 0,
        right: 0,
        borderTopWidth: `${cornerSize}px`,
        borderLeftWidth: `${cornerSize}px`,
        borderTopColor: cornerColor,
        borderLeftColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: 'transparent',
      },
      'bottom-left': {
        bottom: 0,
        left: 0,
        borderBottomWidth: `${cornerSize}px`,
        borderRightWidth: `${cornerSize}px`,
        borderBottomColor: cornerColor,
        borderRightColor: 'transparent',
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
      },
      'bottom-right': {
        bottom: 0,
        right: 0,
        borderBottomWidth: `${cornerSize}px`,
        borderLeftWidth: `${cornerSize}px`,
        borderBottomColor: cornerColor,
        borderLeftColor: 'transparent',
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
      },
    };
    
    return (
      <div 
        className="flip-card-corner-border"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderStyle: 'solid',
          zIndex: 10,
          pointerEvents: 'none',
          ...cornerStyles[cornerPosition],
        }}
      />
    );
  };

  return (
    <div 
      className={`flip-card ${flipClass} ${flippedClass} ${hoverClass} ${designClass}`}
      style={{ height: `${height}px` }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
    >
      {renderCornerBorder()}
      <div className="flip-card-inner">
        {/* FRONT SIDE */}
        <div 
          className="flip-card-front"
          style={{
            backgroundImage: item.frontImage ? `url(${item.frontImage})` : undefined,
            backgroundColor: !item.frontImage ? '#374151' : undefined,
          }}
        >
          {/* Overlay */}
          {item.frontOverlay !== false && item.frontImage && (
            <div 
              className="flip-card-overlay"
              style={{ backgroundColor: `rgba(0, 0, 0, ${frontOverlayOpacity})` }}
            />
          )}
          {/* Content */}
          <div className="flip-card-content">
            {item.frontTitle && (
              <h3 
                className="flip-card-title"
                style={{ color: item.frontTitleColor || '#ffffff' }}
              >
                {item.frontTitle}
              </h3>
            )}
            {item.frontSubtitle && (
              <span 
                className="flip-card-subtitle"
                style={{ color: item.frontSubtitleColor || 'rgba(255,255,255,0.8)' }}
              >
                {item.frontSubtitle}
              </span>
            )}
            {/* Front Styled Texts */}
            {(item.frontStyledTexts || []).length > 0 && (
              <div className="flip-card-styled-texts mt-2">
                {(item.frontStyledTexts || []).map((st, stIdx) => (
                  <StyledText key={stIdx} element={st} />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* BACK SIDE */}
        <div 
          className={`flip-card-back ${item.backImage ? 'has-back-image' : ''}`}
          style={{
            ...(item.backImage ? {
              backgroundImage: `url(${item.backImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            } : {
              background: backBg,
            }),
            color: item.backTextColor || '#ffffff',
          }}
        >
          {/* Back Image Overlay */}
          {item.backImage && item.backImageOverlay !== false && (
            <div 
              className="flip-card-overlay"
              style={{ 
                backgroundColor: `rgba(0, 0, 0, ${(item.backImageOverlayOpacity ?? 40) / 100})`,
                background: item.backBgGradient ? `${item.backBgGradient.replace('100%)', `${(item.backImageOverlayOpacity ?? 40)}%)`)}` : undefined,
              }}
            />
          )}
          {/* Color overlay for non-image backgrounds */}
          {!item.backImage && (
            <div 
              className="flip-card-back-bg"
              style={{ 
                position: 'absolute',
                inset: 0,
                background: backBg,
                zIndex: 0,
              }}
            />
          )}
          <div className="flip-card-content" style={{ position: 'relative', zIndex: 1 }}>
            {item.backTitle && (
              <h3 className="flip-card-back-title">{item.backTitle}</h3>
            )}
            {item.backDescription && (
              <p className="flip-card-back-description">{item.backDescription}</p>
            )}
            {/* Back Styled Texts */}
            {(item.backStyledTexts || []).length > 0 && (
              <div className="flip-card-styled-texts mt-2">
                {(item.backStyledTexts || []).map((st, stIdx) => (
                  <StyledText key={stIdx} element={st} />
                ))}
              </div>
            )}
            {item.backButtonText && item.backButtonUrl && (
              <Link
                to={item.backButtonUrl}
                className="flip-card-button"
                style={{
                  backgroundColor: item.backButtonBg || '#ffffff',
                  color: item.backButtonColor || '#1e3a5f',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {item.backButtonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Styled Text Component ──────────────────────────────────────── */
function StyledText({ element }) {
  const {
    text = '',
    textStyle = 'simple',
    fontSize = 16,
    fontWeight = 'normal',
    textColor = '#ffffff',
    gradientFrom = '#00c2ff',
    gradientTo = '#00fdcf',
    glowColor = '#00c2ff',
    textAlign = 'left',
    wrapMode = 'wrap',
    marginBottom = 0,
  } = element;

  // Don't render if no text
  if (!text) return null;

  // Font weight class
  const fontWeightClass = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
    'extrabold': 'font-extrabold',
  }[fontWeight] || 'font-normal';

  // Text align class
  const textAlignClass = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
  }[textAlign] || 'text-left';

  // White space based on wrap mode
  const whiteSpace = {
    'wrap': 'normal',
    'nowrap': 'nowrap',
    'preserve': 'pre-wrap',
  }[wrapMode] || 'normal';

  // Base style
  const baseStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: 1.2,
    textAlign,
    whiteSpace,
    marginBottom: `${marginBottom}px`,
  };

  // Style-specific rendering
  switch (textStyle) {
    case 'gradient':
      return (
        <div
          className={`styled-text styled-text-gradient ${fontWeightClass} ${textAlignClass}`}
          style={{
            ...baseStyle,
            backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {text}
        </div>
      );

    case 'aurora':
      return (
        <div
          className={`styled-text styled-text-aurora ${fontWeightClass} ${textAlignClass}`}
          style={{
            ...baseStyle,
            '--aurora-color-1': gradientFrom,
            '--aurora-color-2': gradientTo,
          }}
        >
          {text}
          <div className="aurora-overlay">
            <div className="aurora-item" style={{ backgroundColor: gradientFrom }} />
            <div className="aurora-item" style={{ backgroundColor: gradientTo }} />
            <div className="aurora-item" style={{ backgroundColor: gradientFrom }} />
          </div>
        </div>
      );

    case 'glow':
      return (
        <div
          className={`styled-text styled-text-glow ${fontWeightClass} ${textAlignClass}`}
          style={{
            ...baseStyle,
            color: textColor,
            textShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 30px ${glowColor}, 0 0 40px ${glowColor}`,
          }}
        >
          {text}
        </div>
      );

    case 'outline':
      return (
        <div
          className={`styled-text styled-text-outline ${fontWeightClass} ${textAlignClass}`}
          style={{
            ...baseStyle,
            color: 'transparent',
            WebkitTextStroke: `2px ${glowColor}`,
          }}
        >
          {text}
        </div>
      );

    case 'shadow3d':
      return (
        <div
          className={`styled-text styled-text-shadow3d ${fontWeightClass} ${textAlignClass}`}
          style={{
            ...baseStyle,
            color: textColor,
            textShadow: `
              1px 1px 0 rgba(0,0,0,0.2),
              2px 2px 0 rgba(0,0,0,0.2),
              3px 3px 0 rgba(0,0,0,0.2),
              4px 4px 0 rgba(0,0,0,0.15),
              5px 5px 0 rgba(0,0,0,0.1),
              6px 6px 10px rgba(0,0,0,0.3)
            `,
          }}
        >
          {text}
        </div>
      );

    case 'sliced':
      return (
        <div
          className={`styled-text styled-text-sliced ${fontWeightClass} ${textAlignClass}`}
          style={baseStyle}
        >
          <span className="sliced-top" style={{ color: textColor }}>{text}</span>
          <span className="sliced-bottom" style={{ 
            background: `linear-gradient(177deg, transparent 53%, ${textColor} 65%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>{text}</span>
        </div>
      );

    case 'dual':
      return (
        <div
          className={`styled-text styled-text-dual ${fontWeightClass} ${textAlignClass}`}
          style={baseStyle}
        >
          <span style={{ color: gradientFrom }}>{text.substring(0, Math.ceil(text.length / 2))}</span>
          <span style={{ color: gradientTo }}>{text.substring(Math.ceil(text.length / 2))}</span>
        </div>
      );

    case 'blur':
      return (
        <div
          className={`styled-text styled-text-blur ${fontWeightClass} ${textAlignClass}`}
          style={{
            ...baseStyle,
            color: textColor,
          }}
        >
          <span className="blur-text">{text}</span>
          <span className="blur-mask">{text}</span>
        </div>
      );

    default: // simple
      return (
        <div
          className={`styled-text styled-text-simple ${fontWeightClass} ${textAlignClass}`}
          style={{
            ...baseStyle,
            color: textColor,
          }}
        >
          {text}
        </div>
      );
  }
}

/* ── Text Cards Block ────────────────────────────────────────────── */
function TextCardsBlock({ data }) {
  const cols = data.columns || 2;
  const gap = data.gap || 24;
  
  const gridClass = {
    1: 'grid-cols-1 max-w-2xl mx-auto',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'grid-cols-1 md:grid-cols-2';

  return (
    <div className={`grid ${gridClass}`} style={{ gap: `${gap}px` }}>
      {(data.items || []).map((card, i) => (
        <div
          key={i}
          className="text-card"
          style={{
            background: card.bgGradient || card.bgColor || '#1e3a5f',
            borderRadius: `${card.borderRadius || 12}px`,
            padding: `${card.padding || 32}px`,
            minHeight: `${card.minHeight || 200}px`,
          }}
        >
          {(card.elements || []).map((element, j) => (
            <StyledText key={j} element={element} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Counter / Statistics ─────────────────────────────────────── */
function CounterBlock({ data }) {
  const cols = data.columns || 3;
  const gridClass = cols === 2 ? 'grid-cols-2' :
                    cols === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' :
                    'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {(data.items || []).map((item, i) => (
        <CounterItem key={i} item={item} data={data} />
      ))}
    </div>
  );
}

/* ── Counter Item with animation ─────────────────────────────── */
function CounterItem({ item, data }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const targetNumber = parseInt(item.number) || 0;
  const duration = data.duration || 2000;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCounter();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateCounter = () => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * targetNumber));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(targetNumber);
      }
    };
    animate();
  };

  // Use item-specific colors, or fall back to block defaults
  const iconColor = item.iconColor || data.defaultIconColor || '#3b82f6';
  const numberColor = item.numberColor || data.defaultNumberColor || '#111827';
  const labelColor = item.labelColor || data.defaultLabelColor || '#6b7280';
  const bgColor = item.bgColor || data.defaultBgColor || 'transparent';

  return (
    <div 
      ref={ref}
      className="text-center p-6 rounded-xl transition-all duration-300 hover:shadow-lg" 
      style={{ backgroundColor: bgColor }}
    >
      {/* Icon */}
      {item.icon && (
        <div className="mb-4">
          {item.icon.startsWith('/') || item.icon.startsWith('http') ? (
            <img src={item.icon} alt="" className="w-14 h-14 mx-auto object-contain" />
          ) : item.icon.startsWith('<svg') ? (
            <div 
              className="w-14 h-14 mx-auto flex items-center justify-center"
              style={{ color: iconColor }}
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />
          ) : (
            <div className="text-5xl" style={{ color: iconColor }}>{item.icon}</div>
          )}
        </div>
      )}
      
      {/* Counter Number */}
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 break-words" style={{ color: numberColor }}>
        {item.prefix || ''}{count}{item.suffix || ''}
      </div>
      
      {/* Label */}
      <p className="text-xs sm:text-sm font-medium leading-tight break-words hyphens-auto" style={{ color: labelColor }}>
        {item.label}
      </p>
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
