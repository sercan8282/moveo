import { useSortable, SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState, useRef, useCallback } from 'react';

/* ============================================================================
   SortableColumn - Draggable column within a row
   ============================================================================ */
function SortableColumn({ id, width, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: `${(width / 12) * 100}%`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-dashed rounded-lg p-2 min-h-[60px] transition-all relative group/col ${
        isDragging ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Drag handle for column */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-100 border border-gray-300 rounded px-2 py-0.5 cursor-grab opacity-0 group-hover/col:opacity-100 transition-opacity z-10 flex items-center gap-1"
        title="Sleep om kolom te verplaatsen"
      >
        <span className="text-[10px] text-gray-500">⋮⋮</span>
        <span className="text-[10px] text-gray-500">{Math.round((width / 12) * 100)}%</span>
      </div>
      {children}
    </div>
  );
}

/* ============================================================================
   OverlapDragger - Visual drag interface for overlap positioning
   ============================================================================ */
function OverlapDragger({ value, onChange, isOverlay }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(value || 0);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value || 0;
    
    const handleMouseMove = (e) => {
      const delta = startY.current - e.clientY; // Moving up = positive delta
      const newValue = Math.round(startValue.current - delta); // Subtract because negative = overlap up
      setDragValue(Math.max(-200, Math.min(100, newValue)));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      onChange(dragValue);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [value, onChange, dragValue]);

  // Update dragValue when value prop changes
  if (!isDragging && dragValue !== (value || 0)) {
    setDragValue(value || 0);
  }

  const displayValue = isDragging ? dragValue : (value || 0);
  const isNegative = displayValue < 0;
  
  return (
    <div className="space-y-2">
      {/* Visual preview */}
      <div 
        ref={containerRef}
        className="relative h-24 bg-gradient-to-b from-gray-100 to-gray-50 rounded-lg border border-gray-200 overflow-hidden"
      >
        {/* Previous row indicator */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gray-300 rounded-t flex items-center justify-center">
          <span className="text-[10px] text-gray-600">Vorige rij</span>
        </div>
        
        {/* Current row (draggable) */}
        <div 
          className={`absolute left-2 right-2 h-10 bg-blue-500 rounded cursor-ns-resize transition-all ${isDragging ? 'ring-2 ring-blue-300 shadow-lg' : 'hover:bg-blue-600'}`}
          style={{ 
            top: `${32 + Math.max(-24, displayValue / 4)}px`,
            zIndex: isOverlay ? 10 : 1,
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-center h-full text-white text-xs font-medium">
            <span className="mr-1">↕</span>
            {displayValue}px
          </div>
        </div>

        {/* Overlap indicator line */}
        {isNegative && (
          <div 
            className="absolute left-0 right-0 border-t-2 border-dashed border-orange-400"
            style={{ top: '32px' }}
          />
        )}
      </div>

      {/* Value display and quick buttons */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(-80)}
            className={`px-2 py-1 text-xs rounded ${displayValue === -80 ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            -80
          </button>
          <button
            type="button"
            onClick={() => onChange(-40)}
            className={`px-2 py-1 text-xs rounded ${displayValue === -40 ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            -40
          </button>
          <button
            type="button"
            onClick={() => onChange(0)}
            className={`px-2 py-1 text-xs rounded ${displayValue === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            0
          </button>
        </div>
        <input
          type="number"
          value={displayValue}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-16 px-2 py-1 border rounded text-xs text-center"
        />
        <span className="text-xs text-gray-400">px</span>
      </div>
      <p className="text-[10px] text-gray-400">Sleep de blauwe balk of kies een snelle waarde</p>
    </div>
  );
}

export default function SortableRow({
  row, rowIndex, totalRows,
  onMoveRow, onDuplicateRow, onDeleteRow, onChangeLayout, onUpdateSettings,
  onAddBlock, onEditBlock, onDeleteBlock, onMoveBlock, onDuplicateBlock,
  onReorderColumns,
  editingBlockId, columnLayouts
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  
  // Column sensors - smaller activation distance
  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  
  // Handle column reorder
  const handleColumnDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = row.columns.findIndex(c => c.id === active.id);
    const newIndex = row.columns.findIndex(c => c.id === over.id);
    
    if (oldIndex >= 0 && newIndex >= 0 && onReorderColumns) {
      onReorderColumns(row.id, arrayMove(row.columns, oldIndex, newIndex));
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getBlockLabel = (type) => {
    const labels = {
      text: '📝 Tekst', image: '🖼️ Afbeelding', carousel: '🎠 Carousel',
      video: '🎬 Video', contactForm: '📋 Formulier', googleMap: '📍 Maps',
      button: '🔘 Knop', spacer: '↕️ Ruimte', divider: '➖ Lijn',
      html: '💻 HTML', hero: '🎯 Hero', cards: '🃏 Kaarten',
      testimonial: '💬 Quote', accordion: '📂 FAQ', counter: '📊 Teller',
      iconBox: '⭐ Icoon Box'
    };
    return labels[type] || type;
  };

  const getBlockPreview = (block) => {
    switch (block.type) {
      case 'text':
        const textPreview = (block.data.html || '').replace(/<[^>]*>/g, '').substring(0, 80);
        return textPreview || 'Lege tekst...';
      case 'image':
        return block.data.src ? '📷 Afbeelding geselecteerd' : 'Geen afbeelding';
      case 'video':
        return block.data.url || 'Geen video URL';
      case 'button':
        return block.data.text || 'Knop';
      case 'hero':
        return block.data.title || 'Hero banner';
      case 'carousel':
        return `${block.data.images?.length || 0} afbeelding(en)`;
      case 'googleMap':
        return block.data.address || 'Geen adres';
      case 'cards':
        return `${block.data.items?.length || 0} kaart(en)`;
      case 'accordion':
        return `${block.data.items?.length || 0} item(s)`;
      case 'counter':
        return `${block.data.items?.length || 0} teller(s)`;
      case 'spacer':
        return `${block.data.height || 40}px`;
      default:
        return '';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3 group">
      <div className={`border rounded-xl transition-all ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
        {/* Row Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 px-1"
            title="Sleep om te verplaatsen"
          >
            ⠿
          </button>

          <span className="text-xs font-medium text-gray-500">Rij {rowIndex + 1}</span>
          <span className="text-xs text-gray-400">
            ({row.columns.length} {row.columns.length === 1 ? 'kolom' : 'kolommen'})
          </span>

          <div className="flex-1" />

          {/* Row controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => onMoveRow(row.id, 'up')} disabled={rowIndex === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Omhoog">▲</button>
            <button type="button" onClick={() => onMoveRow(row.id, 'down')} disabled={rowIndex === totalRows - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Omlaag">▼</button>
            <button type="button" onClick={() => setShowLayoutPicker(!showLayoutPicker)}
              className="p-1 text-gray-400 hover:text-blue-600" title="Indeling wijzigen">⊞</button>
            <button type="button" onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-gray-400 hover:text-blue-600" title="Instellingen">⚙</button>
            <button type="button" onClick={() => onDuplicateRow(row.id)}
              className="p-1 text-gray-400 hover:text-blue-600" title="Dupliceren">⊕</button>
            <button type="button" onClick={() => { if (confirm('Rij verwijderen?')) onDeleteRow(row.id); }}
              className="p-1 text-gray-400 hover:text-red-600" title="Verwijderen">🗑</button>
          </div>
        </div>

        {/* Layout Picker */}
        {showLayoutPicker && (
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex gap-2 flex-wrap">
              {columnLayouts.map((layout, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { onChangeLayout(row.id, layout.cols); setShowLayoutPicker(false); }}
                  className={`p-2 border rounded-lg text-xs flex items-center gap-1 transition-all ${
                    JSON.stringify(row.columns.map(c => c.width)) === JSON.stringify(layout.cols) 
                      ? 'border-blue-400 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="flex gap-0.5">
                    {layout.cols.map((w, j) => (
                      <span key={j} className="h-4 bg-blue-300 rounded-sm inline-block" style={{ width: w * 3 }} />
                    ))}
                  </span>
                  <span className="ml-1">{layout.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row Settings */}
        {showSettings && (
          <div className="px-3 py-3 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={row.settings.fullWidth || false}
                  onChange={e => onUpdateSettings(row.id, { fullWidth: e.target.checked })} />
                <span className="text-gray-700">Volledige breedte</span>
              </label>
              <div>
                <label className="text-xs text-gray-500">Achtergrondkleur</label>
                <input type="color" value={row.settings.backgroundColor || '#ffffff'}
                  onChange={e => onUpdateSettings(row.id, { backgroundColor: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Padding boven (px)</label>
                <input type="number" value={row.settings.paddingTop || 0}
                  onChange={e => onUpdateSettings(row.id, { paddingTop: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Padding onder (px)</label>
                <input type="number" value={row.settings.paddingBottom || 0}
                  onChange={e => onUpdateSettings(row.id, { paddingBottom: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm" />
              </div>
            </div>
            
            {/* Responsive Settings */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">📱 Responsieve Layout</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs text-gray-500">Mobiel gedrag</label>
                  <select 
                    value={row.settings.mobileLayout || 'stack'}
                    onChange={e => onUpdateSettings(row.id, { mobileLayout: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="stack">Stapelen (verticaal)</option>
                    <option value="stack-reverse">Stapelen (omgekeerd)</option>
                    <option value="keep">Kolommen behouden</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Tablet gedrag</label>
                  <select 
                    value={row.settings.tabletLayout || 'stack'}
                    onChange={e => onUpdateSettings(row.id, { tabletLayout: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="stack">Stapelen (verticaal)</option>
                    <option value="stack-reverse">Stapelen (omgekeerd)</option>
                    <option value="keep">Kolommen behouden</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Kolom volgorde mobiel</label>
                  <select 
                    value={row.settings.mobileOrder || 'default'}
                    onChange={e => onUpdateSettings(row.id, { mobileOrder: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="default">Standaard volgorde</option>
                    <option value="image-first">Afbeelding eerst</option>
                    <option value="text-first">Tekst eerst</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Ruimte tussen kolommen</label>
                  <input type="number" value={row.settings.columnGap || 16}
                    onChange={e => onUpdateSettings(row.id, { columnGap: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border rounded text-sm" min="0" max="100" />
                </div>
              </div>
            </div>

            {/* Overlay Settings - Visual Drag Interface */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">📐 Overlay / Overlap</h4>
              
              {/* Overlay mode checkbox */}
              <label className="flex items-center gap-2 mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <input 
                  type="checkbox" 
                  checked={row.settings.isOverlay || false}
                  onChange={e => onUpdateSettings(row.id, { 
                    isOverlay: e.target.checked,
                    zIndex: e.target.checked ? 10 : 0 
                  })} 
                  className="w-4 h-4 text-orange-500"
                />
                <div>
                  <span className="text-sm font-medium text-orange-800">Overlay modus</span>
                  <p className="text-[10px] text-orange-600">Rij komt op voorgrond (boven andere elementen)</p>
                </div>
              </label>

              {/* Visual drag interface */}
              <OverlapDragger
                value={row.settings.overlapTop || 0}
                onChange={(val) => onUpdateSettings(row.id, { overlapTop: val })}
                isOverlay={row.settings.isOverlay}
              />
            </div>
          </div>
        )}

        {/* Columns - Sortable */}
        <DndContext sensors={columnSensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
          <SortableContext items={row.columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-2 p-3">
              {row.columns.map((col) => (
                <SortableColumn key={col.id} id={col.id} width={col.width}>
                  {/* Blocks in column */}
                  {col.blocks.map((block, blockIndex) => (
                    <div
                      key={block.id}
                      className={`mb-2 p-2 rounded-lg border text-sm cursor-pointer transition-all ${
                        editingBlockId === block.id 
                          ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => onEditBlock(col.id, block.id)}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium text-gray-600 truncate">
                          {getBlockLabel(block.type)}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveBlock(col.id, block.id, 'up'); }}
                            disabled={blockIndex === 0}
                            className="text-[10px] text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5">▲</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveBlock(col.id, block.id, 'down'); }}
                            disabled={blockIndex === col.blocks.length - 1}
                            className="text-[10px] text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5">▼</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicateBlock(col.id, block.id); }}
                            className="text-[10px] text-gray-400 hover:text-blue-600 p-0.5">⊕</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); if (confirm('Blok verwijderen?')) onDeleteBlock(col.id, block.id); }}
                            className="text-[10px] text-gray-400 hover:text-red-600 p-0.5">✕</button>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 truncate">{getBlockPreview(block)}</p>
                    </div>
                  ))}

                  {/* Add block button */}
                  <button
                    type="button"
                    onClick={() => onAddBlock(col.id)}
                    className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all text-xs flex items-center justify-center gap-1"
                  >
                    + Blok
                  </button>
                </SortableColumn>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
