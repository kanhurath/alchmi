/**
 * Content Configuration for CMS Integration
 * This file serves as the data layer for all website content.
 * Later, this will be replaced with API calls to your Node.js + MySQL backend.
 */

export const siteConfig = {
  siteName: 'Vinay Kulkarni',
  tagline: 'Dharayati Iti Dharmaha',
  description: 'Professional portfolio and insights',
};

export const navigationLinks = [
  { id: 'biography', label: 'Biography', path: '/biography' },
  { id: 'articles',  label: 'Articles',  path: '/articles' },
  { id: 'teaching',  label: 'Teaching',  path: '/teaching' },
  { id: 'talks',     label: 'Videos',    path: '/videos' },
  {
    id: 'events',
    label: 'Events',
    path: '/events',
    children: [
      { id: 'workshops', label: 'Workshops & Retreats', path: '/workshops' },
    ],
  },
  { id: 'connect',   label: 'Connect',   path: '/connect' },
  { id: 'gallery',   label: 'Gallery',   path: '/gallery' },
];

export const hero = {
  title: 'Vinay Kulkarni',
  subtitle: 'Dharayati Iti Dharmaha',
  description: 'Exploring ideas at the intersection of philosophy, technology, and human experience.',
  ctaText: 'Explore My Work',
  ctaLink: '#about',
};

export const about = {
  bio: "Vinay Kulkarni brings over 25 years of global experience in business management and wellness as an entrepreneur, advisor, educator, and marketer. His focus spans business transformation and the meaningful integration of Dharmic principles into organizational practice. He created the Dharmic Enterprise Framework, a model that helps organizations align profit with purpose and evolve as Dharmic enterprises. In Bengaluru, he established a cultural center housing The Upadesha Academy (IKS based workshops & retreats), Darshana Books & Gifts (Indic), and Samvada Bistro—where he explores his passion for fusion cuisine blending traditional Indian and international flavors— alongside ventures including ALCHMI, Sanskritishaala (cultural workshops for children & youth), and Sanathani.com (Indic merchandise). Through this ecosystem, he works to embed Dharmic principles across business, education, and governance.",
  quote: 'Education is not merely the transfer of knowledge or acquisition of skills; it is a transformative process that aligns with one\'s Svabhava and Svadharma.',
  tags: [
    'Dharmic Innovation',
    'IKS',
    'Vedanta',
    'E-commerce Strategy',
    'Meditation',
    'Philosophy',
    'Nation Building',
    'Psychology',
  ],
};

export const articles = [
  {
    id: 1,
    featured: true,
    category: 'Samskrita · Nation Building',
    title: 'Repositioning Sanskrit for India’s Next Civilizational Chapter',
    excerpt: 'Saṃskṛta is not merely a language — it is the very grammar of consciousness, the scaffolding of a civilization that never separated knowing from being.',
    date: 'May 23, 2026',
    url: 'http://localhost:3001/blog/2026/05/23/sa%e1%b9%83sk%e1%b9%9bta-is-not-merely-a-language/',
    image: new URL('../assets/Images/samskrita-nation.png', import.meta.url).href,
  },
  {
    id: 2,
    featured: false,
    category: 'Education \xb7 Vedanta',
    title: 'Vedanta in Education – Or Is Vedanta Itself Education?',
    excerpt: 'Reflecting on a panel discussion that became a churning of minds around what it truly means to educate a human being.',
    date: 'May 17, 2026',
    url: 'http://localhost:3001/blog/2026/05/17/vedanta-in-education-or-is-vedanta-itself-education/',
  },
  {
    id: 3,
    featured: false,
    category: 'Dharma \xb7 Education',
    title: 'The Eight-Second Mind',
    excerpt: 'The average human attention span has collapsed from twelve seconds to eight — and what five quiet days of Bhāratīya cultural education might give back.',
    date: 'May 2, 2026',
    url: 'http://localhost:3001/blog/2026/05/02/the-eight-second-mind/',
  },
  {
    id: 4,
    featured: false,
    category: 'Dharmic Innovation',
    title: 'The Great Inversion',
    excerpt: 'Why sustainable lifestyles must come before sustainable products — a case for Dharmic Innovation.',
    date: 'May 1, 2026',
    url: 'http://localhost:3001/blog/2026/05/01/the-great-inversion/',
  },
  {
    id: 5,
    featured: false,
    category: 'Dharma \xb7 Spirituality',
    title: 'Jala-Brahma: The Sacred Intelligence of Water',
    excerpt: 'A contemplation on the seven streams within, beginning where the Ṝgveda begins — in the primordial waters before creation.',
    date: 'April 23, 2026',
    url: 'http://localhost:3001/blog/2026/04/23/jala-brahma-the-sacred-intelligence-of-water/',
  },
];

