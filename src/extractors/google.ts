import type { LinkAnalysis } from './types'
import { normalizeTitle } from './types'

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

export function analyzeGoogle(anchor: HTMLAnchorElement): LinkAnalysis {
  if (isChrome(anchor) || isPagination(anchor)) {
    return { kind: 'other', title: '' }
  }
  if (!anchor.closest('#search, #rso, #center_col, #main, #res')) {
    return { kind: 'other', title: '' }
  }
  if (anchor.closest('#tads, #tadsb, #bottomads, .cu-container, [data-text-ad]')) {
    return { kind: 'other', title: '' }
  }

  const h3 = anchor.querySelector('h3')
  if (!h3) {
    return { kind: 'other', title: '' }
  }

  return { kind: 'result', title: normalizeTitle(h3.textContent) || 'Source' }
}

export function isGoogleSerp(): boolean {
  const path = location.pathname.toLowerCase()
  return path.includes('/search') || !!document.querySelector('#rso, #center_col .g, #search .g, #rso .MjjYud')
}
