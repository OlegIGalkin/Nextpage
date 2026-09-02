import { ipcRenderer } from 'electron'
import { focusComposer, insertTextWithRetry } from '../injectors'

ipcRenderer.on('insert-text', async (_event, requestId: string, payload: { text: string }) => {
  const ok = await insertTextWithRetry(payload?.text || '')
  ipcRenderer.sendToHost('insert-text-ok', requestId, ok)
})

ipcRenderer.on('focus-composer', (_event, requestId: string) => {
  ipcRenderer.sendToHost('focus-composer-ok', requestId, focusComposer())
})
