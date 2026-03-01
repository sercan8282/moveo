import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import RichTextEditor from '../RichTextEditor';
import MediaLibrary from '../MediaLibrary';

/* ============================================================================
   Canvas Builder - Free-form positioning editor
   Allows users to place elements anywhere on the canvas, resize, drag, etc.
   ============================================================================ */

const genId = () => crypto.randomUUID();

// Available element types for the canvas
const CANVAS_ELEMENT_TYPES = [
  { type: 'text', label: 'Tekst', icon: '📝', defaultSize: { w: 300, h: 100 } },
  { type: 'heading', label: 'Kop', icon: '🔠', defaultSize: { w: 400, h: 60 } },
  { type: 'image', label: 'Afbeelding', icon: '🖼️', defaultSize: { w: 300, h: 200 } },
  { type: 'button', label: 'Knop', icon: '🔘', defaultSize: { w: 150, h: 50 } },
  { type: 'shape', label: 'Vorm', icon: '⬜', defaultSize: { w: 150, h: 150 } },
  { type: 'icon', label: 'Icoon', icon: '⭐', defaultSize: { w: 60, h: 60 } },
  { type: 'video', label: 'Video', icon: '🎬', defaultSize: { w: 400, h: 225 } },
  { type: 'divider', label: 'Lijn', icon: '➖', defaultSize: { w: 300, h: 4 } },
  { type: 'container', label: 'Container', icon: '📦', defaultSize: { w: 400, h: 300 } },
];

// Default data for each element type
const getDefaultData = (type) => {
  switch (type) {
    case 'text':
      return { html: '<p>Typ hier...</p>', fontSize: 16, color: '#333333' };
    case 'heading':
      return { text: 'Koptekst', level: 2, fontSize: 32, fontWeight: 'bold', color: '#111111' };
    case 'image':
      return { src: '', alt: '', objectFit: 'cover', borderRadius: 8 };
    case 'button':
      return { 
        text: 'Klik hier', 
        url: '#', 
        bgColor: '#3b82f6', 
        textColor: '#ffffff',
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 'medium',
      };
    case 'shape':
      return { 
        shapeType: 'rectangle', // rectangle, circle, triangle
        bgColor: '#3b82f6', 
        borderColor: '', 
        borderWidth: 0,
        borderRadius: 0,
        opacity: 100,
      };
    case 'icon':
      return { 
        icon: '⭐', 
        size: 48, 
        color: '#3b82f6',
      };
    case 'video':
      return { url: '', type: 'youtube', autoplay: false };
    case 'divider':
      return { 
        style: 'solid', 
        color: '#e2e8f0', 
        thickness: 2,
        direction: 'horizontal',
      };
    case 'container':
      return { 
        bgColor: 'rgba(255,255,255,0.8)', 
        borderColor: '#e2e8f0', 
        borderWidth: 1,
        borderRadius: 12,
        padding: 20,
        shadow: 'md',
      };
    default:
      return {};
  }
};

// Create new canvas element
const createCanvasElement = (type, x = 100, y = 100) => {
  const elementType = CANVAS_ELEMENT_TYPES.find(et => et.type === type);
  const defaultSize = elementType?.defaultSize || { w: 200, h: 100 };
  
  return {
    id: genId(),
    type,
    x,
    y,
    width: defaultSize.w,
    height: defaultSize.h,
    rotation: 0,
    zIndex: 1,
    locked: false,
    visible: true,
    data: getDefaultData(type),
  };
};

/* ============================================================================
   Resize Handle Component - Draggable corners/edges for resizing
   ============================================================================ */
