import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.join(process.cwd(), 'public', 'brand')
const source = path.join(root, 'logo.png')
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: '../apple-touch-icon.png', size: 180 },
]

await mkdir(root, { recursive: true })

for (const { name, size } of sizes) {
  const out = path.join(root, '..', name.replace('../', ''))
  const target = name.startsWith('..') ? out : path.join(root, name)
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 253, g: 248, b: 243, alpha: 1 } })
    .png()
    .toFile(target)
  console.log('Wrote', target)
}
