
export interface Quote {
  id: string;
  text: string; // English translation (from 'english')
  hindi: string; // Hindi translation (from 'hindi')
  tamil?: string; // Tamil translation (from 'tamil')
  source: string; // Reference (from 'reference')
  context?: string; 
  themes: string[]; // Tags (from 'tags')
  sanskrit?: string;
}

export interface UserPreference {
  theme: string;
  weight: number;
}
