const { test, expect } = require('@playwright/test');
const { baseUrls } = require('./helpers/env');
const { modernStartButton } = require('./helpers/ui');

const specialTitle = 'Grüße "Tempo" \'Österreich\'';

test.describe('TITLE and TAGLINE special characters', () => {
  test('modern page renders GoFive dashboard correctly', async ({ page }) => {
    await page.goto(`${baseUrls.standaloneNew}/index-modern.html`);

    await expect(page).toHaveTitle(/Speed Test|Speed test|GoFive/i);

    await expect(
      page.locator('h1').first()
    ).toContainText(/Speed\s*test|GoFive/i);

    await expect(modernStartButton(page)).toBeVisible();
  });

  test('classic heading supports umlauts and quotes', async ({ page }) => {
    await page.goto(`${baseUrls.standaloneNew}/index-classic.html`);

    await expect(
      page.locator('h1').first()
    ).toHaveText(specialTitle);
  });

  test('modern page loads correctly when tagline contains apostrophe', async ({ page }) => {
    await page.goto(
      `${baseUrls.standaloneApostrophe}/index-modern.html`
    );

    await expect(modernStartButton(page)).toBeVisible();

    await expect(
      page.locator('h1').first()
    ).toContainText(/Speed\s*test|GoFive/i);
  });
});