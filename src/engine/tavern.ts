import { MinionCard, PlayerState, BoardMinion } from '../types';
import { SharedCardPool } from './pool';
import { MINION_DATABASE, createBoardMinion } from './cards';

const TIER_SLOT_COUNTS: Record<number, number> = {
  1: 3,
  2: 4,
  3: 4,
  4: 5,
  5: 5,
  6: 6,
};

const BASE_UPGRADE_COSTS: Record<number, number> = {
  1: 5,  // Tier 1 -> 2
  2: 7,  // Tier 2 -> 3
  3: 8,  // Tier 3 -> 4
  4: 9,  // Tier 4 -> 5
  5: 10, // Tier 5 -> 6
};

export class TavernManager {
  constructor(private pool: SharedCardPool) {}

  public startPlayerTurn(player: PlayerState, turnNumber: number): void {
    player.maxCoins = Math.min(10, 2 + turnNumber);
    player.coins = player.maxCoins;

    if (player.tavernTier < 6) {
      player.tierUpgradeCost = Math.max(0, player.tierUpgradeCost - 1);
    }

    if (!player.isFrozen) {
      this.refreshTavern(player);
    } else {
      player.isFrozen = false;
    }

    this.processTurnStartBuffs(player);
  }

  public refreshTavern(player: PlayerState): void {
    const slotCount = TIER_SLOT_COUNTS[player.tavernTier] || 3;
    player.tavernSlots = this.pool.rollTavern(player.tavernTier, slotCount);
  }

  public reroll(player: PlayerState): boolean {
    if (player.coins < 1) return false;
    player.coins -= 1;
    player.isFrozen = false;
    this.refreshTavern(player);
    return true;
  }

  public toggleFreeze(player: PlayerState): void {
    player.isFrozen = !player.isFrozen;
  }

  public upgradeTier(player: PlayerState): boolean {
    if (player.tavernTier >= 6) return false;
    const cost = Math.max(0, player.tierUpgradeCost - (player.hero.id === 'hero_baron' ? 1 : 0));
    if (player.coins < cost) return false;

    player.coins -= cost;
    player.tavernTier += 1;
    if (player.tavernTier < 6) {
      player.tierUpgradeCost = BASE_UPGRADE_COSTS[player.tavernTier] || 8;
    }
    return true;
  }

  public buyMinion(player: PlayerState, shopIndex: number): boolean {
    const minion = player.tavernSlots[shopIndex];
    if (!minion) return false;
    
    let cost = 3;
    if (player.hero.id === 'hero_chronos' && minion.tribe === 'AUTOMATA') {
      cost = 2;
    }

    if (player.coins < cost) return false;
    if (player.hand.length >= 10) return false;

    player.coins -= cost;
    player.tavernSlots.splice(shopIndex, 1);
    player.hand.push(minion);

    for (const b of player.board) {
      if (b.cardId === 'celest_spark' && minion.tribe === 'CELESTIAL') {
        b.attack += b.isGolden ? 2 : 1;
      }
    }

    this.checkForTriplets(player, minion.id);
    return true;
  }

  public sellMinion(player: PlayerState, boardIndex: number): boolean {
    const minion = player.board[boardIndex];
    if (!minion) return false;

    player.board.splice(boardIndex, 1);
    const refund = minion.cardId === 'pirate_swab' ? (minion.isGolden ? 4 : 2) : 1;
    player.coins = Math.min(player.maxCoins + 2, player.coins + refund);

    const dbCard = { id: minion.cardId, tier: minion.tier } as MinionCard;
    this.pool.returnCards([dbCard]);
    return true;
  }

  public playMinionFromHand(player: PlayerState, handIndex: number, targetBoardIndex?: number): boolean {
    if (player.board.length >= 7) return false;
    const card = player.hand[handIndex];
    if (!card) return false;

    player.hand.splice(handIndex, 1);
    const isGolden = card.name.startsWith('★');
    const boardMinion = createBoardMinion(card, isGolden);

    const insertIdx = targetBoardIndex !== undefined && targetBoardIndex >= 0 && targetBoardIndex <= player.board.length
      ? targetBoardIndex
      : player.board.length;

    player.board.splice(insertIdx, 0, boardMinion);
    this.resolveDeployEffects(player, boardMinion);
    return true;
  }

