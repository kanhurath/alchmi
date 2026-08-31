import './MarqueeStrip.css';

function MarqueeStrip({ items, marqueeStyle = {} }) {
  if (!items?.length) return null;
  const list    = items.map(i => i.item_text || i);
  const doubled = [...list, ...list];

  const s = marqueeStyle;
  const stripStyle = {
    ...(s.bg_color   ? { background: s.bg_color }   : {}),
    ...(s.height_px  ? { height: `${s.height_px}px`, padding: '0', display: 'flex', alignItems: 'center' } : {}),
  };
  const itemStyle = {
    ...(s.font_color   ? { color: s.font_color }                 : {}),
    ...(s.font_size_px ? { fontSize: `${s.font_size_px}px` }     : {}),
  };
  const dotStyle = s.font_color
    ? { color: s.font_color, opacity: 0.45 }
    : {};

  return (
    <div className="marquee-strip" style={stripStyle} aria-hidden="true">
      <div className="marquee-inner">
        {doubled.map((item, i) => (
          <span key={i}>
            <span className="marquee-item" style={itemStyle}>{item}</span>
            <span className="marquee-dot"  style={dotStyle}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default MarqueeStrip;
