export type Category = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'other' | 'overall';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: Date;
}

export interface Budget {
  category: Category;
  limit: number;
  spent: number;
}

export const categoryLabels: Record<Category, string> = {
  food: 'Food & Dining',
  transport: 'Transportation',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  bills: 'Bills & Utilities',
  health: 'Health & Fitness',
  other: 'Other',
  overall: 'Overall Budget',
};

export const categoryIcons: Record<Category, string> = {
  food: '🍕',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎬',
  bills: '📄',
  health: '💊',
  other: '📦',
  overall: '💰',
};

export const categoryColors: Record<Category, string> = {
  food: 'hsl(24, 95%, 53%)',
  transport: 'hsl(217, 91%, 60%)',
  shopping: 'hsl(280, 68%, 60%)',
  entertainment: 'hsl(328, 85%, 60%)',
  bills: 'hsl(158, 64%, 42%)',
  health: 'hsl(0, 72%, 55%)',
  other: 'hsl(210, 15%, 55%)',
  overall: 'hsl(45, 93%, 47%)',
};

// AI-like category prediction based on keywords
const categoryKeywords: Record<Category, string[]> = {
  food: [
    'restaurant', 'food', 'lunch', 'dinner', 'breakfast', 'coffee', 'grocery', 'pizza', 'burger', 'sushi', 
    'cafe', 'eat', 'meal', 'snack', 'drink', 'beer', 'wine', 'bar', 'pub', 'tea', 'bakery', 'deli', 
    'takeout', 'delivery', 'doordash', 'grubhub', 'ubereats', 'zomato', 'swiggy', 'mcdonalds', 'starbucks', 
    'kfc', 'subway', 'dominos', 'chipotle', 'taco', 'chicken', 'pasta', 'salad', 'brunch', 'buffet', 
    'canteen', 'cafeteria', 'thali', 'biryani', 'dosa', 'curry', 'noodles', 'ramen', 'boba', 'juice', 
    'smoothie', 'ice cream', 'dessert', 'cake', 'chocolate', 'supermarket', 'groceries', 'vegetable', 
    'fruit', 'meat', 'dairy', 'bread', 'rice', 'eggs', 'milk', 'cheese', 'snacks', 'chips', 'candy',
    'wendys', 'burgerking', 'popeyes', 'chilis', 'applebees', 'ihop', 'dennys', 'panera', 'dunkin',
    'krispy', 'baskin', 'coldstone', 'jamba', 'panda express', 'taco bell', 'arbys', 'sonic', 'five guys',
    'shake shack', 'in-n-out', 'whataburger', 'wingstop', 'buffalo wild', 'hooters', 'olive garden',
    'red lobster', 'outback', 'texas roadhouse', 'cracker barrel', 'waffle house', 'diner', 'bistro',
    'pizzeria', 'steakhouse', 'seafood', 'bbq', 'barbeque', 'grill', 'kitchen', 'eatery', 'foodie'
  ],
  transport: [
    'uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train', 'flight', 'airline', 'car',
    'ola', 'rapido', 'grab', 'didi', 'bolt', 'toll', 'highway', 'petrol', 'diesel', 'auto', 'rickshaw',
    'bike', 'scooter', 'motorcycle', 'bicycle', 'rental', 'lease', 'maintenance', 'repair', 'service',
    'tyre', 'tire', 'oil change', 'wash', 'valet', 'airport', 'railway', 'ticket', 'pass', 'fare',
    'commute', 'travel', 'trip', 'journey', 'cab', 'carpool', 'rideshare', 'transit', 'subway', 'tram',
    'ferry', 'boat', 'cruise', 'road', 'expressway', 'turnpike', 'uber eats', 'shell', 'bp', 'exxon',
    'chevron', 'mobil', 'texaco', 'citgo', 'sunoco', 'speedway', 'wawa', 'racetrac', 'quiktrip',
    'ev charging', 'tesla', 'supercharger', 'electrify', 'chargepoint', 'blink', 'evgo'
  ],
  shopping: [
    'amazon', 'clothes', 'shoes', 'mall', 'store', 'shop', 'buy', 'purchase', 'order', 'flipkart',
    'walmart', 'target', 'costco', 'ebay', 'aliexpress', 'myntra', 'ajio', 'fashion', 'dress', 'shirt',
    'pants', 'jeans', 'jacket', 'accessories', 'jewelry', 'watch', 'bag', 'purse', 'wallet', 'electronics',
    'gadget', 'phone', 'laptop', 'tablet', 'appliance', 'furniture', 'home', 'decor', 'gift', 'present',
    'online', 'retail', 'marketplace', 'clothing', 'apparel', 'footwear', 'sneakers', 'boots', 'sandals',
    'handbag', 'backpack', 'luggage', 'suitcase', 'ikea', 'wayfair', 'overstock', 'etsy', 'wish',
    'shein', 'zara', 'h&m', 'uniqlo', 'gap', 'old navy', 'banana republic', 'nordstrom', 'macys',
    'kohls', 'jcpenney', 'sears', 'bloomingdales', 'saks', 'neiman marcus', 'best buy', 'apple store',
    'samsung', 'microsoft', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'sony', 'lg', 'nike', 'adidas',
    'puma', 'reebok', 'new balance', 'skechers', 'vans', 'converse', 'under armour', 'lululemon',
    'sephora', 'ulta', 'bath body', 'victoria secret', 'aerie', 'urban outfitters', 'forever 21'
  ],
  entertainment: [
    'movie', 'netflix', 'spotify', 'concert', 'game', 'theater', 'ticket', 'subscription', 'streaming',
    'youtube', 'disney', 'hulu', 'prime video', 'hbo', 'hotstar', 'zee5', 'amazon prime', 'apple music',
    'gaming', 'playstation', 'xbox', 'nintendo', 'steam', 'twitch', 'show', 'drama', 'series', 'music',
    'party', 'club', 'nightclub', 'event', 'festival', 'amusement', 'park', 'zoo', 'museum', 'arcade',
    'bowling', 'karaoke', 'hobby', 'leisure', 'cinema', 'imax', 'theatre', 'opera', 'ballet', 'dance',
    'comedy', 'standup', 'live', 'performance', 'band', 'dj', 'rave', 'lounge', 'casino', 'gambling',
    'bet', 'poker', 'slots', 'lottery', 'bingo', 'escape room', 'laser tag', 'paintball', 'go kart',
    'mini golf', 'putt putt', 'trampoline', 'sky zone', 'dave busters', 'chuck e cheese', 'topgolf',
    'amc', 'regal', 'cinemark', 'imax', 'dolby', 'peacock', 'paramount', 'discovery', 'crunchyroll',
    'funimation', 'apple tv', 'tubi', 'pluto', 'roku', 'pandora', 'tidal', 'deezer', 'soundcloud',
    'audible', 'kindle', 'books', 'reading', 'magazine', 'comic', 'manga', 'anime', 'cosplay'
  ],
  bills: [
    'electric', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance', 'utility', 'electricity',
    'gas bill', 'cable', 'wifi', 'broadband', 'mobile', 'telephone', 'landline', 'maintenance', 'society',
    'hoa', 'property', 'tax', 'emi', 'loan', 'credit card', 'payment', 'due', 'subscription', 'membership',
    'annual', 'monthly', 'quarterly', 'bill', 'invoice', 'statement', 'account', 'balance', 'installment',
    'premium', 'deductible', 'coverage', 'policy', 'claim', 'verizon', 'att', 'tmobile', 'sprint',
    'comcast', 'xfinity', 'spectrum', 'cox', 'frontier', 'centurylink', 'at&t', 'dish', 'directv',
    'geico', 'progressive', 'state farm', 'allstate', 'liberty mutual', 'farmers', 'usaa', 'nationwide',
    'metlife', 'prudential', 'aetna', 'cigna', 'united health', 'blue cross', 'anthem', 'humana',
    'pg&e', 'con ed', 'duke energy', 'dominion', 'xcel', 'entergy', 'ameren', 'dte', 'ppl'
  ],
  health: [
    'gym', 'doctor', 'medicine', 'pharmacy', 'hospital', 'fitness', 'vitamin', 'dentist', 'clinic',
    'medical', 'health', 'consultation', 'checkup', 'test', 'lab', 'diagnostic', 'surgery', 'treatment',
    'therapy', 'physiotherapy', 'mental', 'wellness', 'spa', 'massage', 'yoga', 'meditation', 'supplement',
    'protein', 'healthcare', 'specialist', 'eye', 'vision', 'optometrist', 'prescription', 'drug',
    'chemist', 'apollo', 'medplus', '1mg', 'netmeds', 'pharmeasy', 'cvs', 'walgreens', 'rite aid',
    'planet fitness', 'la fitness', '24 hour fitness', 'anytime fitness', 'equinox', 'orangetheory',
    'crossfit', 'f45', 'soulcycle', 'peloton', 'classpass', 'fitbit', 'whoop', 'garmin', 'apple watch',
    'myfitnesspal', 'noom', 'weight watchers', 'nutrisystem', 'herbalife', 'gnc', 'vitamin shoppe',
    'urgent care', 'er', 'emergency', 'ambulance', 'nurse', 'therapist', 'psychiatrist', 'psychologist',
    'counselor', 'chiropractor', 'acupuncture', 'dermatologist', 'cardiologist', 'pediatrician',
    'obgyn', 'orthopedic', 'neurologist', 'oncologist', 'radiologist', 'pathologist', 'surgeon'
  ],
  other: [],
  overall: [],
};

