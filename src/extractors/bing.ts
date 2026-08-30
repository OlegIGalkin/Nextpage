import type { LinkAnalysis } from './types'
import { firstNormalizedText, normalizeTitle, NOT_RESULT } from './types'

const SNIPPET_SELECTORS = ['.b_caption p', '.b_algoSlug', '.b_lineclamp2', '.b_lineclamp3', '.b_lineclamp4']

function isChrome(anchor: HTMLAnchorElement): boolean {
  return !!anchor.closest('#b_header, #b_footer, .b_pag, header, nav, footer, .b_scopebar')
}

export function analyzeBing(anchor: HTMLAnchorElement): LinkAnalysis {
  if (isChrome(anchor)) {
    return NOT_RESULT
  }
  if (!anchor.closest('#b_results, #b_content')) {
    return NOT_RESULT
  }
  if (anchor.closest('.b_ad, .ad_sc, .b_adLastChild')) {
    return NOT_RESULT
  }

  const card = anchor.closest('.b_algo')
  if (!card) {
    return NOT_RESULT
  }
  const titleLink = card.querySelector('h2 a')
  if (!titleLink || (titleLink !== anchor && !titleLink.contains(anchor) && !anchor.contains(titleLink))) {
    return NOT_RESULT
  }

  const title = normalizeTitle(card.querySelector('h2')?.textContent)
  return {
    kind: 'result',
    title: title || 'Source',
    snippet: firstNormalizedText(card, SNIPPET_SELECTORS)
  }
}

export function isBingSerp(): boolean {
  const path = location.pathname.toLowerCase()
  return path.includes('/search') || !!document.querySelector('#b_results .b_algo')
}
