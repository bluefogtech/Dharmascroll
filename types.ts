
export interface Quote {
  id: string;
  text: string; // English translation
  hindi: string; // Hindi translation
  source: string; // e.g., "Bhagavad Gita", "Upanishads"
  context?: string; // Chapter/Verse
  themes: string[]; // e.g., ["Peace", "Action", "Duty"]
  sanskrit?: string;
}

export interface UserPreference {
  theme: string;
  weight: number;
}