export function predictCategory(description: string): Category {
  const lowerDesc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category as Category;
    }
  }
  
  return 'other';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getMonthlyExpenses(expenses: Expense[], date: Date = new Date()): Expense[] {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
  });
}

export function getCategoryTotals(expenses: Expense[]): Record<Category, number> {
  const totals: Record<Category, number> = {
    food: 0,
    transport: 0,
    shopping: 0,
    entertainment: 0,
    bills: 0,
    health: 0,
    other: 0,
    overall: 0,
  };
  
  expenses.forEach(expense => {
    totals[expense.category] += expense.amount;
  });
  
  return totals;
}

export function exportToCSV(expenses: Expense[]): string {
  const headers = ['Date', 'Description', 'Category', 'Amount'];
  const rows = expenses.map(expense => [
    formatDate(new Date(expense.date)),
    expense.description,
    categoryLabels[expense.category],
    expense.amount.toFixed(2),
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function downloadCSV(expenses: Expense[], filename: string = 'expenses.csv'): void {
  const csv = exportToCSV(expenses);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Sample data for demo
export const sampleExpenses: Expense[] = [
  { id: generateId(), amount: 45.50, description: 'Grocery shopping at Whole Foods', category: 'food', date: new Date('2024-01-15') },
  { id: generateId(), amount: 12.00, description: 'Uber ride to office', category: 'transport', date: new Date('2024-01-15') },
  { id: generateId(), amount: 89.99, description: 'New running shoes', category: 'shopping', date: new Date('2024-01-14') },
  { id: generateId(), amount: 15.99, description: 'Netflix subscription', category: 'entertainment', date: new Date('2024-01-13') },
  { id: generateId(), amount: 120.00, description: 'Electric bill', category: 'bills', date: new Date('2024-01-12') },
  { id: generateId(), amount: 50.00, description: 'Gym membership', category: 'health', date: new Date('2024-01-11') },
  { id: generateId(), amount: 35.00, description: 'Dinner at Italian restaurant', category: 'food', date: new Date('2024-01-10') },
  { id: generateId(), amount: 25.00, description: 'Gas station', category: 'transport', date: new Date('2024-01-09') },
  { id: generateId(), amount: 199.00, description: 'Amazon order', category: 'shopping', date: new Date('2024-01-08') },
  { id: generateId(), amount: 22.00, description: 'Movie tickets', category: 'entertainment', date: new Date('2024-01-07') },
];

export const sampleBudgets: Budget[] = [
  { category: 'food', limit: 500, spent: 280 },
  { category: 'transport', limit: 200, spent: 137 },
  { category: 'shopping', limit: 300, spent: 289 },
  { category: 'entertainment', limit: 150, spent: 38 },
  { category: 'bills', limit: 400, spent: 120 },
  { category: 'health', limit: 100, spent: 50 },
];
