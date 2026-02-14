import { useState, useCallback, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function MediaLibrary({ onSelect, isOpen, onClose, filterType }) {
  const { t } = useLanguage();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [search, setSearch] = useState('');
  const [showResize, setShowResize] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  useEffect(() => {
    if (isOpen) loadMedia();
  }, [isOpen]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = { limit: 50, search };
      if (filterType) params.type = filterType;
      const res = await api.get('/media', { params });
      setMedia(res.data.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    try {
      if (files.length === 1) {
        const formData = new FormData();
        formData.append('file', files[0]);
        await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        await api.post('/media/upload-multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      toast.success(t('savedSuccess'));
      loadMedia();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    } finally {
      setUploading(false);
    }
  };

  const handleResize = async (mediaItem, preset) => {
    try {
      let width, height;
      if (preset === 'small') { width = 150; }
      else if (preset === 'normal') { width = 400; }
      else if (preset === 'medium') { width = 800; }
      else if (preset === 'large') { width = 1200; }
      else if (preset === 'custom') {
        width = customWidth ? parseInt(customWidth) : null;
        height = customHeight ? parseInt(customHeight) : null;
        if (!width && !height) {
          toast.error('Voer breedte of hoogte in');
          return;
        }
      }

      await api.post(`/media/${mediaItem.id}/resize`, { width, height });
      toast.success(t('savedSuccess'));
      loadMedia();
      setShowResize(false);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/media/${id}`);
      toast.success(t('deleteSuccess'));
      setSelectedMedia(null);
      loadMedia();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleUpdateAlt = async (id, altText) => {
    try {
      await api.put(`/media/${id}`, { altText });
      toast.success(t('savedSuccess'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{t('media')}</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMedia()}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
            <label className="px-4 py-1.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 text-sm font-medium">
              {uploading ? t('loading') : t('uploadFiles')}
              <input type="file" multiple accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleUpload} className="hidden" />
            </label>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-lg">{t('noResults')}</p>
                <p className="text-sm mt-2">{t('dragDropFiles')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {media.map(item => {
                  const isVideo = item.mimeType && item.mimeType.startsWith('video/');
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:shadow-lg ${
                        selectedMedia?.id === item.id ? 'border-blue-500 shadow-lg' : 'border-transparent'
                      }`}
                    >
                      {isVideo ? (
                        <>
                          <video src={item.path} muted preload="metadata" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
                            </div>
                          </div>
                          <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">VIDEO</div>
                        </>
                      ) : (
                        <img
                          src={item.path}
                          alt={item.altText || item.originalName}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                        {item.originalName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedMedia && (
            <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
              {selectedMedia.mimeType && selectedMedia.mimeType.startsWith('video/') ? (
                <video
                  src={selectedMedia.path}
                  controls
                  preload="metadata"
                  className="w-full rounded-lg mb-4 bg-black"
                />
              ) : (
                <img
                  src={selectedMedia.path}
                  alt={selectedMedia.altText}
                  className="w-full rounded-lg mb-4"
                />
              )}
              <div className="space-y-3 text-sm">
                <div>
                  <label className="font-medium text-gray-700">{t('altText')}</label>
                  <input
                    type="text"
                    defaultValue={selectedMedia.altText || ''}
                    onBlur={(e) => handleUpdateAlt(selectedMedia.id, e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('dimensions')}:</span>
                  <span className="ml-1">{selectedMedia.width}×{selectedMedia.height}px</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('fileSize')}:</span>
                  <span className="ml-1">{formatSize(selectedMedia.size)}</span>
                </div>

                {/* Resize Options - only for images */}
                {!(selectedMedia.mimeType && selectedMedia.mimeType.startsWith('video/')) && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-gray-700 mb-2">{t('resize')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleResize(selectedMedia, 'small')} className="px-2 py-1.5 text-xs bg-gray-200 rounded hover:bg-gray-300">
                      {t('small')}
                    </button>
                    <button onClick={() => handleResize(selectedMedia, 'normal')} className="px-2 py-1.5 text-xs bg-gray-200 rounded hover:bg-gray-300">
                      {t('normal')}
                    </button>
                    <button onClick={() => handleResize(selectedMedia, 'medium')} className="px-2 py-1.5 text-xs bg-gray-200 rounded hover:bg-gray-300">
                      {t('medium')}
                    </button>
                    <button onClick={() => handleResize(selectedMedia, 'large')} className="px-2 py-1.5 text-xs bg-gray-200 rounded hover:bg-gray-300">
                      {t('large')}
                    </button>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => setShowResize(!showResize)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {t('custom')} →
                    </button>
                    {showResize && (
                      <div className="mt-2 flex gap-2 items-end">
                        <div>
                          <label className="text-xs text-gray-500">{t('width')}</label>
                          <input
                            type="number"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-xs"
                            placeholder="px"
                          />
                        </div>
                        <span className="text-gray-400 pb-1">×</span>
                        <div>
                          <label className="text-xs text-gray-500">{t('height')}</label>
                          <input
                            type="number"
                            value={customHeight}
                            onChange={(e) => setCustomHeight(e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-xs"
                            placeholder="px"
                          />
                        </div>
                        <button
                          onClick={() => handleResize(selectedMedia, 'custom')}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Variants */}
                {selectedMedia.variants && Object.keys(selectedMedia.variants).length > 0 && (
                  <div className="pt-3 border-t">
                    <h4 className="font-medium text-gray-700 mb-2">{t('variants')}</h4>
                    <div className="space-y-1">
                      {Object.entries(selectedMedia.variants).map(([key, variant]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{key}: {variant.width}×{variant.height}</span>
                          {onSelect && (
                            <button
                              onClick={() => { onSelect(variant); onClose(); }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {t('selectImage')}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t flex gap-2">
                  {onSelect && (
                    <button
                      onClick={() => { onSelect(selectedMedia); onClose(); }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      {t('selectImage')}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedMedia.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