function ResizeHandle({ position, onResize }) {
  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onResize(e, position);
  };

  const positionStyles = {
    'top-left': { top: -6, left: -6, cursor: 'nwse-resize' },
    'top-right': { top: -6, right: -6, cursor: 'nesw-resize' },
    'bottom-left': { bottom: -6, left: -6, cursor: 'nesw-resize' },
    'bottom-right': { bottom: -6, right: -6, cursor: 'nwse-resize' },
    'top': { top: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    'bottom': { bottom: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    'left': { left: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
    'right': { right: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
  };

  return (
    <div
      className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm z-50 hover:bg-blue-100"
      style={positionStyles[position]}
      onMouseDown={handleMouseDown}
    />
  );
}

/* ============================================================================
   Canvas Element Component - Single draggable/resizable element
   ============================================================================ */
function CanvasElement({ 
  element, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete,
  onStartDrag,
  onStartResize,
  scale,
}) {
  const elementRef = useRef(null);

  const handleMouseDown = (e) => {
    if (element.locked) return;
    e.stopPropagation();
    onSelect(element.id);
    onStartDrag(e, element);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    // Could open inline editor here
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    // Could show context menu
  };

  // Render element content based on type
  const renderContent = () => {
    const { data, width, height } = element;
    
    switch (element.type) {
      case 'text':
        return (
          <div 
            className="w-full h-full overflow-auto"
            style={{ fontSize: data.fontSize || 16, color: data.color || '#333' }}
            dangerouslySetInnerHTML={{ __html: data.html || '<p>Tekst</p>' }}
          />
        );
      
      case 'heading':
        const HeadingTag = `h${data.level || 2}`;
        return (
          <HeadingTag 
            className="w-full h-full flex items-center"
            style={{ 
              fontSize: data.fontSize || 32, 
              fontWeight: data.fontWeight || 'bold',
              color: data.color || '#111',
            }}
          >
            {data.text || 'Koptekst'}
          </HeadingTag>
        );
      
      case 'image':
        return data.src ? (
          <img 
            src={data.src} 
            alt={data.alt || ''} 
            className="w-full h-full"
            style={{ 
              objectFit: data.objectFit || 'cover',
              borderRadius: data.borderRadius || 0,
            }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            <span className="text-2xl">🖼️</span>
          </div>
        );
      
      case 'button':
        return (
          <button 
            className="w-full h-full flex items-center justify-center transition-all hover:opacity-90"
            style={{
              backgroundColor: data.bgColor || '#3b82f6',
              color: data.textColor || '#ffffff',
              borderRadius: data.borderRadius || 8,
              fontSize: data.fontSize || 16,
              fontWeight: data.fontWeight || 'medium',
            }}
          >
            {data.text || 'Knop'}
          </button>
        );
      
      case 'shape':
        const shapeStyle = {
          width: '100%',
          height: '100%',
          backgroundColor: data.bgColor || '#3b82f6',
          borderColor: data.borderColor || 'transparent',
          borderWidth: data.borderWidth || 0,
          borderStyle: 'solid',
          opacity: (data.opacity || 100) / 100,
        };
        
        if (data.shapeType === 'circle') {
          shapeStyle.borderRadius = '50%';
        } else if (data.shapeType === 'rectangle') {
          shapeStyle.borderRadius = data.borderRadius || 0;
        }
        // Triangle would need CSS triangle technique
        
        return <div style={shapeStyle} />;
      
      case 'icon':
        return (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ fontSize: data.size || 48, color: data.color || '#3b82f6' }}
          >
            {data.icon || '⭐'}
          </div>
        );
      
      case 'divider':
        const isHorizontal = data.direction !== 'vertical';
        return (
          <div 
            className={`${isHorizontal ? 'w-full' : 'h-full'}`}
            style={{
              [isHorizontal ? 'borderTopWidth' : 'borderLeftWidth']: data.thickness || 2,
              borderStyle: data.style || 'solid',
              borderColor: data.color || '#e2e8f0',
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
        }[data.shadow] || '';
        
        return (
          <div 
            className={`w-full h-full ${shadowClass}`}
            style={{
              backgroundColor: data.bgColor || 'rgba(255,255,255,0.8)',
              borderColor: data.borderColor || '#e2e8f0',
              borderWidth: data.borderWidth || 1,
              borderStyle: 'solid',
              borderRadius: data.borderRadius || 12,
              padding: data.padding || 20,
            }}
          />
        );
      
      default:
        return <div className="w-full h-full bg-gray-200" />;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`absolute group ${element.locked ? 'cursor-not-allowed' : 'cursor-move'} ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${!element.visible ? 'opacity-30' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Element content */}
      <div className="w-full h-full overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Selection indicator + resize handles */}
      {isSelected && !element.locked && (
        <>
          {/* Corner handles */}
          <ResizeHandle position="top-left" onResize={onStartResize} />
          <ResizeHandle position="top-right" onResize={onStartResize} />
          <ResizeHandle position="bottom-left" onResize={onStartResize} />
          <ResizeHandle position="bottom-right" onResize={onStartResize} />
          {/* Edge handles */}
          <ResizeHandle position="top" onResize={onStartResize} />
          <ResizeHandle position="bottom" onResize={onStartResize} />
          <ResizeHandle position="left" onResize={onStartResize} />
          <ResizeHandle position="right" onResize={onStartResize} />
          
          {/* Quick actions */}
          <div className="absolute -top-8 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdate(element.id, { locked: true }); }}
              className="p-1 bg-white rounded shadow text-xs hover:bg-gray-100" 
              title="Vergrendelen"
            >
              🔒
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdate(element.id, { zIndex: element.zIndex + 1 }); }}
              className="p-1 bg-white rounded shadow text-xs hover:bg-gray-100" 
              title="Naar voren"
            >
              ⬆️
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdate(element.id, { zIndex: Math.max(0, element.zIndex - 1) }); }}
              className="p-1 bg-white rounded shadow text-xs hover:bg-gray-100" 
              title="Naar achteren"
            >
              ⬇️
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); if (confirm('Element verwijderen?')) onDelete(element.id); }}
              className="p-1 bg-white rounded shadow text-xs hover:bg-red-100 text-red-600" 
              title="Verwijderen"
            >
              🗑️
            </button>
          </div>
        </>
      )}
      
      {/* Lock indicator */}
      {element.locked && (
        <div 
          className="absolute -top-6 left-0 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onUpdate(element.id, { locked: false }); }}
          title="Klik om te ontgrendelen"
        >
          🔒 Vergrendeld
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Element Properties Panel - Edit selected element properties
   ============================================================================ */
function ElementPropertiesPanel({ element, onUpdate, onOpenMedia }) {
  if (!element) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-sm">Selecteer een element om de eigenschappen te bewerken</p>
      </div>
    );
  }

  const inputClass = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  const updateData = (field, value) => {
    onUpdate(element.id, { data: { ...element.data, [field]: value } });
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Position & Size */}
      <div className="p-3 bg-gray-50 rounded-lg space-y-2">
        <h4 className="text-xs font-semibold text-gray-700">📐 Positie & Grootte</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>X</label>
            <input 
              type="number" 
              value={Math.round(element.x)} 
              onChange={e => onUpdate(element.id, { x: parseInt(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Y</label>
            <input 
              type="number" 
              value={Math.round(element.y)} 
              onChange={e => onUpdate(element.id, { y: parseInt(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Breedte</label>
            <input 
              type="number" 
              value={Math.round(element.width)} 
              onChange={e => onUpdate(element.id, { width: parseInt(e.target.value) || 100 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Hoogte</label>
            <input 
              type="number" 
              value={Math.round(element.height)} 
              onChange={e => onUpdate(element.id, { height: parseInt(e.target.value) || 100 })}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Rotatie (°)</label>
            <input 
              type="number" 
              value={element.rotation || 0} 
              onChange={e => onUpdate(element.id, { rotation: parseInt(e.target.value) || 0 })}
              className={inputClass}
              min={-360}
              max={360}
            />
          </div>
          <div>
            <label className={labelClass}>Z-Index</label>
            <input 
              type="number" 
              value={element.zIndex || 1} 
              onChange={e => onUpdate(element.id, { zIndex: parseInt(e.target.value) || 1 })}
              className={inputClass}
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Type-specific properties */}
      {element.type === 'text' && (
        <div className="space-y-2">
          <label className={labelClass}>Tekst</label>
          <textarea
            value={element.data.html || ''}
            onChange={e => updateData('html', e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="<p>HTML tekst...</p>"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Tekstgrootte</label>
              <input 
                type="number" 
                value={element.data.fontSize || 16} 
                onChange={e => updateData('fontSize', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Kleur</label>
              <input 
                type="color" 
                value={element.data.color || '#333333'} 
                onChange={e => updateData('color', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {element.type === 'heading' && (
        <div className="space-y-2">
          <div>
            <label className={labelClass}>Tekst</label>
            <input 
              type="text"
              value={element.data.text || ''}
              onChange={e => updateData('text', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Niveau (H1-H6)</label>
              <select 
                value={element.data.level || 2} 
                onChange={e => updateData('level', parseInt(e.target.value))}
                className={inputClass}
              >
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>H{n}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Grootte</label>
              <input 
                type="number" 
                value={element.data.fontSize || 32} 
                onChange={e => updateData('fontSize', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Kleur</label>
            <input 
              type="color" 
              value={element.data.color || '#111111'} 
              onChange={e => updateData('color', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {element.type === 'image' && (
        <div className="space-y-2">
          {element.data.src ? (
            <div className="relative">
              <img src={element.data.src} alt="" className="w-full h-32 object-cover rounded" />
              <button 
                type="button" 
                onClick={() => updateData('src', '')}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
              >✕</button>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={() => onOpenMedia('canvas-image')}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400"
            >
              🖼️ Selecteer afbeelding
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Object fit</label>
              <select 
                value={element.data.objectFit || 'cover'} 
                onChange={e => updateData('objectFit', e.target.value)}
                className={inputClass}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Border radius</label>
              <input 
                type="number" 
                value={element.data.borderRadius || 0} 
                onChange={e => updateData('borderRadius', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {element.type === 'button' && (
        <div className="space-y-2">
          <div>
            <label className={labelClass}>Knoptekst</label>
            <input 
              type="text"
              value={element.data.text || ''}
              onChange={e => updateData('text', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Link URL</label>
            <input 
              type="text"
              value={element.data.url || '#'}
              onChange={e => updateData('url', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Achtergrondkleur</label>
              <input 
                type="color" 
                value={element.data.bgColor || '#3b82f6'} 
                onChange={e => updateData('bgColor', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className={labelClass}>Tekstkleur</label>
              <input 
                type="color" 
                value={element.data.textColor || '#ffffff'} 
                onChange={e => updateData('textColor', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Border radius</label>
            <input 
              type="number" 
              value={element.data.borderRadius || 8} 
              onChange={e => updateData('borderRadius', parseInt(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {element.type === 'shape' && (
        <div className="space-y-2">
          <div>
            <label className={labelClass}>Vorm type</label>
            <select 
              value={element.data.shapeType || 'rectangle'} 
              onChange={e => updateData('shapeType', e.target.value)}
              className={inputClass}
            >
              <option value="rectangle">Rechthoek</option>
              <option value="circle">Cirkel</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Achtergrondkleur</label>
              <input 
                type="color" 
                value={element.data.bgColor || '#3b82f6'} 
                onChange={e => updateData('bgColor', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className={labelClass}>Opacity (%)</label>
              <input 
                type="number" 
                value={element.data.opacity || 100} 
                onChange={e => updateData('opacity', parseInt(e.target.value))}
                className={inputClass}
                min={0}
                max={100}
              />
            </div>
          </div>
          {element.data.shapeType !== 'circle' && (
            <div>
              <label className={labelClass}>Border radius</label>
              <input 
                type="number" 
                value={element.data.borderRadius || 0} 
                onChange={e => updateData('borderRadius', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {element.type === 'container' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Achtergrondkleur</label>
              <input 
                type="color" 
                value={element.data.bgColor || '#ffffff'} 
                onChange={e => updateData('bgColor', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className={labelClass}>Randkleur</label>
              <input 
                type="color" 
                value={element.data.borderColor || '#e2e8f0'} 
                onChange={e => updateData('borderColor', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Border radius</label>
              <input 
                type="number" 
                value={element.data.borderRadius || 12} 
                onChange={e => updateData('borderRadius', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Padding</label>
              <input 
                type="number" 
                value={element.data.padding || 20} 
                onChange={e => updateData('padding', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Schaduw</label>
            <select 
              value={element.data.shadow || 'md'} 
              onChange={e => updateData('shadow', e.target.value)}
              className={inputClass}
            >
              <option value="none">Geen</option>
              <option value="sm">Klein</option>
              <option value="md">Medium</option>
              <option value="lg">Groot</option>
              <option value="xl">Extra groot</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Main Canvas Builder Component
   ============================================================================ */
export default function CanvasBuilder({ elements = [], onChange, canvasSettings = {}, onSettingsChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  // Canvas dimensions
  const canvasWidth = canvasSettings.width || 1200;
  const canvasHeight = canvasSettings.height || 800;
  const canvasBgColor = canvasSettings.bgColor || '#ffffff';

  const selectedElement = elements.find(el => el.id === selectedId);

  // Add new element
  const addElement = (type) => {
    const centerX = (canvasWidth / 2) - 100;
    const centerY = (canvasHeight / 2) - 50;
    const newElement = createCanvasElement(type, centerX, centerY);
    // Set zIndex to be on top
    newElement.zIndex = Math.max(...elements.map(e => e.zIndex || 0), 0) + 1;
    onChange([...elements, newElement]);
    setSelectedId(newElement.id);
    setShowAddMenu(false);
  };

  // Update element
  const updateElement = (id, updates) => {
    onChange(elements.map(el => {
      if (el.id !== id) return el;
      // Handle nested data updates
      if (updates.data) {
        return { ...el, ...updates, data: { ...el.data, ...updates.data } };
      }
      return { ...el, ...updates };
    }));
  };

  // Delete element
  const deleteElement = (id) => {
    onChange(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Duplicate element
  const duplicateElement = (id) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newEl = {
      ...JSON.parse(JSON.stringify(el)),
      id: genId(),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: Math.max(...elements.map(e => e.zIndex || 0), 0) + 1,
    };
    onChange([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  // Start dragging element
  const handleStartDrag = (e, element) => {
    if (element.locked) return;
    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      elementId: element.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: element.x,
      startY: element.y,
    };
    
    const handleMouseMove = (e) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startMouseX) / scale;
      const dy = (e.clientY - dragRef.current.startMouseY) / scale;
      updateElement(dragRef.current.elementId, {
        x: Math.max(0, Math.min(canvasWidth - 50, dragRef.current.startX + dx)),
        y: Math.max(0, Math.min(canvasHeight - 50, dragRef.current.startY + dy)),
      });
    };
    
    const handleMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Start resizing element
  const handleStartResize = (e, position) => {
    e.stopPropagation();
    if (!selectedElement || selectedElement.locked) return;
    
    resizeRef.current = {
      elementId: selectedElement.id,
      position,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: selectedElement.x,
      startY: selectedElement.y,
      startWidth: selectedElement.width,
      startHeight: selectedElement.height,
    };
    
    const handleMouseMove = (e) => {
      if (!resizeRef.current) return;
      const { position, startMouseX, startMouseY, startX, startY, startWidth, startHeight } = resizeRef.current;
      const dx = (e.clientX - startMouseX) / scale;
      const dy = (e.clientY - startMouseY) / scale;
      
      let newX = startX, newY = startY, newW = startWidth, newH = startHeight;
      
      // Handle different resize handles
      if (position.includes('right')) newW = Math.max(20, startWidth + dx);
      if (position.includes('left')) { newX = startX + dx; newW = Math.max(20, startWidth - dx); }
      if (position.includes('bottom')) newH = Math.max(20, startHeight + dy);
      if (position.includes('top')) { newY = startY + dy; newH = Math.max(20, startHeight - dy); }
      
      updateElement(resizeRef.current.elementId, { x: newX, y: newY, width: newW, height: newH });
    };
    
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle canvas click (deselect)
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-grid')) {
      setSelectedId(null);
    }
  };

  // Media selection handler
  const handleMediaSelect = (media) => {
    if (mediaTarget === 'canvas-image' && selectedElement) {
      const url = media.url || media.path;
      updateElement(selectedElement.id, { data: { ...selectedElement.data, src: url } });
    }
    setShowMedia(false);
    setMediaTarget(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        deleteElement(selectedId);
      }
      
      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateElement(selectedId);
      }
      
      // Arrow key movement
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const el = elements.find(e => e.id === selectedId);
        if (!el || el.locked) return;
        
        const updates = {};
        if (e.key === 'ArrowUp') updates.y = el.y - step;
        if (e.key === 'ArrowDown') updates.y = el.y + step;
        if (e.key === 'ArrowLeft') updates.x = el.x - step;
        if (e.key === 'ArrowRight') updates.x = el.x + step;
        
        updateElement(selectedId, updates);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements]);

  return (
    <div className="canvas-builder flex h-full bg-gray-100">
      {/* Left Sidebar - Elements */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
        <div className="text-xs font-semibold text-gray-500 mb-2">Elementen</div>
        {CANVAS_ELEMENT_TYPES.map(et => (
          <button
            key={et.type}
            onClick={() => addElement(et.type)}
            className="w-12 h-12 flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-colors group"
            title={et.label}
          >
            <span className="text-xl">{et.icon}</span>
            <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{et.label}</span>
          </button>
        ))}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setScale(Math.max(0.25, scale - 0.1))} 
              className="p-2 hover:bg-gray-100 rounded"
            >
              ➖
            </button>
            <span className="text-sm text-gray-600 w-16 text-center">{Math.round(scale * 100)}%</span>
            <button 
              onClick={() => setScale(Math.min(2, scale + 0.1))} 
              className="p-2 hover:bg-gray-100 rounded"
            >
              ➕
            </button>
            <button 
              onClick={() => setScale(1)} 
              className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
            >
              100%
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            Canvas: {canvasWidth} × {canvasHeight}
          </div>
          
          <div className="flex-1" />
          
          {selectedElement && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => duplicateElement(selectedId)}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                ⊕ Dupliceren
              </button>
              <button 
                onClick={() => { if (confirm('Verwijderen?')) deleteElement(selectedId); }}
                className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
              >
                🗑️ Verwijderen
              </button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div
            ref={canvasRef}
            className="canvas-workspace relative shadow-2xl"
            style={{
              width: canvasWidth * scale,
              height: canvasHeight * scale,
              backgroundColor: canvasBgColor,
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
              backgroundSize: `${20 * scale}px ${20 * scale}px`,
            }}
            onClick={handleCanvasClick}
          >
            {/* Scaled content container */}
            <div 
              className="canvas-content absolute inset-0 origin-top-left"
              style={{ transform: `scale(${scale})`, width: canvasWidth, height: canvasHeight }}
            >
              {elements.map(el => (
                <CanvasElement
                  key={el.id}
                  element={el}
                  isSelected={selectedId === el.id}
                  onSelect={setSelectedId}
                  onUpdate={updateElement}
                  onDelete={deleteElement}
                  onStartDrag={handleStartDrag}
                  onStartResize={handleStartResize}
                  scale={scale}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">
            {selectedElement ? (
              <>
                {CANVAS_ELEMENT_TYPES.find(et => et.type === selectedElement.type)?.icon} {' '}
                {CANVAS_ELEMENT_TYPES.find(et => et.type === selectedElement.type)?.label}
              </>
            ) : 'Eigenschappen'}
          </h3>
        </div>
        <ElementPropertiesPanel 
          element={selectedElement} 
          onUpdate={updateElement}
          onOpenMedia={(target) => { setMediaTarget(target); setShowMedia(true); }}
        />
      </div>

      {/* Media Library */}
      <MediaLibrary 
        isOpen={showMedia} 
        onClose={() => { setShowMedia(false); setMediaTarget(null); }} 
        onSelect={handleMediaSelect} 
      />
    </div>
  );
}

export { createCanvasElement, CANVAS_ELEMENT_TYPES };
