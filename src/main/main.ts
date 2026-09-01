import { app, BrowserWindow, clipboard, ipcMain, Menu, session, shell } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { needsNetworkResolve, resolveNativeUrl } from './link-resolver'
import {
  createNetRedirectFetch,
  resolveByGuestNavigation,
  searchPartitionReferer
} from './session-redirect-fetch'
import { CHAT_PARTITION, IPC, SEARCH_PARTITION } from '../shared/ipc'
import { isChatProviderUrl, isIdentityProviderUrl } from '../shared/oauth-hosts'
import { isInternalSearchNavigation } from '../shared/search-hosts'

const CHROME_UA = (): string => {
  const chrome = process.versions.chrome || '131.0.0.0'
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome} Safari/537.36`
}

function guestPreloadUrl(name: string): string {
  let preloadPath = join(__dirname, '../preload', `${name}.js`)
  if (preloadPath.includes('app.asar')) {
    preloadPath = preloadPath.replace('app.asar', 'app.asar.unpacked')
  }
  return pathToFileURL(preloadPath).href
}

function applyUserAgent(): void {
  const ua = CHROME_UA()
  app.userAgentFallback = ua
  session.fromPartition(SEARCH_PARTITION).setUserAgent(ua)
  session.fromPartition(CHAT_PARTITION).setUserAgent(ua)
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Nextpage',
    backgroundColor: '#f3f3f3',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true
    }
  })

  const rendererUrl = process.env.ELECTRON_RENDERER_URL
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerIpc(): void {
  ipcMain.handle(IPC.getConfig, () => ({
    searchPreload: guestPreloadUrl('search-engine'),
    chatPreload: guestPreloadUrl('ai-chat'),
    userAgent: CHROME_UA()
  }))

  ipcMain.handle(IPC.resolveUrl, async (_event, href: string) => {
    if (typeof href !== 'string') return href
    const searchSession = session.fromPartition(SEARCH_PARTITION)
    const userAgent = CHROME_UA()
    const referer = searchPartitionReferer(searchSession)
    const fetchFn = createNetRedirectFetch(searchSession, { userAgent, referer })
    let resolved = await resolveNativeUrl(href, fetchFn)
    if (needsNetworkResolve(resolved)) {
      resolved = await resolveByGuestNavigation(SEARCH_PARTITION, resolved, userAgent, referer)
    }
    return resolved
  })

  ipcMain.handle(IPC.openExternal, async (_event, url: string) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return
    await shell.openExternal(url)
  })
}

function isSearchWebContents(contents: Electron.WebContents): boolean {
  return contents.session === session.fromPartition(SEARCH_PARTITION)
}

function isChatWebContents(contents: Electron.WebContents): boolean {
  return contents.session === session.fromPartition(CHAT_PARTITION)
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function attachGuestContextMenu(contents: Electron.WebContents): void {
  contents.on('context-menu', (_event, params) => {
    if (contents.isDestroyed()) return

    const template: Electron.MenuItemConstructorOptions[] = []
    const linkUrl = params.linkURL && isHttpUrl(params.linkURL) ? params.linkURL : ''

    if (linkUrl) {
      template.push(
        {
          label: 'Open link in browser',
          click: () => {
            void shell.openExternal(linkUrl)
          }
        },
        {
          label: 'Copy link',
          click: () => clipboard.writeText(linkUrl)
        },
        { type: 'separator' }
      )
    }

    const { editFlags } = params
    template.push(
      { role: 'undo', enabled: editFlags.canUndo },
      { role: 'redo', enabled: editFlags.canRedo },
      { type: 'separator' },
      { role: 'cut', enabled: editFlags.canCut },
      { role: 'copy', enabled: editFlags.canCopy },
      { role: 'paste', enabled: editFlags.canPaste },
      { role: 'selectAll', enabled: editFlags.canSelectAll },
      { type: 'separator' },
      {
        label: 'Back',
        enabled: contents.navigationHistory.canGoBack(),
        click: () => {
          if (!contents.isDestroyed()) contents.navigationHistory.goBack()
        }
      },
      {
        label: 'Forward',
        enabled: contents.navigationHistory.canGoForward(),
        click: () => {
          if (!contents.isDestroyed()) contents.navigationHistory.goForward()
        }
      },
      {
        label: 'Reload',
        click: () => {
          if (!contents.isDestroyed()) contents.reload()
        }
      }
    )

    if (!app.isPackaged) {
      template.push(
        { type: 'separator' },
        {
          label: 'Inspect',
          click: () => {
            if (!contents.isDestroyed()) contents.inspectElement(params.x, params.y)
          }
        }
      )
    }

    const window = BrowserWindow.fromWebContents(contents) ?? mainWindow ?? undefined
    Menu.buildFromTemplate(template).popup({ window })
  })
}

function chatPopupWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    parent: mainWindow ?? undefined,
    autoHideMenuBar: true,
    width: 520,
    height: 740,
    minWidth: 400,
    minHeight: 500,
    backgroundColor: '#ffffff',
    webPreferences: {
      partition: CHAT_PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false
    }
  }
}

function allowChatPopup(): Electron.WindowOpenHandlerResponse {
  return {
    action: 'allow',
    overrideBrowserWindowOptions: chatPopupWindowOptions()
  }
}

const recentOAuthOpens = new WeakMap<Electron.WebContents, number>()

function shouldOpenOAuthWindow(opener: Electron.WebContents): boolean {
  const lastAt = recentOAuthOpens.get(opener) ?? 0
  const now = Date.now()
  if (now - lastAt < 800) {
    return false
  }
  recentOAuthOpens.set(opener, now)
  return true
}

function returnOAuthToOpener(popup: BrowserWindow, opener: Electron.WebContents, url: string): void {
  if (!isChatProviderUrl(url) || isIdentityProviderUrl(url)) {
    return
  }
  if (!opener.isDestroyed()) {
    void opener.loadURL(url)
  }
  if (!popup.isDestroyed()) {
    popup.close()
  }
}

function openChatOAuthWindow(url: string, opener: Electron.WebContents): void {
  if (!shouldOpenOAuthWindow(opener)) {
    return
  }
  const popup = new BrowserWindow(chatPopupWindowOptions())
  popup.webContents.setUserAgent(CHROME_UA())
  configureChatPopup(popup.webContents)

  const onReturn = (event: Electron.Event, navUrl: string): void => {
    if (!isChatProviderUrl(navUrl) || isIdentityProviderUrl(navUrl)) {
      return
    }
    event.preventDefault()
    returnOAuthToOpener(popup, opener, navUrl)
  }
  popup.webContents.on('will-navigate', onReturn)
  popup.webContents.on('will-redirect', onReturn)

  void popup.loadURL(url)
}

function configureChatPopup(contents: Electron.WebContents): void {
  attachGuestContextMenu(contents)
  contents.setWindowOpenHandler((details) => {
    if (!isHttpUrl(details.url)) {
      return { action: 'deny' }
    }
    return allowChatPopup()
  })
  contents.on('did-create-window', (win) => {
    win.webContents.setUserAgent(CHROME_UA())
    win.setMenuBarVisibility(false)
    configureChatPopup(win.webContents)
  })
}

function registerWebviewHandlers(): void {
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() !== 'webview') {
      return
    }

    attachGuestContextMenu(contents)

    contents.setWindowOpenHandler(({ url }) => {
      if (isSearchWebContents(contents)) {
        if (url && isHttpUrl(url)) {
          mainWindow?.webContents.send(IPC.searchNavigationBlocked, url)
        }
        return { action: 'deny' }
      }
      if (!isHttpUrl(url)) {
        return { action: 'deny' }
      }
      return allowChatPopup()
    })

    contents.on('did-create-window', (win) => {
      if (!isChatWebContents(contents)) {
        return
      }
      win.webContents.setUserAgent(CHROME_UA())
      win.setMenuBarVisibility(false)
      configureChatPopup(win.webContents)
    })

    contents.on('will-navigate', (event, url) => {
      if (isChatWebContents(contents) && isIdentityProviderUrl(url)) {
        event.preventDefault()
        openChatOAuthWindow(url, contents)
        return
      }
      if (!isSearchWebContents(contents)) {
        return
      }
      if (isInternalSearchNavigation(url)) {
        return
      }
      event.preventDefault()
      mainWindow?.webContents.send(IPC.searchNavigationBlocked, url)
    })

    contents.on('will-redirect', (event, url) => {
      if (!isChatWebContents(contents) || !isIdentityProviderUrl(url)) {
        return
      }
      event.preventDefault()
      openChatOAuthWindow(url, contents)
    })
  })
}

app.whenReady().then(() => {
  applyUserAgent()
  registerIpc()
  registerWebviewHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
