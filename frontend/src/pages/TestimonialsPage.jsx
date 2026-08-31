import { useState, useEffect } from 'react';
import { useReveal } from '../hooks/useReveal';
import InnerPageHero from '../components/Sections/InnerPageHero';
import { getTestimonialsData } from '../services/testimonialsApi';
import './TestimonialsPage.css';

// ── Static fallback data ──────────────────────────────────────────────────────

const STATIC_HERO = {
  eyebrow: 'Community',
  title: 'Words of',
  title_em: 'Gratitude',
  subtitle: 'Reflections from students, entrepreneurs, educators, and seekers who have engaged with Vinay Ji\'s work across workshops, talks, and coaching.',
  breadcrumb: 'Testimonials',
};

const STATIC_FILTERS = [
  { id: 1, key_name: 'iks',       label: 'IKS Course',  sort_order: 0 },
  { id: 2, key_name: 'corporate', label: 'Corporate',   sort_order: 1 },
  { id: 3, key_name: 'retreat',   label: 'Retreats',    sort_order: 2 },
  { id: 4, key_name: 'upadesha',  label: 'Upadesha',    sort_order: 3 },
  { id: 5, key_name: 'coaching',  label: 'Coaching',    sort_order: 4 },
];

const STATIC_FEATURED = {
  quote: "The IKS Certificate Course completely shifted how I understand my own discipline. Vinay Ji's ability to translate ancient frameworks into contemporary practice is unlike anything I had encountered in twenty years of academic work.",
  author: 'Dr. Priya Sharma',
  role: 'Associate Professor of Philosophy · Bengaluru',
  program: 'IKS Certificate Course — Cohort 3',
};

const STATIC_CARDS = [
  { id: 1,  cat_keys: 'corporate', large: false, avatar: 'C', text: "Vinay is an energetic and dynamic Executive with a high sense of urgency. He is meticulous as he uncovers the issues and moves just as thoroughly in developing an action plan, making sure to collaborate with those involved. He has a high level of integrity and authenticity. As a business partner he is fair and objective and able to grasp complicated subjects quickly. His humor and personal approach work to put his teams at ease for the best results. A quality leader!", author: 'Christine Helin', role: 'Vice-President · Lovitt & Touché, a Marsh & McLennan Agency LLC Company', program: '' },
  { id: 2,  cat_keys: 'corporate', large: true,  avatar: 'J', text: "I had the good fortune of reporting to Vinay in his role as Chief Operating Officer for Horizon Moving Systems. Vinay has led the company through a tumultuous economy which greatly impacted the moving and transportation industry. He set a new direction for the company, differentiating Horizon as one of the most innovative moving companies around with cutting edge technology and truly professional services. In addition to being a brilliant person, Vinay leads selflessly and with unmatched dedication.", author: 'James Pedicone', role: 'Partner and ex-CoS · Design Pickle', program: 'Corporate Workshop' },
  { id: 3,  cat_keys: 'corporate upadesha', large: false, avatar: 'T', text: "The excellent feedback from Swedish customers referred to Horizon Moving Systems provided a very good reason to meet Mr. Kulkarni, COO, in person in 2011. His valuable perspective and input for improvements to the executive strategy for SACCarizona.org has proven valuable for our continued expansion.", author: 'Tobias Lofstrand', role: 'Global Envoy Sweden at GPEC, Board Member SACC Arizona', program: 'Upadesha Academy' },
  { id: 4,  cat_keys: 'corporate', large: false, avatar: 'J', text: "I have had the privilege of working with Vinay in our BCA organization in developing relationships with like titled business leaders and through that experience came to know of Vinay's vast experience in leadership and his uncanny ability to create a bottom-up and collaborative business culture.", author: 'Jim Perrine', role: 'CEO/President · Business Clubs America', program: '' },
  { id: 5,  cat_keys: 'retreat',   large: true,  avatar: 'P', text: "My experience with Vinay as the Chief Operating Officer for Horizon Moving System was impressive in many ways. He displays strong leadership, creative thinking and is very decisive. His high degree of expertise in managing, operating and marketing has led the company to the right direction.", author: 'Petcharat Mon', role: 'Assistant Controller · Suddath Relocation Systems', program: '' },
  { id: 6,  cat_keys: 'coaching',  large: false, avatar: 'L', text: "Vinay is a transformational leader who brings tremendous energy, passion and enthusiasm to any position. He successfully accomplishes what he sets out to do by utilizing a 'systems approach' to business. He clearly understands that the purpose of a business is to create a customer and he deeply cares about customers.", author: 'Larry Aldrich', role: 'Entrepreneur, Philosopher (Amateur) · Mentor Aldrich Capital Company', program: '' },
  { id: 7,  cat_keys: 'iks',       large: false, avatar: 'D', text: "Vinay is a thoughtful, strategic and hands-on executive who rolls up his sleeves and gets the job done. He thinks in terms of process and measurements, and how to continually improve results.", author: 'Doug Bruhnke', role: 'CEO/Founder at Global Chamber® · Global Chamber', program: '' },
  { id: 8,  cat_keys: 'iks corporate', large: false, avatar: 'B', text: "Vinay is a highly motivated individual who has shouldered and mastered many business challenges during his time with our company. He has contributed substantial value and has always acted with integrity and a focus on results that are in the best interests of Horizon and its employees.", author: 'Bruce Dusenberry', role: 'President & CEO · Horizon Moving Systems, LLC', program: '' },
  { id: 9,  cat_keys: 'retreat corporate', large: false, avatar: 'J', text: "Vinay is a visionary leader with strong organizational skills. He is well-networked, intelligent and professional.", author: 'John Ficorilli', role: 'Metals Recycling', program: '' },
  { id: 10, cat_keys: 'upadesha',  large: false, avatar: 'E', text: "Vinay is an experienced and capable business consultant. Vinay not only helped us decide on a particular vendor but added considerable value by leading us through a process to better understand the particular needs for such a system in our organization.", author: 'E. LaBrent Chrite', role: 'President at Bentley University · Bentley University', program: '' },
  { id: 11, cat_keys: 'coaching',  large: false, avatar: 'S', text: "Vinay is a solutions-oriented professional. He has the ability to see situations from a holistic approach, both as a visionary and strategist. He is very bright and always full of ideas and thoughtful perspective.", author: 'Suzanne McFarlina', role: 'Strategic | Maximizer | Positivity · Executive Leadership Coach', program: '' },
  { id: 12, cat_keys: 'iks',       large: false, avatar: 'L', text: "Vinay's intuitive understanding of people combined with his systems approach to business makes him a rare and valuable trusted advisor. If you have a need for your company to grow, then Vinay can help you take your company to a higher level.", author: 'Leamon Crooms', role: 'Founder | SEO Strategist · Strategic Growth Advisors, LLC', program: '' },
];

