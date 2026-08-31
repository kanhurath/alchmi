import './PageLoader.css';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

const DEFAULTS = {
  bgColor:    '#8b2e33',
  iconType:   'text',
  iconText:   'ॐ',
  iconColor:  '#ffea00',
  iconUrl:    '',
  iconWidth:  '',
  iconHeight: '',
  lineColor:  '#ffea00',
};

function PageLoader({ settings = {} }) {
  const s = { ...DEFAULTS, ...settings };

  const iconSrc = s.iconUrl
    ? (s.iconUrl.startsWith('http') ? s.iconUrl : `${API_ROOT}${s.iconUrl}`)
    : null;

  return (
    <div className="page-loader" style={{ background: s.bgColor }}>
      {s.iconType === 'image' && iconSrc ? (
        <img
          src={iconSrc}
          alt="Loading"
          className="loader-icon-img"
          style={{
            width:  s.iconWidth  ? `${s.iconWidth}px`  : undefined,
            height: s.iconHeight ? `${s.iconHeight}px` : '120px',
          }}
        />
      ) : (
        <div className="loader-om" style={{ color: s.iconColor }}>
          {s.iconText || 'ॐ'}
        </div>
      )}
      <div className="loader-line" style={{ background: s.lineColor }} />
    </div>
  );
}

export default PageLoader;
