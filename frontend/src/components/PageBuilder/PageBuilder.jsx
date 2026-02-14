import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableRow from './SortableRow';
import BlockEditor from './BlockEditor';

const genId = () => crypto.randomUUID();

const BLOCK_TYPES = [
  { type: 'text', label: 'Tekst', icon: '📝' },
  { type: 'image', label: 'Afbeelding', icon: '🖼️' },
  { type: 'carousel', label: 'Carousel', icon: '🎠' },
  { type: 'video', label: 'Video', icon: '🎬' },
  { type: 'contactForm', label: 'Contactformulier', icon: '📋' },
  { type: 'googleMap', label: 'Google Maps', icon: '📍' },
  { type: 'button', label: 'Knop', icon: '🔘' },
  { type: 'spacer', label: 'Ruimte', icon: '↕️' },
  { type: 'divider', label: 'Scheidingslijn', icon: '➖' },
  { type: 'html', label: 'HTML Code', icon: '💻' },
  { type: 'hero', label: 'Hero Banner', icon: '🎯' },
  { type: 'cards', label: 'Kaarten', icon: '🃏' },
  { type: 'testimonial', label: 'Testimonial', icon: '💬' },
  { type: 'accordion', label: 'Accordion/FAQ', icon: '📂' },
  { type: 'counter', label: 'Teller/Statistiek', icon: '📊' },
  { type: 'iconBox', label: 'Icoon Box', icon: '⭐' },
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
    image: { src: '', alt: '', caption: '', objectFit: 'cover' },
    carousel: { images: [], autoplay: true, interval: 5000, showDots: true, showArrows: true },
    video: { url: '', type: 'youtube', autoplay: false },
    contactForm: {},
    googleMap: { address: '', height: '400px' },
    button: { text: 'Klik hier', url: '#', style: 'primary', size: 'medium', target: '_self', fullWidth: false },
    spacer: { height: 40 },
    divider: { style: 'solid', color: '#e2e8f0' },
    html: { code: '' },
    hero: { title: '', subtitle: '', backgroundImage: '', overlay: true, height: '400px', alignment: 'center' },
    cards: { items: [{ title: '', description: '', image: '', link: '' }], columns: 3 },
    testimonial: { quote: '', author: '', role: '', avatar: '' },
    accordion: { items: [{ title: '', content: '' }], allowMultiple: false },
    counter: { items: [{ number: 0, suffix: '', label: '' }], columns: 4 },
    iconBox: { items: [{ icon: '⭐', title: '', description: '' }], columns: 3, style: 'default' },
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

export default function PageBuilder({ rows, onChange }) {
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

      {/* Block Editor Panel */}
      {editingBlock && currentBlock && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">
              {BLOCK_TYPES.find(bt => bt.type === currentBlock.type)?.icon} {BLOCK_TYPES.find(bt => bt.type === currentBlock.type)?.label || currentBlock.type}
            </h3>
            <button onClick={() => setEditingBlock(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <BlockEditor
              block={currentBlock}
              onChange={(data) => updateBlock(editingBlock.rowId, editingBlock.colId, editingBlock.blockId, data)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { createRow, createBlock, BLOCK_TYPES, COLUMN_LAYOUTS };
