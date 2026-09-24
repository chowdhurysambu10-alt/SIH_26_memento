/**
 * Districts grouped by State for platform forms and filter dropdowns
 */

export const JHARKHAND_DISTRICTS: string[] = [
  'Bokaro',
  'Chatra',
  'Deoghar',
  'Dhanbad',
  'Dumka',
  'East Singhbhum',
  'Garhwa',
  'Giridih',
  'Godda',
  'Gumla',
  'Hazaribagh',
  'Jamtara',
  'Khunti',
  'Koderma',
  'Latehar',
  'Lohardaga',
  'Pakur',
  'Palamu',
  'Ramgarh',
  'Ranchi',
  'Sahibganj',
  'Saraikela Kharsawan',
  'Simdega',
  'West Singhbhum',
];

export const ALL_DISTRICTS: string[] = [
  ...JHARKHAND_DISTRICTS,
].sort((a, b) => a.localeCompare(b));
