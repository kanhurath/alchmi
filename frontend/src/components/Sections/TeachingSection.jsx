import { Link } from 'react-router-dom';
import './TeachingSection.css';

const MAIN_CARDS = [
  {
    numeral: 'i.',
    title: '36-Hour Certificate Course on IKS',
    subtitle: 'Intensive · Open Enrolment',
    desc: 'A structured, faculty-led journey through the foundational frameworks of Indian Knowledge Systems — for educators, professionals, and learners seeking a substantive engagement with the field.',
    note: 'Cohort-based · See events for next intake',
    delay: '',
  },
  {
    numeral: 'ii.',
    title: 'Faculty Development Programs',
    subtitle: 'For Universities & Institutions',
    desc: 'Workshops and intensives for university faculty on integrating IKS frameworks into pedagogy, research methodology, and curriculum design across disciplines.',
    note: 'Custom-designed per institution',
    delay: ' reveal-delay-1',
  },
  {
    numeral: 'iii.',
    title: 'IKS Curriculum Design',
    subtitle: 'University & Institutional',
    desc: 'End-to-end curriculum design and pedagogical architecture for institutions building IKS programs — drawing on first-principles pedagogy rather than retrofitted Western templates.',
    note: 'Multi-month engagements',
    delay: ' reveal-delay-1',
  },
  {
    numeral: 'iv.',
    title: 'Corporate Leadership Retreats',
    subtitle: 'For CXOs & Leadership Teams',
    desc: 'Immersive workshops blending strategy, organizational design, mental-model evaluation, and dharmic enterprise principles — for boards, founders, and senior leadership teams.',
    note: 'Two- to five-day formats',
    delay: ' reveal-delay-2',
  },
];

const ADDITIONAL_CARDS = [
  {
    numeral: 'v.',
    title: 'Creativity & Wellness Programs',
    subtitle: 'For CXOs & Key Leadership',
    desc: 'Creativity building and enhancement programs, and the design and implementation of corporate wellness programs grounded in Bhāratīya knowledge.',
    delay: '',
  },
  {
    numeral: 'vi.',
    title: 'Organizational Culture Redesign',
    subtitle: 'Culture & HR Systems',
    desc: 'Redesigning organizational culture and HR systems, mental model evaluation and alignment, and designing training and learning systems for company-wide growth.',
    delay: ' reveal-delay-1',
  },
  {
    numeral: 'vii.',
    title: 'Upadesha Academy Workshops',
    subtitle: 'Immersive · Open Enrolment',
    desc: 'Immersive, experiential workshops led by top intellectuals in Business, Spirituality, Sanskrit, Wellness, Yoga, and Psychology — open to all.',
    delay: ' reveal-delay-2',
  },
];

function TeachingSection() {




  return (
    <div className="teaching-page">

      {/* ── HEADER ── */}
      <div className="teaching-header reveal">
        <div className="teaching-header-left">
          <span className="section-numeral">iv.</span>
          <h1>Teaching &amp; <em>Pedagogy</em></h1>
        </div>
        <Link to="/teaching" className="all-offerings-link">
          All Offerings
        </Link>
      </div>

      {/* ── INTRO ── */}
      <p className="teaching-intro reveal reveal-delay-1">
        A range of teaching engagements — from short certificate courses to university curriculum design, faculty development programs, and corporate leadership retreats. Built on immersive, experiential pedagogy with IKS at its core.
      </p>

      {/* ── 2×2 GRID ── */}
      <div className="teaching-grid">
        {MAIN_CARDS.map((card) => (
          <div key={card.numeral} className={`teach-card reveal${card.delay}`}>
            <div className="teach-card-header">
              <span className="card-numeral">{card.numeral}</span>
              <div className="card-title-block">
                <div className="card-title">{card.title}</div>
                <div className="card-subtitle">{card.subtitle}</div>
              </div>
            </div>
            <p className="card-desc">{card.desc}</p>
            <div className="card-note">{card.note}</div>
          </div>
        ))}
      </div>

      {/* ── ADDITIONAL OFFERINGS ── */}
      <div className="additional-section">
        <div className="additional-label reveal">Also Available</div>
        <div className="additional-grid">
          {ADDITIONAL_CARDS.map((card) => (
            <div key={card.numeral} className={`additional-card reveal${card.delay}`}>
              <span className="add-numeral">{card.numeral}</span>
              <div className="add-title">{card.title}</div>
              <div className="add-subtitle">{card.subtitle}</div>
              <p className="add-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default TeachingSection;
