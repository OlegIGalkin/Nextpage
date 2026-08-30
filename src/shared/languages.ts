export interface LlmLanguage {
  id: string
  name: string
}

export const LLM_LANGUAGES: LlmLanguage[] = [
  { id: 'en', name: 'English' },
  { id: 'zh', name: '中文 (简体)' },
  { id: 'es', name: 'Español' },
  { id: 'hi', name: 'हिन्दी' },
  { id: 'ar', name: 'العربية' },
  { id: 'pt', name: 'Português' },
  { id: 'ru', name: 'Русский' },
  { id: 'ja', name: '日本語' },
  { id: 'fr', name: 'Français' },
  { id: 'de', name: 'Deutsch' },
  { id: 'ko', name: '한국어' },
  { id: 'it', name: 'Italiano' },
  { id: 'tr', name: 'Türkçe' },
  { id: 'id', name: 'Bahasa Indonesia' },
  { id: 'vi', name: 'Tiếng Việt' },
  { id: 'pl', name: 'Polski' },
  { id: 'nl', name: 'Nederlands' },
  { id: 'th', name: 'ไทย' },
  { id: 'uk', name: 'Українська' },
  { id: 'bn', name: 'বাংলা' },
  { id: 'ur', name: 'اردو' },
  { id: 'fa', name: 'فارسی' }
]

export const DEFAULT_LLM_LANGUAGE = LLM_LANGUAGES[0]
