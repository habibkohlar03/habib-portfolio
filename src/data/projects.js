// Real projects. Descriptions are based on what each live site states about itself (checked 19 Nov 2026).
// `url: null` means the official address could not be verified: the card is shown without a link.
// Thumbnails: /public/images/projects/<id>.webp, generated from the live homepages by the
// "Capture project screenshots" GitHub workflow. Until it has run, a branded panel is shown instead.

const project = (p) => ({ role: null, tech: [], image: `/images/projects/${p.id}.webp`, ...p });

export const projects = [
  project({
    id: 'leadzsoft',
    name: 'LeadzSoft',
    category: 'SEO & Web Development Agency',
    description: 'Website for a digital company offering SEO, GEO (AI-search optimisation), web and software development, and business consulting.',
    url: 'https://leadzsoft.co/',
    tech: ['WordPress', 'Elementor'],
  }),
  project({
    id: 'reflax',
    name: 'Reflax',
    category: 'Hiring Platform',
    description: 'A hiring platform connecting businesses with reviewed freelancers and experts, with business and profile directories and recruitment services.',
    url: 'https://reflax.org/',
    tech: ['Next.js'],
  }),
  project({
    id: 'brightgate',
    name: 'Bright Gate Group',
    category: 'Financial Advisory',
    description: 'Dubai-based financial business advisory site covering forex brokerage, crypto exchange, family office and hedge fund setup.',
    url: 'https://brightgate.ae/',
    tech: ['Next.js'],
  }),
  project({
    id: 'aipilot',
    name: 'AiPilot',
    category: 'FinTech White-Label',
    description: 'Marketing site for white-label trading, CRM, prop firm, payment gateway and prediction-market platforms for brokers and fintech companies.',
    url: 'https://aipilot.io/',
    tech: ['WordPress', 'Elementor'],
  }),
  project({
    id: 'ecoxent',
    name: 'Ecoxent',
    category: 'E-commerce',
    description: 'Online store for a Pakistani natural personal-care brand: hair oil, creams, serums, soaps and shampoos, with cart, order tracking and COD.',
    url: 'https://ecoxent.com/',
    tech: ['WordPress', 'WooCommerce', 'Elementor'],
  }),
  project({
    id: 'gulzar-sons-furniture',
    name: 'Gulzar Sons Furniture',
    category: 'E-commerce',
    description: 'Catalogue and online shop for a Chiniot furniture maker: royal beds, sofas, dinings, diwans and handicrafts, with city portfolio pages and a blog.',
    url: 'https://gulzarsonsfurniture.com/',
    tech: ['WordPress', 'WooCommerce', 'Elementor'],
  }),
  project({
    id: 'maxmag',
    name: 'MaxMag',
    category: 'Media & Digital Platform',
    description: 'A global platform showcasing influencers, models, creative talent, branding, events, and digital marketing services.',
    url: 'https://maxmag.net/',
    tech: ['WordPress', 'Elementor'],
  }),
  project({
    id: 'all-roofing-calculators',
    name: 'All Roofing Calculators',
    category: 'Calculator Tools',
    description: 'A library of free roofing calculators for materials, roof measurement and cost estimates.',
    url: null, // official domain not verified yet: add it here
  }),
  project({
    id: 'jmc-cleanup-services',
    name: 'JMC Cleanup Services',
    category: 'Cleaning Services',
    description: 'Website for a cleanup services business in Australia.',
    url: null, // official domain not verified yet: add it here
  }),
];
