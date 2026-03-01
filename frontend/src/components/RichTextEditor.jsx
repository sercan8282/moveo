import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useLanguage } from '../context/LanguageContext';

// Link effect options
const LINK_EFFECTS = [
  { value: '', label: 'Standaard' },
  { value: 'link-effect-underline', label: 'Onderstrepen (grow)' },
  { value: 'link-effect-highlight', label: 'Achtergrond highlight' },
  { value: 'link-effect-glow', label: 'Glow effect' },
  { value: 'link-effect-button', label: 'Knop stijl' },
  { value: 'link-effect-slide', label: 'Slide achtergrond' },
  { value: 'link-effect-border', label: 'Border effect' },
  { value: 'link-effect-arrow', label: 'Met pijl' },
];

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

const MenuBar = ({ editor }) => {
  const { t } = useLanguage();
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkEffect, setLinkEffect] = useState('');
  const linkPopupRef = useRef(null);
  
  if (!editor) return null;

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (linkPopupRef.current && !linkPopupRef.current.contains(e.target)) {
        setShowLinkPopup(false);
      }
    };
    if (showLinkPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLinkPopup]);

  const openLinkPopup = () => {
    // Check if there's already a link and pre-fill values
    const attrs = editor.getAttributes('link');
    setLinkUrl(attrs.href || '');
    // Try to get existing class
    const existingClass = attrs.class || '';
    const existingEffect = LINK_EFFECTS.find(e => e.value && existingClass.includes(e.value));
    setLinkEffect(existingEffect?.value || '');
    setShowLinkPopup(true);
  };

  const applyLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ 
        href: linkUrl,
        class: linkEffect || undefined
      }).run();
    }
    setShowLinkPopup(false);
    setLinkUrl('');
    setLinkEffect('');
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setShowLinkPopup(false);
    setLinkUrl('');
    setLinkEffect('');
  };

  const addImage = () => {
    const url = window.prompt('Image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
  const fontFamilies = [
    { label: 'Inter', value: 'Inter' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Playfair Display', value: 'Playfair Display' }
  ];

  return (
    <div className="editor-toolbar">
      {/* Text Style */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <select
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontFamily(e.target.value).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
          className="text-xs border border-gray-300 rounded px-1 py-1 bg-white"
          value=""
        >
          <option value="">Font</option>
          {fontFamilies.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <select
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontSize(e.target.value).run();
            } else {
              editor.chain().focus().unsetFontSize().run();
            }
          }}
          className="text-xs border border-gray-300 rounded px-1 py-1 bg-white"
          value=""
        >
          <option value="">Grootte</option>
          {fontSizes.map(size => (
            <option key={size} value={size}>{size.replace('px', '')}</option>
          ))}
        </select>
      </div>

      {/* Basic formatting */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active font-bold' : 'font-bold'}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active italic' : 'italic'}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active underline' : 'underline'}
          title="Underline"
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active line-through' : 'line-through'}
          title="Strikethrough"
        >
          S
        </button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <div className="relative">
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-6 h-6 cursor-pointer border-0 p-0 rounded"
            title="Text Color"
          />
        </div>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'is-active' : ''}
          title="Highlight"
        >
          <span className="bg-yellow-200 px-1">H</span>
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
          title="Align Left"
        >
          ≡
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
          title="Align Center"
        >
          ≡
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
          title="Align Right"
        >
          ≡
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          •≡
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Numbered List"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="Quote"
        >
          "
        </button>
      </div>

      {/* Insert */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1 relative">
        <div className="relative">
          <button onClick={openLinkPopup} className={editor.isActive('link') ? 'is-active' : ''} title="Link">
            🔗
          </button>
          {showLinkPopup && (
            <div 
              ref={linkPopupRef}
              className="absolute z-50 top-full left-0 mt-1 p-3 bg-white rounded-lg shadow-xl border w-64"
            >
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link effect</label>
                  <select
                    value={linkEffect}
                    onChange={(e) => setLinkEffect(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
                  >
                    {LINK_EFFECTS.map(effect => (
                      <option key={effect.value} value={effect.value}>{effect.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={applyLink}
                    className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600"
                  >
                    Toepassen
                  </button>
                  {editor.isActive('link') && (
                    <button
                      onClick={removeLink}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600"
                    >
                      Verwijder
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <button onClick={addImage} title="Image">
          🖼
        </button>
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          title="Table"
        >
          ⊞
        </button>
      </div>

      {/* Code */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'is-active' : ''}
          title="Code"
        >
          {'</>'}
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          ―
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          ↷
        </button>
      </div>
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] }
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: null,
        },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none'
      }
    }
  });

  return (
    <div className="tiptap-editor">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
