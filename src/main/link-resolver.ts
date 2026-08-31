import { isRedirectPath, isSearchEngineHost } from '../shared/search-hosts'

const RESOLVE_TIMEOUT_MS = 8000
const MAX_REDIRECT_HOPS = 5
const RESOLVE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type ResolveFetch = (input: string, init?: RequestInit) => Promise<Response>

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

function isGoogleRedirectPath(pathname: string): boolean {
  const path = pathname.toLowerCase()
  return (
    path.startsWith('/url') ||
    path.startsWith('/aclk') ||
    path.startsWith('/imgres') ||
    path === '/goto' ||
    path.startsWith('/goto/')
  )
}

function parseGoogleRedirect(url: URL): string | null {
  if (!isSearchEngineHost(url.hostname)) return null
  if (!isGoogleRedirectPath(url.pathname)) {
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

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400
}

function resolveLocation(current: string, location: string): string | null {
  try {
    return new URL(location, current).href
  } catch {
    return null
  }
}

function nativeFromCandidate(candidate: string, fallback: string): string {
  return parseRedirectUrl(candidate) || candidate || fallback
}

async function followRedirects(href: string, fetchFn: ResolveFetch): Promise<string> {
  let current = href
  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS)
    try {
      const response = await fetchFn(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': RESOLVE_USER_AGENT }
      })
      await response.body?.cancel()

      if (isRedirectStatus(response.status)) {
        const location = response.headers.get('location')
        if (!location) {
          return nativeFromCandidate(response.url || current, current)
        }
        const next = resolveLocation(current, location)
        if (!next) {
          return current
        }
        const parsed = parseRedirectUrl(next)
        if (parsed && !needsNetworkResolve(parsed)) {
          return parsed
        }
        current = parsed || next
        if (!needsNetworkResolve(current)) {
          return current
        }
        continue
      }

      if (response.url && response.url !== current) {
        return nativeFromCandidate(response.url, current)
      }
      return current
    } catch {
      return current
    } finally {
      clearTimeout(timer)
    }
  }
  return current
}

export async function resolveNativeUrl(href: string, fetchFn: ResolveFetch = fetch): Promise<string> {
  let current = parseRedirectUrl(href) || href
  if (needsNetworkResolve(current)) {
    current = await followRedirects(current, fetchFn)
    const parsed = parseRedirectUrl(current)
    if (parsed && !needsNetworkResolve(parsed)) {
      return parsed
    }
    current = parsed || current
  }
  return current
}
