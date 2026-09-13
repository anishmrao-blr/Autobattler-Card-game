import React, { useState, useEffect } from 'react';
import { sound } from '../audio/sound';

export const TUTORIAL_STORAGE_KEY = 'aabg_tutorial_seen';

interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  badge: string;
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'WELCOME TO THE AETHERIUM',
    subtitle: '8-Player Tactical Autobattler',
    description:
      'You are an Astral Commander leading a warband into competitive combat. Compete against 7 rival commanders across alternating Tavern and Combat rounds to be the last survivor.',
    icon: '🌌',
    badge: 'MISSION BRIEFING',
    tip: 'Your health starts at 40. When it reaches 0, you are eliminated from the Astral Lobby.',
  },
  {
    id: 'coins',
    title: 'ASTRAL COINS & ECONOMY',
    subtitle: 'Your Turn-by-Turn Resource',
    description:
      'You gain coins each turn (starting at 3 and increasing up to 10). Unspent coins do NOT carry over between rounds—spend them each turn to recruit, upgrade, or reroll.',
    icon: '🪙',
    badge: 'RESOURCE MANAGEMENT',
    tip: 'Watch the gold counter in the top HUD. Each recruit costs 3 coins.',
  },
  {
    id: 'shop',
    title: 'THE ASTRAL ATRIUM (SHOP)',
    subtitle: 'Recruiting Minion Units',
    description:
      'The top shelf displays minions available for recruitment. Click any minion card to buy and add it directly to your Hand Tray below. Use the Reroll lever (1 coin) to refresh the selection, or Freeze (0 coins) to lock it for next turn.',
    icon: '🏪',
    badge: 'TAVERN MECHANICS',
    tip: 'Triplets: Buying 3 copies of the same minion forges a Golden unit with double stats and a free Discover reward!',
  },
  {
    id: 'board',
    title: 'WARBAND DEPLOYMENT & ORDER',
    subtitle: 'Left-to-Right Attack Sequence',
    description:
      'Click minions in your Hand Tray to deploy them onto the battlefield (up to 7 units). In combat, minions attack from left to right—position high-durability Bastion and frontliners on the far left!',
    icon: '⚔️',
    badge: 'WARBAND FORMATION',
    tip: 'Drag and drop units on the board to fine-tune their strike sequence.',
  },
  {
    id: 'keywords',
    title: 'COMBAT KEYWORDS & INSPECTION',
    subtitle: 'Synergies & Strategic Triggers',
    description:
      'Hover over any card for 350ms to preview combat stats, abilities, and inline keyword definitions (Bastion, Aether Barrier, Surge, Last Gasp, Miasmic). Right-click or click 🔍 to view full 3D card art.',
    icon: '🔍',
    badge: 'CARD CLARITY',
    tip: 'Synergies between tribes (Automata, Voidborn, Alchemist, Celestial, Beast, Pirate) grant immense scaling power.',
  },
  {
    id: 'tiering',
    title: 'TAVERN TIER ADVANCEMENT',
    subtitle: 'Unlock High-Tier Stellar Forces',
    description:
      'Click Upgrade Tier to advance your Tavern level (up to Tier 6). Each tier unlocks higher-tier minions in the shop. The upgrade cost reduces by 1 coin at the start of each turn.',
    icon: '⬆️',
    badge: 'PROGRESSION',
    tip: 'Balancing tempo (buying units now) with tiering (investing in the future) is key to 1st place.',
  },
  {
    id: 'combat',
    title: 'READY FOR COMBAT!',
    subtitle: 'Enter the Dark Steel Arena',
    description:
      'Once your warband is prepared, click "Engage Combat" or wait for the round timer. Combat is fully automated with physical shockwaves, particle blooming, and real-time damage calculation.',
    icon: '🔥',
    badge: 'ENGAGE HOSTILES',
    tip: 'You can replay this tutorial anytime via the Game Menu (Esc or ⚙️ icon in top-right).',
  },
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleComplete();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    sound.playCardSnap();
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (isFirst) return;
    sound.playCardSnap();
    setCurrentStepIndex((prev) => prev - 1);
  };

  const handleComplete = () => {
    sound.playTierUpgrade();
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    onClose();
  };

  const isArenaStep = currentStepIndex >= 4;
  const ambientVideoSrc = isArenaStep ? '/assets/video/tutorial_arena.mp4' : '/assets/video/tutorial_tavern.mp4';
  const ambientPoster = isArenaStep ? '/assets/art/runic_table.jpg' : '/assets/art/astral_portal.jpg';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none overflow-hidden">
      {/* Dynamic Ambient Cinematic Atmosphere (Tavern / Battleground Arena) */}
      <video
        key={ambientVideoSrc}
        autoPlay
        loop
        muted
        playsInline
        poster={ambientPoster}
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none filter blur-[2px] transition-opacity duration-700"
        src={ambientVideoSrc}
      />

      {/* Background click dismisses / skips */}
      <div className="absolute inset-0 z-0 bg-black/40" onClick={handleComplete} />

      {/* Tutorial Card Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-xl w-full dark-steel-card rounded-3xl p-6 sm:p-8 border-2 border-yellow-500/80 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(234,179,8,0.3)] z-10 flex flex-col justify-between overflow-hidden"
      >
        {/* Subtle Decorative Ambient Beam */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-yellow-500/15 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full filter blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#3b2a59]">
          <div className="flex items-center gap-2">
            <span className="text-xl text-yellow-400">{currentStep.icon}</span>
            <span className="text-xs font-cinzel font-black tracking-widest text-cyan-300 uppercase">
              {currentStep.badge}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-400">
              {currentStepIndex + 1} / {TUTORIAL_STEPS.length}
            </span>
            <button
              onClick={handleComplete}
              className="text-xs text-slate-400 hover:text-yellow-300 font-cinzel font-bold px-2.5 py-1 rounded-lg border border-slate-700/80 hover:border-yellow-500/50 bg-black/50 transition-colors"
            >
              SKIP TUTORIAL ✕
            </button>
          </div>
        </div>

        {/* Center Content */}
        <div className="my-6 space-y-4">
          <div>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-wider mb-1">
              {currentStep.title}
            </h2>
            <div className="text-xs font-cinzel font-bold text-purple-300 uppercase tracking-wider">
              {currentStep.subtitle}
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-200 font-sans leading-relaxed">
            {currentStep.description}
          </p>

          {currentStep.tip && (
            <div className="bg-yellow-950/40 border-l-4 border-yellow-400 p-3 rounded-r-xl text-xs text-yellow-200/90 font-sans flex items-start gap-2">
              <span className="text-yellow-400 font-bold">💡 TIP:</span>
              <span>{currentStep.tip}</span>
            </div>
          )}
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-2 my-2">
          {TUTORIAL_STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => {
                sound.playCardSnap();
                setCurrentStepIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-8 bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                  : idx < currentStepIndex
                  ? 'w-2 bg-yellow-600/60'
                  : 'w-2 bg-slate-800'
              }`}
              title={step.title}
            />
          ))}
        </div>

        {/* Bottom Controls */}
        <div className="pt-4 border-t border-[#3b2a59] flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs border transition-colors flex items-center gap-1.5 ${
              isFirst
                ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white'
            }`}
          >
            <span>←</span>
            <span>PREVIOUS</span>
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-cinzel font-black text-xs sm:text-sm rounded-xl shadow-brass transition-transform duration-150 active:scale-95 flex items-center gap-2"
          >
            <span>{isLast ? 'COMMENCE BATTLEGROUNDS ⚔️' : 'NEXT STEP →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
