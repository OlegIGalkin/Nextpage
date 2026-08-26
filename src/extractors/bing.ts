import type { LinkAnalysis } from './types'
import { normalizeTitle } from './types'

function isChrome(anchor: HTMLAnchorElement): boolean {
  return !!anchor.closest('#b_header, #b_footer, .b_pag, header, nav, footer, .b_scopebar')
}

export function analyzeBing(anchor: HTMLAnchorElement): LinkAnalysis {
  if (isChrome(anchor)) {
    return { kind: 'other', title: '' }
  }
  if (!anchor.closest('#b_results, #b_content')) {
    return { kind: 'other', title: '' }
  }
  if (anchor.closest('.b_ad, .ad_sc, .b_adLastChild')) {
    return { kind: 'other', title: '' }
  }

  const card = anchor.closest('.b_algo')
  if (!card) {
    return { kind: 'other', title: '' }
  }
  const titleLink = card.querySelector('h2 a')
  if (!titleLink || (titleLink !== anchor && !titleLink.contains(anchor) && !anchor.contains(titleLink))) {
    return { kind: 'other', title: '' }
  }

  const title = normalizeTitle(card.querySelector('h2')?.textContent)
  return { kind: 'result', title: title || 'Source' }
}

export function isBingSerp(): boolean {
  const path = location.pathname.toLowerCase()
  return path.includes('/search') || !!document.querySelector('#b_results .b_algo')
}
