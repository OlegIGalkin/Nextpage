import { appendToComposer, findVisibleEditors, insertGeneric } from './generic'

const SELECTORS = [
  'textarea[placeholder]',
  'div[contenteditable="true"]',
  'textarea',
  '[contenteditable="true"]'
]

export function insertPerplexity(text: string): boolean {
  const el = findVisibleEditors(SELECTORS)
  if (el && appendToComposer(el, text)) {
    return true
  }
  return insertGeneric(text)
}
