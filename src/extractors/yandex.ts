import { isRedirectPath } from '../shared/search-hosts'
import type { LinkAnalysis } from './types'
import { normalizeTitle } from './types'

function isChrome(anchor: HTMLAnchorElement): boolean {
  return !!anchor.closest(
    '.Header, .header, .HeaderNav, .Pager, .pager, .Footer, .footer, nav, header, footer, .mini-suggest'
  )
}

export function analyzeYandex(anchor: HTMLAnchorElement): LinkAnalysis {
  if (isChrome(anchor)) {
    return { kind: 'other', title: '' }
  }

  const card = anchor.closest('.serp-item, .Organic, .organic, .serp-list__item, [class*="serp-item"]')
  if (!card) {
    return { kind: 'other', title: '' }
  }

  const titleLink = card.querySelector(
    'h2 a, h3 a, .OrganicTitle a, .organic__title a, a.OrganicTitle-Link, .organic__url'
  ) as HTMLAnchorElement | null

  const isTitle =
    !!titleLink && (titleLink === anchor || titleLink.contains(anchor) || anchor.contains(titleLink))

  let pathname = ''
  try {
    pathname = new URL(anchor.href, location.href).pathname
  } catch {
    pathname = ''
  }
  const isRedirectWrapper = isRedirectPath(pathname)

  if (!isTitle && !(isRedirectWrapper && anchor.closest('.OrganicTitle, .organic__title, h2, h3'))) {
    return { kind: 'other', title: '' }
  }

  const title = normalizeTitle(
    card.querySelector('h2, h3, .OrganicTitle, .organic__title')?.textContent || anchor.textContent
  )
  return { kind: 'result', title: title || 'Source' }
}

export function isYandexSerp(): boolean {
  const path = location.pathname.toLowerCase()
  return path.includes('/search') || !!document.querySelector('.serp-item, .Organic, .organic')
}
