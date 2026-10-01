export type Locale = 'en' | 'rw' | 'fr';

export type TranslationDict = typeof import('./locales/en').en;
