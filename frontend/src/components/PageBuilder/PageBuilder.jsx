import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableRow from './SortableRow';
import BlockEditor from './BlockEditor';

const genId = () => crypto.randomUUID();

const BLOCK_TYPES = [
  { type: 'text', label: 'Tekst', icon: '📝' },
  { type: 'styledText', label: 'Gestileerde Tekst', icon: '✨' },
  { type: 'image', label: 'Afbeelding', icon: '🖼️' },
  { type: 'imageCard', label: 'Afbeelding met Kaart', icon: '🎴' },
  { type: 'carousel', label: 'Carousel', icon: '🎠' },
  { type: 'video', label: 'Video', icon: '🎬' },
  { type: 'contactForm', label: 'Contactformulier', icon: '📋' },
  { type: 'googleMap', label: 'Google Maps', icon: '📍' },
  { type: 'button', label: 'Knop', icon: '🔘' },
  { type: 'spacer', label: 'Ruimte', icon: '↕️' },
  { type: 'divider', label: 'Scheidingslijn', icon: '➖' },
  { type: 'html', label: 'HTML Code', icon: '💻' },
  { type: 'hero', label: 'Hero Banner', icon: '🎯' },
  { type: 'heroBanner', label: 'Hero met Kaarten', icon: '🏆' },
  { type: 'cards', label: 'Kaarten', icon: '🃏' },
  { type: 'flipCards', label: 'Flip Kaarten', icon: '🔄' },
  { type: 'textCards', label: 'Tekst Kaarten', icon: '📐' },
  { type: 'testimonial', label: 'Testimonial', icon: '💬' },
  { type: 'accordion', label: 'Accordion/FAQ', icon: '📂' },
  { type: 'counter', label: 'Teller/Statistiek', icon: '📊' },
  { type: 'iconBox', label: 'Icoon Box', icon: '⭐' },
  { type: 'countdown', label: 'Countdown Timer', icon: '⏱️' },
];

const COLUMN_LAYOUTS = [
  { cols: [12], label: '1 kolom', icon: '▰' },
  { cols: [6, 6], label: '2 kolommen', icon: '▰▰' },
  { cols: [4, 4, 4], label: '3 kolommen', icon: '▰▰▰' },
  { cols: [3, 3, 3, 3], label: '4 kolommen', icon: '▰▰▰▰' },
  { cols: [8, 4], label: '2/3 + 1/3', icon: '▰▰ ▰' },
  { cols: [4, 8], label: '1/3 + 2/3', icon: '▰ ▰▰' },
  { cols: [3, 6, 3], label: '1/4 + 1/2 + 1/4', icon: '▰ ▰▰ ▰' },
  { cols: [3, 9], label: '1/4 + 3/4', icon: '▰ ▰▰▰' },
  { cols: [9, 3], label: '3/4 + 1/4', icon: '▰▰▰ ▰' },
];

