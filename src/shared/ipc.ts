export const IPC = {
  getConfig: 'get-config',
  resolveUrl: 'resolve-url',
  openExternal: 'open-external',
  searchNavigationBlocked: 'search-navigation-blocked'
} as const

export const SEARCH_PARTITION = 'persist:search-engine'
export const CHAT_PARTITION = 'persist:ai-chat'
