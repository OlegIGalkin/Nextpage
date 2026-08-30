import { ipcRenderer } from 'electron'
import { analyzeLink, extractAllResults, extractQuery, isSerpPage, sourceForHref } from '../extractors'

function hrefOf(anchor: HTMLAnchorElement): string {
  return anchor.href || anchor.getAttribute('href') || ''
}

function onClick(event: MouseEvent): void {
  if (event.button !== 0) {
    return
  }
  const target = event.target as Element | null
  const anchor = target?.closest?.('a')
  if (!anchor || !(anchor instanceof HTMLAnchorElement)) {
    return
  }

  const href = hrefOf(anchor)
  if (!href) {
    return
  }

  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    event.stopImmediatePropagation()
    ipcRenderer.sendToHost('open-external', href)
    return
  }

  if (!isSerpPage()) {
    return
  }

  const analysis = analyzeLink(anchor)
  if (analysis.kind !== 'result') {
    return
  }

  event.preventDefault()
  event.stopImmediatePropagation()
  ipcRenderer.sendToHost('serp-link', { href, title: analysis.title, snippet: analysis.snippet })
}

function attach(): void {
  document.addEventListener('click', onClick, true)
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', attach, { once: true })
} else {
  attach()
}

ipcRenderer.on('extract-all', (_event, requestId: string) => {
  ipcRenderer.sendToHost('extract-all-ok', requestId, extractAllResults())
})

ipcRenderer.on('extract-query', (_event, requestId: string) => {
  ipcRenderer.sendToHost('extract-query-ok', requestId, extractQuery())
})

ipcRenderer.on('source-for-href', (_event, requestId: string, href: string) => {
  ipcRenderer.sendToHost('source-for-href-ok', requestId, sourceForHref(href))
})
