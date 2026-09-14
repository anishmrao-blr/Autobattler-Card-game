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

      // Dismiss discover modal if a triple was formed
      const chooseBtn = page.getByRole('button', { name: /^CHOOSE$/i });
      if (await chooseBtn.first().isVisible().catch(() => false)) {
        await chooseBtn.first().tap();
        await page.waitForTimeout(300);
      }

      // Reroll to ensure second card available
      const rerollButtonMobile = page.locator('[data-testid="reroll-button"]');
      await rerollButtonMobile.tap();
      await page.waitForTimeout(400);

      await remainingShopCards.first().tap();
      await expect(page.getByText('TAP AGAIN TO BUY')).toBeVisible({ timeout: 5_000 });
      await remainingShopCards.first().tap();
      await page.waitForTimeout(400);

      if (await chooseBtn.first().isVisible().catch(() => false)) {
        await chooseBtn.first().tap();
        await page.waitForTimeout(300);
      }
    } else {
      await remainingShopCards.first().click();
      await page.waitForTimeout(400);

      const chooseBtn = page.getByRole('button', { name: /^CHOOSE$/i });
      if (await chooseBtn.first().isVisible().catch(() => false)) {
        await chooseBtn.first().click();
        await page.waitForTimeout(300);
      }

      const rerollButtonDesktop = page.locator('[data-testid="reroll-button"]');
      await rerollButtonDesktop.click();
      await page.waitForTimeout(600);

      await remainingShopCards.first().click();
      await page.waitForTimeout(500);

      if (await chooseBtn.first().isVisible().catch(() => false)) {
        await chooseBtn.first().click();
        await page.waitForTimeout(300);
      }
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

  test('renders parabolic hand fan and HearthSim live combat forecast odds', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ENTER THE AETHERIUM/i }).click();
    await expect(page.getByText(/Select your Commander/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /CHOOSE COMMANDER/i }).first().click();

    // Skip tutorial
    await expect(page.getByText('WELCOME TO THE AETHERIUM')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /SKIP TUTORIAL/i }).click();

    // 1. Verify HearthSim Combat Forecast Badge is visible in Tavern Shop header
    const forecastBadge = page.locator('[data-testid="combat-forecast-badge"]');
    await expect(forecastBadge).toBeVisible({ timeout: 5000 });
    const badgeText = await forecastBadge.textContent();
    expect(badgeText).toMatch(/Forecast|Odds/);
    expect(badgeText).toContain('% W');
    expect(badgeText).toContain('% T');
    expect(badgeText).toContain('% L');

    // Grant test coins to buy cards
    await page.evaluate(() => {
      (window as any).__testHarness?.addCoins(20);
    });
    await page.waitForTimeout(200);

    // Buy 3 cards into hand
    const shopCards = page.locator('[data-testid="shop-card"]');
    for (let i = 0; i < 3; i++) {
      if (isMobile) {
        await shopCards.first().tap();
        await expect(page.getByText('TAP AGAIN TO BUY')).toBeVisible({ timeout: 5000 });
        await shopCards.first().tap();
      } else {
        await shopCards.first().click();
      }
      await page.waitForTimeout(300);
      // Reroll to restock if needed
      if (i < 2) {
        const rerollBtn = page.locator('[data-testid="reroll-button"]');
        if (isMobile) {
          await rerollBtn.tap();
        } else {
          await rerollBtn.click();
        }
        await page.waitForTimeout(300);
      }
    }

    // 2. Verify Hand cards have parabolic fan transforms applied
    const handCards = page.locator('[data-testid="hand-card"]');
    await expect(handCards).toHaveCount(3, { timeout: 5000 });

    const firstCardTransform = await handCards.nth(0).evaluate((el) => el.style.transform);
    const middleCardTransform = await handCards.nth(1).evaluate((el) => el.style.transform);
    const lastCardTransform = await handCards.nth(2).evaluate((el) => el.style.transform);

    // Left card should have negative rotation
    expect(firstCardTransform).toMatch(/rotate\(-\d+/);
    // Center card should have 0deg rotation
    expect(middleCardTransform).toContain('rotate(0deg)');
    // Right card should have positive rotation
    expect(lastCardTransform).toMatch(/rotate\(\d+/);

    // 3. Hovering first card should lift and zero out rotation on desktop
    if (!isMobile) {
      await handCards.nth(0).hover();
      await page.waitForTimeout(200);
      const hoveredTransform = await handCards.nth(0).evaluate((el) => el.style.transform);
      expect(hoveredTransform).toContain('rotate(0deg)');
      expect(hoveredTransform).toContain('-20px');
    }

    // Capture screenshot of parabolic fan and live forecast badge
    const screenshotName = isMobile ? 'batch1_hand_fan_odds_mobile.png' : 'batch1_hand_fan_odds_desktop.png';
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, screenshotName),
    });
  });

  test('renders dynamic holographic foil and 3D tilt in card inspector', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ENTER THE AETHERIUM/i }).click();
    await expect(page.getByText(/Select your Commander/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /CHOOSE COMMANDER/i }).first().click();

    // Skip tutorial
    await expect(page.getByText('WELCOME TO THE AETHERIUM')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /SKIP TUTORIAL/i }).click();

    // Open inspector on the first shop card
    const inspectBtn = page.getByTitle('Zoom & Inspect Artwork').first();
    await inspectBtn.click();
    await expect(page.getByText(/Tribe Affinity/i)).toBeVisible({ timeout: 5000 });

    // Click to preview Golden Form
    const goldenToggle = page.getByRole('button', { name: /Preview Golden Form/i });
    await goldenToggle.click();
    await page.waitForTimeout(300);

    // Verify holographic specular sheen and rainbow stripes are mounted
    const holoSheen = page.locator('.holo-specular-sheen');
    const holoRainbow = page.locator('.holo-rainbow-stripes');
    await expect(holoSheen).toBeVisible({ timeout: 5000 });
    await expect(holoRainbow).toBeVisible({ timeout: 5000 });

    // Test 3D pointer parallax tilt on desktop
    if (!isMobile) {
      const cardBox = await page.locator('.perspective-1000').boundingBox();
      if (cardBox) {
        await page.mouse.move(cardBox.x + 40, cardBox.y + 40);
        await page.waitForTimeout(200);
      }
    }

    // Capture screenshot of dynamic golden holographic foil in inspector
    const screenshotName = isMobile ? 'batch2_golden_holo_mobile.png' : 'batch2_golden_holo_desktop.png';
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, screenshotName),
    });
  });

  test('commits single-slot reorder at sub-94px distance and handles rapid consecutive drags', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Pointer drag-to-reorder distance verification optimized for desktop pointer testing');

    await page.goto('/');
    await page.getByRole('button', { name: /ENTER THE AETHERIUM/i }).click();
    await expect(page.getByText(/Select your Commander/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /CHOOSE COMMANDER/i }).first().click();

    // Skip tutorial
    await expect(page.getByText('WELCOME TO THE AETHERIUM')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /SKIP TUTORIAL/i }).click();

    await expect(page.getByText('WARBAND FORMATION')).toBeVisible({ timeout: 10_000 });

    // Setup 4 distinct test board minions directly via harness
    await page.evaluate(() => {
      (window as any).__testHarness?.setupTestBoard(4);
    });

    const boardCards = page.locator('[data-testid="board-card"]');
    await expect(boardCards).toHaveCount(4, { timeout: 5000 });
    await boardCards.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Initial order: [Cogwork Scrapper, Abyssal Larva, Alchemist's Apprentice, Star-Pup]
    const card0 = await boardCards.nth(0).locator('[data-testid="card-title"]').textContent();
    const card1 = await boardCards.nth(1).locator('[data-testid="card-title"]').textContent();
    const card2 = await boardCards.nth(2).locator('[data-testid="card-title"]').textContent();
    const card3 = await boardCards.nth(3).locator('[data-testid="card-title"]').textContent();

    expect(card0).toContain('Cogwork Scrapper');
    expect(card1).toContain('Abyssal Larva');
    expect(card2).toContain('Elixir Apprentice');
    expect(card3).toContain('Star Shard');

    // 1. Verify sub-94px commit threshold (~78px drag)
    const box0 = await boardCards.nth(0).boundingBox();
    expect(box0).not.toBeNull();
    if (box0) {
      const startX = box0.x + box0.width / 2;
      const startY = box0.y + 40;

      // Drag 78px to the right:
      // Under old nearest-center (50% pitch / 94px), 78px reverted to index 0.
      // Under directional step (0.38 pitch / ~71px), 78px commits to index 1!
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 78, startY, { steps: 5 });
      await page.waitForTimeout(50);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Verify card 0 committed to index 1
      const newCard0 = await boardCards.nth(0).locator('[data-testid="card-title"]').textContent();
      const newCard1 = await boardCards.nth(1).locator('[data-testid="card-title"]').textContent();
      expect(newCard0).toContain('Abyssal Larva');
      expect(newCard1).toContain('Cogwork Scrapper');
    }

    // 2. Test Rapid Consecutive Drags without delay
    // Current board order: [Abyssal Larva (0), Cogwork Scrapper (1), Elixir Apprentice (2), Star Shard (3)]
    // Drag Star Shard from index 3 to index 0:
    const box3 = await boardCards.nth(3).boundingBox();
    const boxCurrent0 = await boardCards.nth(0).boundingBox();
    expect(box3).not.toBeNull();
    expect(boxCurrent0).not.toBeNull();

    if (box3 && boxCurrent0) {
      // First drag: move index 3 to index 0
      await page.mouse.move(box3.x + box3.width / 2, box3.y + 40);
      await page.mouse.down();
      await page.mouse.move(boxCurrent0.x + boxCurrent0.width / 2, boxCurrent0.y + 40, { steps: 6 });
      await page.mouse.up();

      // Immediately (zero delay), drag the card currently at index 1 to index 2
      // After Star Shard moved to 0: array is [Star Shard, Abyssal Larva, Cogwork Scrapper, Elixir Apprentice]
      // At index 1 is Abyssal Larva.
      const boxCurrent1 = await boardCards.nth(1).boundingBox();
      const boxCurrent2 = await boardCards.nth(2).boundingBox();
      if (boxCurrent1 && boxCurrent2) {
        await page.mouse.move(boxCurrent1.x + boxCurrent1.width / 2, boxCurrent1.y + 40);
        await page.mouse.down();
        await page.mouse.move(boxCurrent2.x + boxCurrent2.width / 2, boxCurrent2.y + 40, { steps: 6 });
        await page.mouse.up();
      }

      await page.waitForTimeout(400);

      // Verify final board layout matches [Delta, Bravo, Alpha, Charlie]:
      // Star Shard at 0, Abyssal Larva at 1, Cogwork Scrapper at 2, Elixir Apprentice at 3
      const final0 = await boardCards.nth(0).locator('[data-testid="card-title"]').textContent();
      const final1 = await boardCards.nth(1).locator('[data-testid="card-title"]').textContent();
      const final2 = await boardCards.nth(2).locator('[data-testid="card-title"]').textContent();
      const final3 = await boardCards.nth(3).locator('[data-testid="card-title"]').textContent();

      expect(final0).toContain('Star Shard');
      expect(final1).toContain('Abyssal Larva');
      expect(final2).toContain('Cogwork Scrapper');
      expect(final3).toContain('Elixir Apprentice');
    }
  });
});


