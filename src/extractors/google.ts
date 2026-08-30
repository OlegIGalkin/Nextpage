import type { LinkAnalysis } from './types'
import { firstNormalizedText, normalizeTitle, NOT_RESULT } from './types'

const SNIPPET_SELECTORS = ['.VwiC3b', '.IsZvec', '.aCOpRe', '[data-sncf]', '.s3WFgc']

function isChrome(anchor: HTMLAnchorElement): boolean {
  return !!(
    anchor.closest('#gb, #hdtb, #searchform, header, nav, #top_nav, .appbar, #foot, #fbar') ||
    anchor.id === 'pnnext' ||
    anchor.id === 'pnprev'
  )
}

function isPagination(anchor: HTMLAnchorElement): boolean {
  if (anchor.id === 'pnnext' || anchor.id === 'pnprev') return true
  if (anchor.closest('[role="navigation"], [aria-label="Pagination"]')) return true
  if (anchor.closest('#botstuff') && /^(next|previous|\d+)$/i.test(normalizeTitle(anchor.textContent))) {
    return true
  }
  return false
}

function resultCard(anchor: HTMLAnchorElement): Element | null {
  return anchor.closest('.g') || anchor.closest('.MjjYud') || anchor.closest('[data-hveid]')
}

export function analyzeGoogle(anchor: HTMLAnchorElement): LinkAnalysis {
  if (isChrome(anchor) || isPagination(anchor)) {
    return NOT_RESULT
  }
  if (!anchor.closest('#search, #rso, #center_col, #main, #res')) {
    return NOT_RESULT
  }
  if (anchor.closest('#tads, #tadsb, #bottomads, .cu-container, [data-text-ad]')) {
    return NOT_RESULT
  }

  const h3 = anchor.querySelector('h3')
  if (!h3) {
    return NOT_RESULT
  }

  return {
    kind: 'result',
    title: normalizeTitle(h3.textContent) || 'Source',
    snippet: firstNormalizedText(resultCard(anchor), SNIPPET_SELECTORS)
  }
}

export function isGoogleSerp(): boolean {
  const path = location.pathname.toLowerCase()
  return path.includes('/search') || !!document.querySelector('#rso, #center_col .g, #search .g, #rso .MjjYud')
}
