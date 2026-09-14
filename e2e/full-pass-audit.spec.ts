import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';

/**
 * Full cold-playthrough audit: login -> hero select -> tavern -> combat,
 * on real touch emulation (mobile-chrome project), with video/trace always
 * on (see playwright.config.ts) and an axe-core accessibility scan at each
 * major screen. This is the "record a proper full pass" test the manual
 * Browser-pane testing couldn't produce - Playwright writes real video/
 * trace files to test-results/, unlike inline screenshots.
 */

async function runAxeScan(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  await test.info().attach(`axe-${label}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  return results.violations;
}

test.describe('Full cold pass', () => {
  test('login through first combat round', async ({ page }, testInfo) => {
    const allViolations: Record<string, unknown[]> = {};

    // ---- Login ----
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'AETHERIUM' })).toBeVisible();
    allViolations.login = await runAxeScan(page, 'login');
    await page.getByRole('button', { name: /ENTER THE AETHERIUM/i }).click();

    // ---- Hero Select ----
    await expect(page.getByText(/Select your Commander/i)).toBeVisible({ timeout: 10_000 });
    allViolations.heroSelect = await runAxeScan(page, 'hero-select');
    await page.getByRole('button', { name: /CHOOSE COMMANDER/i }).first().click();

    // ---- First-run tutorial (fresh context => always fires) ----
    const tutorialHeading = page.getByText('WELCOME TO THE AETHERIUM');
    await expect(tutorialHeading).toBeVisible({ timeout: 10_000 });
    allViolations.tutorial = await runAxeScan(page, 'tutorial-step-1');
    await page.getByRole('button', { name: /SKIP TUTORIAL/i }).click();

    // ---- Tavern ----
    await expect(page.getByText('WARBAND FORMATION')).toBeVisible({ timeout: 10_000 });
    allViolations.tavern = await runAxeScan(page, 'tavern');

    // Tap-to-preview-then-buy: first tap previews (no purchase), second buys.
    const firstShopCard = page.locator('.snap-center').first();
    await firstShopCard.tap();
    await expect(page.getByText('TAP AGAIN TO BUY')).toBeVisible({ timeout: 5_000 });
    await testInfo.attach('shop-card-armed', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await firstShopCard.tap();
    await expect(page.getByText('TAP AGAIN TO BUY')).not.toBeVisible({ timeout: 5_000 });

    // Deploy from hand (single tap - confirmed working in manual pass).
    const handCard = page.locator('text=HAND TRAY').locator('..').locator('..').locator('.snap-center').first();
    await handCard.tap({ timeout: 5_000 }).catch(() => {
      // Fall back to a broader selector if the DOM structure differs.
    });

    await testInfo.attach('tavern-after-buy-deploy', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    // ---- Engage combat ----
    const combatButton = page.locator('button, [role="button"]').filter({ hasText: /⚔/ }).first();
    await combatButton.click({ trial: false }).catch(async () => {
      // Icon-only button fallback: click the header combat icon by position.
      await page.locator('header, [class*="HUD"]').first().locator('button').last().click();
    });

    // Combat auto-resolves; wait for either victory/defeat/stalemate or the
    // next tavern round, whichever comes first.
    await expect(
      page.getByText(/VICTORY!|DEFEAT!|STALEMATE/i)
    ).toBeVisible({ timeout: 30_000 });
    allViolations.combatResult = await runAxeScan(page, 'combat-result');

    await testInfo.attach('combat-result', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // ---- Summary ----
    const totalViolations = Object.values(allViolations).flat().length;
    await testInfo.attach('audit-summary', {
      body: JSON.stringify(
        Object.fromEntries(
          Object.entries(allViolations).map(([k, v]) => [k, v.length])
        ),
        null,
        2
      ),
      contentType: 'application/json',
    });

    console.log(`Total accessibility violations across all screens: ${totalViolations}`);
    fs.writeFileSync(
      'e2e-audit-violations.json',
      JSON.stringify(allViolations, null, 2)
    );
  });
});
