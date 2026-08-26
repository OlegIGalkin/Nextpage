import { appendToComposer, findVisibleEditors, insertGeneric } from './generic'

const SELECTORS = [
  '#prompt-textarea',
  'div#prompt-textarea[contenteditable="true"]',
  '#prompt-textarea [contenteditable="true"]',
  'div[contenteditable="true"]#prompt-textarea',
  '[data-placeholder][contenteditable="true"]',
  '[contenteditable="true"]'
]

export function insertOpenAI(text: string): boolean {
  const el = findVisibleEditors(SELECTORS)
  if (el && appendToComposer(el, text)) {
    return true
  }
  return insertGeneric(text)
}
