import { BrowserWindow, net, webContents, type Session } from 'electron'
import { needsNetworkResolve, parseRedirectUrl, type ResolveFetch } from './link-resolver'
import { isRedirectPath, isSearchEngineHost } from '../shared/search-hosts'

function headerValue(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(raw)) return raw[0]
  return raw
}

function isWrapperUrl(url: string): boolean {
  if (needsNetworkResolve(url)) return true
  const parsed = parseRedirectUrl(url)
  return !!parsed && needsNetworkResolve(parsed)
}

export function searchPartitionReferer(partitionSession: Session): string | undefined {
  for (const contents of webContents.getAllWebContents()) {
    if (contents.getType() !== 'webview' || contents.session !== partitionSession) continue
    const url = contents.getURL()
    if (/^https?:\/\//i.test(url)) return url
  }
  return undefined
}

export function createNetRedirectFetch(
  ses: Session,
  defaults: { userAgent: string; referer?: string }
): ResolveFetch {
  return (input, init) =>
    new Promise((resolve, reject) => {
      const request = net.request({
        method: 'GET',
        url: input,
        session: ses,
        redirect: 'manual',
        useSessionCookies: true
      })

      request.setHeader('User-Agent', defaults.userAgent)
      request.setHeader(
        'Accept',
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      )
      request.setHeader('Upgrade-Insecure-Requests', '1')
      request.setHeader('Sec-Fetch-Dest', 'document')
      request.setHeader('Sec-Fetch-Mode', 'navigate')
      request.setHeader('Sec-Fetch-Site', defaults.referer ? 'same-origin' : 'none')
      request.setHeader('Sec-Fetch-User', '?1')
      if (defaults.referer) {
        request.setHeader('Referer', defaults.referer)
      }

      let settled = false
      const settle = (response: Response): void => {
        if (settled) return
        settled = true
        init?.signal?.removeEventListener('abort', onAbort)
        resolve(response)
      }

      const onAbort = (): void => {
        request.abort()
      }
      init?.signal?.addEventListener('abort', onAbort)

      request.on('redirect', (statusCode, _method, redirectUrl) => {
        const headers = redirectUrl ? { Location: redirectUrl } : undefined
        settle(new Response(null, { status: statusCode || 302, headers }))
        request.abort()
      })

      request.on('response', (response) => {
        const location = headerValue(response.headers, 'location')
        settle(
          new Response(null, {
            status: response.statusCode,
            headers: location ? { Location: location } : undefined
          })
        )
        request.abort()
      })

      request.on('error', (error) => {
        init?.signal?.removeEventListener('abort', onAbort)
        if (settled) return
        reject(error)
      })

      request.end()
    })
}

let navigationQueue: Promise<void> = Promise.resolve()

export function resolveByGuestNavigation(
  partition: string,
  href: string,
  userAgent: string,
  referer?: string,
  timeoutMs = 8000
): Promise<string> {
  const run = (): Promise<string> =>
    new Promise((resolve) => {
      const win = new BrowserWindow({
        show: false,
        width: 400,
        height: 300,
        webPreferences: {
          partition,
          offscreen: true,
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false
        }
      })
      win.webContents.setUserAgent(userAgent)

      let done = false
      const finish = (url: string): void => {
        if (done) return
        done = true
        clearTimeout(timer)
        if (!win.isDestroyed()) {
          win.destroy()
        }
        resolve(url)
      }

      const timer = setTimeout(() => finish(href), timeoutMs)

      const consider = (event: Electron.Event | undefined, url: string): void => {
        if (!url || url === href) return
        try {
          const parsedUrl = new URL(url)
          if (isSearchEngineHost(parsedUrl.hostname) && isRedirectPath(parsedUrl.pathname)) {
            return
          }
        } catch {
          return
        }
        const parsed = parseRedirectUrl(url)
        if (parsed && isWrapperUrl(parsed)) {
          return
        }
        event?.preventDefault()
        finish(parsed || url)
      }

      win.webContents.on('will-redirect', (event, url) => consider(event, url))
      win.webContents.on('will-navigate', (event, url) => consider(event, url))
      win.webContents.on('did-navigate', (_event, url) => consider(undefined, url))
      win.webContents.on('did-fail-load', () => finish(href))

      const options = referer ? { extraHeaders: `Referer: ${referer}\n` } : undefined
      void win.loadURL(href, options)
    })

  const pending = navigationQueue.then(run, run)
  navigationQueue = pending.then(
    () => undefined,
    () => undefined
  )
  return pending
}
