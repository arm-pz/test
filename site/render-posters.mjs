// Renders every honey (in its retail pack) and every format to a transparent WebP in assets/posters.
// Usage (from site/): npm run posters   — needs Playwright's Chromium and Python with Pillow.
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const out = fileURLToPath(new URL('../assets/posters/', import.meta.url))
const tmp = fileURLToPath(new URL('./node_modules/.posters/', import.meta.url))
mkdirSync(tmp, { recursive: true })
const server = await createServer({ root: fileURLToPath(new URL('./', import.meta.url)), server: { port: 5199 }, logLevel: 'error' })
await server.listen()
const { varieties } = await server.ssrLoadModule('/src/data.js')
const jobs = [
  ...varieties.map(v => [v.slug, v.slug, v.format]),
  ['format-drip', 'multifloral', 'drip'], ['format-smooth', 'rosemary', 'smooth'], ['format-comb', 'orange-blossom', 'comb'],
  ['format-pail', 'multifloral', 'pail'], ['format-drum', 'orange-blossom', 'drum'], ['format-ibc', 'eucalyptus', 'ibc'],
]
const browser = await chromium.launch({ ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 800, height: 1000 } })
for (const [name, v, f] of jobs) {
  await page.goto(`http://localhost:5199/poster.html?v=${v}&f=${f}`)
  await page.waitForFunction(() => window.__ready, null, { timeout: 60_000 })
  await page.locator('canvas').screenshot({ path: `${tmp}${name}.png`, omitBackground: true })
  execFileSync('python3', ['-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]); im = im.crop(im.getbbox()); im.thumbnail((640, 640))
im.save(sys.argv[2], 'WEBP', quality=82, method=6)`, `${tmp}${name}.png`, `${out}${name}.webp`])
  console.log('poster', name)
}
await browser.close()
await server.close()
