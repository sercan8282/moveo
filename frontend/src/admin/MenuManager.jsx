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
  const [itemForm, setItemForm] = useState({ label: '', url: '', pageId: '', parentId: '', target: '_self' });

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
        ...itemForm,
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
      setItemForm({ label: '', url: '', pageId: '', parentId: '', target: '_self' });
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
    setItemForm({
      label: item.label || '',
      url: item.url || '',
      pageId: item.pageId?.toString() || '',
      parentId: item.parentId?.toString() || '',
      target: item.target || '_self'
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
                  <button onClick={() => { setEditingItem(null); setItemForm({ label: '', url: '', pageId: '', parentId: '', target: '_self' }); setShowItemForm(true); }}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
