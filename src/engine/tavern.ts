import { SharedCardPool } from './pool';
import { PlayerState, MinionCard, BoardMinion } from '../types';
import { MINION_DATABASE, createBoardMinion } from './cards';

export class TavernManager {
  private pool: SharedCardPool;

  constructor(pool: SharedCardPool) {
    this.pool = pool;
  }

  public getUpgradeCost(_currentTier: number, baseCost: number): number {
    return Math.max(0, baseCost);
  }

  public startPlayerTurn(player: PlayerState, turnNumber: number): void {
    player.maxCoins = Math.min(10, turnNumber + 2);
    player.coins = player.maxCoins;
    this.refreshTavern(player, 0);
    this.processTurnStartBuffs(player);
  }

  public upgradeTier(player: PlayerState): boolean {
    if (player.tavernTier >= 6) return false;
    if (player.coins < player.tierUpgradeCost) return false;

    player.coins -= player.tierUpgradeCost;
    player.tavernTier += 1;

    const baseCosts = [0, 5, 7, 8, 9, 10, 0];
    player.tierUpgradeCost = baseCosts[player.tavernTier] || 10;
    return true;
  }

  public refreshTavern(player: PlayerState, cost = 1): boolean {
    if (cost > 0) {
      if (player.coins < cost) return false;
      player.coins -= cost;
    }

    const slotCounts = [0, 3, 4, 4, 5, 5, 6];
    const numSlots = slotCounts[player.tavernTier] || 3;

    if (player.tavernSlots.length > 0 && !player.isFrozen) {
      this.pool.returnCards(player.tavernSlots);
    }

    if (!player.isFrozen) {
      player.tavernSlots = this.pool.rollTavern(player.tavernTier, numSlots);
    } else {
      player.isFrozen = false;
    }

    return true;
  }

  public reroll(player: PlayerState): boolean {
    player.isFrozen = false;
    return this.refreshTavern(player, 1);
  }

  public toggleFreeze(player: PlayerState): void {
    player.isFrozen = !player.isFrozen;
  }

  public buyMinion(player: PlayerState, shopIndex: number): boolean {
    if (shopIndex < 0 || shopIndex >= player.tavernSlots.length) return false;
    const minion = player.tavernSlots[shopIndex];
    if (!minion) return false;

    let cost = 3;
    // Hero: Chronos passive discount on first Automata
    if (player.hero.id === 'hero_chronos' && minion.tribe === 'AUTOMATA') {
      const alreadyDiscounted = player.hand.some(c => c.tribe === 'AUTOMATA') || player.board.some(b => b.tribe === 'AUTOMATA');
      if (!alreadyDiscounted) cost = 2;
    }

    if (player.coins < cost) return false;
    if (player.hand.length >= 10) return false;

    player.coins -= cost;
    player.tavernSlots.splice(shopIndex, 1);
    player.hand.push(minion);

    // On-Buy Tribal Triggers (e.g. Star Shard)
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
    // Alchemist Tier 1: Elixir Apprentice (Deploy Surge: +1/+1 or Golden +2/+2)
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

    // Alchemist Tier 2: Volatile Homunculus
    if (minion.cardId === 'alch_homunculus') {
      player.hp = Math.max(1, player.hp - 2);
    }

    // Celestial Tier 3: Starlight Envoy (Grant Barrier, Golden: grant 2 Barriers)
    if (minion.cardId === 'celest_envoy') {
      const count = minion.isGolden ? 2 : 1;
      const targets = player.board.filter(b => b.instanceId !== minion.instanceId && !b.barrierActive);
      targets.slice(0, count).forEach(t => {
        t.barrierActive = true;
        if (!t.keywords.includes('AETHER_BARRIER')) {
          t.keywords.push('AETHER_BARRIER');
        }
      });
    }

    // Celestial Tier 4: Nova Archon (Deploy Surge: +1/+1 per Celestial, Golden: +2/+2)
    if (minion.cardId === 'celest_archon') {
      const celestials = player.board.filter(m => m.tribe === 'CELESTIAL').length;
      const multiplier = minion.isGolden ? 2 : 1;
      const buff = celestials * multiplier;
      if (buff > 0) {
        player.board.forEach(m => {
          m.attack += buff;
          m.health += buff;
          m.maxHealth += buff;
        });
      }
    }

    // Pirate Tier 4: Corsair Captain (Deploy Surge: +3 coins, Golden +6 coins)
    if (minion.cardId === 'pirate_captain') {
      const bonus = minion.isGolden ? 6 : 3;
      player.coins = Math.min(player.maxCoins + bonus, player.coins + bonus);
    }

    // Alchemist Tier 5: Philosopher Grandmaster (Transform tavern minion into +1 tier higher)
    if (minion.cardId === 'alch_philosopher' && player.tavernSlots.length > 0) {
      const count = minion.isGolden ? 2 : 1;
      for (let i = 0; i < count && i < player.tavernSlots.length; i++) {
        const nextTier = Math.min(6, player.tavernSlots[i].tier + 1);
        const rolled = this.pool.rollTavern(nextTier, 1);
        if (rolled.length > 0) {
          player.tavernSlots[i] = rolled[0];
        }
      }
    }

    // Automata Tier 3: Cogwheel Assembler (Whenever another Automata is played, +2/+2 or Golden +4/+4)
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

  public processTurnStartBuffs(player: PlayerState): void {
    for (const b of player.board) {
      // Celestial Tier 2: Astral Scribe (+1/+2, Golden +2/+4)
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

      // Alchemist Tier 4: Arcane Transmuter (+3/+3 to leftmost minion, Golden: 2 leftmost minions +6/+6)
      if (b.cardId === 'alch_transmuter' && player.board.length > 0) {
        const buff = b.isGolden ? 6 : 3;
        const count = b.isGolden ? 2 : 1;
        player.board.slice(0, count).forEach(leftmost => {
          leftmost.attack += buff;
          leftmost.health += buff;
          leftmost.maxHealth += buff;
        });
      }

      // Automata Tier 5: Clockwork Overlord (Give all friendly Automata +2/+2, Golden +4/+4)
      if (b.cardId === 'auto_overlord') {
        const buff = b.isGolden ? 4 : 2;
        player.board.forEach(m => {
          if (m.tribe === 'AUTOMATA') {
            m.attack += buff;
            m.health += buff;
            m.maxHealth += buff;
          }
        });
      }

      // Alchemist Tier 6: Arch-Alchemist Aurelius (Double stats of leftmost minion, Golden: 2 leftmost minions)
      if (b.cardId === 'alch_elixir_master' && player.board.length > 0) {
        const count = b.isGolden ? 2 : 1;
        player.board.slice(0, count).forEach(target => {
          target.attack *= 2;
          target.health *= 2;
          target.maxHealth *= 2;
        });
      }
    }
  }
}
