export function formatSourceBlock(title: string, url: string): string {
  const safeTitle = title.replace(/\s+/g, ' ').trim() || 'Source'
  return `\nUse the following source:\n[${safeTitle}] [${url}]\n`
}

export function formatQueryMessage(query: string): string {
  const safeQuery = query.replace(/\s+/g, ' ').trim()
  if (!safeQuery) return ''
  return `My message to you is: ${safeQuery}\n`
}
