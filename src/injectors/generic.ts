function isVisible(element: HTMLElement): boolean {
  if (!element.getClientRects || element.getClientRects().length === 0) {
    return false
  }
  const style = window.getComputedStyle(element)
  return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0'
}

export function setNativeInputValue(el: HTMLTextAreaElement | HTMLInputElement, value: string): void {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }))
}

export function insertIntoContentEditable(el: HTMLElement, text: string): boolean {
  el.focus()
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  selection?.removeAllRanges()
  selection?.addRange(range)

  const inserted = document.execCommand('insertText', false, text)
  if (inserted) {
    return true
  }

  el.dispatchEvent(
    new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    })
  )
  el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }))
  return true
}

export function appendToComposer(el: HTMLElement, text: string): boolean {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    setNativeInputValue(el, `${el.value}${text}`)
    return true
  }
  if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
    return insertIntoContentEditable(el, text)
  }
  const nested = el.querySelector<HTMLElement>('textarea, input, [contenteditable="true"]')
  if (nested) {
    return appendToComposer(nested, text)
  }
  return false
}

export function findVisibleEditors(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const matches = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(isVisible)
    if (matches.length > 0) {
      return matches[matches.length - 1]
    }
  }
  return null
}

export function findGenericComposer(): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('textarea, input[type="text"], [contenteditable="true"]')
  ).filter((el) => {
    if (!isVisible(el)) return false
    if (el instanceof HTMLInputElement && (el.type === 'hidden' || (el.type === 'search' && el.closest('header, nav')))) {
      return false
    }
    return true
  })
  if (nodes.length === 0) return null
  nodes.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)
  return nodes[0]
}

export function insertGeneric(text: string): boolean {
  const el = findGenericComposer()
  if (!el) return false
  return appendToComposer(el, text)
}
