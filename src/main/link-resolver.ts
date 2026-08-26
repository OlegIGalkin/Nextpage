import { isRedirectPath, isSearchEngineHost } from '../shared/search-hosts'

const RESOLVE_TIMEOUT_MS = 8000

function looksLikeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
    const decoded = Buffer.from(normalized + pad, 'base64').toString('utf8')
    return decoded || null
  } catch {
    return null
  }
}

function firstHttpParam(params: URLSearchParams, names: string[]): string | null {
  for (const name of names) {
    const raw = params.get(name)
    if (!raw) continue
    const candidates = [raw, safeDecode(raw)]
    for (const candidate of candidates) {
      if (candidate && looksLikeHttpUrl(candidate)) {
        return candidate
      }
    }
  }
  return null
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parseGoogleRedirect(url: URL): string | null {
  if (!isSearchEngineHost(url.hostname)) return null
  if (!url.pathname.startsWith('/url') && !url.pathname.startsWith('/aclk') && !url.pathname.startsWith('/imgres')) {
    return null
  }
  return firstHttpParam(url.searchParams, ['url', 'q', 'imgurl'])
}

function parseBingRedirect(url: URL): string | null {
  if (!url.hostname.toLowerCase().includes('bing.com')) return null
  if (!url.pathname.toLowerCase().includes('/ck/a')) return null
  const encoded = url.searchParams.get('u')
  if (!encoded) return null
  let payload = encoded
  if (payload.startsWith('a1')) {
    payload = payload.slice(2)
  }
  const decoded = decodeBase64Url(payload)
  if (decoded && looksLikeHttpUrl(decoded)) {
    return decoded
  }
  const asUrl = safeDecode(encoded)
  return looksLikeHttpUrl(asUrl) ? asUrl : null
}

function parseYandexRedirect(url: URL): string | null {
  const host = url.hostname.toLowerCase()
  if (!host.includes('yandex.') && host !== 'ya.ru' && !host.endsWith('.ya.ru')) {
    return null
  }
  if (!isRedirectPath(url.pathname)) {
    return null
  }
  const fromQuery = firstHttpParam(url.searchParams, ['url', 'to', 'u', 'target'])
  if (fromQuery) return fromQuery

  const data = url.searchParams.get('*data') || url.searchParams.get('data')
  if (data) {
    const decoded = decodeBase64Url(data)
    if (decoded) {
      const match = decoded.match(/https?:\/\/[^\s"'<>]+/)
      if (match && looksLikeHttpUrl(match[0])) {
        return match[0]
      }
    }
  }
  return null
}

export function parseRedirectUrl(href: string): string | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }

  return parseGoogleRedirect(url) || parseBingRedirect(url) || parseYandexRedirect(url)
}

export function needsNetworkResolve(href: string): boolean {
  try {
    const url = new URL(href)
    return isSearchEngineHost(url.hostname) && isRedirectPath(url.pathname) && !parseRedirectUrl(href)
  } catch {
    return false
  }
}

async function followRedirects(href: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS)
  try {
    const head = await fetch(href, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    })
    if (head.url) {
      return head.url
    }
  } catch {
    // Some hosts reject HEAD; try a GET and drop the body.
  } finally {
    clearTimeout(timer)
  }

  const getController = new AbortController()
  const getTimer = setTimeout(() => getController.abort(), RESOLVE_TIMEOUT_MS)
  try {
    const response = await fetch(href, {
      method: 'GET',
      redirect: 'follow',
      signal: getController.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    })
    await response.body?.cancel()
    return response.url || href
  } catch {
    return href
  } finally {
    clearTimeout(getTimer)
  }
}

export async function resolveNativeUrl(href: string): Promise<string> {
  const parsed = parseRedirectUrl(href)
  if (parsed) {
    return parsed
  }
  if (needsNetworkResolve(href)) {
    return followRedirects(href)
  }
  return href
}
