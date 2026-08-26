import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'

export interface AppConfig {
  searchPreload: string
  chatPreload: string
  userAgent: string
}

contextBridge.exposeInMainWorld('api', {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke(IPC.getConfig),
  resolveUrl: (href: string): Promise<string> => ipcRenderer.invoke(IPC.resolveUrl, href),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke(IPC.openExternal, url),
  onSearchNavigationBlocked: (callback: (url: string) => void): void => {
    ipcRenderer.on(IPC.searchNavigationBlocked, (_event, url: string) => {
      callback(url)
    })
  }
})
