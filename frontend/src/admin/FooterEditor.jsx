import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RichTextEditor from '../components/RichTextEditor';
import toast from 'react-hot-toast';

function SortableColumn({ column, onEdit, t }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.id || column.tempId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">⠿</button>
        <h4 className="font-medium text-gray-800 flex-1">{column.title || `Column ${column.order + 1}`}</h4>
        <button onClick={() => onEdit(column)} className="text-blue-600 hover:text-blue-800 text-sm">{t('edit')}</button>
      </div>
      <div className="p-4">
        {column.content ? (
          <div className="text-sm text-gray-600 line-clamp-4 prose prose-sm" dangerouslySetInnerHTML={{ __html: typeof column.content === 'string' ? column.content : (column.content?.html || '') }} />
        ) : (
          <p className="text-sm text-gray-400 italic">{t('noContent')}</p>
        )}
        {column.menuId && <p className="text-xs text-blue-500 mt-2">Menu ID: {column.menuId}</p>}
      </div>
    </div>
  );
}

export default function FooterEditor() {
  const { t } = useLanguage();
  const [columns, setColumns] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    menuId: '',
    order: 0
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { loadFooter(); loadMenus(); }, []);

  const loadFooter = async () => {
    try {
      const res = await api.get('/footer');
      let cols = res.data || [];
      // Ensure we have 3 columns
      while (cols.length < 3) {
        cols.push({ tempId: `new-${cols.length}`, title: '', content: '', menuId: null, order: cols.length });
      }
      setColumns(cols);
    } catch (error) {
      // Initialize with 3 empty columns
      setColumns([
        { tempId: 'new-0', title: '', content: '', menuId: null, order: 0 },
        { tempId: 'new-1', title: '', content: '', menuId: null, order: 1 },
        { tempId: 'new-2', title: '', content: '', menuId: null, order: 2 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMenus = async () => {
    try {
      const res = await api.get('/menus');
      setMenus(res.data);
    } catch (error) { console.error(error); }
  };

  const handleEdit = (column) => {
    setEditingColumn(column);
    const content = typeof column.content === 'string' ? column.content : (column.content?.html || '');
    setForm({
      title: column.title || '',
      content: content,
      menuId: column.menuId?.toString() || '',
      order: column.order
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      // Update the column in the local state
      const updatedColumns = columns.map(col => {
        if ((col.id && col.id === editingColumn.id) || (col.tempId && col.tempId === editingColumn.tempId)) {
          return {
            ...col,
            title: form.title,
            content: { html: form.content },
            menuId: form.menuId ? parseInt(form.menuId) : null,
            order: form.order
          };
        }
        return col;
      });

      // Send bulk update to API
      await api.put('/footer', {
        columns: updatedColumns.map(col => ({
          id: col.id || undefined,
          title: col.title || '',
          content: typeof col.content === 'object' ? col.content : { html: col.content || '' },
          menuId: col.menuId || null,
          order: col.order
        }))
      });

      toast.success(t('savedSuccess'));
      setShowForm(false);
      loadFooter();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columns.findIndex(c => (c.id || c.tempId) === active.id);
    const newIndex = columns.findIndex(c => (c.id || c.tempId) === over.id);
    const newOrder = arrayMove(columns, oldIndex, newIndex).map((col, idx) => ({ ...col, order: idx }));
    setColumns(newOrder);

    try {
      await api.put('/footer', {
        columns: newOrder.map(col => ({
          id: col.id || undefined,
          title: col.title || '',
          content: typeof col.content === 'object' ? col.content : { html: col.content || '' },
          menuId: col.menuId || null,
          order: col.order
        }))
      });
    } catch (error) {
      toast.error(t('error'));
      loadFooter();
    }
  };

  const saveAll = async () => {
    try {
      await api.put('/footer', {
        columns: columns.map(col => ({
          id: col.id || undefined,
          title: col.title || '',
          content: typeof col.content === 'object' ? col.content : { html: col.content || '' },
          menuId: col.menuId || null,
          order: col.order
        }))
      });
      toast.success(t('savedSuccess'));
      loadFooter();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('footer')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('footerDescription')}</p>
        </div>
        <button onClick={saveAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          {t('saveAll')}
        </button>
      </div>

      {/* Footer Preview Bar */}
      <div className="bg-gray-900 rounded-xl p-4 mb-6">
        <p className="text-gray-400 text-xs text-center mb-2">{t('footerPreview')}</p>
        <div className="grid grid-cols-3 gap-4">
          {columns.map((col, i) => (
            <div key={col.id || col.tempId || i} className="text-center">
              <p className="text-white text-sm font-medium">{col.title || `Column ${i + 1}`}</p>
              {col.menuId && <p className="text-gray-400 text-xs mt-1">📋 Menu linked</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Draggable Columns */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={columns.map(c => c.id || c.tempId)} strategy={horizontalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {columns.map(column => (
              <SortableColumn key={column.id || column.tempId} column={column} onEdit={handleEdit} t={t} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Column Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">{t('editColumn')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('columnTitle')}</label>
                <input type="text" value={form.title} onChange={(e) => setForm(prev => ({...prev, title: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('content')}</label>
                <RichTextEditor content={form.content} onChange={(html) => setForm(prev => ({...prev, content: html}))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('linkMenu')}</label>
                <select value={form.menuId} onChange={(e) => setForm(prev => ({...prev, menuId: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">{t('noMenu')}</option>
                  {menus.filter(m => m.location?.startsWith('footer')).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.location})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
