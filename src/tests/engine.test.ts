import { describe, it, expect, beforeEach } from 'vitest';
import { SharedCardPool } from '../engine/pool';
import { TavernManager } from '../engine/tavern';
import { CombatResolver } from '../engine/combat';
import { GameCoordinator } from '../engine/game';
import { HERO_DATABASE } from '../engine/heroes';
import { MINION_DATABASE, createBoardMinion } from '../engine/cards';
import { PlayerState } from '../types';

describe('Aetherium Engine - Shared Pool & Tavern', () => {
  let pool: SharedCardPool;
  let tavern: TavernManager;
  let player: PlayerState;

  beforeEach(() => {
    pool = new SharedCardPool();
    tavern = new TavernManager(pool);
    player = {
      id: 'test_player',
      name: 'Tester',
      isHuman: true,
      avatar: '⚙️',
      hero: HERO_DATABASE[0],
      hp: 40,
      maxHp: 40,
      coins: 10,
      maxCoins: 10,
      tavernTier: 1,
      tierUpgradeCost: 5,
      isFrozen: false,
      hand: [],
      board: [],
      tavernSlots: [],
      triplesFound: 0,
      winStreak: 0,
      isEliminated: false,
    };
  });

  it('rolls minions respecting player tavern tier', () => {
    player.tavernTier = 1;
    tavern.refreshTavern(player);
    expect(player.tavernSlots.length).toBe(3);
    expect(player.tavernSlots.every(m => m.tier <= 1)).toBe(true);
  });

  it('buys minion, deducts coins, adds to hand', () => {
    tavern.refreshTavern(player, 0);
    const firstMinion = player.tavernSlots[0];
    const expectedCost = player.hero.id === 'hero_chronos' && firstMinion.tribe === 'AUTOMATA' ? 2 : 3;
    const success = tavern.buyMinion(player, 0);
    expect(success).toBe(true);
    expect(player.coins).toBe(10 - expectedCost);
    expect(player.hand.length).toBe(1);
    expect(player.hand[0].id).toBe(firstMinion.id);
  });

  it('detects Triplets and creates Astral Forged card with Discover reward', () => {
    const scrapper = MINION_DATABASE.find(c => c.id === 'auto_scrapper')!;
    player.hand.push({ ...scrapper });
    player.hand.push({ ...scrapper });
    player.tavernSlots = [{ ...scrapper }];
    player.coins = 3;

    tavern.buyMinion(player, 0);
    expect(player.triplesFound).toBe(1);
    expect(player.hand.some(c => c.name.startsWith('★'))).toBe(true);
    expect(player.discoverOptions).toBeDefined();
    expect(player.discoverOptions?.length).toBe(3);
  });

  it('selling minion returns coins and returns card to pool', () => {
    const scrapper = MINION_DATABASE.find(c => c.id === 'auto_scrapper')!;
    player.board.push(createBoardMinion(scrapper));
    player.coins = 5;

    const success = tavern.sellMinion(player, 0);
    expect(success).toBe(true);
    expect(player.coins).toBe(6);
    expect(player.board.length).toBe(0);
  });
});

describe('Aetherium Engine - Card Database & Golden Doubling Consistency', () => {
  it('ensures every card in the database has active or passive mechanics and a doubled golden description', () => {
    for (const card of MINION_DATABASE) {
      expect(card.description.length).toBeGreaterThan(0);
      expect(card.goldenDescription).toBeDefined();
      expect(card.goldenDescription!.length).toBeGreaterThan(0);

      // Check keyword or active/passive syntax presence
      const hasMechanic =
        card.keywords.length > 0 ||
        card.description.includes('Deploy Surge') ||
        card.description.includes('Fracture Core') ||
        card.description.includes('Catalyst Aura') ||
        card.description.includes('Rally Cry') ||
        card.description.includes('Kinetic Overclock') ||
        card.description.includes('Aegis Bastion') ||
        card.description.includes('Aether Barrier') ||
        card.description.includes('Arc Sweep') ||
        card.description.includes('Miasmic');

      expect(hasMechanic).toBe(true);
    }
  });

  it('doubles stats when createBoardMinion is called with isGolden = true', () => {
    const scrapper = MINION_DATABASE.find(c => c.id === 'auto_scrapper')!;
    const normalMinion = createBoardMinion(scrapper, false);
    const goldenMinion = createBoardMinion(scrapper, true);

    expect(normalMinion.attack).toBe(scrapper.attack);
    expect(normalMinion.health).toBe(scrapper.health);

    expect(goldenMinion.attack).toBe(scrapper.attack * 2);
    expect(goldenMinion.health).toBe(scrapper.health * 2);
    expect(goldenMinion.isGolden).toBe(true);
    expect(goldenMinion.name).toContain('★');
  });
});

