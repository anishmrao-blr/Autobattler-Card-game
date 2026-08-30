import { Hero } from '../types';

export const HERO_DATABASE: Hero[] = [
  {
    id: 'hero_chronos',
    name: 'Professor Chronos',
    title: 'Grand Clocksmith',
    hp: 40,
    maxHp: 40,
    powerName: 'Clockwork Calibration',
    powerCost: 0,
    powerType: 'PASSIVE',
    powerDescription: 'Passive: The first Automata you buy each turn costs 1 less Cog-Coin.',
    avatarIcon: '🕰️'
  },
  {
    id: 'hero_nyx',
    name: 'Madame Nyx',
    title: 'Sovereign of the Rift',
    hp: 40,
    maxHp: 40,
    powerName: 'Abyssal Tithe',
    powerCost: 1,
    powerType: 'ACTIVE',
    powerDescription: 'Cost (1): Target a friendly minion to sacrifice it and add a random Voidborn to your hand.',
    avatarIcon: '🔮'
  },
  {
    id: 'hero_artificer',
    name: 'Archimedes Spark',
    title: 'High Artificer',
    hp: 40,
    maxHp: 40,
    powerName: 'Aether Overcharge',
    powerCost: 0,
    powerType: 'PASSIVE',
    powerDescription: 'Passive: Start of Combat: Grant your leftmost minion +3 Attack and Aether Barrier for this combat.',
    avatarIcon: '⚡'
  },
  {
    id: 'hero_vespera',
    name: 'Vespera the Seer',
    title: 'Celestial Oracle',
    hp: 40,
    maxHp: 40,
    powerName: 'Star Alignment',
    powerCost: 1,
    powerType: 'ACTIVE',
    powerDescription: 'Cost (1): Discover a random Celestial from your current Tavern Tier.',
    avatarIcon: '✨'
  },
  {
    id: 'hero_baron',
    name: 'Baron Von Cog',
    title: 'Aether Consortium Tycoon',
    hp: 40,
    maxHp: 40,
    powerName: 'Industrial Subsidies',
    powerCost: 0,
    powerType: 'PASSIVE',
    powerDescription: 'Passive: Upgrading the Astral Atrium costs 1 less Cog-Coin every tier.',
    avatarIcon: '🎩'
  },
  {
    id: 'hero_malakor',
    name: 'Malakor the Ancient',
    title: 'Chthonic Whisperer',
    hp: 40,
    maxHp: 40,
    powerName: 'Echoes of the Abyss',
    powerCost: 0,
    powerType: 'PASSIVE',
    powerDescription: 'Passive: Whenever an allied Last Gasp triggers in combat, give your surviving minions +1/+1.',
    avatarIcon: '🐙'
  },
  {
    id: 'hero_skylar',
    name: 'Captain Skylar',
    title: 'Dread Void-Corsair',
    hp: 40,
    maxHp: 40,
    powerName: 'Plunder & Roll',
    powerCost: 0,
    powerType: 'PASSIVE',
    powerDescription: 'Passive: Every 3rd Tavern Reroll in a turn is completely FREE.',
    avatarIcon: '🏴‍☠️'
  },
  {
    id: 'hero_aurelius',
    name: 'Dr. Aurelius',
    title: 'Grand Transmuter',
    hp: 40,
    maxHp: 40,
    powerName: 'Philosopher\'s Draught',
    powerCost: 1,
    powerType: 'ACTIVE',
    powerDescription: 'Cost (1): Give a random friendly minion +2/+3.',
    avatarIcon: '🧪'
  }
];
