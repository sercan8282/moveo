import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

export default function SortableRow({
  row, rowIndex, totalRows,
  onMoveRow, onDuplicateRow, onDeleteRow, onChangeLayout, onUpdateSettings,
  onAddBlock, onEditBlock, onDeleteBlock, onMoveBlock, onDuplicateBlock,
  editingBlockId, columnLayouts
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

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
          </div>
        )}

        {/* Columns */}
        <div className="flex gap-2 p-3">
          {row.columns.map((col) => (
            <div
              key={col.id}
              className="border border-dashed border-gray-200 rounded-lg p-2 min-h-[60px] transition-all hover:border-gray-300"
              style={{ width: `${(col.width / 12) * 100}%` }}
            >
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
