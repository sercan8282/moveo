import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RichTextEditor from '../components/RichTextEditor';
import MediaLibrary from '../components/MediaLibrary';
import toast from 'react-hot-toast';

function SortableSection({ section, onEdit, onDelete, t }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const typeLabels = { hero: 'Hero Banner', featured: 'Featured Content', content: 'Content Block', cta: 'Call to Action', gallery: 'Gallery', text: 'Text' };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 text-lg">⠿</button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800">{section.title || section.type}</p>
        <p className="text-xs text-gray-500">{typeLabels[section.type] || section.type}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(section)} className="text-blue-600 hover:text-blue-800 text-sm">{t('edit')}</button>
        <button onClick={() => onDelete(section.id)} className="text-red-500 hover:text-red-700 text-sm">{t('delete')}</button>
      </div>
    </div>
  );
}

export default function HomepageEditor() {
  const { t } = useLanguage();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showMedia, setShowMedia] = useState(false);
  const [form, setForm] = useState({
    type: 'hero',
    title: '',
    subtitle: '',
    content: '',
    buttonText: '',
    buttonUrl: '',
    imageUrl: '',
    settings: {}
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { loadSections(); }, []);

  const loadSections = async () => {
    try {
      const res = await api.get('/homepage');
      setSections(res.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section) => {
    setEditing(section);
    const settings = typeof section.settings === 'string' ? JSON.parse(section.settings) : (section.settings || {});
    const content = typeof section.content === 'string' ? section.content : (section.content?.html || '');
    setForm({
      type: section.type || 'hero',
      title: section.title || '',
      subtitle: section.subtitle || '',
      content: content,
      buttonText: settings.buttonText || '',
      buttonUrl: settings.buttonUrl || '',
      imageUrl: settings.imageUrl || '',
      settings: settings
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setForm({ type: 'hero', title: '', subtitle: '', content: '', buttonText: '', buttonUrl: '', imageUrl: '', settings: {} });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        type: form.type,
        title: form.title,
        subtitle: form.subtitle,
        content: { html: form.content },
        order: editing ? editing.order : sections.length,
        settings: {
          ...form.settings,
          buttonText: form.buttonText,
          buttonUrl: form.buttonUrl,
          imageUrl: form.imageUrl
        }
      };

      if (editing) {
        await api.put(`/homepage/${editing.id}`, data);
      } else {
        await api.post('/homepage', data);
      }
      toast.success(t('savedSuccess'));
      setShowForm(false);
      loadSections();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    }
  };

  const deleteSection = async (id) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/homepage/${id}`);
      toast.success(t('deletedSuccess'));
      loadSections();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const newOrder = arrayMove(sections, oldIndex, newIndex);
    setSections(newOrder);

    try {
      await api.put('/homepage/reorder', {
        sections: newOrder.map((s, idx) => ({ id: s.id, order: idx }))
      });
    } catch (error) {
      toast.error(t('error'));
      loadSections();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('homepage')}</h2>
        <button onClick={handleNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          + {t('addSection')}
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center text-gray-400">
          <p className="text-lg mb-2">{t('noSections')}</p>
          <button onClick={handleNew} className="text-blue-600 hover:text-blue-800 text-sm">{t('addSection')}</button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sections.map(section => (
                <SortableSection key={section.id} section={section} onEdit={handleEdit} onDelete={deleteSection} t={t} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Section Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">{editing ? t('editSection') : t('addSection')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sectionType')}</label>
                <select value={form.type} onChange={(e) => setForm(prev => ({...prev, type: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="hero">Hero Banner</option>
                  <option value="featured">Featured Content</option>
                  <option value="content">Content Block</option>
                  <option value="cta">Call to Action</option>
                  <option value="gallery">Gallery</option>
                  <option value="text">Text</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sectionTitle')}</label>
                <input type="text" value={form.title} onChange={(e) => setForm(prev => ({...prev, title: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('subtitle')}</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm(prev => ({...prev, subtitle: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('content')}</label>
                <RichTextEditor content={form.content} onChange={(html) => setForm(prev => ({...prev, content: html}))} />
              </div>

              {(form.type === 'hero' || form.type === 'cta') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('buttonText')}</label>
                    <input type="text" value={form.buttonText} onChange={(e) => setForm(prev => ({...prev, buttonText: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('buttonUrl')}</label>
                    <input type="text" value={form.buttonUrl} onChange={(e) => setForm(prev => ({...prev, buttonUrl: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('backgroundImage')}</label>
                <div className="flex items-center gap-3">
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  )}
                  <button type="button" onClick={() => setShowMedia(true)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">{t('selectImage')}</button>
                  {form.imageUrl && (
                    <button type="button" onClick={() => setForm(prev => ({...prev, imageUrl: ''}))}
                      className="text-red-500 text-sm hover:text-red-700">{t('remove')}</button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      <MediaLibrary isOpen={showMedia} onClose={() => setShowMedia(false)}
        onSelect={(media) => { setForm(prev => ({...prev, imageUrl: media.path})); setShowMedia(false); }} />
    </div>
  );
}
