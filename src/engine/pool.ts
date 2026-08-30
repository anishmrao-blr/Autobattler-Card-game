import { MinionCard } from '../types';
import { MINION_DATABASE } from './cards';

const TIER_COPY_COUNTS: Record<number, number> = {
  1: 16,
  2: 15,
  3: 13,
  4: 11,
  5: 9,
  6: 7,
};

export class SharedCardPool {
  private pool: Map<string, number> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.pool.clear();
    for (const card of MINION_DATABASE) {
      const count = TIER_COPY_COUNTS[card.tier] || 10;
      this.pool.set(card.id, count);
    }
  }

  public rollTavern(tier: number, slotCount: number): MinionCard[] {
    const availableCards = MINION_DATABASE.filter(
      c => c.tier <= tier && (this.pool.get(c.id) || 0) > 0
    );

    if (availableCards.length === 0) {
      // Fallback if pool is empty
      return MINION_DATABASE.filter(c => c.tier <= tier).slice(0, slotCount);
    }

    // Create weighted lottery ticket array based on remaining counts
    const tickets: MinionCard[] = [];
    for (const card of availableCards) {
      const remaining = this.pool.get(card.id) || 0;
      for (let i = 0; i < remaining; i++) {
        tickets.push(card);
      }
    }

    const result: MinionCard[] = [];
    for (let i = 0; i < slotCount; i++) {
      if (tickets.length === 0) break;
      const idx = Math.floor(Math.random() * tickets.length);
      const chosen = tickets[idx];
      result.push(chosen);
      // Decrement pool
      const current = this.pool.get(chosen.id) || 1;
      this.pool.set(chosen.id, Math.max(0, current - 1));
      // Remove that specific ticket
      tickets.splice(idx, 1);
    }

    return result;
  }

  public returnCards(cards: MinionCard[]): void {
    for (const card of cards) {
      const current = this.pool.get(card.id) || 0;
      const maxCopies = TIER_COPY_COUNTS[card.tier] || 16;
      this.pool.set(card.id, Math.min(maxCopies, current + 1));
    }
  }

  public getDiscoverOptions(tier: number, count = 3): MinionCard[] {
    // Target tier cards (capped at 6)
    const targetTier = Math.min(6, tier);
    const tierCards = MINION_DATABASE.filter(c => c.tier === targetTier);
    const shuffled = [...tierCards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  public getRemainingCount(cardId: string): number {
    return this.pool.get(cardId) || 0;
  }
}
