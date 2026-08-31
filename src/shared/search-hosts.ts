export type SearchEngineId = 'google' | 'bing' | 'yandex' | 'unknown'

export function detectSearchEngine(hostname: string): SearchEngineId {
  const host = hostname.toLowerCase()
  if (host === 'google.com' || host.startsWith('www.google.') || host.includes('.google.')) {
    return 'google'
  }
  if (host === 'bing.com' || host.endsWith('.bing.com') || host.includes('bing.com')) {
    return 'bing'
  }
  if (host === 'ya.ru' || host.endsWith('.ya.ru') || host.includes('yandex.') || host.endsWith('.yandex.ru')) {
    return 'yandex'
  }
  return 'unknown'
}

export function isSearchEngineHost(hostname: string): boolean {
  return detectSearchEngine(hostname) !== 'unknown'
}

export function isRedirectPath(pathname: string): boolean {
  const path = pathname.toLowerCase()
  return (
    path === '/url' ||
    path.startsWith('/url/') ||
    path === '/goto' ||
    path.startsWith('/goto/') ||
    path.includes('/ck/a') ||
    path.includes('/clck') ||
    path.includes('jsredir') ||
    path.startsWith('/aclk') ||
    path.startsWith('/imgres')
  )
}

export function isInternalSearchNavigation(urlString: string): boolean {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return false
  }
  if (!isSearchEngineHost(url.hostname)) {
    return false
  }
  if (isRedirectPath(url.pathname)) {
    return false
  }
  return true
}
