/* ============================================================================
   Canvas Renderer - Renders canvas pages publicly
   Takes canvasElements array and canvasSettings and renders them as positioned elements
   ============================================================================ */

export default function CanvasRenderer({ elements = [], settings = {} }) {
  const canvasWidth = settings.width || 1200;
  const canvasHeight = settings.height || 800;
  const canvasBgColor = settings.bgColor || '#ffffff';

  // Render element content based on type
  const renderElementContent = (element) => {
    const { data, width, height } = element;
    
    switch (element.type) {
      case 'text':
        return (
          <div 
            className="w-full h-full overflow-hidden"
            style={{ fontSize: data?.fontSize || 16, color: data?.color || '#333' }}
            dangerouslySetInnerHTML={{ __html: data?.html || '' }}
          />
        );
      
      case 'heading':
        const HeadingTag = `h${data?.level || 2}`;
        return (
          <HeadingTag 
            className="w-full h-full flex items-center"
            style={{ 
              fontSize: data?.fontSize || 32, 
              fontWeight: data?.fontWeight || 'bold',
              color: data?.color || '#111',
              margin: 0,
            }}
          >
            {data?.text || ''}
          </HeadingTag>
        );
      
      case 'image':
        return data?.src ? (
          <img 
            src={data.src} 
            alt={data.alt || ''} 
            className="w-full h-full"
            style={{ 
              objectFit: data.objectFit || 'cover',
              borderRadius: data.borderRadius || 0,
            }}
          />
        ) : null;
      
      case 'button':
        return (
          <a 
            href={data?.url || '#'}
            className="w-full h-full flex items-center justify-center transition-all hover:opacity-90"
            style={{
              backgroundColor: data?.bgColor || '#3b82f6',
              color: data?.textColor || '#ffffff',
              borderRadius: data?.borderRadius || 8,
              fontSize: data?.fontSize || 16,
              fontWeight: data?.fontWeight || 'medium',
              textDecoration: 'none',
              display: 'flex',
            }}
          >
            {data?.text || 'Knop'}
          </a>
        );
      
      case 'shape':
        const shapeStyle = {
          width: '100%',
          height: '100%',
          backgroundColor: data?.bgColor || '#3b82f6',
          borderColor: data?.borderColor || 'transparent',
          borderWidth: data?.borderWidth || 0,
          borderStyle: 'solid',
          opacity: (data?.opacity || 100) / 100,
        };
        
        if (data?.shapeType === 'circle') {
          shapeStyle.borderRadius = '50%';
        } else if (data?.shapeType === 'rectangle') {
          shapeStyle.borderRadius = data?.borderRadius || 0;
        }
        
        return <div style={shapeStyle} />;
      
      case 'icon':
        return (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ fontSize: data?.size || 48, color: data?.color || '#3b82f6' }}
          >
            {data?.icon || '⭐'}
          </div>
        );
      
      case 'video':
        if (!data?.url) return null;
        // YouTube embed
        if (data?.type === 'youtube') {
          const videoId = data.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
          if (videoId) {
            return (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}${data?.autoplay ? '?autoplay=1&mute=1' : ''}`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            );
          }
        }
        return <video src={data.url} className="w-full h-full object-cover" controls />;
      
      case 'divider':
        const isHorizontal = data?.direction !== 'vertical';
        return (
          <div 
            className={`${isHorizontal ? 'w-full' : 'h-full'}`}
            style={{
              [isHorizontal ? 'borderTopWidth' : 'borderLeftWidth']: data?.thickness || 2,
              borderStyle: data?.style || 'solid',
              borderColor: data?.color || '#e2e8f0',
              [isHorizontal ? 'marginTop' : 'marginLeft']: '50%',
            }}
          />
        );
      
      case 'container':
        const shadowClass = {
          'none': '',
          'sm': 'shadow-sm',
          'md': 'shadow-md',
          'lg': 'shadow-lg',
          'xl': 'shadow-xl',
        }[data?.shadow] || '';
        
        return (
          <div 
            className={`w-full h-full ${shadowClass}`}
            style={{
              backgroundColor: data?.bgColor || 'rgba(255,255,255,0.8)',
              borderColor: data?.borderColor || '#e2e8f0',
              borderWidth: data?.borderWidth || 1,
              borderStyle: 'solid',
              borderRadius: data?.borderRadius || 12,
              padding: data?.padding || 20,
            }}
          />
        );
      
      default:
        return null;
    }
  };

  if (!elements || elements.length === 0) {
    return null;
  }

  // Sort elements by zIndex for proper layering
  const sortedElements = [...elements]
    .filter(el => el.visible !== false)
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return (
    <div 
      className="canvas-page relative mx-auto"
      style={{
        width: '100%',
        maxWidth: canvasWidth,
        aspectRatio: `${canvasWidth} / ${canvasHeight}`,
        backgroundColor: canvasBgColor,
        overflow: 'hidden',
      }}
    >
      {/* Make canvas responsive */}
      <div className="canvas-viewport absolute inset-0">
        <div 
          className="canvas-content origin-top-left"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            position: 'relative',
            transform: `scale(var(--canvas-scale, 1))`,
          }}
        >
          {sortedElements.map(el => (
            <div
              key={el.id}
              className="canvas-element absolute"
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                zIndex: el.zIndex || 1,
              }}
            >
              {renderElementContent(el)}
            </div>
          ))}
        </div>
      </div>
      
      {/* CSS for responsive scaling */}
      <style>{`
        .canvas-page {
          container-type: inline-size;
        }
        .canvas-viewport {
          --canvas-scale: min(1, calc(100cqi / ${canvasWidth}));
        }
        .canvas-content {
          transform: scale(var(--canvas-scale));
        }
      `}</style>
    </div>
  );
}
