import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

function SortableMenuItem({ item, onEdit, onDelete, t }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{item.label}</p>
        <p className="text-xs text-gray-500 truncate">{item.url || `Page: ${item.pageId}`}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800 text-sm">{t('edit')}</button>
        <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 text-sm">{t('delete')}</button>
      </div>
    </div>
  );
}

export default function MenuManager() {
  const { t } = useLanguage();
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [menuForm, setMenuForm] = useState({ name: '', location: '' });
  const [itemForm, setItemForm] = useState({ 
    label: '', url: '', pageId: '', parentId: '', target: '_self',
    styles: { bgColor: '#3b82f6', textColor: '#ffffff', hoverColor: '#2563eb', shape: 'square', effect: 'none' }
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { loadMenus(); loadPages(); }, []);
  useEffect(() => { if (selectedMenu) loadMenuItems(selectedMenu.id); }, [selectedMenu]);

  const loadMenus = async () => {
    try {
      const res = await api.get('/menus');
      setMenus(res.data);
      if (res.data.length > 0 && !selectedMenu) setSelectedMenu(res.data[0]);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async () => {
    try {
      const res = await api.get('/pages/list');
      setPages(res.data);
    } catch (error) { console.error(error); }
  };

  const loadMenuItems = async (menuId) => {
    try {
      const res = await api.get(`/menus/${menuId}`);
      setMenuItems(res.data.items || []);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const saveMenu = async () => {
    try {
      if (showMenuForm === 'edit') {
        await api.put(`/menus/${selectedMenu.id}`, menuForm);
      } else {
        const res = await api.post('/menus', menuForm);
        setSelectedMenu(res.data);
      }
      toast.success(t('savedSuccess'));
      setShowMenuForm(false);
      loadMenus();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    }
  };

  const deleteMenu = async (id) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/menus/${id}`);
      toast.success(t('deletedSuccess'));
      setSelectedMenu(null);
      loadMenus();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const saveItem = async () => {
    try {
      const data = {
        label: itemForm.label,
        url: itemForm.url,
        target: itemForm.target,
        styles: itemForm.styles,
        menuId: selectedMenu.id,
        pageId: itemForm.pageId ? parseInt(itemForm.pageId) : null,
        parentId: itemForm.parentId ? parseInt(itemForm.parentId) : null,
        order: menuItems.length
      };

      if (editingItem) {
        await api.put(`/menus/${selectedMenu.id}/items/${editingItem.id}`, data);
      } else {
        await api.post(`/menus/${selectedMenu.id}/items`, data);
      }
      toast.success(t('savedSuccess'));
      setShowItemForm(false);
      setEditingItem(null);
      setItemForm({ label: '', url: '', pageId: '', parentId: '', target: '_self', styles: { bgColor: '#3b82f6', textColor: '#ffffff', hoverColor: '#2563eb', shape: 'square', effect: 'none' } });
      loadMenuItems(selectedMenu.id);
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    }
  };

  const deleteItem = async (itemId) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/menus/${selectedMenu.id}/items/${itemId}`);
      toast.success(t('deletedSuccess'));
      loadMenuItems(selectedMenu.id);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    const itemStyles = typeof item.styles === 'string' ? JSON.parse(item.styles) : (item.styles || {});
    setItemForm({
      label: item.label || '',
      url: item.url || '',
      pageId: item.pageId?.toString() || '',
      parentId: item.parentId?.toString() || '',
      target: item.target || '_self',
      styles: {
        bgColor: itemStyles.bgColor || '#3b82f6',
        textColor: itemStyles.textColor || '#ffffff',
        hoverColor: itemStyles.hoverColor || '#2563eb',
        shape: itemStyles.shape || 'square',
        effect: itemStyles.effect || 'none'
      }
    });
    setShowItemForm(true);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = menuItems.findIndex(i => i.id === active.id);
    const newIndex = menuItems.findIndex(i => i.id === over.id);
    const newOrder = arrayMove(menuItems, oldIndex, newIndex);
    setMenuItems(newOrder);

    try {
      await api.put(`/menus/${selectedMenu.id}/reorder`, {
        items: newOrder.map((item, idx) => ({ id: item.id, sortOrder: idx }))
      });
    } catch (error) {
      toast.error(t('error'));
      loadMenuItems(selectedMenu.id);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('menus')}</h2>
        <button onClick={() => { setMenuForm({ name: '', location: '' }); setShowMenuForm('new'); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          + {t('newMenu')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu List */}
        <div className="space-y-2">
          {menus.map(menu => (
            <div
              key={menu.id}
              onClick={() => setSelectedMenu(menu)}
              className={`p-3 rounded-lg cursor-pointer border transition-all ${
                selectedMenu?.id === menu.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-800">{menu.name}</p>
              <p className="text-xs text-gray-500">{menu.location}</p>
            </div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="lg:col-span-3">
          {selectedMenu ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{selectedMenu.name}</h3>
                  <p className="text-sm text-gray-500">{t('location')}: {selectedMenu.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setMenuForm({ name: selectedMenu.name, location: selectedMenu.location }); setShowMenuForm('edit'); }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('edit')}</button>
                  <button onClick={() => deleteMenu(selectedMenu.id)}
                    className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">{t('delete')}</button>
                  <button onClick={() => { setEditingItem(null); setItemForm({ label: '', url: '', pageId: '', parentId: '', target: '_self', styles: { bgColor: '#3b82f6', textColor: '#ffffff', hoverColor: '#2563eb', shape: 'square', effect: 'none' } }); setShowItemForm(true); }}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    + {t('addItem')}
                  </button>
                </div>
              </div>

              {menuItems.length === 0 ? (
                <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  {t('noMenuItems')}
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={menuItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {menuItems.map(item => (
                        <SortableMenuItem key={item.id} item={item} onEdit={handleEditItem} onDelete={deleteItem} t={t} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              {t('selectMenu')}
            </div>
          )}
        </div>
      </div>

      {/* Menu Form Modal */}
      {showMenuForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{showMenuForm === 'edit' ? t('editMenu') : t('newMenu')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('menuName')}</label>
                <input type="text" value={menuForm.name} onChange={(e) => setMenuForm(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('location')}</label>
                <select value={menuForm.location} onChange={(e) => setMenuForm(prev => ({...prev, location: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Select...</option>
                  <option value="header">Header</option>
                  <option value="footer-1">Footer Column 1</option>
                  <option value="footer-2">Footer Column 2</option>
                  <option value="footer-3">Footer Column 3</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowMenuForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={saveMenu} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingItem ? t('editItem') : t('addItem')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input type="text" value={itemForm.label} onChange={(e) => setItemForm(prev => ({...prev, label: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('linkToPage')}</label>
                <select value={itemForm.pageId} onChange={(e) => setItemForm(prev => ({...prev, pageId: e.target.value, url: e.target.value ? '' : prev.url}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">{t('noPage')}</option>
                  {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL ({t('orCustomUrl')})</label>
                <input type="text" value={itemForm.url} onChange={(e) => setItemForm(prev => ({...prev, url: e.target.value}))}
                  placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  disabled={!!itemForm.pageId} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <select value={itemForm.target} onChange={(e) => setItemForm(prev => ({...prev, target: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="_self">Same window</option>
                  <option value="_blank">New window</option>
                </select>
              </div>

              {/* Per-Item Styling Section */}
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs">🎨</span>
                  Item Styling (voor zwevend menu)
                </h4>
                
                {/* Colors */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Achtergrond</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={itemForm.styles?.bgColor || '#3b82f6'} 
                        onChange={(e) => setItemForm(prev => ({...prev, styles: {...prev.styles, bgColor: e.target.value}}))}
                        className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                      <input type="text" value={itemForm.styles?.bgColor || '#3b82f6'} 
                        onChange={(e) => setItemForm(prev => ({...prev, styles: {...prev.styles, bgColor: e.target.value}}))}
                        className="flex-1 px-1.5 py-1 border border-gray-300 rounded text-xs font-mono w-16" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tekst</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={itemForm.styles?.textColor || '#ffffff'} 
                        onChange={(e) => setItemForm(prev => ({...prev, styles: {...prev.styles, textColor: e.target.value}}))}
                        className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                      <input type="text" value={itemForm.styles?.textColor || '#ffffff'} 
                        onChange={(e) => setItemForm(prev => ({...prev, styles: {...prev.styles, textColor: e.target.value}}))}
                        className="flex-1 px-1.5 py-1 border border-gray-300 rounded text-xs font-mono w-16" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hover</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={itemForm.styles?.hoverColor || '#2563eb'} 
                        onChange={(e) => setItemForm(prev => ({...prev, styles: {...prev.styles, hoverColor: e.target.value}}))}
                        className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                      <input type="text" value={itemForm.styles?.hoverColor || '#2563eb'} 
                        onChange={(e) => setItemForm(prev => ({...prev, styles: {...prev.styles, hoverColor: e.target.value}}))}
                        className="flex-1 px-1.5 py-1 border border-gray-300 rounded text-xs font-mono w-16" />
                    </div>
                  </div>
                </div>

                {/* Shape */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Vorm</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'none', label: 'Geen', icon: 'ab' },
                      { value: 'square', label: 'Vierkant', icon: '▢' },
                      { value: 'round', label: 'Rond', icon: '○' },
                      { value: 'parallelogram', label: 'Schuin', icon: '▱' },
                    ].map(shape => (
                      <button
                        key={shape.value}
                        type="button"
                        onClick={() => setItemForm(prev => ({...prev, styles: {...prev.styles, shape: shape.value}}))}
                        className={`p-2 rounded-lg text-xs border-2 transition-all flex flex-col items-center gap-0.5 ${
                          itemForm.styles?.shape === shape.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span className="text-lg">{shape.icon}</span>
                        <span className="text-[10px]">{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Hover Effect</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { value: 'none', label: 'Geen' },
                      { value: 'scale', label: 'Scale' },
                      { value: 'glow', label: 'Glow' },
                      { value: 'lift', label: 'Lift' },
                      { value: 'bounce', label: 'Bounce' },
                      { value: 'pulse', label: 'Pulse' },
                      { value: 'shake', label: 'Shake' },
                      { value: 'rotate', label: 'Rotate' },
                      { value: 'slide', label: 'Slide' },
                      { value: 'flip', label: 'Flip' },
                    ].map(effect => (
                      <button
                        key={effect.value}
                        type="button"
                        onClick={() => setItemForm(prev => ({...prev, styles: {...prev.styles, effect: effect.value}}))}
                        className={`px-1.5 py-1 rounded text-[10px] border-2 transition-all ${
                          itemForm.styles?.effect === effect.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Effect */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Tekst Effect</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: 'none', label: 'Geen' },
                      { value: 'underline', label: 'Underline' },
                      { value: 'bold', label: 'Bold' },
                      { value: 'uppercase', label: 'UPPER' },
                      { value: 'shadow', label: 'Shadow' },
                      { value: 'glow', label: 'Glow' },
                      { value: 'spacing', label: 'Spacing' },
                    ].map(effect => (
                      <button
                        key={effect.value}
                        type="button"
                        onClick={() => setItemForm(prev => ({...prev, styles: {...prev.styles, textEffect: effect.value}}))}
                        className={`px-1.5 py-1 rounded text-[10px] border-2 transition-all ${
                          itemForm.styles?.textEffect === effect.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <span className="text-[10px] text-gray-400 block mb-2">Voorbeeld</span>
                  <div className="flex justify-center">
                    <span 
                      className={`inline-block px-4 py-2 text-sm font-medium transition-all duration-300 cursor-pointer
                        ${itemForm.styles?.shape === 'square' ? 'rounded-none' : ''}
                        ${itemForm.styles?.shape === 'round' ? 'rounded-full' : ''}
                        ${itemForm.styles?.shape === 'parallelogram' ? 'skew-x-[-12deg]' : ''}
                        ${itemForm.styles?.effect === 'scale' ? 'hover:scale-110' : ''}
                        ${itemForm.styles?.effect === 'lift' ? 'hover:-translate-y-1 hover:shadow-lg' : ''}
                      `}
                      style={{
                        backgroundColor: itemForm.styles?.bgColor || '#3b82f6',
                        color: itemForm.styles?.textColor || '#ffffff',
                        borderRadius: itemForm.styles?.shape === 'none' ? '0' : (itemForm.styles?.shape === 'round' ? '9999px' : '8px'),
                        boxShadow: itemForm.styles?.effect === 'glow' ? `0 0 20px ${itemForm.styles?.bgColor || '#3b82f6'}80` : 'none',
                      }}
                    >
                      <span className={itemForm.styles?.shape === 'parallelogram' ? 'skew-x-[12deg] inline-block' : ''}>
                        {itemForm.label || 'Menu Item'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowItemForm(false); setEditingItem(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={saveItem} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
