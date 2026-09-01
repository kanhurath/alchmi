import { useState } from 'react';

/**
 * Reusable admin graphic field — supports built-in preset, image (URL or upload),
 * raw SVG code, and raw HTML code.
 *
 * Props:
 *   label        — field label string
 *   presetLabel  — if provided, adds a "Built-in / Preset" option (value: 'svg_preset')
 *   form         — object with { graphic_type, graphic_url, graphic_svg, graphic_html }
 *   onChange     — (patch) => void  — called with partial object to merge into form
 *   onUpload     — async (File) => { url }  — required for the Upload option
 *   uploadNote   — optional hint shown under file input
 */
export function GraphicField({ label, presetLabel, form, onChange, onUpload, uploadNote }) {
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');

  const type = form.graphic_type || (presetLabel ? 'svg_preset' : '');

  const setType = (t) => {
    setUploadError('');
    onChange({ graphic_type: t });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setUploadError('');
    try {
      const { url } = await onUpload(file);
      onChange({ graphic_type: 'image', graphic_url: url });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="adm-field">
      <label className="adm-label">{label || 'Section Graphic'}</label>

      {/* Type selector */}
      <select
        className="adm-input"
        value={type}
        onChange={e => setType(e.target.value)}
        style={{ marginBottom: '0.6rem' }}
      >
        {presetLabel && <option value="svg_preset">{presetLabel}</option>}
        <option value="">Built-in / Default</option>
        <option value="image">Image (URL or upload)</option>
        <option value="svg">SVG Code</option>
        <option value="html">HTML Code</option>
        <option value="none">None / Hidden</option>
      </select>

      {/* Image mode — URL + optional upload */}
      {type === 'image' && (
        <div>
          <input
            className="adm-input"
            type="text"
            value={form.graphic_url || ''}
            onChange={e => onChange({ graphic_url: e.target.value })}
            placeholder="https://… or leave blank and upload below"
            style={{ marginBottom: '0.4rem' }}
          />
          {form.graphic_url && (
            <img
              src={form.graphic_url}
              alt="preview"
              style={{ display: 'block', maxWidth: 220, maxHeight: 140, objectFit: 'contain',
                       marginBottom: '0.5rem', border: '1px solid #e5d9c4', borderRadius: 4, background: '#fff' }}
            />
          )}
          {onUpload && (
            <>
              <input type="file" accept="image/*" className="adm-file" onChange={handleFile} disabled={uploading} />
              {uploading    && <p className="adm-hint">Uploading…</p>}
              {uploadError  && <p className="adm-hint" style={{ color: '#c0392b' }}>{uploadError}</p>}
            </>
          )}
          {uploadNote && <p className="adm-hint">{uploadNote}</p>}
        </div>
      )}

      {/* SVG code */}
      {type === 'svg' && (
        <textarea
          className="adm-input adm-textarea"
          value={form.graphic_svg || ''}
          rows={8}
          onChange={e => onChange({ graphic_svg: e.target.value })}
          placeholder={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  …\n</svg>'}
        />
      )}

      {/* HTML code */}
      {type === 'html' && (
        <textarea
          className="adm-input adm-textarea"
          value={form.graphic_html || ''}
          rows={8}
          onChange={e => onChange({ graphic_html: e.target.value })}
          placeholder={'<div class="my-graphic">\n  …\n</div>'}
        />
      )}

      <p className="adm-hint" style={{ marginTop: '0.3rem' }}>
        {(type === '' || type === 'svg_preset') && (presetLabel
          ? `Uses the built-in decorative SVG selected above. Switch to another type to replace it.`
          : 'Uses the default built-in graphic for this section.')}
        {type === 'image' && 'Paste an external URL, or upload a file below — both set the image source.'}
        {type === 'svg'   && 'Paste complete SVG markup. Rendered inline inside the section.'}
        {type === 'html'  && 'Paste HTML markup. Rendered inside a div with dangerouslySetInnerHTML.'}
        {type === 'none'  && 'The graphic area will be hidden on the frontend.'}
      </p>
    </div>
  );
}
