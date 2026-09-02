interface AppConfig {
  searchPreload: string
  chatPreload: string
  userAgent: string
}

interface AppApi {
  getConfig: () => Promise<AppConfig>
  resolveUrl: (href: string) => Promise<string>
  openExternal: (url: string) => Promise<void>
  onSearchNavigationBlocked: (callback: (url: string) => void) => void
}

declare global {
  interface IpcMessageEvent extends Event {
    channel: string
    args: unknown[]
  }

  interface WebviewTag extends HTMLElement {
    src: string
    preload: string
    partition: string
    useragent: string
    send(channel: string, ...args: unknown[]): void
    sendInputEvent(event: {
      type: 'mouseDown' | 'mouseUp' | 'mouseEnter' | 'mouseLeave' | 'contextMenu' | 'mouseWheel' | 'mouseMove' | 'keyDown' | 'keyUp' | 'char'
      keyCode?: string
      modifiers?: string[]
    }): void
    addEventListener(
      type: 'ipc-message',
      listener: (event: IpcMessageEvent) => void,
      options?: boolean | AddEventListenerOptions
    ): void
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void
    removeEventListener(
      type: 'ipc-message',
      listener: (event: IpcMessageEvent) => void,
      options?: boolean | EventListenerOptions
    ): void
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ): void
  }

  interface SerpLink {
    href: string
    title: string
    snippet: string
  }

  interface Window {
    api: AppApi
  }
}

export {}
