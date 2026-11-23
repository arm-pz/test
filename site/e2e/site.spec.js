import { test, expect } from '@playwright/test'

const errors = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', e => errors.push(e.message))
  page.on('response', r => { if (r.status() >= 400 && !/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push(`${r.status()} ${r.url()}`) })
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text()) && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()) })
  // a fixed language, whatever the test browser's locale
  await page.addInitScript(() => { try { if (!localStorage.getItem('reina-lang')) localStorage.setItem('reina-lang', 'en') } catch {} })
})
test.afterEach(() => expect(errors, 'no page errors').toEqual([]))

// Wait for the loader to finish and leave the DOM.
async function open(page, hash = '') {
  await page.goto('./' + hash)
  await expect(page.locator('.loader')).toHaveCount(0, { timeout: 10_000 })
}
// Scroll the hero by a fraction of its length (0..1).
async function scrollHero(page, f) {
  await page.evaluate(f => { const h = document.querySelector('.hero'); scrollTo(0, h.offsetTop + (h.offsetHeight - innerHeight) * f) }, f)
}

test('home opens on the packing line with the first honey packed', async ({ page }) => {
  await open(page)
  await expect(page).toHaveTitle(/Reina Apícola/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Packed to your brief')
  const name = page.locator('.ro-name')
  await expect(name).toContainText('Rosemary Honey')
  await expect(name).toContainText('01 / 10')
  await expect(page.locator('.ro-spec')).toContainText('Pfund 10 mm')
})

test('the 3D line starts, and scrolling moves the next unit under the filler', async ({ page }) => {
  await open(page)
  await expect(page.locator('.line3d canvas')).toHaveCount(1, { timeout: 15_000 })
  await expect(page.locator('.hero-poster')).toHaveCount(0, { timeout: 15_000 }) // the poster goes once the line has drawn
  await scrollHero(page, 0.25)
  await expect(page.locator('.ro-name')).not.toContainText('Rosemary Honey', { timeout: 5_000 })
  await scrollHero(page, 1)
  await expect(page.locator('.ro-name')).toContainText('IBC tote', { timeout: 5_000 })
  await expect(page.locator('.ro-name')).toContainText('10 / 10')
})

test('switching to Spanish translates the page and is remembered', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'ES', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Envasada a tu medida')
  await expect(page.locator('.ro-name')).toContainText('Miel de Romero')
  await page.reload()
  await expect(page.locator('.loader')).toHaveCount(0, { timeout: 10_000 })
  await expect(page.locator('.ro-name')).toContainText('Miel de Romero')
})

test('a honey card opens its page through the curtain, with a 3D jar', async ({ page }) => {
  await open(page)
  await page.locator('#honeys .pcard').filter({ hasText: 'Heather Honey' }).evaluate(a => a.click())
  await expect(page).toHaveURL(/#heather$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Heather Honey', { timeout: 5_000 })
  await expect(page.locator('.facts')).toContainText('Pfund 100 mm')
  await expect(page.locator('.facts')).toContainText('Amber')
  const jar = page.locator('.pjar .unit3d.live canvas')
  await expect(jar).toBeVisible({ timeout: 15_000 })
  await expect(jar).toHaveAttribute('aria-label', /Heather Honey.*3D/)
  const box = await jar.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
})

test('honeys go into the quote list, which builds an email', async ({ page }) => {
  await open(page, '#chestnut')
  await page.getByRole('button', { name: 'Add to quote' }).click()
  await expect(page.getByRole('status')).toContainText('Chestnut Honey added')
  await expect(page.getByRole('button', { name: 'In your quote' })).toBeVisible()
  await page.locator('.bag').click()
  const drawer = page.getByRole('dialog', { name: 'Your quote request' })
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.quote-list li')).toHaveCount(1)
  await drawer.getByLabel('Formats, volumes and destination').fill('5,000 × 500 g anti-drip, own label')
  const href = await drawer.getByRole('link', { name: 'Email this request' }).getAttribute('href')
  expect(href).toMatch(/^mailto:info@reinaapicola\.com\?subject=Quote%20request/)
  expect(decodeURIComponent(href)).toContain('Chestnut Honey')
  expect(decodeURIComponent(href)).toContain('5,000 × 500 g anti-drip')
  await drawer.getByRole('button', { name: 'Remove' }).click()
  await expect(drawer.locator('.quote-empty')).toBeVisible()
})

test('menu jumps to a home section from a honey page', async ({ page }) => {
  await open(page, '#forest')
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.locator('#menu')).toBeVisible()
  await page.locator('#menu nav').getByText('Retail & industry').click()
  await expect(page.locator('#menu')).toHaveCount(0)
  await expect(page.locator('#formats')).toBeInViewport({ timeout: 8_000 })
  await expect(page.locator('.fcard')).toHaveCount(6)
})

test('pressing Back during the page transition still lands on the right page', async ({ page }) => {
  await open(page)
  await page.locator('#honeys .pcard').nth(2).evaluate(a => a.click())
  await page.waitForTimeout(300) // curtain is still rising
  await page.goBack()
  await expect(page).not.toHaveURL(/#multifloral/)
  await expect(page.locator('.hero')).toHaveCount(1, { timeout: 8_000 })
  await expect(page.locator('.ptitle')).toHaveCount(0)
})

test('unknown hash falls back to the home page', async ({ page }) => {
  await open(page, '#not-a-honey')
  await expect(page.locator('.hero')).toHaveCount(1)
})

test('page never scrolls sideways', async ({ page }) => {
  for (const hash of ['', '#orange-blossom']) {
    await open(page, hash)
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(600)
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, `horizontal overflow on "${hash || 'home'}"`).toBeLessThanOrEqual(0)
  }
})

test('footer shows the wordmark and contact details', async ({ page }) => {
  await open(page)
  const foot = page.locator('footer.foot')
  await foot.scrollIntoViewIfNeeded()
  await expect(foot.locator('.giant')).toContainText('Reina Apícola')
  await expect(foot).toContainText('info@reinaapicola.com')
  await expect(foot).toContainText('46600 Alzira')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('content is reachable without smooth scrolling', async ({ page }) => {
    await open(page)
    expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false)
    await page.locator('#honeys').scrollIntoViewIfNeeded()
    await expect(page.locator('#honeys .pcard')).toHaveCount(7)
    await expect(page.locator('#formats .fcard')).toHaveCount(6)
  })
})

test('on phones the honeys are a swipeable row of cards', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only')
  await open(page)
  const row = page.locator('#honeys .pgrid')
  await row.scrollIntoViewIfNeeded()
  const { scrollW, clientW } = await row.evaluate(el => ({ scrollW: el.scrollWidth, clientW: el.clientWidth }))
  expect(scrollW).toBeGreaterThan(clientW * 3)
  await row.evaluate(el => el.scrollBy({ left: el.clientWidth, behavior: 'instant' }))
  await expect.poll(() => row.evaluate(el => el.scrollLeft)).toBeGreaterThan(100)
  await expect(page.locator('#honeys .swipe-hint')).toBeVisible()
})
