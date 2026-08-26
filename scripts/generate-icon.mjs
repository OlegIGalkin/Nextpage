import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '../build/icon.png')
const SIZE = 256

function crc(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function px(x, y) {
  const cx = (x + 0.5) / SIZE
  const cy = (y + 0.5) / SIZE
  const dx = cx - 0.5
  const dy = cy - 0.5
  const inCircle = dx * dx + dy * dy <= 0.46 * 0.46

  if (!inCircle) return [0, 0, 0, 0]

  const bg = [37, 99, 168, 255]
  const pane = [245, 248, 252, 255]
  const accent = [255, 255, 255, 255]
  const splitterC = [37, 99, 168, 255]

  const left = cx > 0.22 && cx < 0.46 && cy > 0.28 && cy < 0.72
  const right = cx > 0.54 && cx < 0.78 && cy > 0.28 && cy < 0.72
  const bar = cx > 0.485 && cx < 0.515 && cy > 0.26 && cy < 0.74

  if (bar) return splitterC
  if (left || right) return pane
  if (cy > 0.18 && cy < 0.24 && cx > 0.22 && cx < 0.78) return accent
  return bg
}

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE)
for (let y = 0; y < SIZE; y++) {
  const row = y * (SIZE * 4 + 1)
  raw[row] = 0
  for (let x = 0; x < SIZE; x++) {
    const [r, g, b, a] = px(x, y)
    const i = row + 1 + x * 4
    raw[i] = r
    raw[i + 1] = g
    raw[i + 2] = b
    raw[i + 3] = a
  }
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8
ihdr[9] = 6
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0))
])

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, png)
console.log(`Wrote ${outPath}`)
