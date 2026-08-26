import { AI_CHATS } from './providers'

const IDENTITY_HOSTS = new Set([
  'accounts.google.com',
  'account.google.com',
  'accounts.youtube.com',
  'login.microsoftonline.com',
  'login.live.com',
  'login.microsoft.com',
  'appleid.apple.com',
  'auth.openai.com',
  'auth0.openai.com'
])

function hostname(urlString: string): string | null {
  try {
    return new URL(urlString).hostname.toLowerCase()
  } catch {
    return null
  }
}

function canonicalHost(host: string): string {
  return host.replace(/^www\./, '')
}

export function isIdentityProviderUrl(urlString: string): boolean {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false
  }
  const host = url.hostname.toLowerCase()
  if (IDENTITY_HOSTS.has(host) || host.startsWith('accounts.google.')) {
    return true
  }
  const path = url.pathname.toLowerCase()
  if (
    (host === 'google.com' || host === 'www.google.com') &&
    (path.includes('/oauth') || path.includes('/signin'))
  ) {
    return true
  }
  return false
}

export function isChatProviderUrl(urlString: string): boolean {
  const host = hostname(urlString)
  if (!host) return false
  const guest = canonicalHost(host)
  return AI_CHATS.some((chat) => {
    const chatHost = hostname(chat.url)
    if (!chatHost) return false
    const provider = canonicalHost(chatHost)
    return guest === provider || guest.endsWith(`.${provider}`)
  })
}
