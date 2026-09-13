import { Hero } from '../types';

export interface HeroProfileDetails {
  lore: string;
  signatureSynergy: string;
  difficulty: 'Novice' | 'Tactician' | 'Master';
}

export const HERO_PROFILES: Record<string, HeroProfileDetails> = {
  hero_chronos: {
    lore: 'Master of the infinite gearwork cosmos. Professor Chronos bends the timelines of the Astral Atrium to accelerate Automata assembly.',
    signatureSynergy: 'Automata / Magnetic scaling with cost-discounted early recruits.',
    difficulty: 'Novice'
  },
  hero_nyx: {
    lore: 'Sovereign of the void abyss. Madame Nyx converts expendable flesh into terrifying eldritch abominations that spawn tentacles from death.',
    signatureSynergy: 'Voidborn / Last Gasp token swarms with sacrificial card generation.',
    difficulty: 'Tactician'
  },
  hero_artificer: {
    lore: 'High Artificer Archimedes harnesses raw aetheric lightning to supercharge frontline vanguard units with impenetrable energy barriers.',
    signatureSynergy: 'Frontline Cleave and High-Attack Bastion minions protected by Aether Barrier.',
    difficulty: 'Novice'
  },
  hero_vespera: {
    lore: 'Celestial Oracle gazing deep into the astral tapestry. Vespera aligns cosmic constellations to manifest divine entities into battle.',
    signatureSynergy: 'Celestial divine scaling, generating high-tier star weavers every turn.',
    difficulty: 'Tactician'
  },
  hero_baron: {
    lore: 'Industrial titan commanding vast aether consortiums. Baron Von Cog floods tavern registries with cheap capital to fast-track tavern tier upgrades.',
    signatureSynergy: 'Fast Tavern Tier 5 & 6 rushing to discover legendary end-game units early.',
    difficulty: 'Master'
  },
  hero_malakor: {
    lore: 'Ancient apex beastmaster from the primal astral wildlands. When one predator falls, the pack feeds and grows permanently stronger.',
    signatureSynergy: 'Beast death-triggers and permanent warband-wide stat accumulation.',
    difficulty: 'Tactician'
  },
  hero_skylar: {
    lore: 'Dread admiral of the void corsairs. Captain Skylar raids enemy trade lanes and grants her board sweeping cleave strikes.',
    signatureSynergy: 'Pirates with gold refund loops and devastating multi-target Sweep strikes.',
    difficulty: 'Master'
  },
  hero_aurelius: {
    lore: 'Master transmuter who synthesizes volatile alchemical serums, turning frail acolytes into armored juggernauts.',
    signatureSynergy: 'Alchemist potion buffs and targeted targeted stat infusions + Barriers.',
    difficulty: 'Novice'
  }
};

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
    avatarIcon: '🕰️',
    artUrl: '/assets/art/hero_chronos.jpg',
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
    avatarIcon: '🔮',
    artUrl: '/assets/art/hero_nyx.jpg',
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
    avatarIcon: '⚡',
    artUrl: '/assets/art/auto_titan.jpg',
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
    avatarIcon: '✨',
    artUrl: '/assets/art/celestial_weaver.jpg',
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
    avatarIcon: '🎩',
    artUrl: '/assets/art/hero_baron.jpg',
  },
  {
    id: 'hero_malakor',
    name: 'Malakor the Ancient',
    title: 'Apex Beastmaster',
    hp: 40,
    maxHp: 40,
    powerName: 'Primal Awakening',
    powerCost: 0,
    powerType: 'PASSIVE',
    powerDescription: 'Passive: Whenever a friendly Beast dies in combat, your remaining Beasts gain +1/+1 permanently.',
    avatarIcon: '🐺',
    artUrl: '/assets/art/beast_apex.jpg',
  },
  {
    id: 'hero_skylar',
    name: 'Captain Skylar',
    title: 'Void Corsair Admiral',
    hp: 40,
    maxHp: 40,
    powerName: 'Plunder & Raid',
    powerCost: 1,
    powerType: 'ACTIVE',
    powerDescription: 'Cost (1): The next minion you buy this turn grants +2 Attack and Sweep to a random friendly minion.',
    avatarIcon: '🏴‍☠️',
    artUrl: '/assets/art/pirate_admiral.jpg',
  },
  {
    id: 'hero_aurelius',
    name: 'Dr. Aurelius',
    title: 'Grand Transmuter',
    hp: 40,
    maxHp: 40,
    powerName: 'Elixir Infusion',
    powerCost: 1,
    powerType: 'ACTIVE',
    powerDescription: 'Cost (1): Give a friendly minion +2/+2 and Aether Barrier.',
    avatarIcon: '🧪',
    artUrl: '/assets/art/alchemist.jpg',
  }
];
