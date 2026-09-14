import { test, expect } from '@playwright/test';
import * as path from 'path';

const ARTIFACT_DIR = 'C:/Users/Anish/.gemini/antigravity/brain/1fec4ea1-9447-42d0-9e4d-ca47cfea8a88';

test.describe('Tactile TCG Card Reorder', () => {
  test('drag-to-reorder on warband board and hand tray with slot parting', async ({ page, isMobile }) => {
    // 1. Enter game & setup
    await page.goto('/');
    await page.getByRole('button', { name: /ENTER THE AETHERIUM/i }).click();
    await expect(page.getByText(/Select your Commander/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /CHOOSE COMMANDER/i }).first().click();

    // Skip tutorial
    await expect(page.getByText('WELCOME TO THE AETHERIUM')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /SKIP TUTORIAL/i }).click();

    await expect(page.getByText('WARBAND FORMATION')).toBeVisible({ timeout: 10_000 });

    // Grant test coins to recruit multiple cards without economy constraints
    await page.evaluate(() => {
      (window as any).__testHarness?.addCoins(25);
    });
    await page.waitForTimeout(200);

    // 2. Buy two minions from shop
    const shopCards = page.locator('[data-testid="shop-card"]');
    await expect(shopCards.first()).toBeVisible({ timeout: 5000 });

    if (isMobile) {
      // First card buy
      await shopCards.first().tap();
      await expect(page.getByText('TAP AGAIN TO BUY')).toBeVisible({ timeout: 5_000 });
      await shopCards.first().tap();
      await page.waitForTimeout(400);

      // Second card buy
      await shopCards.first().tap();
      await expect(page.getByText('TAP AGAIN TO BUY')).toBeVisible({ timeout: 5_000 });
      await shopCards.first().tap();
      await page.waitForTimeout(400);
    } else {
      // First card buy
      await shopCards.first().click();
      await page.waitForTimeout(400);

      // Second card buy
      await shopCards.first().click();
      await page.waitForTimeout(400);
    }

    // 3. Verify 2 cards are in Hand Tray
    const handCards = page.locator('[data-testid="hand-card"]');
    await expect(handCards).toHaveCount(2, { timeout: 5000 });

    // Deploy both minions to the board (tapping / clicking hand cards)
    if (isMobile) {
      await handCards.first().tap();
      await page.waitForTimeout(400);
      if (await handCards.count() > 0) {
        await handCards.first().tap();
        await page.waitForTimeout(400);
      }
    } else {
      await handCards.first().click();
      await page.waitForTimeout(400);
      if (await handCards.count() > 0) {
        await handCards.first().click();
        await page.waitForTimeout(400);
      }
    }

    // 4. Verify board now has 2 minions
    const boardCards = page.locator('[data-testid="board-card"]');
    await expect(boardCards).toHaveCount(2, { timeout: 5000 });
    await boardCards.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const initialBoardCard0 = await boardCards.nth(0).locator('[data-testid="card-title"]').textContent();
    const initialBoardCard1 = await boardCards.nth(1).locator('[data-testid="card-title"]').textContent();

    const firstBoardBox = await boardCards.nth(0).boundingBox();
    const secondBoardBox = await boardCards.nth(1).boundingBox();
    expect(firstBoardBox).not.toBeNull();
    expect(secondBoardBox).not.toBeNull();

    if (firstBoardBox && secondBoardBox) {
      // 5. Test Board Card Drag-to-Reorder
      // Target the upper third of the card (title/header) safely above bottom overlap
      const startX = firstBoardBox.x + firstBoardBox.width / 2;
      const startY = firstBoardBox.y + 40;
      const targetX = secondBoardBox.x + secondBoardBox.width / 2;
      const targetY = secondBoardBox.y + 40;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Move past 8px threshold to initiate physical lift
      await page.mouse.move(startX + 45, startY - 15, { steps: 6 });
      await page.waitForTimeout(200);

      // Verify golden aura ring and grabbing cursor
      await expect(boardCards.nth(0)).toHaveClass(/ring-yellow-400/);
      await expect(boardCards.nth(0)).toHaveClass(/cursor-grabbing/);

      // Capture screenshot of lifted board card with slot parting
      const boardScreenshotName = isMobile ? 'board_reorder_lift_mobile.png' : 'board_reorder_lift_desktop.png';
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, boardScreenshotName),
      });

      // Move over second card slot and release
      await page.mouse.move(targetX, targetY, { steps: 8 });
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(400);

      // Verify board cards successfully swapped positions
      const swappedBoardCard0 = await boardCards.nth(0).locator('[data-testid="card-title"]').textContent();
      expect(swappedBoardCard0).toBe(initialBoardCard1);
    }

    // 6. Test Hand Tray Drag-to-Reorder
    // Buy 2 more cards from shop into Hand Tray
    const remainingShopCards = page.locator('[data-testid="shop-card"]');
    if (isMobile) {
      await remainingShopCards.first().tap();
      await expect(page.getByText('TAP AGAIN TO BUY')).toBeVisible({ timeout: 5_000 });
      await remainingShopCards.first().tap();
      await page.waitForTimeout(300);

      // Reroll to ensure second card available
      const rerollButton = page.getByRole('button', { name: /REROLL/i });
      await rerollButton.click();
      await page.waitForTimeout(300);

      await remainingShopCards.first().tap();
      await expect(page.getByText('TAP AGAIN TO BUY')).toBeVisible({ timeout: 5_000 });
      await remainingShopCards.first().tap();
      await page.waitForTimeout(400);
    } else {
      await remainingShopCards.first().click();
      await page.waitForTimeout(300);

      const rerollButton = page.getByRole('button', { name: /REROLL/i });
      await rerollButton.click();
      await page.waitForTimeout(300);

      await remainingShopCards.first().click();
      await page.waitForTimeout(400);
    }

    // Check hand cards count
    const updatedHandCards = page.locator('[data-testid="hand-card"]');
    await expect(updatedHandCards).toHaveCount(2, { timeout: 5000 });
    await updatedHandCards.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const initialHand0 = await updatedHandCards.nth(0).locator('[data-testid="card-title"]').textContent();
    const initialHand1 = await updatedHandCards.nth(1).locator('[data-testid="card-title"]').textContent();

    const h0Box = await updatedHandCards.nth(0).boundingBox();
    const h1Box = await updatedHandCards.nth(1).boundingBox();
    if (h0Box && h1Box) {
      const hStartX = h0Box.x + h0Box.width / 2;
      const hStartY = h0Box.y + 35;
      const hTargetX = h1Box.x + h1Box.width / 2;
      const hTargetY = h1Box.y + 35;

      await page.mouse.move(hStartX, hStartY);
      await page.mouse.down();
      // Move past 8px threshold
      await page.mouse.move(hStartX + 40, hStartY - 20, { steps: 6 });
      await page.waitForTimeout(200);

      // Verify active drag styling
      await expect(updatedHandCards.nth(0)).toHaveClass(/ring-yellow-400/);

      // Capture screenshot of hand card lifted with slot parting
      const handScreenshotName = isMobile ? 'hand_reorder_lift_mobile.png' : 'hand_reorder_lift_desktop.png';
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, handScreenshotName),
      });

      // Drop onto slot 1
      await page.mouse.move(hTargetX, hTargetY, { steps: 8 });
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(400);

      // Verify hand cards swapped
      const swappedHand0 = await updatedHandCards.nth(0).locator('[data-testid="card-title"]').textContent();
      expect(swappedHand0).toBe(initialHand1);
    }
  });
});
