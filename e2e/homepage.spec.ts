import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads the homepage successfully', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/TZH Sports Centre|Badminton/)

    await expect(page.getByRole('link', { name: /booking/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /shop/i })).toBeVisible()
  })

  test('displays court status section', async ({ page }) => {
    await page.goto('/')

    const courtStatus = page.locator('text=/court.*status/i').first()
  })

  test('displays pricing section', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('text=/pricing|rates/i').first()).toBeVisible()
  })

  test('navigation links work', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /shop/i }).first().click()
    await expect(page).toHaveURL(/\/shop/)

    await page.goto('/')

    await page.getByRole('link', { name: /booking/i }).first().click()
    await expect(page).toHaveURL(/\/booking/)
  })
})