const STATIC_STATS = [
  { id: 1, number: '500', suffix: '+', label: 'Participants Trained',    description: 'Across all programs' },
  { id: 2, number: '4',   suffix: '',  label: 'IKS Certificate Cohorts', description: 'Since 2025' },
  { id: 3, number: '15',  suffix: '+', label: 'Organisations Served',    description: 'Universities, corporates & NGOs' },
  { id: 4, number: '5',   suffix: '★', label: 'Average Rating',          description: 'Across all programs' },
];

const STATIC_PULL_QUOTES = [
  { id: 1, program: 'IKS Course',        avatar: 'P', text: '"One of the best sessions till date. The dimensions it opened up. The mindset shift that happened today which made me take the road of going deeper into what sort of research are we doing. Gratitude."', author: 'Research Scholar', role: 'Central University of Gujarat' },
  { id: 2, program: 'Leadership Retreat', avatar: 'H', text: '"The case studies provided by Kulkarni sir gave an in-depth understanding of the need to preserve. His insights are truly knowledgeable."', author: 'Hardi', role: 'Master Research Scholar · University of Mumbai' },
  { id: 3, program: 'Upadesha Workshop',  avatar: 'K', text: '"Vinay Kulkarni Ji\'s lecture was highly practical. He explained very simply why and how digital documentation should be done in the context of IKS."', author: 'Karuna Kumari Ram', role: 'Research Scholar · Sido Kanhu Murmu University' },
  { id: 4, program: 'Coaching',           avatar: 'L', text: '"Vinay\'s intuitive understanding of people combined with his systems approach to business makes him a rare and valuable trusted advisor."', author: 'Leamon Crooms', role: 'Founder | SEO Strategist · Strategic Growth Advisors, LLC' },
];

// ── UI helpers ────────────────────────────────────────────────────────────────

function Stars() {
  return (
    <div className="t-stars">
      {[...Array(5)].map((_, i) => <div key={i} className="t-star" />)}
    </div>
  );
}

const stagger = (i) => i % 3 === 1 ? 'reveal-delay-1' : i % 3 === 2 ? 'reveal-delay-2' : '';

// ── Page ──────────────────────────────────────────────────────────────────────