function createBlock(type) {
  const defaults = {
    text: { html: '<p></p>' },
    styledText: {
      text: 'Gestileerde tekst',
      textStyle: 'gradient',
      fontSize: 64,
      fontWeight: 'bold',
      textColor: '#ffffff',
      gradientFrom: '#00c2ff',
      gradientTo: '#00fdcf',
      glowColor: '#00c2ff',
      outlineColor: '#ffffff',
      textAlign: 'center',
      backgroundColor: '',
      backgroundGradient: '',
      padding: 24,
      marginTop: 0,
      marginBottom: 0,
    },
    image: { src: '', alt: '', caption: '', objectFit: 'cover' },
    imageCard: { 
      image: '', 
      imageAlt: '',
      // Card position: 'bottom-right', 'bottom-left', 'bottom-center', 'top-right', 'top-left', 'top-center'
      cardPosition: 'bottom-right',
      // Card content
      icon: '',
      title: '',
      subtitle: '',
      // Icon position relative to text: 'left', 'right', 'top', 'bottom'
      iconPosition: 'left',
      // Colors
      iconColor: '#3b82f6',
      titleColor: '#111827',
      subtitleColor: '#6b7280',
      cardBgColor: '#ffffff',
      // Border
      borderColor: '#3b82f6',
      borderWidth: 4,
      borderSide: 'right', // 'all', 'left', 'right', 'top', 'bottom', 'none'
    },
    carousel: { images: [], autoplay: true, interval: 5000, showDots: true, showArrows: true },
    video: { url: '', type: 'youtube', autoplay: false },
    contactForm: {},
    googleMap: { address: '', height: '400px' },
    button: { text: 'Klik hier', url: '#', style: 'primary', size: 'medium', target: '_self', fullWidth: false },
    spacer: { height: 40 },
    divider: { style: 'solid', color: '#e2e8f0' },
    html: { code: '' },
    hero: { 
      title: '', 
      subtitle: '', 
      backgroundImage: '', 
      overlay: true, 
      height: '400px', 
      alignment: 'center',
      // Hero columns system
      useHeroColumns: false,
      heroLayout: [12], // single column by default
      heroColumns: [{ id: 'hc1', width: 12, blocks: [] }],
    },
    heroBanner: { 
      title: '', 
      subtitle: '', 
      titleHtml: '',
      subtitleHtml: '',
      backgroundImage: '', 
      backgroundColor: '#1e3a5f',
      overlay: true, 
      overlayOpacity: 50,
      height: '500px', 
      contentPosition: 'center-center',
      cardCount: 3,
      cardsPosition: 'inline',
      defaultCardEffect: 'none',
      styledTexts: [], // Styled text elements
      cards: [
        { icon: '', counter: '', suffix: '', title: '', subtitle: '', effect: '', bgColor: '#ffffff', iconColor: '#3b82f6', counterColor: '#111827', titleColor: '#111827', subtitleColor: '#6b7280', borderColor: '' },
        { icon: '', counter: '', suffix: '', title: '', subtitle: '', effect: '', bgColor: '#ffffff', iconColor: '#3b82f6', counterColor: '#111827', titleColor: '#111827', subtitleColor: '#6b7280', borderColor: '' },
        { icon: '', counter: '', suffix: '', title: '', subtitle: '', effect: '', bgColor: '#ffffff', iconColor: '#3b82f6', counterColor: '#111827', titleColor: '#111827', subtitleColor: '#6b7280', borderColor: '' },
      ],
    },
    cards: { items: [{ title: '', description: '', image: '', link: '' }], columns: 3 },
    flipCards: {
      columns: 3,
      cardHeight: 320,
      flipDirection: 'horizontal', // horizontal, vertical
      flipTrigger: 'hover', // hover, click
      items: [
        {
          // Front side
          frontImage: '',
          frontTitle: '',
          frontSubtitle: '',
          frontOverlay: true,
          frontOverlayOpacity: 60,
          frontTitleColor: '#ffffff',
          frontSubtitleColor: 'rgba(255,255,255,0.8)',
          // Back side
          backTitle: '',
          backDescription: '',
          backButtonText: '',
          backButtonUrl: '',
          backBgColor: '#1e3a5f',
          backBgGradient: '',
          backTextColor: '#ffffff',
          backButtonBg: '#ffffff',
          backButtonColor: '#1e3a5f',
        }
      ]
    },
    textCards: {
      columns: 2,
      gap: 24,
      items: [
        {
          // Card styling
          bgColor: '#1e3a5f',
          bgGradient: '',
          borderRadius: 12,
          padding: 32,
          minHeight: 200,
          // Text elements within the card
          elements: [
            {
              text: 'Titel',
              textStyle: 'simple',
              fontSize: 32,
              fontWeight: 'bold',
              textColor: '#ffffff',
              gradientFrom: '#00c2ff',
              gradientTo: '#00fdcf',
              glowColor: '#00c2ff',
              textAlign: 'left',
              wrapMode: 'wrap', // wrap, nowrap, preserve
              marginBottom: 16,
            }
          ]
        }
      ]
    },
    testimonial: { quote: '', author: '', role: '', avatar: '' },
    accordion: { items: [{ title: '', content: '' }], allowMultiple: false },
    counter: { items: [{ number: 0, suffix: '', label: '' }], columns: 4 },
    iconBox: { items: [{ icon: '⭐', title: '', description: '' }], columns: 3, style: 'default' },
    countdown: {
      targetDate: '',
      targetTime: '00:00',
      title: 'Countdown',
      subtitle: '',
      style: 'cards', // cards, flip, minimal, circular
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      // Colors
      bgColor: '#1e3a5f',
      textColor: '#ffffff',
      numberColor: '#ffffff',
      labelColor: 'rgba(255,255,255,0.7)',
      accentColor: '#3b82f6',
      // Card style specific
      cardBg: 'rgba(255,255,255,0.1)',
      cardBorder: 'rgba(255,255,255,0.2)',
      // Labels
      daysLabel: 'Dagen',
      hoursLabel: 'Uren',
      minutesLabel: 'Minuten',
      secondsLabel: 'Seconden',
      // Expired message
      expiredTitle: 'De tijd is verstreken!',
      expiredMessage: '',
      hideWhenExpired: false,
    },
  };

  return {
    id: genId(),
    type,
    data: defaults[type] || {},
    settings: { padding: 0, margin: 0, backgroundColor: '', textColor: '' }
  };
}

