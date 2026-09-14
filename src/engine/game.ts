// Fix game.ts
import { PlayerState, Hero } from '../types';
import { SharedCardPool } from './pool';
import { TavernManager } from './tavern';
import { CombatResolver, CombatSimulationResult } from './combat';
import { BotAI } from './ai';
import { HERO_DATABASE } from './heroes';

export class GameCoordinator {
  public pool: SharedCardPool;
  public tavern: TavernManager;
  public combat: CombatResolver;
  public ai: BotAI;

  public players: PlayerState[] = [];
  public currentTurn = 0;
  public matchPhase: 'HERO_SELECT' | 'TAVERN' | 'COMBAT' | 'GAME_OVER' = 'HERO_SELECT';
  public lastHumanCombatResult?: CombatSimulationResult;
  public scheduledPairs: [PlayerState, PlayerState][] = [];

  constructor() {
    this.pool = new SharedCardPool();
    this.tavern = new TavernManager(this.pool);
    this.combat = new CombatResolver();
    this.ai = new BotAI(this.tavern);
  }

  public initGame(humanHero: Hero, humanName = 'Artificer Player'): void {
    this.pool.reset();
    this.currentTurn = 0;
    this.players = [];

    const human: PlayerState = {
      id: 'human_player',
      name: humanName,
      isHuman: true,
      avatar: humanHero.avatarIcon,
      hero: humanHero,
      hp: humanHero.hp,
      maxHp: humanHero.maxHp,
      coins: 3,
      maxCoins: 3,
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
    this.players.push(human);

    const availableHeroes = HERO_DATABASE.filter(h => h.id !== humanHero.id);
    const shuffledHeroes = [...availableHeroes].sort(() => 0.5 - Math.random());

    const botNames = [
      'Automaton Prime',
      'Lady Nyx Voidwalker',
      'Archon Orion',
      'Baron Cogsworth',
      'Corsair Vex',
      'Dr. Aurelius',
      'The Whisperer'
    ];

    for (let i = 0; i < 7; i++) {
      const hero = shuffledHeroes[i] || HERO_DATABASE[0];
      const bot: PlayerState = {
        id: `bot_${i + 1}`,
        name: botNames[i],
        isHuman: false,
        avatar: hero.avatarIcon,
        hero,
        hp: hero.hp,
        maxHp: hero.maxHp,
        coins: 3,
        maxCoins: 3,
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
      this.players.push(bot);
    }

    this.startNewTurn();
  }

  public schedulePairings(): void {
    const living = this.getLivingPlayers();
    const shuffled = [...living].sort(() => 0.5 - Math.random());

    const pairs: [PlayerState, PlayerState][] = [];
    while (shuffled.length >= 2) {
      const p1 = shuffled.pop()!;
      const p2 = shuffled.pop()!;
      pairs.push([p1, p2]);
    }

    if (shuffled.length === 1) {
      const oddPlayer = shuffled.pop()!;
      const ghostOpponent = living.find(p => p.id !== oddPlayer.id) || oddPlayer;
      const ghostCopy: PlayerState = {
        ...ghostOpponent,
        id: `${ghostOpponent.id}_ghost`,
        name: `${ghostOpponent.name} (Ghost)`,
      };
      pairs.push([oddPlayer, ghostCopy]);
    }

    this.scheduledPairs = pairs;
  }

  public getNextOpponent(player: PlayerState): PlayerState | undefined {
    if (this.scheduledPairs.length === 0) {
      this.schedulePairings();
    }
    for (const [p1, p2] of this.scheduledPairs) {
      if (p1.id === player.id) return p2;
      if (p2.id === player.id) return p1;
    }
    const living = this.getLivingPlayers().filter(p => p.id !== player.id);
    return living[0];
  }

  public startNewTurn(): void {
    this.currentTurn += 1;
    this.matchPhase = 'TAVERN';

    for (const p of this.getLivingPlayers()) {
      this.tavern.startPlayerTurn(p, this.currentTurn);

      if (!p.isHuman) {
        this.ai.executeBotTurn(p, this.currentTurn);
      }
    }

    this.schedulePairings();
  }

  public resolveCombatPhase(): { humanMatch: CombatSimulationResult; allResults: CombatSimulationResult[] } {
    this.matchPhase = 'COMBAT';
    if (this.scheduledPairs.length === 0) {
      this.schedulePairings();
    }
    const pairs = [...this.scheduledPairs];
    this.scheduledPairs = [];

    const allResults: CombatSimulationResult[] = [];
    let humanMatchResult: CombatSimulationResult | undefined;

    for (const [p1, p2] of pairs) {
      const result = this.combat.simulate1v1(p1, p2);
      allResults.push(result);

      if (result.winnerSide === 1) {
        if (!p2.id.includes('_ghost')) {
          p2.hp = Math.max(0, p2.hp - result.damageDealt);
          p2.winStreak = 0;
          p2.lastCombatResult = 'LOSS';
        }
        p1.winStreak += 1;
        p1.lastCombatResult = 'WIN';
      } else if (result.winnerSide === 2) {
        p1.hp = Math.max(0, p1.hp - result.damageDealt);
        p1.winStreak = 0;
        p1.lastCombatResult = 'LOSS';
        if (!p2.id.includes('_ghost')) {
          p2.winStreak += 1;
          p2.lastCombatResult = 'WIN';
        }
      } else {
        p1.lastCombatResult = 'TIE';
        if (!p2.id.includes('_ghost')) p2.lastCombatResult = 'TIE';
      }

      p1.lastCombatEvents = result.events;
      p1.lastOpponentName = p2.name;

      if (!p2.id.includes('_ghost')) {
        p2.lastCombatEvents = result.events;
        p2.lastOpponentName = p1.name;
      }

      if (p1.isHuman || p2.isHuman) {
        humanMatchResult = result;
        this.lastHumanCombatResult = result;
      }
    }

    this.updateEliminationsAndRankings();

    const human = this.getHumanPlayer();
    if (!human || human.isEliminated || this.getLivingPlayers().length <= 1) {
      this.matchPhase = 'GAME_OVER';
    }

    return {
      humanMatch: humanMatchResult || allResults[0],
      allResults,
    };
  }

  public getLivingPlayers(): PlayerState[] {
    return this.players.filter(p => !p.isEliminated && p.hp > 0);
  }

  public getHumanPlayer(): PlayerState {
    return this.players.find(p => p.isHuman) || this.players[0];
  }

  public getLeaderboard(): PlayerState[] {
    return [...this.players].sort((a, b) => {
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;
      if (a.hp !== b.hp) return b.hp - a.hp;
      return b.tavernTier - a.tavernTier;
    });
  }

  public concedeGame(player?: PlayerState): void {
    const target = player || this.getHumanPlayer();
    if (!target || target.isEliminated) return;

    target.hp = 0;
    this.updateEliminationsAndRankings();
    this.matchPhase = 'GAME_OVER';
  }

  public getPredictedPlacement(player?: PlayerState): number {
    const target = player || this.getHumanPlayer();
    if (!target) return 8;
    if (target.placement) return target.placement;
    const currentlyDeadCount = this.players.filter(p => p.isEliminated).length;
    return Math.max(1, 8 - currentlyDeadCount);
  }

  private updateEliminationsAndRankings(): void {
    const deadPlayers = this.players.filter(p => p.hp <= 0 && !p.isEliminated);
    const currentlyDeadCount = this.players.filter(p => p.isEliminated).length;

    deadPlayers.forEach((p, idx) => {
      p.isEliminated = true;
      p.placement = 8 - (currentlyDeadCount + idx);
    });

    const living = this.getLivingPlayers();
    if (living.length === 1) {
      living[0].placement = 1;
    }
  }
}