function TestimonialsPage() {
  useReveal();
  const [active, setActive] = useState('all');

  const [hero,       setHero]       = useState(null);
  const [filters,    setFilters]    = useState([]);
  const [featured,   setFeatured]   = useState(null);
  const [cards,      setCards]      = useState([]);
  const [stats,      setStats]      = useState([]);
  const [pullQuotes, setPullQuotes] = useState([]);

  useEffect(() => {
    getTestimonialsData()
      .then(d => {
        setHero(d.hero?.eyebrow ? d.hero : null);
        setFilters(Array.isArray(d.filters)    ? d.filters    : []);
        setFeatured(d.featured?.quote          ? d.featured   : null);
        setCards(Array.isArray(d.cards)        ? d.cards      : []);
        setStats(Array.isArray(d.stats)        ? d.stats      : []);
        setPullQuotes(Array.isArray(d.pullQuotes) ? d.pullQuotes : []);
      })
      .catch(() => {});
  }, []);

  const allFilters = [{ id: 0, key_name: 'all', label: 'All' }, ...filters];
  const visible = active === 'all'
    ? cards
    : cards.filter(c => (c.cat_keys || c.cat || '').includes(active));

  return (
    <main>
      {hero && (
        <InnerPageHero
          eyebrow={hero.eyebrow}
          title={hero.title}
          titleEm={hero.title_em}
          subtitle={hero.subtitle}
          breadcrumb={hero.breadcrumb}
        />
      )}

      {/* ── FILTER STRIP ── */}
      <div className="tp-filter-strip reveal">
        <span className="tp-filter-label">Filter by Program</span>
        {allFilters.map(f => (
          <button key={f.id || f.key_name}
            className={`tp-filter-btn${active === f.key_name ? ' active' : ''}`}
            onClick={() => setActive(f.key_name)}>
            {f.label}
          </button>
        ))}
        <span className="tp-count">{visible.length} Testimonial{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── FEATURED QUOTE ── */}
      {featured && (
        <div className="tp-featured reveal">
          <div className="tp-featured-inner">
            <span className="tp-featured-mark">&ldquo;</span>
            <p className="tp-featured-text">{featured.quote}</p>
            <div className="tp-featured-divider"><span className="tp-featured-glyph">✦</span></div>
            <div className="tp-featured-name">{featured.author}</div>
            <div className="tp-featured-role">{featured.role}</div>
            <span className="tp-featured-program">{featured.program}</span>
          </div>
        </div>
      )}

      {/* ── MASONRY CARDS ── */}
      <div className="tp-section">
        <div className="tp-eyebrow reveal">What Participants Say</div>
        <div className="tp-grid">
          {visible.map((card, i) => (
            <div key={card.id}
              className={`tp-card reveal${card.large ? ' large' : ''} ${stagger(i)}`}>
              <Stars />
              <span className="tp-open-quote">&ldquo;</span>
              <p className="tp-text">{card.text}</p>
              <div className="tp-separator" />
              <div className="tp-author-row">
                <div className="tp-avatar">{card.avatar}</div>
                <div className="tp-author-info">
                  <div className="tp-author-name">{card.author}</div>
                  <div className="tp-author-role">{card.role}</div>
                </div>
                <span className="tp-program-badge">{card.program}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS BAND ── */}
      <div className="tp-stats-band">
        {stats.map((s, i) => (
          <div key={s.id} className={`tp-stat reveal ${i > 0 ? `reveal-delay-${Math.min(i, 3)}` : ''}`}>
            <div className="tp-stat-number">{s.number}<em>{s.suffix}</em></div>
            <div className="tp-stat-label">{s.label}</div>
            <div className="tp-stat-desc">{s.description || s.desc}</div>
          </div>
        ))}
      </div>

      {/* ── PULL QUOTES ── */}
      <div className="tp-pull-quotes">
        <div className="tp-eyebrow reveal">Selected Reflections</div>
        <div className="tp-pq-grid">
          {pullQuotes.map((pq, i) => (
            <div key={pq.id} className={`tp-pq-card reveal ${i > 0 ? `reveal-delay-${Math.min(i, 3)}` : ''}`}>
              <span className="tp-pq-program">{pq.program}</span>
              <p className="tp-pq-text">{pq.text}</p>
              <div className="tp-pq-author">
                <div className="tp-pq-avatar">{pq.avatar}</div>
                <div>
                  <div className="tp-pq-name">{pq.author}</div>
                  <div className="tp-pq-role">{pq.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default TestimonialsPage;
