// Walleto Atelier Marks — custom icon set
// All icons: 24x24 viewBox, duotone construction

export const FAMILY_STYLES = {
  primary:   { fillTint: 'rgba(42, 20, 180, 0.06)',  accent: '#2a14b4', tileBg: '#eeecf8' },
  secondary: { fillTint: 'rgba(0, 108, 73, 0.08)',   accent: '#006c49', tileBg: '#e6f1ec' },
  tertiary:  { fillTint: 'rgba(71, 0, 171, 0.07)',   accent: '#7c3aed', tileBg: '#efe8fb' },
};

export const CATEGORY_ICONS = {
  grocery: {
    label: 'Grocery', family: 'secondary',
    svg: (s) => `
      <path d="M3.5 5.5h2.2l1.8 9.2a1.5 1.5 0 0 0 1.47 1.2h8.5a1.5 1.5 0 0 0 1.48-1.24l1.05-5.96H7" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="9" cy="20" r="1.3" fill="var(--accent)" stroke="${s}" stroke-width="1.2"/>
      <circle cx="17.5" cy="20" r="1.3" fill="var(--accent)" stroke="${s}" stroke-width="1.2"/>
      <path d="M11 10.5v3.5M14 10.5v3.5M17 10.5v3.5" stroke="${s}" stroke-width="1.2" stroke-linecap="round"/>
    `,
  },
  restaurant: {
    label: 'Restaurant', family: 'secondary',
    svg: (s) => `
      <path d="M7 3v8a2 2 0 0 0 2 2h0v8" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M5 3v5a2 2 0 0 0 2 2M9 3v5a2 2 0 0 1-2 2" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M17 3c-2 0-3 2.5-3 5.5S15 13 17 13v8" stroke="${s}" stroke-width="1.5" stroke-linecap="round" fill="var(--fill-tint)"/>
    `,
  },
  coffee: {
    label: 'Coffee', family: 'secondary',
    svg: (s) => `
      <path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M8 3c-.5 1 .5 2 0 3M11.5 3c-.5 1 .5 2 0 3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M4 21h14" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
    `,
  },
  shopping: {
    label: 'Shopping', family: 'tertiary',
    svg: (s) => `
      <path d="M5 7h14l-1 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 7z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="9.5" cy="11" r=".8" fill="var(--accent)"/>
      <circle cx="14.5" cy="11" r=".8" fill="var(--accent)"/>
    `,
  },
  transport: {
    label: 'Transport', family: 'primary',
    svg: (s) => `
      <path d="M5 14l1.5-6.5A2 2 0 0 1 8.45 6h7.1a2 2 0 0 1 1.95 1.5L19 14v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M5 14h14" stroke="${s}" stroke-width="1.2"/>
      <circle cx="8" cy="16.5" r="1.1" fill="var(--accent)" stroke="${s}" stroke-width="1"/>
      <circle cx="16" cy="16.5" r="1.1" fill="var(--accent)" stroke="${s}" stroke-width="1"/>
    `,
  },
  fuel: {
    label: 'Fuel', family: 'primary',
    svg: (s) => `
      <rect x="4" y="4" width="9" height="16" rx="1.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <rect x="6" y="7" width="5" height="4" rx=".6" fill="var(--accent)" opacity=".6"/>
      <path d="M4 20h9" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M13 8h2.5a1.5 1.5 0 0 1 1.5 1.5V16a2 2 0 0 0 2 2 2 2 0 0 0 2-2V8l-2-2" stroke="${s}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
  },
  home: {
    label: 'Home', family: 'primary',
    svg: (s) => `
      <path d="M4 11l8-6.5L20 11v8.5a1 1 0 0 1-1 1h-4v-6h-4v6H5a1 1 0 0 1-1-1V11z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M10 14.5h4" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    `,
  },
  utilities: {
    label: 'Utilities', family: 'primary',
    svg: (s) => `
      <path d="M12 3l-5 10h4l-1 8 6-10h-4l1-8z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="18" cy="6" r="1" fill="var(--accent)"/>
    `,
  },
  rent: {
    label: 'Rent', family: 'primary',
    svg: (s) => `
      <rect x="3.5" y="8" width="17" height="12" rx="1.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <path d="M3.5 12h17" stroke="${s}" stroke-width="1.2"/>
      <path d="M7 4l5 3 5-3" stroke="${s}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M9 16h3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="16" cy="16.2" r="1" fill="var(--accent)"/>
    `,
  },
  health: {
    label: 'Health', family: 'tertiary',
    svg: (s) => `
      <path d="M10 3.5h4v6h6v4.5h-6v6h-4v-6H4V9.5h6z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="1.4" fill="var(--accent)"/>
    `,
  },
  fitness: {
    label: 'Fitness', family: 'secondary',
    svg: (s) => `
      <rect x="2" y="9" width="3" height="6" rx=".8" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <rect x="19" y="9" width="3" height="6" rx=".8" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <rect x="5" y="7" width="2" height="10" rx=".5" fill="var(--accent)"/>
      <rect x="17" y="7" width="2" height="10" rx=".5" fill="var(--accent)"/>
      <path d="M7 12h10" stroke="${s}" stroke-width="1.8" stroke-linecap="round"/>
    `,
  },
  entertainment: {
    label: 'Entertainment', family: 'tertiary',
    svg: (s) => `
      <rect x="3.5" y="5" width="17" height="13" rx="1.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <path d="M10 9.5v4l3.5-2-3.5-2z" fill="var(--accent)" stroke="${s}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M8 21h8" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M12 18v3" stroke="${s}" stroke-width="1.2"/>
    `,
  },
  subscription: {
    label: 'Subscription', family: 'primary',
    svg: (s) => `
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" stroke="${s}" stroke-width="1.5" stroke-linecap="round" fill="var(--fill-tint)"/>
      <path d="M20.5 3.5V7h-3.5" stroke="${s}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="2.2" fill="var(--accent)"/>
    `,
  },
  travel: {
    label: 'Travel', family: 'tertiary',
    svg: (s) => `
      <path d="M2.5 14.5l5-1 4.5-9 2 .5-2 8.5 5-1 1.5-2 2 .5-1.5 4 1.5 4-2 .5-1.5-2-5-1 2 8.5-2 .5-4.5-9-5-1z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.3" stroke-linejoin="round"/>
    `,
  },
  education: {
    label: 'Education', family: 'primary',
    svg: (s) => `
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" stroke="${s}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <path d="M21 10v5" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    `,
  },
  gift: {
    label: 'Gifts', family: 'tertiary',
    svg: (s) => `
      <rect x="3.5" y="9" width="17" height="4" rx=".8" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <rect x="4.5" y="13" width="15" height="7.5" rx="1" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <path d="M12 9v11.5" stroke="${s}" stroke-width="1.5"/>
      <path d="M12 9s-3 0-3.5-2a1.5 1.5 0 0 1 3-.5c.5 1 .5 2.5.5 2.5zM12 9s3 0 3.5-2a1.5 1.5 0 0 0-3-.5c-.5 1-.5 2.5-.5 2.5z" fill="var(--accent)" stroke="${s}" stroke-width="1.2" stroke-linejoin="round"/>
    `,
  },
  salary: {
    label: 'Salary', family: 'secondary',
    svg: (s) => `
      <rect x="3.5" y="6" width="17" height="12" rx="1.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="2.8" fill="var(--accent)" stroke="${s}" stroke-width="1.3"/>
      <path d="M12 10.6v2.8M11 11.5h1.6a.6.6 0 0 1 0 1.2H11" stroke="${s}" stroke-width="1" stroke-linecap="round" fill="none"/>
      <circle cx="6" cy="9" r=".8" fill="${s}"/>
      <circle cx="18" cy="15" r=".8" fill="${s}"/>
    `,
  },
  savings: {
    label: 'Savings', family: 'secondary',
    svg: (s) => `
      <path d="M4 12c0-3.5 3.5-6 8-6 1 0 2 .1 3 .4L17.5 5l1 3.2c1 .9 1.5 2 1.5 3.3 0 1.2-.5 2.3-1.3 3.1V18h-2.7l-1-1.2c-.5.1-1 .2-1.5.2v1H10v-1.2a8 8 0 0 1-3-1.3L5 17v-3.3C4.4 13 4 12 4 12z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="8" cy="10.5" r=".8" fill="${s}"/>
      <path d="M12 7.5h3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
    `,
  },
  taxes: {
    label: 'Taxes', family: 'primary',
    svg: (s) => `
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <path d="M8 7.5h8M8 11h8M8 14.5h5" stroke="${s}" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="16" cy="16.5" r="2.2" fill="var(--accent)" stroke="${s}" stroke-width="1.2"/>
      <path d="M14.8 15.3l2.4 2.4M17.2 15.3l-2.4 2.4" stroke="${s}" stroke-width="1" stroke-linecap="round"/>
    `,
  },
  pets: {
    label: 'Pets', family: 'tertiary',
    svg: (s) => `
      <ellipse cx="12" cy="17" rx="4.5" ry="3.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <ellipse cx="6.5" cy="11" rx="1.8" ry="2.2" fill="var(--accent)" stroke="${s}" stroke-width="1.2"/>
      <ellipse cx="17.5" cy="11" rx="1.8" ry="2.2" fill="var(--accent)" stroke="${s}" stroke-width="1.2"/>
      <ellipse cx="9.5" cy="7" rx="1.5" ry="2" fill="var(--accent)" stroke="${s}" stroke-width="1.2"/>
      <ellipse cx="14.5" cy="7" rx="1.5" ry="2" fill="var(--accent)" stroke="${s}" stroke-width="1.2"/>
    `,
  },
};

export const ACCOUNT_ICONS = {
  bank: {
    label: 'Bank', family: 'primary',
    svg: (s) => `
      <path d="M3.5 9.5L12 4l8.5 5.5H3.5z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M5 10v7M9 10v7M15 10v7M19 10v7" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M3 20h18" stroke="${s}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="12" cy="7.5" r=".9" fill="var(--accent)"/>
    `,
  },
  cash: {
    label: 'Cash', family: 'secondary',
    svg: (s) => `
      <rect x="2.5" y="7" width="19" height="10" rx="1.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="2.6" fill="var(--accent)" stroke="${s}" stroke-width="1.3"/>
      <path d="M12 10.5v3M11 11.3h1.5a.7.7 0 0 1 0 1.4H11" stroke="${s}" stroke-width="1" stroke-linecap="round" fill="none"/>
      <circle cx="5.5" cy="12" r=".7" fill="${s}"/>
      <circle cx="18.5" cy="12" r=".7" fill="${s}"/>
    `,
  },
  card: {
    label: 'Card', family: 'primary',
    svg: (s) => `
      <rect x="2.5" y="6" width="19" height="12" rx="1.8" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <rect x="2.5" y="9.5" width="19" height="2.2" fill="${s}"/>
      <rect x="5" y="14" width="4" height="2" rx=".4" fill="var(--accent)"/>
      <path d="M14 14.5h4M14 16h3" stroke="${s}" stroke-width="1.2" stroke-linecap="round"/>
    `,
  },
  investment: {
    label: 'Investment', family: 'secondary',
    svg: (s) => `
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <path d="M6 15l3.5-4 3 2.5L16 8l2 2" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="18" cy="10" r="1.3" fill="var(--accent)" stroke="${s}" stroke-width="1"/>
    `,
  },
  atm: {
    label: 'ATM', family: 'primary',
    svg: (s) => `
      <rect x="4" y="3.5" width="16" height="17" rx="1.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <rect x="6.5" y="6" width="11" height="5" rx=".6" fill="var(--accent)" opacity=".3" stroke="${s}" stroke-width="1.2"/>
      <rect x="6.5" y="13" width="4" height="1.5" rx=".3" fill="${s}"/>
      <rect x="13" y="13" width="4" height="1.5" rx=".3" fill="${s}"/>
      <rect x="6.5" y="16" width="11" height="2" rx=".4" fill="var(--accent)"/>
    `,
  },
  globe: {
    label: 'Global', family: 'primary',
    svg: (s) => `
      <circle cx="12" cy="12" r="8.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <path d="M3.5 12h17M12 3.5a13 13 0 0 1 0 17M12 3.5a13 13 0 0 0 0 17" stroke="${s}" stroke-width="1.3" fill="none"/>
      <circle cx="12" cy="12" r="2" fill="var(--accent)"/>
    `,
  },
  vault: {
    label: 'Vault', family: 'primary',
    svg: (s) => `
      <rect x="3" y="4" width="18" height="15" rx="1.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <circle cx="12" cy="11.5" r="3.5" fill="none" stroke="${s}" stroke-width="1.5"/>
      <circle cx="12" cy="11.5" r="1.2" fill="var(--accent)"/>
      <path d="M12 7v1.5M12 14.5v1.5M15.5 11.5h1M7.5 11.5h1" stroke="${s}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M6 19v1.5M18 19v1.5" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>
    `,
  },
  chart: {
    label: 'Portfolio', family: 'secondary',
    svg: (s) => `
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.8" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <rect x="7" y="13" width="2.2" height="4" rx=".3" fill="${s}"/>
      <rect x="11" y="10" width="2.2" height="7" rx=".3" fill="${s}"/>
      <rect x="15" y="7" width="2.2" height="10" rx=".3" fill="var(--accent)"/>
    `,
  },
  wallet: {
    label: 'Wallet', family: 'primary',
    svg: (s) => `
      <path d="M3.5 7.5a2 2 0 0 1 2-2h11l1 2H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5.5a2 2 0 0 1-2-2v-10z" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="17" cy="13.5" r="1.4" fill="var(--accent)" stroke="${s}" stroke-width="1.2"/>
      <path d="M3.5 10h13" stroke="${s}" stroke-width="1.2"/>
    `,
  },
  crypto: {
    label: 'Crypto', family: 'tertiary',
    svg: (s) => `
      <circle cx="12" cy="12" r="8.5" fill="var(--fill-tint)" stroke="${s}" stroke-width="1.5"/>
      <path d="M9.5 7.5v9M11.5 7.5v9" stroke="${s}" stroke-width="1.2"/>
      <path d="M8 9.5h5.5a2 2 0 0 1 0 4H8M8 13.5h6a2 2 0 0 1 0 4H8" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
};

export const CATEGORY_NAME_MAP = {
  // Food
  'Food & Dining':      'restaurant',
  'Food and Dining':    'restaurant',
  'Food and Drinks':    'restaurant',
  'Food & Drinks':      'restaurant',
  'Food and Drink':     'restaurant',
  'Food & Drink':       'restaurant',
  'Dining':             'restaurant',
  'Eating Out':         'restaurant',
  'Restaurants':        'restaurant',
  'Restaurant':         'restaurant',
  'Grocery':            'grocery',
  'Groceries':          'grocery',
  'Supermarket':        'grocery',
  'Coffee':             'coffee',
  'Cafe':               'coffee',
  // Shopping
  'Shopping':           'shopping',
  'Clothing':           'shopping',
  'Online Shopping':    'shopping',
  // Transport
  'Transport':          'transport',
  'Transportation':     'transport',
  'Commute':            'transport',
  'Public Transport':   'transport',
  'Fuel':               'fuel',
  'Petrol':             'fuel',
  'Gas':                'fuel',
  // Home
  'Home':               'home',
  'Housing':            'home',
  'Bills & Utilities':  'utilities',
  'Bills and Utilities':'utilities',
  'Utilities':          'utilities',
  'Bills':              'utilities',
  'Electricity':        'utilities',
  'Water':              'utilities',
  'Internet':           'utilities',
  'Phone':              'utilities',
  'Rent':               'rent',
  'Mortgage':           'rent',
  // Health
  'Health':             'health',
  'Medical':            'health',
  'Healthcare':         'health',
  'Health & Fitness':   'health',
  'Health and Fitness': 'health',
  'Fitness':            'fitness',
  'Gym':                'fitness',
  'Personal Care':      'fitness',
  'Beauty':             'fitness',
  // Entertainment
  'Entertainment':      'entertainment',
  'Movies':             'entertainment',
  'Games':              'entertainment',
  'Streaming':          'subscription',
  'Subscriptions':      'subscription',
  'Subscription':       'subscription',
  // Travel
  'Travel':             'travel',
  'Holiday':            'travel',
  'Vacation':           'travel',
  // Education
  'Education':          'education',
  'Books':              'education',
  'Courses':            'education',
  // Gifts
  'Gifts':              'gift',
  'Gift':               'gift',
  'Donations':          'gift',
  'Charity':            'gift',
  // Income
  'Salary':             'salary',
  'Income':             'salary',
  'Other Income':       'salary',
  'Wages':              'salary',
  'Freelance':          'salary',
  // Finance
  'Savings':            'savings',
  'Investments':        'savings',
  'Investment':         'savings',
  'Taxes':              'taxes',
  'Tax':                'taxes',
  // Misc
  'Pets':               'pets',
  'Pet Care':           'pets',
  // Vehicle / transport variants
  'Vehicle':            'fuel',
  'Car':                'fuel',
  'Auto':               'fuel',
  // Leisure / other
  'Leisure':            'entertainment',
  'Fun':                'entertainment',
  'Hobbies':            'entertainment',
  // Medicine / health variants
  'Medicine':           'health',
  'Pharmacy':           'health',
  'Doctor':             'health',
  'Home Improvement':   'home',
};

export const ALL_ICON_KEYS = Object.keys(CATEGORY_ICONS);
export const ALL_ACCOUNT_KEYS = Object.keys(ACCOUNT_ICONS);
