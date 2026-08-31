/**
 * ArticleRichEditor
 * CKEditor 5 (GPL / open-source) rich text editor for the Articles CMS.
 *
 * Uses a custom upload adapter instead of SimpleUploadAdapter so that
 * the image URL is constructed from the same origin as the upload
 * request — works correctly in both development and production.
 */

import { useMemo } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Alignment,
  Autoformat,
  AutoImage,
  AutoLink,
  BlockQuote,
  Bold,
  CodeBlock,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontSize,
  GeneralHtmlSupport,
  Heading,
  HtmlEmbed,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  MediaEmbed,
  Paragraph,
  PasteFromOffice,
  SourceEditing,
  Strikethrough,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  Underline,
  Undo,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import './ArticleRichEditor.css';

// ── Custom upload adapter ─────────────────────────────────────────────────────
// CKEditor's FileRepository calls createUploadAdapter(loader) to get an
// adapter for each upload.  We derive the server base from the uploadUrl
// prop so the returned image URL always points to the right host (localhost
// in dev, production domain in prod).

class ArticleUploadAdapter {
  constructor(loader, uploadUrl, token) {
    this.loader    = loader;
    this.uploadUrl = uploadUrl;
    // Server base = everything before /api/...
    this.serverBase = uploadUrl.replace(/\/api\/.*$/, '');
  }

  async upload() {
    const file = await this.loader.file;
    const body = new FormData();
    body.append('upload', file);   // CKEditor convention: field name is 'upload'

    const token = localStorage.getItem('vk_admin_token');
    const res   = await fetch(this.uploadUrl, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.error) {
      throw new Error(json.error?.message || `Upload failed (${res.status})`);
    }

    // Backend returns { url: '/uploads/articles/…' } (relative) or an
    // absolute URL.  Make sure CKEditor gets an absolute URL it can load.
    const url = json.url?.startsWith('http')
      ? json.url
      : this.serverBase + json.url;

    return { default: url };
  }

  abort() { /* nothing to cancel for fetch */ }
}

// ── Editor plugin list (no SimpleUploadAdapter — replaced by custom adapter) ──
const PLUGINS = [
  Essentials, Undo, Autoformat, PasteFromOffice,
  Bold, Italic, Underline, Strikethrough,
  Heading, Paragraph,
  FontSize, FontColor, FontBackgroundColor,
  Alignment,
  List, ListProperties,
  Indent, IndentBlock,
  Link, AutoLink, LinkImage,
  Image, AutoImage, ImageInsert, ImageUpload, ImageToolbar,
  ImageCaption, ImageStyle, ImageResize,
  Table, TableToolbar, TableProperties, TableCellProperties,
  TableCaption, TableColumnResize,
  BlockQuote,
  CodeBlock,
  MediaEmbed,
  HtmlEmbed,
  SourceEditing,
  GeneralHtmlSupport,
];

const TOOLBAR = {
  items: [
    'undo', 'redo',
    '|',
    'heading',
    '|',
    'bold', 'italic', 'underline', 'strikethrough',
    '|',
    'fontSize', 'fontColor', 'fontBackgroundColor',
    '|',
    'alignment',
    '-',
    'bulletedList', 'numberedList', 'outdent', 'indent',
    '|',
    'link', 'insertImage', 'mediaEmbed', 'insertTable',
    '|',
    'blockQuote', 'codeBlock', 'htmlEmbed',
    '|',
    'sourceEditing',
  ],
  shouldNotGroupWhenFull: true,
};

// ── Config builder ────────────────────────────────────────────────────────────
function buildConfig(uploadUrl) {
  // Factory function passed to extraPlugins; receives the editor instance.
  function UploadAdapterPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
      new ArticleUploadAdapter(loader, uploadUrl);
  }

  return {
    licenseKey:   'GPL',
    plugins:      PLUGINS,
    extraPlugins: [UploadAdapterPlugin],
    toolbar:      TOOLBAR,

    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading2',  view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3',  view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4',  view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      ],
    },

    fontSize: {
      options: ['tiny', 'small', 'default', 'big', 'huge'],
    },

    image: {
      toolbar: [
        'imageStyle:inline', 'imageStyle:block', 'imageStyle:side',
        '|',
        'toggleImageCaption', 'imageTextAlternative',
        '|',
        'linkImage',
      ],
      insert: { integrations: ['upload', 'url'] },
    },

    table: {
      contentToolbar: [
        'tableColumn', 'tableRow', 'mergeTableCells',
        'tableProperties', 'tableCellProperties',
      ],
    },

    list: {
      properties: { styles: true, startIndex: true, reversed: true },
    },

    codeBlock: {
      languages: [
        { language: 'plaintext',   label: 'Plain text'  },
        { language: 'javascript',  label: 'JavaScript'  },
        { language: 'python',      label: 'Python'      },
        { language: 'html',        label: 'HTML'        },
        { language: 'css',         label: 'CSS'         },
        { language: 'sql',         label: 'SQL'         },
      ],
    },

    htmlSupport: {
      allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
    },

    mediaEmbed: { previewsInData: false },

    link: {
      defaultProtocol: 'https://',
      decorators: {
        openInNewTab: {
          mode:       'manual',
          label:      'Open in new tab',
          attributes: { target: '_blank', rel: 'noreferrer noopener' },
        },
      },
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ArticleRichEditor({ value, onChange, uploadUrl }) {
  // Memoise so the config object (and the UploadAdapterPlugin closure) is
  // stable across re-renders — CKEditor only reads config on first mount.
  const config = useMemo(() => buildConfig(uploadUrl), [uploadUrl]);

  return (
    <div className="art-rich-editor">
      <CKEditor
        editor={ClassicEditor}
        config={config}
        data={value || ''}
        onChange={(_event, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
