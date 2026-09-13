export interface RealmEntry {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  climate: string;
  leylineAffinity: string;
  lore: string;
  battlefieldHazard: string;
}

export interface FactionEntry {
  id: string;
  name: string;
  tribe: string;
  leader: string;
  motto: string;
  image: string;
  doctrine: string;
  lore: string;
  signatureRelic: string;
}

export interface TimelineEvent {
  era: string;
  year: string;
  title: string;
  summary: string;
  icon: string;
}

export interface RelicEntry {
  id: string;
  name: string;
  originTribe: string;
  image: string;
  power: string;
  lore: string;
}

export const REALMS_LORE: RealmEntry[] = [
  {
    id: 'realm_clockwork',
    name: 'The Clockwork Spires',
    subtitle: 'Floating Citadel of the Grand Artificers',
    image: '/assets/art/realm_clockwork.jpg',
    climate: 'Steam-pressurized atmospheric inversion',
    leylineAffinity: 'Kinetic Aether & Magnetism',
    lore: 'Suspended miles above the clouds by counter-rotating titanium gyroscopes, the Spires represent the apex of mechanical alchemy. Thousands of brass steam-pipes channel pressurized aether into towering forges that never sleep.',
    battlefieldHazard: 'Frontline Automata start combat with Overclocked torque (+1 Attack).'
  },
  {
    id: 'realm_abyssal',
    name: 'The Abyssal Rift',
    subtitle: 'The Event Horizon of Shattered Stars',
    image: '/assets/art/void_devourer.jpg',
    climate: 'Zero-gravity cosmic vacuum',
    leylineAffinity: 'Entropy & Dark Matter',
    lore: 'A jagged tear in the fabric of spacetime where dead celestial bodies are slowly devoured by ancient eldritch leviathans. Gravity is erratic, and the whispers of the Void Covenant echo across obsidian monoliths.',
    battlefieldHazard: 'The first Last Gasp triggered on each side summons an additional 1/1 Voidling.'
  },
  {
    id: 'realm_celestial',
    name: 'The Celestial Citadel',
    subtitle: 'Sanctum of the Star Weavers',
    image: '/assets/art/celestial_weaver.jpg',
    climate: 'Iridescent solar winds and starlight auroras',
    leylineAffinity: 'Divine Cosmic Light',
    lore: 'Built atop a dormant comet, the Citadel is inhabited by ancient celestial entities who weave the threads of destiny into living constellations. Pure starlight illuminates its crystal arches.',
    battlefieldHazard: 'Minions with Aether Barrier reflect 2 radiant damage when hit.'
  },
  {
    id: 'realm_corsair',
    name: "Corsair's Nebula Haven",
    subtitle: 'Lawless Smuggler Docks of the Void Fleet',
    image: '/assets/art/pirate_admiral.jpg',
    climate: 'Ionized gas storms and glowing plasma reefs',
    leylineAffinity: 'Plasma Surge & Gold Resonance',
    lore: 'Carved directly into hollowed-out asteroid clusters, this pirate anchorage is where outcasts, renegade inventors, and sky corsairs trade contraband cog-coins and salvaged naval armaments.',
    battlefieldHazard: 'Selling a unit in the Tavern grants +1 additional Cog-Coin on Turn 5+.'
  }
];

