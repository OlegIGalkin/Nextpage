import { detectSearchEngine } from '../shared/search-hosts'
import { analyzeBing, isBingSerp } from './bing'
import { analyzeGoogle, isGoogleSerp } from './google'
import type { LinkAnalysis, SerpLink, SourceDetails } from './types'
import { normalizeTitle, NOT_RESULT } from './types'
import { analyzeYandex, isYandexSerp } from './yandex'

function hrefOf(anchor: HTMLAnchorElement): string {
  return anchor.href || anchor.getAttribute('href') || ''
}

function isIgnorableHref(href: string): boolean {
  if (!href) return true
  const lower = href.trim().toLowerCase()
  return lower.startsWith('javascript:') || lower.startsWith('mailto:') || lower === '#' || lower.startsWith('#')
}

export function analyzeLink(anchor: HTMLAnchorElement): LinkAnalysis {
  const href = hrefOf(anchor)
  if (isIgnorableHref(href)) {
    return NOT_RESULT
  }

  const engine = detectSearchEngine(location.hostname)
  switch (engine) {
    case 'google':
      return analyzeGoogle(anchor)
    case 'bing':
      return analyzeBing(anchor)
    case 'yandex':
      return analyzeYandex(anchor)
    default:
      return NOT_RESULT
  }
}

export function isSerpPage(): boolean {
  const engine = detectSearchEngine(location.hostname)
  if (engine === 'google') return isGoogleSerp()
  if (engine === 'bing') return isBingSerp()
  if (engine === 'yandex') return isYandexSerp()
  return false
}

export function extractAllResults(): SerpLink[] {
  const seen = new Set<string>()
  const results: SerpLink[] = []
  for (const node of Array.from(document.querySelectorAll('a'))) {
    if (!(node instanceof HTMLAnchorElement)) continue
    const analysis = analyzeLink(node)
    if (analysis.kind !== 'result') continue
    const href = hrefOf(node)
    if (!href || seen.has(href)) continue
    seen.add(href)
    results.push({ href, title: analysis.title, snippet: analysis.snippet })
  }
  return results
}

export function extractQuery(): string {
  const engine = detectSearchEngine(location.hostname)
  const selectors = {
    google: 'textarea[name="q"], input[name="q"]',
    bing: 'input[name="q"], textarea[name="q"]',
    yandex: 'input[name="text"], textarea[name="text"]'
  } as const
  if (engine !== 'unknown') {
    const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selectors[engine])
    if (field?.value) {
      return field.value
    }
  }
  const params = new URLSearchParams(location.search)
  return params.get('q') || params.get('text') || params.get('query') || ''
}

export function sourceForHref(href: string): SourceDetails {
  for (const node of Array.from(document.querySelectorAll('a'))) {
    if (!(node instanceof HTMLAnchorElement)) continue
    if (node.href !== href) continue
    const analysis = analyzeLink(node)
    if (analysis.kind === 'result') {
      return { title: analysis.title, snippet: analysis.snippet }
    }
    const text = normalizeTitle(node.textContent)
    if (text) return { title: text, snippet: analysis.snippet }
  }
  try {
    return { title: new URL(href).hostname, snippet: '' }
  } catch {
    return { title: href, snippet: '' }
  }
}
