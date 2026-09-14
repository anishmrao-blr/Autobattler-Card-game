import { describe, it, expect, beforeEach } from 'vitest';
import { SharedCardPool } from '../engine/pool';
import { TavernManager } from '../engine/tavern';
import { CombatResolver } from '../engine/combat';
import { GameCoordinator } from '../engine/game';
import { HERO_DATABASE } from '../engine/heroes';
import { MINION_DATABASE, createBoardMinion } from '../engine/cards';
import { PlayerState } from '../types';
import { calculateCardFan } from '../hooks/useCardFan';

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

  it('allows human player to concede, correctly assigns placement, and finishes game', () => {
    const game = new GameCoordinator();
    game.initGame(HERO_DATABASE[0], 'Conceding Commander');
    const human = game.getHumanPlayer();

    expect(game.matchPhase).toBe('TAVERN');
    expect(game.getPredictedPlacement(human)).toBe(8);

    game.concedeGame(human);

    expect(human.hp).toBe(0);
    expect(human.isEliminated).toBe(true);
    expect(human.placement).toBe(8);
    expect(game.matchPhase).toBe('GAME_OVER');
  });
});

describe('Aetherium Engine - Balance Orders & Permanent Buff Caps', () => {
  let pool: SharedCardPool;
  let tavern: TavernManager;
  let combat: CombatResolver;
  let player: PlayerState;

  beforeEach(() => {
    pool = new SharedCardPool();
    tavern = new TavernManager(pool);
    combat = new CombatResolver();
    player = {
      id: 'test_player',
      name: 'Tester',
      isHuman: true,
      avatar: '⚙️',
      hero: HERO_DATABASE[0],
      hp: 40,
      maxHp: 40,
      coins: 20,
      maxCoins: 20,
      tavernTier: 6,
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

  it('celest_spark caps attack gain at +6 (or +12 golden)', () => {
    const sparkCard = MINION_DATABASE.find(c => c.id === 'celest_spark')!;
    const sparkMinion = createBoardMinion(sparkCard);
    player.board.push(sparkMinion);
    const initialAtk = sparkMinion.attack;

    const celestialCard = MINION_DATABASE.find(c => c.tribe === 'CELESTIAL' && c.id !== 'celest_spark')!;
    // Buy 8 celestials
    for (let i = 0; i < 8; i++) {
      player.tavernSlots = [{ ...celestialCard }];
      player.coins = 10;
      tavern.buyMinion(player, 0);
    }

    // Should have capped at initial + 6
    expect(sparkMinion.attack).toBe(initialAtk + 6);
    expect(sparkMinion.permanentBuffTriggers).toBe(6);

    // Test Golden: cap at +12
    const goldenSpark = createBoardMinion(sparkCard, true);
    player.board = [goldenSpark];
    const initialGoldenAtk = goldenSpark.attack;
    for (let i = 0; i < 10; i++) {
      player.tavernSlots = [{ ...celestialCard }];
      player.coins = 10;
      tavern.buyMinion(player, 0);
    }
    expect(goldenSpark.attack).toBe(initialGoldenAtk + 12);
    expect(goldenSpark.permanentBuffTriggers).toBe(12);
  });

  it('auto_overlord caps at 5 triggers and grants +1/+1 (+2/+2 golden)', () => {
    const overlordCard = MINION_DATABASE.find(c => c.id === 'auto_overlord')!;
    const overlord = createBoardMinion(overlordCard);
    const scrapper = createBoardMinion(MINION_DATABASE.find(c => c.id === 'auto_scrapper')!);
    player.board = [overlord, scrapper];

    const initialOverlordAtk = overlord.attack;
    const initialScrapperAtk = scrapper.attack;

    // Trigger processTurnStartBuffs 7 times
    for (let i = 0; i < 7; i++) {
      tavern.processTurnStartBuffs(player);
    }

    // Should trigger exactly 5 times (+5/+5 to all automata)
    expect(overlord.permanentBuffTriggers).toBe(5);
    expect(scrapper.attack).toBe(initialScrapperAtk + 5);
    expect(scrapper.health).toBe(scrapper.maxHealth);
    expect(overlord.attack).toBe(initialOverlordAtk + 5);
  });

  it('alch_elixir_master grants flat +5/+5 (+10/+10 golden) instead of 2x doubling', () => {
    const alchCard = MINION_DATABASE.find(c => c.id === 'alch_elixir_master')!;
    const alch = createBoardMinion(alchCard);
    const target = createBoardMinion(MINION_DATABASE.find(c => c.id === 'auto_scrapper')!);
    target.attack = 4;
    target.health = 4;
    target.maxHealth = 4;

    player.board = [target, alch]; // target is leftmost

    tavern.processTurnStartBuffs(player);
    // +5/+5 flat
    expect(target.attack).toBe(9);
    expect(target.health).toBe(9);

    // Test Golden: +10/+10 to 2 leftmost
    const goldenAlch = createBoardMinion(alchCard, true);
    player.board = [target, alch, goldenAlch];
    tavern.processTurnStartBuffs(player);
    // goldenAlch gives +10/+10 to target and alch, regular alch gives +5/+5 to target
    expect(target.attack).toBe(9 + 10 + 5);
    expect(alch.attack).toBe(6 + 10);
  });

  it('void_devourer caps at 4 friendly Voidborn deaths in combat', () => {
    const devourer = createBoardMinion(MINION_DATABASE.find(c => c.id === 'void_devourer')!);
    const larva = createBoardMinion(MINION_DATABASE.find(c => c.id === 'void_larva')!);
    devourer.health = 500;
    devourer.maxHealth = 500;
    const initialAtk = devourer.attack;
    const initialHp = devourer.health;

    // Setup board with devourer and dying friendly Voidborns
    const p1: PlayerState = {
      ...player,
      board: [
        { ...larva, health: 1, maxHealth: 1, keywords: ['BASTION'] },
        { ...larva, health: 1, maxHealth: 1, keywords: ['BASTION'] },
        { ...larva, health: 1, maxHealth: 1, keywords: ['BASTION'] },
        { ...larva, health: 1, maxHealth: 1, keywords: ['BASTION'] },
        { ...larva, health: 1, maxHealth: 1, keywords: ['BASTION'] },
        devourer,
      ]
    };

    // Fast enemy that will kill the larvae
    const enemyMinion = createBoardMinion({
      id: 'killer',
      name: 'Killer',
      tier: 6,
      tribe: 'NEUTRAL',
      attack: 10,
      health: 100,
      keywords: [],
      description: '',
      icon: '⚔️',
      flavor: ''
    });

    const p2: PlayerState = {
      ...player,
      id: 'enemy',
      board: [enemyMinion]
    };

    combat.simulate1v1(p1, p2);
    // Even if 5 larvae die, devourer should only gain 4 triggers (+8/+4)
    expect(devourer.permanentBuffTriggers).toBe(4);
    expect(devourer.attack).toBe(initialAtk + 8);
    expect(devourer.health).toBe(initialHp + 4);
  });

  it('void_abomination only absorbs friendly VOIDBORN and caps at +15 (+30 golden)', () => {
    const abomination = createBoardMinion(MINION_DATABASE.find(c => c.id === 'void_abomination')!);
    abomination.health = 500;
    abomination.maxHealth = 500;
    abomination.keywords = [];
    const initialAtk = abomination.attack;

    // Ally non-voidborn minion: should NOT be absorbed
    const beastAlly = createBoardMinion(MINION_DATABASE.find(c => c.id === 'beast_ripper')!);
    beastAlly.attack = 10;
    beastAlly.health = 1;
    beastAlly.keywords = ['BASTION'];

    // Ally voidborn minion: should be absorbed
    const voidAlly1 = createBoardMinion(MINION_DATABASE.find(c => c.id === 'void_larva')!);
    voidAlly1.attack = 10;
    voidAlly1.health = 1;
    voidAlly1.keywords = ['BASTION'];

    const voidAlly2 = createBoardMinion(MINION_DATABASE.find(c => c.id === 'void_larva')!);
    voidAlly2.attack = 10;
    voidAlly2.health = 1;
    voidAlly2.keywords = ['BASTION'];

    const p1: PlayerState = {
      ...player,
      board: [beastAlly, voidAlly1, voidAlly2, abomination]
    };

    const enemy = createBoardMinion({
      id: 'enemy_giant',
      name: 'Giant',
      tier: 6,
      tribe: 'NEUTRAL',
      attack: 20,
      health: 200,
      keywords: [],
      description: '',
      icon: '💀',
      flavor: ''
    });

    const p2: PlayerState = {
      ...player,
      id: 'enemy',
      board: [enemy]
    };

    combat.simulate1v1(p1, p2);

    // beastAlly died (10 atk) -> ignored
    // voidAlly1 died (10 atk) -> absorbs 10 (triggers = 10)
    // voidAlly2 died (10 atk) -> absorbs remaining 5 up to cap 15 (triggers = 15)
    expect(abomination.permanentBuffTriggers).toBe(15);
    expect(abomination.attack).toBe(initialAtk + 15);
  });

  it('beast_god_behemoth only triggers on friendly BEAST deaths up to max 3 times', () => {
    const behemoth = createBoardMinion(MINION_DATABASE.find(c => c.id === 'beast_god_behemoth')!);
    behemoth.health = 500;
    behemoth.maxHealth = 500;
    behemoth.keywords = [];
    const initialAtk = behemoth.attack;
    const initialHp = behemoth.health;

    const friendlyBeast = createBoardMinion(MINION_DATABASE.find(c => c.id === 'beast_ripper')!);
    friendlyBeast.health = 1;
    friendlyBeast.keywords = ['BASTION'];

    const friendlyAutomata = createBoardMinion(MINION_DATABASE.find(c => c.id === 'auto_scrapper')!);
    friendlyAutomata.health = 1;
    friendlyAutomata.keywords = ['BASTION'];

    const p1: PlayerState = {
      ...player,
      board: [
        { ...friendlyBeast },
        { ...friendlyBeast },
        { ...friendlyBeast },
        { ...friendlyBeast },
        { ...friendlyAutomata }, // should NOT trigger behemoth
        behemoth
      ]
    };

    const enemy = createBoardMinion({
      id: 'enemy_boss',
      name: 'Boss',
      tier: 6,
      tribe: 'NEUTRAL',
      attack: 30,
      health: 300,
      keywords: [],
      description: '',
      icon: '👾',
      flavor: ''
    });

    const p2: PlayerState = {
      ...player,
      id: 'enemy',
      board: [enemy]
    };

    combat.simulate1v1(p1, p2);

    // friendlyAutomata ignored.
    // 4 friendly beasts die, but max triggers is 3 (+6/+6)
    expect(behemoth.permanentBuffTriggers).toBe(3);
    expect(behemoth.attack).toBe(initialAtk + 6);
    expect(behemoth.health).toBe(initialHp + 6);
  });

  it('reorders hand and board correctly with boundary safety', () => {
    const tavern = new TavernManager(pool);
    const card1 = MINION_DATABASE[0];
    const card2 = MINION_DATABASE[1];
    const card3 = MINION_DATABASE[2];

    const p: PlayerState = {
      ...player,
      hand: [card1, card2, card3],
      board: [
        createBoardMinion(card1),
        createBoardMinion(card2),
        createBoardMinion(card3),
      ]
    };

    // Reorder hand: move index 0 to index 2 -> [card2, card3, card1]
    tavern.reorderHand(p, 0, 2);
    expect(p.hand[0].id).toBe(card2.id);
    expect(p.hand[1].id).toBe(card3.id);
    expect(p.hand[2].id).toBe(card1.id);

    // Reorder board: move index 2 to index 0 -> [card3, card1, card2]
    tavern.reorderBoard(p, 2, 0);
    expect(p.board[0].cardId).toBe(card3.id);
    expect(p.board[1].cardId).toBe(card1.id);
    expect(p.board[2].cardId).toBe(card2.id);

    // Out of bounds safety checks
    tavern.reorderHand(p, -1, 2);
    expect(p.hand[0].id).toBe(card2.id);
    tavern.reorderHand(p, 0, 99);
    expect(p.hand[0].id).toBe(card2.id);
  });
});

describe('Batch 1 Polish - Parabolic Hand Fan (calculateCardFan)', () => {
  it('returns default layout for single card or dragging state', () => {
    const single = calculateCardFan(0, 1, false, false);
    expect(single.transform).toBeUndefined();
    expect(single.transformOrigin).toBe('bottom center');
    expect(single.zIndex).toBe(10);

    const dragging = calculateCardFan(1, 5, false, true);
    expect(dragging.transform).toBeUndefined();
    expect(dragging.zIndex).toBe(50);
  });

  it('calculates symmetrical angular fan without NaN for any hand size', () => {
    const total = 5;
    const styles = [0, 1, 2, 3, 4].map(i => calculateCardFan(i, total, false, false));

    // Ensure no NaN in generated transforms
    styles.forEach(s => {
      expect(s.transform).toBeDefined();
      expect(s.transform).not.toContain('NaN');
    });

    // Center card (idx 2) should have 0 rotation
    expect(styles[2].transform).toContain('rotate(0deg)');

    // Left card (idx 0) should have negative rotation
    expect(styles[0].transform).toMatch(/rotate\(-\d+(\.\d+)?deg\)/);

    // Right card (idx 4) should have positive rotation
    expect(styles[4].transform).toMatch(/rotate\(\d+(\.\d+)?deg\)/);
  });

  it('elevates and straightens card on hover', () => {
    const hovered = calculateCardFan(0, 5, true, false);
    expect(hovered.transform).toContain('-20px');
    expect(hovered.transform).toContain('rotate(0deg)');
    expect(hovered.zIndex).toBe(40);
  });

  it('respects reduced motion by disabling rotation', () => {
    const reduced = calculateCardFan(0, 5, false, false, true);
    expect(reduced.transform).toBeUndefined();

    const reducedHovered = calculateCardFan(0, 5, true, false, true);
    expect(reducedHovered.transform).toBe('translate3d(0, -18px, 0)');
    expect(reducedHovered.zIndex).toBe(40);
  });
});

describe('Batch 1 Polish - HearthSim Monte Carlo Odds Predictor', () => {
  let combat: CombatResolver;
  let basePlayer: PlayerState;

  beforeEach(() => {
    combat = new CombatResolver();
    basePlayer = {
      id: 'p1',
      name: 'Player 1',
      isHuman: true,
      avatar: '⚙️',
      hero: HERO_DATABASE[0],
      hp: 30,
      maxHp: 30,
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

  it('correctly handles empty boards with immediate deterministic odds', () => {
    const p1 = { ...basePlayer, board: [] };
    const p2 = { ...basePlayer, id: 'p2', name: 'Player 2', board: [] };

    const tieOdds = combat.simulateMonteCarloOdds(p1, p2, 50);
    expect(tieOdds.tieRate).toBe(100);
    expect(tieOdds.winRate).toBe(0);
    expect(tieOdds.lossRate).toBe(0);

    const minion = MINION_DATABASE[0];
    const p1WithBoard = { ...basePlayer, board: [createBoardMinion(minion)] };
    const winOdds = combat.simulateMonteCarloOdds(p1WithBoard, p2, 50);
    expect(winOdds.winRate).toBe(100);
    expect(winOdds.tieRate).toBe(0);
    expect(winOdds.lossRate).toBe(0);

    const lossOdds = combat.simulateMonteCarloOdds(p1, p1WithBoard, 50);
    expect(lossOdds.lossRate).toBe(100);
    expect(lossOdds.winRate).toBe(0);
    expect(lossOdds.tieRate).toBe(0);
  });

  it('runs 100 headless simulations in < 5ms and odds sum to ~100%', () => {
    const m1 = createBoardMinion(MINION_DATABASE[0]);
    const m2 = createBoardMinion(MINION_DATABASE[1]);
    const m3 = createBoardMinion(MINION_DATABASE[2]);
    const m4 = createBoardMinion(MINION_DATABASE[3]);

    const p1 = { ...basePlayer, board: [m1, m2] };
    const p2 = { ...basePlayer, id: 'p2', name: 'Opponent', board: [m3, m4] };

    const t0 = performance.now();
    const odds = combat.simulateMonteCarloOdds(p1, p2, 100);
    const duration = performance.now() - t0;

    expect(duration).toBeLessThan(15); // Fast headless benchmark
    const total = odds.winRate + odds.tieRate + odds.lossRate;
    expect(Math.abs(total - 100)).toBeLessThanOrEqual(0.5); // Floating point rounding check
  });

  it('GameCoordinator schedules pairings and returns valid next opponent', () => {
    const game = new GameCoordinator();
    game.initGame(HERO_DATABASE[0], 'Test Hero');
    expect(game.players.length).toBe(8);

    const human = game.getHumanPlayer();
    const opp = game.getNextOpponent(human);
    expect(opp).toBeDefined();
    expect(opp?.id).not.toBe(human.id);
  });
});



