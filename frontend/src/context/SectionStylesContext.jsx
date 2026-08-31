import { createContext, useContext, useEffect, useState } from 'react';
import { getAllSectionStyles } from '../services/sectionStylesApi';

const EMPTY = { bg_color: '', height_px: '', font_color: '', font_size_px: '', title_font_color: '', title_font_size_px: '' };

const SectionStylesContext = createContext({});

export function SectionStylesProvider({ children }) {
  const [styles, setStyles] = useState({});

  useEffect(() => {
    getAllSectionStyles().then(setStyles).catch(() => {});
  }, []);

  return (
    <SectionStylesContext.Provider value={styles}>
      {children}
    </SectionStylesContext.Provider>
  );
}

export function useSectionStyle(key) {
  const styles = useContext(SectionStylesContext);
  return styles[key] || EMPTY;
}

// Helper: build inline style + scoped CSS from a section style object
export function buildSectionCss(ss, cssClass) {
  const style = {
    ...(ss.bg_color  ? { background: ss.bg_color }          : {}),
    ...(ss.height_px ? { minHeight: `${ss.height_px}px` }   : {}),
  };
  const css = [
    ss.font_color        ? `.${cssClass} { color: ${ss.font_color} !important; }`                                        : '',
    ss.font_color        ? `.${cssClass} .article-excerpt { color: ${ss.font_color} !important; }`                       : '',
    ss.font_color        ? `.${cssClass} .article-date { color: ${ss.font_color} !important; }`                          : '',
    ss.font_size_px      ? `.${cssClass} { font-size: ${ss.font_size_px}px !important; }`                                : '',
    ss.title_font_color  ? `.${cssClass} .article-title { color: ${ss.title_font_color} !important; }`                   : '',
    ss.title_font_size_px? `.${cssClass} .article-title { font-size: ${ss.title_font_size_px}px !important; }`           : '',
  ].filter(Boolean).join('\n');
  return { style, css };
}