describe('Aetherium Engine - Combat Resolver Mechanics', () => {
  let combat: CombatResolver;

  beforeEach(() => {
    combat = new CombatResolver();
  });

  it('Aether Barrier absorbs 100% of first damage instance', () => {
    const scrapper = MINION_DATABASE.find(c => c.id === 'auto_scrapper')!;
    const p1: PlayerState = {
      id: 'p1',
      name: 'P1',
      isHuman: true,
      avatar: '🛡️',
      hero: HERO_DATABASE[0],
      hp: 40,
      maxHp: 40,
      coins: 10,
      maxCoins: 10,
      tavernTier: 1,
      tierUpgradeCost: 5,
      isFrozen: false,
      hand: [],
      board: [createBoardMinion(scrapper)],
      tavernSlots: [],
      triplesFound: 0,
      winStreak: 0,
      isEliminated: false,
    };

    const p2: PlayerState = {
      ...p1,
      id: 'p2',
      name: 'P2',
      board: [createBoardMinion({ ...scrapper, keywords: [] })]
    };

    const result = combat.simulate1v1(p1, p2);
    expect(result.events.some(e => e.type === 'BARRIER_BROKEN')).toBe(true);
  });

  it('Last Gasp spawns tokens on death and continues combat', () => {
    const p1: PlayerState = {
      id: 'p1',
      name: 'Void Master',
      isHuman: true,
      avatar: '🐙',
      hero: HERO_DATABASE[0],
      hp: 40,
      maxHp: 40,
      coins: 10,
      maxCoins: 10,
      tavernTier: 2,
      tierUpgradeCost: 5,
      isFrozen: false,
      hand: [],
      board: [
        createBoardMinion(MINION_DATABASE.find(c => c.id === 'void_larva')!)
      ],
      tavernSlots: [],
      triplesFound: 0,
      winStreak: 0,
      isEliminated: false,
    };

    const p2: PlayerState = {
      ...p1,
      id: 'p2',
      name: 'Weakling',
      board: [
        createBoardMinion({
          id: 'weak_1',
          name: 'Weak Bot',
          tier: 1,
          tribe: 'AUTOMATA',
          attack: 2,
          health: 1,
          keywords: [],
          description: '',
          goldenDescription: '',
          icon: '🤖',
          flavor: ''
        })
      ]
    };

    const result = combat.simulate1v1(p1, p2);
    expect(result.winnerSide).toBe(1);
    expect(result.events.some(e => e.type === 'TOKEN_SPAWNED')).toBe(true);
  });
});

describe('Aetherium Engine - Full 8-Player Game Simulation', () => {
  it('runs multiple game rounds and tracks leaderboard and eliminations', () => {
    const game = new GameCoordinator();
    game.initGame(HERO_DATABASE[0], 'Human Commander');

    expect(game.players.length).toBe(8);
    expect(game.getLivingPlayers().length).toBe(8);

    for (let r = 0; r < 3; r++) {
      const combatRes = game.resolveCombatPhase();
      expect(combatRes.humanMatch).toBeDefined();
      expect(combatRes.allResults.length).toBe(4);

      if (game.matchPhase !== 'GAME_OVER') {
        game.startNewTurn();
      }
    }

    const leaderboard = game.getLeaderboard();
    expect(leaderboard.length).toBe(8);
  });
});
