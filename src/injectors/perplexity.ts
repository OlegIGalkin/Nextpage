import { appendToComposer, findVisibleEditors, insertGeneric } from './generic'

const SELECTORS = [
  'textarea[placeholder]',
  'div[contenteditable="true"]',
  'textarea',
  '[contenteditable="true"]'
]

export function focusPerplexityComposer(): boolean {
  const el = findVisibleEditors(SELECTORS)
  if (!el) {
    return false
  }
  el.focus()
  return true
}

export function insertPerplexity(text: string): boolean {
  const el = findVisibleEditors(SELECTORS)
  if (el && appendToComposer(el, text)) {
    return true
  }
  return insertGeneric(text)
}