export const FACTIONS_LORE: FactionEntry[] = [
  {
    id: 'faction_automata',
    name: 'The Iron Consortium',
    tribe: 'AUTOMATA',
    leader: 'Professor Chronos & Baron Von Cog',
    motto: '"Precision in Steel, Perfection in Motion."',
    image: '/assets/art/auto_titan.jpg',
    doctrine: 'Relentless industrial scaling through magnetic module fusion and recurring energy barriers.',
    lore: 'Once simple mechanical helpers, the Automata gained sentience during the Grand Synthesis. They view organic life as fragile and strive to forge an indestructible mechanical sanctuary.',
    signatureRelic: 'The Chrono-Resonator Core'
  },
  {
    id: 'faction_voidborn',
    name: 'The Rift Covenant',
    tribe: 'VOIDBORN',
    leader: 'Madame Nyx',
    motto: '"In Nothingness, We Multiply."',
    image: '/assets/art/hero_nyx.jpg',
    doctrine: 'Sacrificing board health and friendly units to unleash uncontrollable swarms of deathrattle horrors.',
    lore: 'Worshippers of the dark spaces between stars. The Covenant believes that death is merely a gateway to greater cosmic multiplication and entropy.',
    signatureRelic: 'The Black Sun Monolith'
  },
  {
    id: 'faction_alchemist',
    name: 'The Transmutation Order',
    tribe: 'ALCHEMIST',
    leader: 'Dr. Aurelius',
    motto: '"Through Volatility, Transcendence."',
    image: '/assets/art/alchemist.jpg',
    doctrine: 'Sudden exponential stat surges and defensive potion infusions delivered directly into combat lines.',
    lore: 'Hermetic scholars who unlocked the chemical secret of liquid Aetherium. Their laboratory vats produce serums capable of turning scrap metal into unbreakable armor.',
    signatureRelic: 'The Philosopher’s Crucible'
  },
  {
    id: 'faction_celestial',
    name: 'The Starweaver Ascendancy',
    tribe: 'CELESTIAL',
    leader: 'Vespera the Seer',
    motto: '"The Constellations Do Not Lie."',
    image: '/assets/art/celestial_weaver.jpg',
    doctrine: 'Warband-wide passive stat amplification and impenetrable Divine Barrier protections.',
    lore: 'Ancient architects of the galaxy. They observe the mortal conflicts of the Aetherium from high stellar perches, descending only when cosmic balance requires intervention.',
    signatureRelic: 'The Loom of Starlight'
  },
  {
    id: 'faction_beast',
    name: 'The Apex Brood',
    tribe: 'BEAST',
    leader: 'Malakor the Ancient',
    motto: '"The Weak Feed the Strong."',
    image: '/assets/art/beast_apex.jpg',
    doctrine: 'Darwinian swarm tactics where every fallen packmate permanently strengthens surviving predators.',
    lore: 'Native beasts of the untamed astral wilderness infused with raw cosmic dark matter, possessing feral intelligence and voracious apex instincts.',
    signatureRelic: 'The Blood-Amber Fang'
  },
  {
    id: 'faction_pirate',
    name: 'The Astral Void Fleet',
    tribe: 'PIRATE',
    leader: 'Captain Skylar',
    motto: '"No Gods, No Masters, Only Plunder."',
    image: '/assets/art/pirate_admiral.jpg',
    doctrine: 'High-speed attack chaining, sweeping multi-target cutlass strikes, and aggressive economy generation.',
    lore: 'Renegade sailors who abandoned the Grand Empires to sail the solar winds on armed skiffs, answering to no sovereign but the pirate code.',
    signatureRelic: 'The Corsair Sovereign Wheel'
  }
];

export const TIMELINE_LORE: TimelineEvent[] = [
  {
    era: 'ERA I',
    year: 'Year 0 - 320 AS',
    title: 'The Great Synthesis',
    summary: 'The discovery of raw liquid Aetherium unlocks perpetual clockwork energy and planar astral navigation across the starry realms.',
    icon: '⚡'
  },
  {
    era: 'ERA II',
    year: 'Year 321 - 580 AS',
    title: 'The Grand Fracture',
    summary: 'An overcharged alchemical experiment tears open the Abyssal Rift, shattering the planetary crusts into floating celestial sky-islands.',
    icon: '🌌'
  },
  {
    era: 'ERA III',
    year: 'Year 581 AS - Present',
    title: 'The Battleground Accord',
    summary: 'To prevent total cosmic collapse, 8 rival faction commanders gather in the Astral Atrium to duel for sovereign control of the Infinite Core.',
    icon: '⚔️'
  }
];

export const RELICS_LORE: RelicEntry[] = [
  {
    id: 'relic_barrier_core',
    name: 'Aether Shielding Matrix',
    originTribe: 'AUTOMATA / CELESTIAL',
    image: '/assets/art/astral_portal.jpg',
    power: 'Manifests a forcefield that completely absorbs the first incoming lethal blow.',
    lore: 'Forged from concentrated solid starlight and tempered in steam-powered magnetic presses.'
  },
  {
    id: 'relic_chrono_dial',
    name: 'The Chrono-Dial of Aeons',
    originTribe: 'AUTOMATA',
    image: '/assets/art/hero_chronos.jpg',
    power: 'Rewinds destroyed combat constructs back into the battlefield with 1 HP.',
    lore: 'A master clockwork mechanism that stores micro-instances of minion quantum states.'
  },
  {
    id: 'relic_void_eye',
    name: 'The Singularity Eye',
    originTribe: 'VOIDBORN',
    image: '/assets/art/hero_nyx.jpg',
    power: 'Converts defeated enemies into sacrificial dark matter for the Brood.',
    lore: 'An orb extracted from the dead core of a collapsed neutron star, pulsing with endless hunger.'
  }
];
