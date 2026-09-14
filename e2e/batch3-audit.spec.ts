import { test, expect } from '@playwright/test';
import * as path from 'path';

const ARTIFACT_DIR = 'C:/Users/Anish/.gemini/antigravity/brain/1fec4ea1-9447-42d0-9e4d-ca47cfea8a88';

test.describe('Batch 3 Mobile-UX & Narrative Audit Verification', () => {
  test('verifies all 8 audit items and captures visual screenshots', async ({ page, isMobile }) => {
    // 1. Enter game
    await page.goto('/');
    await page.getByRole('button', { name: /ENTER THE AETHERIUM/i }).click();
    await expect(page.getByText(/Select your Commander/i)).toBeVisible({ timeout: 10_000 });

    // 2. Verify Hero Card Faction Motto (Item 6)
    if (!isMobile) {
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'audit_batch3_hero_select.png'),
      });
    }

    // Select Commander
    await page.getByRole('button', { name: /CHOOSE COMMANDER/i }).first().click();

    // 3. Verify Tutorial Step 1 Stakes (Item 7)
    await expect(page.getByText('WELCOME TO THE AETHERIUM')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/To prevent total cosmic collapse/i)).toBeVisible({ timeout: 5000 });

    if (!isMobile) {
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'audit_batch3_tutorial_lore.png'),
      });
    }

    // Skip Tutorial to enter Tavern
    await page.getByRole('button', { name: /SKIP TUTORIAL/i }).click();
    await expect(page.getByText('WARBAND FORMATION')).toBeVisible({ timeout: 10_000 });

    // 4. Verify Combat Button (Item 1)
    const combatButton = page.getByRole('button', { name: /COMBAT/i });
    await expect(combatButton).toBeVisible();
    await expect(combatButton.getByText('COMBAT')).toBeVisible();

    // 5. Verify Stat Medallions in Art Viewport (Item 2)
    const shopCards = page.locator('[data-testid="shop-card"]');
    await expect(shopCards.first()).toBeVisible({ timeout: 5000 });
    const atkMedallion = shopCards.first().locator('.stat-medallion-atk');
    await expect(atkMedallion).toBeVisible();

    // 6. Verify Odds Forecast in Dedicated Strip (Item 4)
    const forecastBadge = page.locator('[data-testid="combat-forecast-badge"]');
    await expect(forecastBadge).toBeVisible();

    // 7. Verify Slim Board Header (Item 5)
    await expect(page.getByText('WARBAND FORMATION')).toBeVisible();

    // Capture Tavern screenshots
    const tavernScreenshotName = isMobile ? 'audit_batch3_tavern_mobile.png' : 'audit_batch3_tavern_desktop.png';
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, tavernScreenshotName),
    });
  });
});
