import { appendToComposer, findVisibleEditors, insertGeneric } from './generic'

const SELECTORS = [
  'textarea.ds-scroll',
  'textarea[placeholder]',
  '#chat-input',
  'textarea',
  '[contenteditable="true"]'
]

export function insertDeepSeek(text: string): boolean {
  const el = findVisibleEditors(SELECTORS)
  if (el && appendToComposer(el, text)) {
    return true
  }
  return insertGeneric(text)
}
