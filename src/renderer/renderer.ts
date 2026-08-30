import { formatQueryMessage, formatSourceBlock } from '../shared/format'
import { DEFAULT_LLM_LANGUAGE, LLM_LANGUAGES } from '../shared/languages'
import { AI_CHATS, DEFAULT_AI_CHAT, DEFAULT_SEARCH_ENGINE, SEARCH_ENGINES } from '../shared/providers'

const searchSelect = document.querySelector('#search-engine') as HTMLSelectElement
const chatSelect = document.querySelector('#ai-chat') as HTMLSelectElement
const languageSelect = document.querySelector('#llm-language') as HTMLSelectElement
const flipButton = document.querySelector('#flip') as HTMLButtonElement
const queryButton = document.querySelector('#query-to-chat') as HTMLButtonElement
const linksButton = document.querySelector('#links-to-chat') as HTMLButtonElement
const split = document.querySelector('#split') as HTMLElement
const splitter = document.querySelector('#splitter') as HTMLElement
const searchPane = document.querySelector('#pane-search') as HTMLElement
const searchView = document.querySelector('#search-webview') as WebviewTag
const chatView = document.querySelector('#chat-webview') as WebviewTag

let flipped = false
let lastIngest = { key: '', at: 0 }

function populateSelects(): void {
  for (const engine of SEARCH_ENGINES) {
    const option = document.createElement('option')
    option.value = engine.id
    option.textContent = engine.name
    if (engine.id === DEFAULT_SEARCH_ENGINE.id) option.selected = true
    searchSelect.append(option)
  }
  for (const chat of AI_CHATS) {
    const option = document.createElement('option')
    option.value = chat.id
    option.textContent = chat.name
    if (chat.id === DEFAULT_AI_CHAT.id) option.selected = true
    chatSelect.append(option)
  }
  for (const language of LLM_LANGUAGES) {
    const option = document.createElement('option')
    option.value = language.id
    option.textContent = language.name
    if (language.id === DEFAULT_LLM_LANGUAGE.id) option.selected = true
    languageSelect.append(option)
  }
}

function selectedLanguage(): string {
  return languageSelect.value || DEFAULT_LLM_LANGUAGE.id
}

function setupSplitter(): void {
  let dragging = false

  const onMove = (event: MouseEvent): void => {
    if (!dragging) return
    const rect = split.getBoundingClientRect()
    if (rect.width <= 0) return
    const visualRatio = (event.clientX - rect.left) / rect.width
    const searchRatio = flipped ? 1 - visualRatio : visualRatio
    const clamped = Math.min(0.8, Math.max(0.2, searchRatio))
    searchPane.style.flex = `0 0 ${clamped * 100}%`
  }

  const stopDrag = (): void => {
    if (!dragging) return
    dragging = false
    splitter.classList.remove('dragging')
    document.body.classList.remove('resizing')
  }

  splitter.addEventListener('mousedown', (event) => {
    event.preventDefault()
    dragging = true
    splitter.classList.add('dragging')
    document.body.classList.add('resizing')
  })
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('blur', stopDrag)
}

function setupFlip(): void {
  flipButton.addEventListener('click', () => {
    flipped = !flipped
    split.classList.toggle('flipped', flipped)
  })
}

function invokeGuest<T>(view: WebviewTag, channel: string, payload?: unknown): Promise<T> {
  const requestId = crypto.randomUUID()
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      view.removeEventListener('ipc-message', onMessage)
      reject(new Error(`${channel} timed out`))
    }, 8000)

    const onMessage = (event: IpcMessageEvent): void => {
      if (event.channel !== `${channel}-ok`) return
      const [id, data] = event.args as [string, T]
      if (id !== requestId) return
      window.clearTimeout(timer)
      view.removeEventListener('ipc-message', onMessage)
      resolve(data)
    }

    view.addEventListener('ipc-message', onMessage)
    view.send(channel, requestId, payload)
  })
}

function shouldIngest(key: string): boolean {
  const now = Date.now()
  if (key === lastIngest.key && now - lastIngest.at < 1000) {
    return false
  }
  lastIngest = { key, at: now }
  return true
}

async function insertIntoChat(text: string): Promise<void> {
  if (!text) return
  try {
    await invokeGuest<boolean>(chatView, 'insert-text', { text })
  } catch (error) {
    console.error('Failed to insert into AI Chat', error)
  }
}

async function ingestLink(title: string, snippet: string, href: string): Promise<void> {
  if (!href || !shouldIngest(`${title}|${href}`)) return
  const native = await window.api.resolveUrl(href)
  await insertIntoChat(formatSourceBlock(title, snippet, native, selectedLanguage()))
}

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function setupWebviewBridge(): void {
  searchView.addEventListener('ipc-message', (event: IpcMessageEvent) => {
    if (event.channel === 'open-external') {
      const href = String(event.args[0] || '')
      void window.api.openExternal(href)
      return
    }
    if (event.channel === 'serp-link') {
      const payload = event.args[0] as { href?: string; title?: string; snippet?: string } | undefined
      if (payload?.href) {
        void ingestLink(payload.title || titleFromUrl(payload.href), payload.snippet || '', payload.href)
      }
    }
  })

  window.api.onSearchNavigationBlocked((url) => {
    void (async () => {
      let title = titleFromUrl(url)
      let snippet = ''
      try {
        const source = await invokeGuest<{ title?: string; snippet?: string }>(searchView, 'source-for-href', url)
        title = source?.title || title
        snippet = source?.snippet || ''
      } catch {
        // Guest page may not be ready; fall back to hostname.
      }
      await ingestLink(title, snippet, url)
    })()
  })
}

function setupProviderNavigation(): void {
  searchSelect.addEventListener('change', () => {
    const engine = SEARCH_ENGINES.find((item) => item.id === searchSelect.value)
    if (engine) searchView.src = engine.url
  })
  chatSelect.addEventListener('change', () => {
    const chat = AI_CHATS.find((item) => item.id === chatSelect.value)
    if (chat) chatView.src = chat.url
  })
}

function setupToolbarActions(): void {
  queryButton.addEventListener('click', () => {
    void (async () => {
      try {
        const query = await invokeGuest<string>(searchView, 'extract-query')
        if (query) await insertIntoChat(formatQueryMessage(query, selectedLanguage()))
      } catch (error) {
        console.error('Failed to extract search query', error)
      }
    })()
  })

  linksButton.addEventListener('click', () => {
    void (async () => {
      try {
        const links = await invokeGuest<SerpLink[]>(searchView, 'extract-all')
        if (!links?.length) return
        const blocks: string[] = []
        for (const link of links) {
          const native = await window.api.resolveUrl(link.href)
          const key = `${link.title}|${native}`
          if (!shouldIngest(key)) continue
          blocks.push(formatSourceBlock(link.title, link.snippet || '', native, selectedLanguage()))
        }
        await insertIntoChat(blocks.join(''))
      } catch (error) {
        console.error('Failed to extract SERP links', error)
      }
    })()
  })
}

async function start(): Promise<void> {
  const config = await window.api.getConfig()
  populateSelects()
  setupSplitter()
  setupFlip()
  setupProviderNavigation()
  setupToolbarActions()
  setupWebviewBridge()

  searchView.preload = config.searchPreload
  chatView.preload = config.chatPreload
  searchView.useragent = config.userAgent
  chatView.useragent = config.userAgent
  searchView.src = DEFAULT_SEARCH_ENGINE.url
  chatView.src = DEFAULT_AI_CHAT.url
}

void start()
