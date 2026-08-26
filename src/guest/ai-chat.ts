import { ipcRenderer } from 'electron'
import { insertTextWithRetry } from '../injectors'

ipcRenderer.on('insert-text', async (_event, requestId: string, payload: { text: string }) => {
  const ok = await insertTextWithRetry(payload?.text || '')
  ipcRenderer.sendToHost('insert-text-ok', requestId, ok)
})
