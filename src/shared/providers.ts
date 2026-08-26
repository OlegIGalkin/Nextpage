export interface SearchEngine {
  id: 'google' | 'bing' | 'yandex'
  name: string
  url: string
}

export interface AiChat {
  id: 'deepseek' | 'perplexity' | 'openai'
  name: string
  url: string
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com' },
  { id: 'yandex', name: 'Yandex', url: 'https://yandex.com' }
]

export const AI_CHATS: AiChat[] = [
  { id: 'deepseek', name: 'Deep Seek', url: 'https://chat.deepseek.com' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai' },
  { id: 'openai', name: 'Open AI', url: 'https://chatgpt.com' }
]

export const DEFAULT_SEARCH_ENGINE = SEARCH_ENGINES[0]
export const DEFAULT_AI_CHAT = AI_CHATS[0]