export const themes = [
  {
    id: 'dharma',
    devanagari: 'धर्म',
    name: 'Dharma',
    description: 'Exploring the foundational principle that sustains cosmos, society, and the individual — across innovation, economics, and daily life.',
    count: 12,
  },
  {
    id: 'iks',
    devanagari: 'ज्ञान',
    name: 'Indian Knowledge Systems',
    description: 'Mainstreaming the depth of Bhāratīya intellectual heritage — from Vedanta and Yoga to Nyāya and Sāṃkhya — into modern education and research.',
    count: 18,
  },
  {
    id: 'education',
    devanagari: 'शिक्षा',
    name: 'Education',
    description: 'What does it mean to truly educate a human being? Examining pedagogy, Svadharma, and the purpose of learning in a civilization rediscovering itself.',
    count: 15,
  },
  {
    id: 'psychology',
    devanagari: 'मन',
    name: 'Psychology & Self',
    description: 'The inner journey of self-discovery through the lenses of ancient wisdom, modern neuroscience, meditation, and the science of the mind.',
    count: 10,
  },
];

export const testimonials = {
  featured: {
    quote: "The IKS Certificate Course completely shifted how I understand my own discipline. Vinay Ji's ability to translate ancient frameworks into contemporary practice is unlike anything I had encountered in twenty years of academic work.",
    author: 'Dr. Priya Sharma',
    role: 'Associate Professor of Philosophy · Bengaluru',
    program: 'IKS Certificate Course — Cohort 3',
  },
  cards: [
    { id: 1,  cat: 'corporate',          large: false, avatar: 'C', text: "Vinay is an energetic and dynamic Executive with a high sense of urgency. He is meticulous as he uncovers the issues and moves just as thoroughly in developing an action plan, making sure to collaborate with those involved. He has a high level of integrity and authenticity. As a business partner he is fair and objective and able to grasp complicated subjects quickly. His humor and personal approach work to put his teams at ease for the best results. A quality leader!.", author: 'Christine Helin',              role: 'Vice-President · Lovitt & Touché, a Marsh & McLennan Agency LLC Company',                      program: '' },
    { id: 2,  cat: 'corporate',          large: true,  avatar: 'J', text: "I had the good fortune of reporting to Vinay in his role as Chief Operating Officer for Horizon Moving Systems. Vinay has led the company through a tumultuous economy which greatly impacted the moving and transportation industry. He set a new direction for the company, differentiating Horizon as one of the most innovative moving companies around with cutting edge technology and truly professional services. In addition to being a brilliant person, Vinay leads selflessly and with unmatched dedication. He truly embodies our core values of Respect, Integrity, Compassion, Honesty, and Efficiency. I am extremely grateful for Vinay's genuine investment in my growth and development and for being an excellent example of how to lead fearlessly.", author: 'James Pedicone',            role: 'Partner and ex-CoS · Design Pickle ',             program: 'Corporate Workshop' },
    { id: 3,  cat: 'corporate',          large: false, avatar: 'T', text: "The excellent feedback from Swedish customers referred to Horizon Moving Systems provided a very good reason to meet Mr. Kulkarni, COO, in person in 2011. His valuable perspective and input for improvements to the executive strategy for SACCarizona.org has proven valuable for our continued expansion. His energy and high level performance is impressive and will be of great value to the individuals and organizations with which he surrounds himself in the future.", author: 'Tobias Lofstrand',       role: 'Global Envoy Sweden at GPEC, Board Member SACC Arizona, Founder Saleby Lin & Malt, Sweden, + Tax advisor in · the US GPEC',                program: 'Upadesha Academy' },
    { id: 4,  cat: 'corporate',          large: false, avatar: 'J', text: "I have had the privilege of working with Vinay in our BCA organization in developing relationships with like titled business leaders and through that experience came to know of Vinay's vast experience in leadership and his uncanny ability to create a bottom-up and collaborative business culture within his own organization and his ability to share his 'how-to' with other business leaders in a mastermind type of learning Jim Perrine, CEO/President environment. I endorse Vinay as one who knows him and understands the outstanding contribution he can make in an organization.", author: 'Jim Perrine',            role: 'CEO/President · Business Clubs America',                      program: '' },
    { id: 5,  cat: 'retreat',            large: true,  avatar: 'P', text: "It has been a pleasure to have the opportunity of working for Vinay. My experience with Vinay as the Chief Operating Officer for Horizon Moving System was impressive in many ways. Vinay is a part of our executive leadership team yet he is accessible when needed. He willingly gave his time in responding to questions and gave advice to help solve any issues. He displays strong leadership, creative thinking and is very decisive. His high degree of expertise in managing, operating and marketing has led the company to the right direction in this economically challenging period. He has many new ideas for improving business; his new strategies in marketing have been effective and has led the company to overcome the economic downturn. Vinay has helped our company to work as a team. Vinay's intelligence, dedication and goal-oriented leadership has made him a great asset to the company.", author: 'Petcharat Mon',           role: 'Assistant Controller · Suddath Relocation Systems',                   program: '' },
    { id: 6,  cat: 'coaching',           large: false, avatar: 'L', text: "Vinay is a transformational leader who brings tremendous energy, passion and enthusiasm to any position. He successfully accomplishes what he sets out to do by utilizing a 'systems approach' to business. He also has a practical understanding of how to integrate the multiple aspects of a business organization to create efficient and sustainable growth. He clearly understands that the purpose of a business is to create a customer and he deeply cares about customers. I highly recommend Vinay to anyone looking to work with a consummate professional.", author: 'Larry Aldrich',             role: 'Entrepreneur, Philosopher (Amateur),  · Mentor Aldrich Capital Company',              program: '' },
    { id: 7,  cat: 'iks',                large: false, avatar: 'D', text: "Vinay is a thoughtful, strategic and hands-on executive who rolls up his sleeves and gets the job done. He thinks in terms of process and measurements, and how to continually improve results. Vinay is particularly recommended for roles that require business strategy, planning and execution – and those such as product management that involve a high degree of multi-functional interactions.", author: 'Doug Bruhnke',           role: 'CEO/Founder at Global Chamber® ·  Global Chamber',     program: '' },
    { id: 8,  cat: 'iks corporate',      large: false, avatar: 'B', text: "Vinay is a highly motivated individual who has shouldered and mastered many business challenges during his time with our company. He has contributed substantial value during his tenure (as the COO and the CMO) and has always acted with integrity and a focus on results that are in the best interests of Horizon and its employees. An example of his accomplishments is the 2012 strategic plan and budget and associated expense reductions that it contained. A key result of this effort has been a profitable first half of the year under his leadership. He has successfully positioned our company for future growth.", author: 'Bruce Dusenberry', role: 'President & CEO · Horizon Moving Systems, LLC',         program: '.' },
    { id: 9,  cat: 'retreat corporate',  large: false, avatar: 'J', text: "Vinay is a visionary leader with strong organizational skills. He is well-networked,intelligent and professional. I have enjoyed working with Vinay and hope to do so again.", author: 'John Ficorilli',         role: 'Metals Recycling ',                   program: '' },
    { id: 10, cat: 'upadesha',           large: false, avatar: 'E', text: "Vinay is an experienced and capable business consultant. I've had the pleasure of working with Vinay on a few occasions. Most recently, Vinay was involved in assisting E. LaBrent Chrite, President at Bentley University my organization is assessing multiple bids for a CRM system to be used in our admissions area. The resource requirements, coordinating costs and operational issues related to this investment were significant. Vinay not only helped us decide on a particular vendor but added considerable value by leading us through a process to better understand the particular needs for such a system in our organization. While we obviously considered these issues, Vinay's 'framing' of multiple scenarios allowed us to make a more strategic investment in this much needed technology. He was thorough, professional, accessible and I will not hesitate to utilize him in the future.", author: 'E. LaBrent Chrite',        role: 'President at Bentley University · Bentley University',                       program: '' },
    { id: 11, cat: 'coaching',           large: false, avatar: 'S', text: "Vinay is a solutions-oriented professional. He has the ability to see situations from a holistic approach, both as a visionary and strategist. He is very bright and always full of ideas and thoughtful perspective that brings possibility to any situation.", author: 'Suzanne McFarlina',            role: 'Strategic | Maximizer | Positivity · Executive Leadership Coach',           program: '' },
    { id: 12, cat: 'iks',                large: false, avatar: 'L', text: "Vinay's intuitive understanding of people combined with his systems approach to business makes him a rare and valuable trusted advisor. If you have a need for your company to grow, then Vinay can help you take your company to a higher level.", author: 'Leamon Crooms',    role: 'Founder | SEO Strategist · Strategic Growth Advisors, LLC',                   program: '' },
  ],
  stats: [
    { number: '500', suffix: '+', label: 'Participants Trained',    desc: 'Across all programs' },
    { number: '4',   suffix: '',  label: 'IKS Certificate Cohorts', desc: 'Since 2025' },
    { number: '15',  suffix: '+', label: 'Organisations Served',    desc: 'Universities, corporates & NGOs' },
    { number: '5',   suffix: '★', label: 'Average Rating',          desc: 'Across all programs' },
  ],
  pullQuotes: [
    { id: 1, program: 'IKS Course',         avatar: 'p', text: '"One of the best sessions till date. The dimensions it opened up. The mindset shift that happened today which made me take the road of going deeper into what sort of research are we doing. Today s session made me question and also, to dig deeper into becoming someone who asks the right kind of questions. Thank you to the organizing team. Gratitude."', author: 'Research Scholar',     role: 'Central University of Gujarat · Gujarat' },
    { id: 2, program: 'Leadership Retreat',  avatar: 'H', text: '"The case studies provided by Kulkarni sir gave an in-depth understanding of the need to preserve. I request Avnish sir if possible to conduct such lecture by Kulkarni sir once again. His insights are truly knowledgeable."', author: 'Hardi', role: 'Master Research Scholar · University of Mumbai · Mumbai' },
    { id: 3, program: 'Upadesha Workshop',   avatar: 'K', text: '"Vinay Kulkarni Ji s lecture was highly practical. He explained very simply why and how digital documentation should be done in the context of IKS."', author: 'Karuna Kumari Ram',     role: 'Research Scholar · Sido Kanhu Murmu University' },
    { id: 4, program: 'Coaching',            avatar: 'L', text: '"Vinay s intuitive understanding of people combined with his systems approach to business makes him a rare and valuable trusted advisor. If you have a need for your company to grow, then Vinay can help you take your company to a higher level."', author: 'Leamon Crooms',    role: 'Founder | SEO Strategist · Strategic Growth Advisors, LLC',                   program: '' },
  ],
};

export const quote = {
  text: 'The greatest discovery of our generation is that we can change our lives by changing our attitudes of mind.',
  author: 'William James',
};

export const talks = [
  {
    id: 1,
    title: 'The Future of Technology',
    event: 'Tech Summit 2024',
    date: '2024-03-15',
    location: 'Online',
  },
  {
    id: 2,
    title: 'Philosophy in Daily Life',
    event: 'Workshop Series',
    date: '2024-02-20',
    location: 'Virtual',
  },
];

export const connectSections = [
  {
    id: 'email',
    label: 'Email',
    value: 'vinay@example.com',
    icon: '✉️',
  },
  {
    id: 'twitter',
    label: 'Twitter',
    value: '@vinaykulkarni',
    icon: '𝕏',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    value: 'vinaykulkarni',
    icon: '💼',
  },
];

export const footerContent = {
  copyright: '© 2024 Vinay Kulkarni. All rights reserved.',
  links: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Sitemap', href: '/sitemap' },
  ],
};
