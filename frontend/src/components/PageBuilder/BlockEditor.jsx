import { useState } from 'react';
import RichTextEditor from '../RichTextEditor';
import MediaLibrary from '../MediaLibrary';

export default function BlockEditor({ block, onChange }) {
  const [showMedia, setShowMedia] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null); // 'image', 'hero-bg', 'carousel', 'card-N', 'avatar', 'video'
  const [mediaFilterType, setMediaFilterType] = useState(null);

  const openMedia = (target, filterType = null) => {
    setMediaTarget(target);
    setMediaFilterType(filterType);
    setShowMedia(true);
  };

  const handleMediaSelect = (media) => {
    const url = media.path;
    if (mediaTarget === 'image') {
      onChange({ src: url, alt: media.altText || media.originalName || '' });
    } else if (mediaTarget === 'hero-bg') {
      onChange({ backgroundImage: url });
    } else if (mediaTarget === 'carousel') {
      onChange({ images: [...(block.data.images || []), { src: url, alt: media.altText || '' }] });
    } else if (mediaTarget === 'avatar') {
      onChange({ avatar: url });
    } else if (mediaTarget?.startsWith('card-')) {
      const idx = parseInt(mediaTarget.split('-')[1]);
      const items = [...(block.data.items || [])];
      if (items[idx]) { items[idx] = { ...items[idx], image: url }; }
      onChange({ items });
    } else if (mediaTarget === 'video') {
      onChange({ url: url, type: 'direct', source: 'media' });
    } else if (mediaTarget?.startsWith('iconbox-')) {
      const idx = parseInt(mediaTarget.split('-')[1]);
      const items = [...(block.data.items || [])];
      if (items[idx]) { items[idx] = { ...items[idx], icon: url }; }
      onChange({ items });
    }
    setShowMedia(false);
    setMediaTarget(null);
    setMediaFilterType(null);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const sectionClass = "space-y-3";

  const renderEditor = () => {
    switch (block.type) {
      case 'text':
        return (
          <div className={sectionClass}>
            <label className={labelClass}>Inhoud</label>
            <RichTextEditor
              content={block.data.html || ''}
              onChange={(html) => onChange({ html })}
            />
          </div>
        );

      case 'image':
        return (
          <div className={sectionClass}>
            <label className={labelClass}>Afbeelding</label>
            {block.data.src ? (
              <div className="relative">
                <img src={block.data.src} alt="" className="w-full rounded-lg" />
                <button type="button" onClick={() => onChange({ src: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => openMedia('image')}
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                Selecteer afbeelding
              </button>
            )}
            <div>
              <label className={labelClass}>Alt tekst</label>
              <input type="text" value={block.data.alt || ''} onChange={e => onChange({ alt: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bijschrift</label>
              <input type="text" value={block.data.caption || ''} onChange={e => onChange({ caption: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Object Fit</label>
              <select value={block.data.objectFit || 'cover'} onChange={e => onChange({ objectFit: e.target.value })} className={inputClass}>
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        );

      case 'carousel':
        return (
          <div className={sectionClass}>
            <label className={labelClass}>Afbeeldingen ({block.data.images?.length || 0})</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(block.data.images || []).map((img, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <img src={img.src} alt="" className="w-12 h-12 object-cover rounded" />
                  <input type="text" value={img.alt || ''} placeholder="Alt tekst"
                    onChange={e => {
                      const images = [...block.data.images];
                      images[i] = { ...images[i], alt: e.target.value };
                      onChange({ images });
                    }}
                    className="flex-1 px-2 py-1 border rounded text-xs" />
                  <button type="button" onClick={() => {
                    onChange({ images: block.data.images.filter((_, j) => j !== i) });
                  }} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => openMedia('carousel')}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 text-sm">
              + Afbeelding toevoegen
            </button>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={block.data.autoplay !== false}
                  onChange={e => onChange({ autoplay: e.target.checked })} />
                Autoplay
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={block.data.showDots !== false}
                  onChange={e => onChange({ showDots: e.target.checked })} />
                Stippen
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={block.data.showArrows !== false}
                  onChange={e => onChange({ showArrows: e.target.checked })} />
                Pijlen
              </label>
              <div>
                <label className={labelClass}>Interval (ms)</label>
                <input type="number" value={block.data.interval || 5000}
                  onChange={e => onChange({ interval: parseInt(e.target.value) })}
                  className={inputClass} />
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className={sectionClass}>
            {/* Source selector tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => onChange({ source: 'url', url: '', type: 'youtube' })}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  block.data.source !== 'media' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔗 URL (YouTube/Vimeo)
              </button>
              <button
                type="button"
                onClick={() => onChange({ source: 'media', type: 'direct' })}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  block.data.source === 'media' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🎬 Eigen video
              </button>
            </div>

            {block.data.source === 'media' ? (
              /* Media library video picker */
              <div>
                {block.data.url ? (
                  <div className="relative">
                    <video src={block.data.url} controls className="w-full rounded-lg" />
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => openMedia('video', 'video')}
                        className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Andere video kiezen
                      </button>
                      <button type="button" onClick={() => onChange({ url: '' })}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                        Verwijderen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => openMedia('video', 'video')}
                    className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm">
                    🎬 Video selecteren uit mediabibliotheek
                  </button>
                )}
              </div>
            ) : (
              /* URL-based video */
              <>
                <div>
                  <label className={labelClass}>Video URL</label>
                  <input type="url" value={block.data.url || ''} onChange={e => onChange({ url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... of https://vimeo.com/..."
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={block.data.type || 'youtube'} onChange={e => onChange({ type: e.target.value })} className={inputClass}>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="direct">Direct (mp4)</option>
                  </select>
                </div>
              </>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={block.data.autoplay || false}
                onChange={e => onChange({ autoplay: e.target.checked })} />
              Autoplay
            </label>
          </div>
        );

      case 'contactForm':
        return (
          <div className={sectionClass}>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              📋 Het contactformulier wordt automatisch weergegeven met alle standaard velden (naam, e-mail, telefoon, onderwerp, bericht).
            </p>
          </div>
        );

      case 'googleMap':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Adres</label>
              <input type="text" value={block.data.address || ''} onChange={e => onChange({ address: e.target.value })}
                placeholder="Transportweg 15, 3045 NB Rotterdam" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hoogte</label>
              <input type="text" value={block.data.height || '400px'} onChange={e => onChange({ height: e.target.value })}
                className={inputClass} />
            </div>
          </div>
        );

      case 'button':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Tekst</label>
              <input type="text" value={block.data.text || ''} onChange={e => onChange({ text: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>URL</label>
              <input type="url" value={block.data.url || ''} onChange={e => onChange({ url: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Stijl</label>
                <select value={block.data.style || 'primary'} onChange={e => onChange({ style: e.target.value })} className={inputClass}>
                  <option value="primary">Primair</option>
                  <option value="secondary">Secundair</option>
                  <option value="outline">Outline</option>
                  <option value="ghost">Ghost</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Grootte</label>
                <select value={block.data.size || 'medium'} onChange={e => onChange({ size: e.target.value })} className={inputClass}>
                  <option value="small">Klein</option>
                  <option value="medium">Medium</option>
                  <option value="large">Groot</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Target</label>
              <select value={block.data.target || '_self'} onChange={e => onChange({ target: e.target.value })} className={inputClass}>
                <option value="_self">Zelfde tabblad</option>
                <option value="_blank">Nieuw tabblad</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={block.data.fullWidth || false}
                onChange={e => onChange({ fullWidth: e.target.checked })} />
              Volledige breedte
            </label>
          </div>
        );

      case 'spacer':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Hoogte (px)</label>
              <input type="number" value={block.data.height || 40} onChange={e => onChange({ height: parseInt(e.target.value) })}
                min={0} max={500} className={inputClass} />
            </div>
            <input type="range" value={block.data.height || 40} onChange={e => onChange({ height: parseInt(e.target.value) })}
              min={0} max={500} className="w-full" />
          </div>
        );

      case 'divider':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Stijl</label>
              <select value={block.data.style || 'solid'} onChange={e => onChange({ style: e.target.value })} className={inputClass}>
                <option value="solid">Doorgetrokken</option>
                <option value="dashed">Gestreept</option>
                <option value="dotted">Gestippeld</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Kleur</label>
              <input type="color" value={block.data.color || '#e2e8f0'} onChange={e => onChange({ color: e.target.value })}
                className="w-full h-8 rounded cursor-pointer" />
            </div>
          </div>
        );

      case 'html':
        return (
          <div className={sectionClass}>
            <label className={labelClass}>HTML Code</label>
            <textarea value={block.data.code || ''} onChange={e => onChange({ code: e.target.value })}
              rows={10} className={`${inputClass} font-mono text-xs`}
              placeholder="<div>Jouw HTML code...</div>" />
          </div>
        );

      case 'hero':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Titel</label>
              <input type="text" value={block.data.title || ''} onChange={e => onChange({ title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ondertitel</label>
              <textarea value={block.data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })}
                rows={2} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Achtergrondafbeelding</label>
              {block.data.backgroundImage ? (
                <div className="relative">
                  <img src={block.data.backgroundImage} alt="" className="w-full h-32 object-cover rounded-lg" />
                  <button type="button" onClick={() => onChange({ backgroundImage: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => openMedia('hero-bg')}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 text-sm">
                  Selecteer afbeelding
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Hoogte</label>
                <input type="text" value={block.data.height || '400px'} onChange={e => onChange({ height: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Uitlijning</label>
                <select value={block.data.alignment || 'center'} onChange={e => onChange({ alignment: e.target.value })} className={inputClass}>
                  <option value="left">Links</option>
                  <option value="center">Midden</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={block.data.overlay !== false}
                onChange={e => onChange({ overlay: e.target.checked })} />
              Donkere overlay
            </label>
            <div>
              <label className={labelClass}>Knoptekst (optioneel)</label>
              <input type="text" value={block.data.buttonText || ''} onChange={e => onChange({ buttonText: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Knop URL</label>
              <input type="url" value={block.data.buttonUrl || ''} onChange={e => onChange({ buttonUrl: e.target.value })} className={inputClass} />
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Kolommen</label>
              <select value={block.data.columns || 3} onChange={e => onChange({ columns: parseInt(e.target.value) })} className={inputClass}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <label className={labelClass}>Kaarten ({block.data.items?.length || 0})</label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(block.data.items || []).map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Kaart {i + 1}</span>
                    <button type="button" onClick={() => onChange({ items: block.data.items.filter((_, j) => j !== i) })}
                      className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                  {item.image ? (
                    <img src={item.image} alt="" className="w-full h-20 object-cover rounded" onClick={() => openMedia(`card-${i}`)} />
                  ) : (
                    <button type="button" onClick={() => openMedia(`card-${i}`)}
                      className="w-full py-3 border border-dashed rounded text-xs text-gray-400">+ Afbeelding</button>
                  )}
                  <input type="text" value={item.title || ''} placeholder="Titel"
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], title: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                  <textarea value={item.description || ''} placeholder="Beschrijving" rows={2}
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], description: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                  <input type="text" value={item.link || ''} placeholder="Link URL (bijv. /diensten of https://...)"
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], link: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ items: [...(block.data.items || []), { title: '', description: '', image: '', link: '' }] })}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">+ Kaart toevoegen</button>
          </div>
        );

      case 'testimonial':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Citaat</label>
              <textarea value={block.data.quote || ''} onChange={e => onChange({ quote: e.target.value })}
                rows={4} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Auteur</label>
              <input type="text" value={block.data.author || ''} onChange={e => onChange({ author: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Functie</label>
              <input type="text" value={block.data.role || ''} onChange={e => onChange({ role: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Avatar</label>
              {block.data.avatar ? (
                <div className="flex items-center gap-3">
                  <img src={block.data.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <button type="button" onClick={() => onChange({ avatar: '' })} className="text-red-400 text-sm">Verwijderen</button>
                </div>
              ) : (
                <button type="button" onClick={() => openMedia('avatar')}
                  className="py-2 px-4 border border-dashed rounded text-sm text-gray-400">Selecteer avatar</button>
              )}
            </div>
          </div>
        );

      case 'accordion':
        return (
          <div className={sectionClass}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={block.data.allowMultiple || false}
                onChange={e => onChange({ allowMultiple: e.target.checked })} />
              Meerdere open tegelijk
            </label>
            <label className={labelClass}>Items ({block.data.items?.length || 0})</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(block.data.items || []).map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
                    <button type="button" onClick={() => onChange({ items: block.data.items.filter((_, j) => j !== i) })}
                      className="text-red-400 text-xs">✕</button>
                  </div>
                  <input type="text" value={item.title || ''} placeholder="Vraag / Titel"
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], title: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                  <textarea value={item.content || ''} placeholder="Antwoord / Inhoud" rows={3}
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], content: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ items: [...(block.data.items || []), { title: '', content: '' }] })}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">+ Item toevoegen</button>
          </div>
        );

      case 'counter':
        return (
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Kolommen</label>
              <select value={block.data.columns || 4} onChange={e => onChange({ columns: parseInt(e.target.value) })} className={inputClass}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <label className={labelClass}>Tellers ({block.data.items?.length || 0})</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(block.data.items || []).map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Teller {i + 1}</span>
                    <button type="button" onClick={() => onChange({ items: block.data.items.filter((_, j) => j !== i) })}
                      className="text-red-400 text-xs">✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={item.number || 0} placeholder="Nummer"
                      onChange={e => {
                        const items = [...block.data.items]; items[i] = { ...items[i], number: parseInt(e.target.value) }; onChange({ items });
                      }} className="px-2 py-1 border rounded text-xs" />
                    <input type="text" value={item.suffix || ''} placeholder="Achtervoegsel (+, %, etc)"
                      onChange={e => {
                        const items = [...block.data.items]; items[i] = { ...items[i], suffix: e.target.value }; onChange({ items });
                      }} className="px-2 py-1 border rounded text-xs" />
                  </div>
                  <input type="text" value={item.label || ''} placeholder="Label"
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], label: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ items: [...(block.data.items || []), { number: 0, suffix: '', label: '' }] })}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">+ Teller toevoegen</button>
          </div>
        );

      case 'iconBox':
        return (
          <div className={sectionClass}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kolommen</label>
                <select value={block.data.columns || 3} onChange={e => onChange({ columns: parseInt(e.target.value) })} className={inputClass}>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Stijl</label>
                <select value={block.data.style || 'default'} onChange={e => onChange({ style: e.target.value })} className={inputClass}>
                  <option value="default">Standaard</option>
                  <option value="bordered">Met rand</option>
                  <option value="filled">Gevuld</option>
                </select>
              </div>
            </div>
            <label className={labelClass}>Items ({block.data.items?.length || 0})</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(block.data.items || []).map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
                    <button type="button" onClick={() => onChange({ items: block.data.items.filter((_, j) => j !== i) })}
                      className="text-red-400 text-xs">✕</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="text" value={item.icon || ''} placeholder="Emoji of icoon"
                      onChange={e => {
                        const items = [...block.data.items]; items[i] = { ...items[i], icon: e.target.value }; onChange({ items });
                      }} className="w-16 px-2 py-1 border rounded text-center" />
                    <span className="text-xs text-gray-400">of</span>
                    <button type="button" onClick={() => openMedia(`iconbox-${i}`)}
                      className="text-xs text-blue-600 hover:underline">Afbeelding kiezen</button>
                  </div>
                  <input type="text" value={item.title || ''} placeholder="Titel"
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], title: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                  <textarea value={item.description || ''} placeholder="Beschrijving" rows={2}
                    onChange={e => {
                      const items = [...block.data.items]; items[i] = { ...items[i], description: e.target.value }; onChange({ items });
                    }} className="w-full px-2 py-1 border rounded text-xs" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onChange({ items: [...(block.data.items || []), { icon: '⭐', title: '', description: '' }] })}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm">+ Item toevoegen</button>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Geen editor beschikbaar voor dit bloktype.</p>;
    }
  };

  return (
    <div>
      {renderEditor()}
      <MediaLibrary isOpen={showMedia} onClose={() => { setShowMedia(false); setMediaTarget(null); setMediaFilterType(null); }} onSelect={handleMediaSelect} filterType={mediaFilterType} />
    </div>
  );
}
