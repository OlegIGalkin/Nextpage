export interface LinkAnalysis {
  kind: 'result' | 'other'
  title: string
}

export interface SerpLink {
  href: string
  title: string
}

export function normalizeTitle(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}
