export interface LinkAnalysis {
  kind: 'result' | 'other'
  title: string
  snippet: string
}

export interface SerpLink {
  href: string
  title: string
  snippet: string
}

export interface SourceDetails {
  title: string
  snippet: string
}

export const NOT_RESULT: LinkAnalysis = { kind: 'other', title: '', snippet: '' }

export function normalizeTitle(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

export function firstNormalizedText(root: Element | null, selectors: string[]): string {
  if (!root) return ''
  for (const selector of selectors) {
    const text = normalizeTitle(root.querySelector(selector)?.textContent)
    if (text) return text
  }
  return ''
}
