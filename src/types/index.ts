export type Tribe = 'AUTOMATA' | 'VOIDBORN' | 'ALCHEMIST' | 'CELESTIAL' | 'BEAST' | 'PIRATE' | 'NEUTRAL';

export type Keyword = 
  | 'BASTION'         // Taunt
  | 'AETHER_BARRIER'  // Divine Shield
  | 'LAST_GASP'       // Deathrattle
  | 'MIASMIC'         // Venomous/Poisonous
  | 'OVERCLOCK'       // Windfury (Attacks twice)
  | 'RE_WIND'         // Reborn (Revives with 1 HP)
  | 'SWEEP'           // Cleave (Damages adjacent enemies)
  | 'MAGNETIC';       // Attaches to Automata

export interface MinionCard {
  id: string;
  name: string;
  tier: number; // 1 to 6
  tribe: Tribe;
  attack: number;
  health: number;
  keywords: Keyword[];
  description: string;
  goldenDescription?: string;
  icon: string;
  artUrl?: string;
  videoUrl?: string;
  flavor: string;
  // Trigger effects identifiers
  onDeploy?: (ctx: DeployContext) => void;
  onLastGasp?: (ctx: LastGaspContext) => void;
  onEndOfTurn?: (ctx: EndOfTurnContext) => void;
  onAllyDeath?: (ctx: AllyDeathContext) => void;
  onTakeDamage?: (ctx: TakeDamageContext) => void;
  onFriendlyAttack?: (ctx: AttackContext) => void;
}

export interface BoardMinion {
  instanceId: string;
  cardId: string;
  name: string;
  tier: number;
  tribe: Tribe;
  attack: number;
  health: number;
  maxHealth: number;
  isGolden: boolean;
  keywords: Keyword[];
  hasAttacked: boolean;
  barrierActive: boolean;
  rewindAvailable: boolean;
  icon: string;
  artUrl?: string;
  videoUrl?: string;
  tempAttackBuff: number;
  tempHealthBuff: number;
  permanentBuffTriggers?: number;
}

export interface DeployContext {
  player: PlayerState;
  playedMinion: BoardMinion;
  targetIndex?: number;
  allPlayers: PlayerState[];
}

export interface LastGaspContext {
  deadMinion: BoardMinion;
  side: 1 | 2;
  allies: BoardMinion[];
  enemies: BoardMinion[];
  spawnQueue: { minion: BoardMinion; pos: number }[];
  eventLog: CombatEvent[];
}

export interface EndOfTurnContext {
  player: PlayerState;
  minion: BoardMinion;
}

export interface AllyDeathContext {
  self: BoardMinion;
  deadAlly: BoardMinion;
  side: 1 | 2;
  eventLog: CombatEvent[];
}

export interface TakeDamageContext {
  self: BoardMinion;
  damage: number;
  side: 1 | 2;
  eventLog: CombatEvent[];
}

export interface AttackContext {
  self: BoardMinion;
  attacker: BoardMinion;
  side: 1 | 2;
  eventLog: CombatEvent[];
}

export type CombatEvent =
  | { type: 'COMBAT_START'; player1Name: string; player2Name: string; player1Hero: string; player2Hero: string; firstAttacker: 1 | 2 }
  | { type: 'ATTACK_START'; attackerId: string; defenderId: string; attackerSide: 1 | 2; minionName: string; defenderName: string }
  | { type: 'DAMAGE_DEALT'; targetId: string; amount: number; isLethal: boolean; sourceId: string; wasMiasmic?: boolean; shieldAbsorbed?: boolean; remainingHp: number }
  | { type: 'CLEAVE_DAMAGE'; targetId: string; amount: number; isLethal: boolean; shieldAbsorbed?: boolean; remainingHp: number }
  | { type: 'MINION_DIED'; minionId: string; side: 1 | 2; minionName: string }
  | { type: 'TOKEN_SPAWNED'; minion: BoardMinion; side: 1 | 2; position: number }
  | { type: 'STAT_BUFF'; targetId: string; attackGain: number; healthGain: number; reason: string; newAttack: number; newHealth: number }
  | { type: 'BARRIER_BROKEN'; targetId: string }
  | { type: 'REWOUND'; targetId: string; newMinion: BoardMinion }
  | { type: 'FRENZY_TRIGGERED'; targetId: string; buffAttack: number; buffHealth: number }
  | { type: 'COMBAT_END'; winnerSide: 1 | 2 | 0; damageDealt: number; winnerName: string; loserName: string; winnerTier: number; survivingMinionTiers: number[] };

export interface Hero {
  id: string;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  powerName: string;
  powerCost: number;
  powerType: 'PASSIVE' | 'ACTIVE';
  powerDescription: string;
  avatarIcon: string;
  artUrl?: string;
  videoUrl?: string;
  onMatchStart?: (player: PlayerState) => void;
  onTavernRoll?: (player: PlayerState) => void;
  onBuy?: (player: PlayerState, card: MinionCard) => void;
  onTurnStart?: (player: PlayerState) => void;
  onActivatePower?: (player: PlayerState) => boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  isHuman: boolean;
  avatar: string;
  artUrl?: string;
  hero: Hero;
  hp: number;
  maxHp: number;
  coins: number;
  maxCoins: number;
  tavernTier: number;
  tierUpgradeCost: number;
  isFrozen: boolean;
  hand: MinionCard[];
  board: BoardMinion[];
  tavernSlots: MinionCard[];
  triplesFound: number;
  winStreak: number;
  isEliminated: boolean;
  placement?: number;
  tripletRewardPending?: number; // Tier of discover card
  discoverOptions?: MinionCard[];
  lastCombatEvents?: CombatEvent[];
  lastOpponentName?: string;
  lastCombatResult?: 'WIN' | 'LOSS' | 'TIE';
}

export interface MatchPairing {
  player1: PlayerState;
  player2: PlayerState;
  isGhost: boolean; // if player2 is a dead player's snapshot
}
