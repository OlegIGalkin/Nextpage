import { insertDeepSeek } from './deepseek'
import { insertGeneric } from './generic'
import { insertOpenAI } from './openai'
import { focusPerplexityComposer, insertPerplexity } from './perplexity'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function insertText(text: string): boolean {
  const host = location.hostname.toLowerCase()
  if (host.includes('deepseek')) {
    return insertDeepSeek(text)
  }
  if (host.includes('perplexity')) {
    return insertPerplexity(text)
  }
  if (host.includes('chatgpt') || host.includes('openai')) {
    return insertOpenAI(text)
  }
  return insertGeneric(text)
}

export function focusComposer(): boolean {
  const host = location.hostname.toLowerCase()
  if (host.includes('perplexity')) {
    return focusPerplexityComposer()
  }
  return false
}

export async function insertTextWithRetry(text: string, attempts = 10): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (insertText(text)) {
      return true
    }
    await delay(200)
  }
  return false
}