  public reorderBoard(player: PlayerState, fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= player.board.length) return;
    if (toIndex < 0 || toIndex >= player.board.length) return;
    const [moved] = player.board.splice(fromIndex, 1);
    player.board.splice(toIndex, 0, moved);
  }

  public checkForTriplets(player: PlayerState, cardId: string): void {
    const handIndices: number[] = [];
    const boardIndices: number[] = [];

    player.hand.forEach((c, idx) => {
      if (c.id === cardId && !c.name.startsWith('★')) {
        handIndices.push(idx);
      }
    });

    player.board.forEach((b, idx) => {
      if (b.cardId === cardId && !b.isGolden) {
        boardIndices.push(idx);
      }
    });

    const totalCopies = handIndices.length + boardIndices.length;
    if (totalCopies >= 3) {
      const baseCard = MINION_DATABASE.find(c => c.id === cardId) || player.hand[handIndices[0]];

      let removed = 0;
      for (let i = handIndices.length - 1; i >= 0 && removed < 3; i--) {
        player.hand.splice(handIndices[i], 1);
        removed++;
      }
      for (let i = boardIndices.length - 1; i >= 0 && removed < 3; i--) {
        if (removed < 3) {
          player.board.splice(boardIndices[i], 1);
          removed++;
        }
      }

      if (baseCard) {
        const goldenCard: MinionCard = {
          ...baseCard,
          name: `★ ${baseCard.name.replace('★ ', '')}`,
          attack: baseCard.attack * 2,
          health: baseCard.health * 2,
          description: baseCard.goldenDescription || baseCard.description
        };

        player.hand.push(goldenCard);
        player.triplesFound += 1;

        const discoverTier = Math.min(6, player.tavernTier + 1);
        player.tripletRewardPending = discoverTier;
        player.discoverOptions = this.pool.getDiscoverOptions(discoverTier, 3);
      }
    }
  }

  public chooseDiscover(player: PlayerState, choiceIndex: number): void {
    if (!player.discoverOptions || choiceIndex < 0 || choiceIndex >= player.discoverOptions.length) return;
    const chosen = player.discoverOptions[choiceIndex];
    if (player.hand.length < 10) {
      player.hand.push(chosen);
    }
    player.tripletRewardPending = undefined;
    player.discoverOptions = undefined;
  }

  private resolveDeployEffects(player: PlayerState, minion: BoardMinion): void {
    if (minion.cardId === 'alch_brewer') {
      const buff = minion.isGolden ? 2 : 1;
      const targets = player.board.filter(b => b.instanceId !== minion.instanceId);
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        target.attack += buff;
        target.health += buff;
        target.maxHealth += buff;
      }
    }

    if (minion.cardId === 'alch_homunculus') {
      player.hp = Math.max(1, player.hp - 2);
    }

    if (minion.cardId === 'celest_envoy') {
      const targets = player.board.filter(b => b.instanceId !== minion.instanceId && !b.barrierActive);
      if (targets.length > 0) {
        targets[0].barrierActive = true;
        if (!targets[0].keywords.includes('AETHER_BARRIER')) {
          targets[0].keywords.push('AETHER_BARRIER');
        }
      }
    }

    if (minion.cardId === 'pirate_captain') {
      const bonus = minion.isGolden ? 6 : 3;
      player.coins = Math.min(player.maxCoins + bonus, player.coins + bonus);
    }

    if (minion.tribe === 'AUTOMATA') {
      for (const b of player.board) {
        if (b.cardId === 'auto_assembler' && b.instanceId !== minion.instanceId) {
          const buff = b.isGolden ? 4 : 2;
          minion.attack += buff;
          minion.health += buff;
          minion.maxHealth += buff;
        }
      }
    }
  }

  private processTurnStartBuffs(player: PlayerState): void {
    for (const b of player.board) {
      if (b.cardId === 'celest_scribe') {
        const buffAtk = b.isGolden ? 2 : 1;
        const buffHp = b.isGolden ? 4 : 2;
        const celestials = player.board.filter(m => m.tribe === 'CELESTIAL' && m.instanceId !== b.instanceId);
        if (celestials.length > 0) {
          const target = celestials[Math.floor(Math.random() * celestials.length)];
          target.attack += buffAtk;
          target.health += buffHp;
          target.maxHealth += buffHp;
        }
      }

      if (b.cardId === 'alch_transmuter' && player.board.length > 0) {
        const buff = b.isGolden ? 6 : 3;
        const leftmost = player.board[0];
        leftmost.attack += buff;
        leftmost.health += buff;
        leftmost.maxHealth += buff;
        if (!leftmost.keywords.includes('MIASMIC')) {
          leftmost.keywords.push('MIASMIC');
        }
      }

      if (b.cardId === 'celest_galaxy_titan') {
        const tribes = new Set(player.board.map(m => m.tribe).filter(t => t !== 'NEUTRAL'));
        const multiplier = b.isGolden ? 8 : 4;
        const totalBuff = tribes.size * multiplier;
        if (totalBuff > 0) {
          for (const m of player.board) {
            m.attack += totalBuff;
            m.health += totalBuff;
            m.maxHealth += totalBuff;
          }
        }
      }
    }
  }
}