function createRow(cols = [12]) {
  return {
    id: genId(),
    columns: cols.map(width => ({
      id: genId(),
      width,
      blocks: []
    })),
    settings: {
      fullWidth: false,
      backgroundColor: '',
      backgroundImage: '',
      paddingTop: 20,
      paddingBottom: 20,
      marginTop: 0,
      marginBottom: 0
    }
  };
}

export default function PageBuilder({ rows, onChange, onSave }) {
  const [activeRow, setActiveRow] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(null); // { rowId, colId }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ROW OPERATIONS
  const addRow = (layout) => {
    onChange([...rows, createRow(layout)]);
    setShowAddRow(false);
  };

  const duplicateRow = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const newRow = JSON.parse(JSON.stringify(row));
    newRow.id = genId();
    newRow.columns.forEach(col => {
      col.id = genId();
      col.blocks.forEach(b => { b.id = genId(); });
    });
    const idx = rows.findIndex(r => r.id === rowId);
    const newRows = [...rows];
    newRows.splice(idx + 1, 0, newRow);
    onChange(newRows);
  };

  const deleteRow = (rowId) => {
    onChange(rows.filter(r => r.id !== rowId));
  };

  const changeRowLayout = (rowId, newLayout) => {
    onChange(rows.map(row => {
      if (row.id !== rowId) return row;
      const currentBlocks = row.columns.flatMap(c => c.blocks);
      const newColumns = newLayout.map((width, i) => ({
        id: genId(),
        width,
        blocks: i === 0 ? currentBlocks : []
      }));
      return { ...row, columns: newColumns };
    }));
  };

  const reorderColumns = (rowId, newColumns) => {
    onChange(rows.map(row => {
      if (row.id !== rowId) return row;
      return { ...row, columns: newColumns };
    }));
  };

  const updateRowSettings = (rowId, settings) => {
    onChange(rows.map(r => r.id === rowId ? { ...r, settings: { ...r.settings, ...settings } } : r));
  };

  const moveRow = (rowId, direction) => {
    const idx = rows.findIndex(r => r.id === rowId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= rows.length) return;
    const newRows = [...rows];
    [newRows[idx], newRows[newIdx]] = [newRows[newIdx], newRows[idx]];
    onChange(newRows);
  };

  // BLOCK OPERATIONS
  const addBlock = (rowId, colId, blockType) => {
    const block = createBlock(blockType);
    onChange(rows.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        columns: row.columns.map(col => {
          if (col.id !== colId) return col;
          return { ...col, blocks: [...col.blocks, block] };
        })
      };
    }));
    setShowAddBlock(null);
    setEditingBlock({ rowId, colId, blockId: block.id });
  };

  const updateBlock = (rowId, colId, blockId, data) => {
    onChange(rows.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        columns: row.columns.map(col => {
          if (col.id !== colId) return col;
          return {
            ...col,
            blocks: col.blocks.map(b => b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b)
          };
        })
      };
    }));
  };

  const deleteBlock = (rowId, colId, blockId) => {
    onChange(rows.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        columns: row.columns.map(col => {
          if (col.id !== colId) return col;
          return { ...col, blocks: col.blocks.filter(b => b.id !== blockId) };
        })
      };
    }));
    if (editingBlock?.blockId === blockId) setEditingBlock(null);
  };

  const moveBlock = (rowId, colId, blockId, direction) => {
    onChange(rows.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        columns: row.columns.map(col => {
          if (col.id !== colId) return col;
          const idx = col.blocks.findIndex(b => b.id === blockId);
          if (idx < 0) return col;
          const newIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= col.blocks.length) return col;
          const newBlocks = [...col.blocks];
          [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
          return { ...col, blocks: newBlocks };
        })
      };
    }));
  };

  const duplicateBlock = (rowId, colId, blockId) => {
    onChange(rows.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        columns: row.columns.map(col => {
          if (col.id !== colId) return col;
          const idx = col.blocks.findIndex(b => b.id === blockId);
          if (idx < 0) return col;
          const newBlock = JSON.parse(JSON.stringify(col.blocks[idx]));
          newBlock.id = genId();
          const newBlocks = [...col.blocks];
          newBlocks.splice(idx + 1, 0, newBlock);
          return { ...col, blocks: newBlocks };
        })
      };
    }));
  };

  // DND handlers for rows
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex(r => r.id === active.id);
    const newIndex = rows.findIndex(r => r.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) {
      onChange(arrayMove(rows, oldIndex, newIndex));
    }
  };

  // Find block for editing
  const getEditingBlockData = () => {
    if (!editingBlock) return null;
    const row = rows.find(r => r.id === editingBlock.rowId);
    if (!row) return null;
    const col = row.columns.find(c => c.id === editingBlock.colId);
    if (!col) return null;
    return col.blocks.find(b => b.id === editingBlock.blockId);
  };

  const currentBlock = getEditingBlockData();

  return (
    <div className="page-builder">
      {/* Row List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
          {rows.map((row, rowIndex) => (
            <SortableRow
              key={row.id}
              row={row}
              rowIndex={rowIndex}
              totalRows={rows.length}
              onMoveRow={moveRow}
              onDuplicateRow={duplicateRow}
              onDeleteRow={deleteRow}
              onChangeLayout={changeRowLayout}
              onUpdateSettings={updateRowSettings}
              onReorderColumns={reorderColumns}
              onAddBlock={(colId) => setShowAddBlock({ rowId: row.id, colId })}
              onEditBlock={(colId, blockId) => setEditingBlock({ rowId: row.id, colId, blockId })}
              onDeleteBlock={(colId, blockId) => deleteBlock(row.id, colId, blockId)}
              onMoveBlock={(colId, blockId, dir) => moveBlock(row.id, colId, blockId, dir)}
              onDuplicateBlock={(colId, blockId) => duplicateBlock(row.id, colId, blockId)}
              editingBlockId={editingBlock?.blockId}
              columnLayouts={COLUMN_LAYOUTS}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Row Button */}
      <div className="relative mt-4">
        <button
          type="button"
          onClick={() => setShowAddRow(!showAddRow)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <span className="text-lg">+</span> Rij toevoegen
        </button>

        {showAddRow && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Kies een indeling</h4>
            <div className="grid grid-cols-3 gap-2">
              {COLUMN_LAYOUTS.map((layout, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => addRow(layout.cols)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                >
                  <div className="flex gap-1 mb-1 justify-center">
                    {layout.cols.map((w, j) => (
                      <div key={j} className="h-8 bg-blue-200 rounded" style={{ width: `${(w / 12) * 100}%`, minWidth: 12 }} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">{layout.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Block Modal */}
      {showAddBlock && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAddBlock(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Blok toevoegen</h3>
              <button onClick={() => setShowAddBlock(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {BLOCK_TYPES.map(bt => (
                <button
                  key={bt.type}
                  type="button"
                  onClick={() => addBlock(showAddBlock.rowId, showAddBlock.colId, bt.type)}
                  className="p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 text-center"
                >
                  <span className="text-2xl">{bt.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{bt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Block Editor Modal - Full screen popup */}
      {editingBlock && currentBlock && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingBlock(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{BLOCK_TYPES.find(bt => bt.type === currentBlock.type)?.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {BLOCK_TYPES.find(bt => bt.type === currentBlock.type)?.label || currentBlock.type}
                  </h3>
                  <p className="text-xs text-gray-500">Bewerk de instellingen van dit blok</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingBlock(null)} 
                className="w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <BlockEditor
                block={currentBlock}
                onChange={(data) => updateBlock(editingBlock.rowId, editingBlock.colId, editingBlock.blockId, data)}
              />
            </div>
            
            {/* Sticky Footer with Save Button */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 p-4 rounded-b-2xl flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setEditingBlock(null)}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Annuleren
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onSave) onSave();
                    setEditingBlock(null);
                  }}
                  className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Opslaan & Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { createRow, createBlock, BLOCK_TYPES, COLUMN_LAYOUTS };
