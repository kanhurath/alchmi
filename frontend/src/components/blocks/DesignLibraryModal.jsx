import { BLOCK_DEFS } from '../../data/blockDefs';
import './DesignLibraryModal.css';

export function DesignLibraryModal({ onSelect, onClose }) {
  return (
    <div className="dl-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dl-modal">
        <div className="dl-head">
          <div>
            <h3 className="dl-title">Design Library</h3>
            <p className="dl-hint">Choose a block to add to the page.</p>
          </div>
          <button className="dl-close" onClick={onClose}>✕</button>
        </div>
        <div className="dl-grid">
          {BLOCK_DEFS.map(def => (
            <button key={def.type} className="dl-card" onClick={() => onSelect(def)}>
              <div className="dl-icon">{def.icon}</div>
              <div className="dl-name">{def.label}</div>
              <div className="dl-desc">{def.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
