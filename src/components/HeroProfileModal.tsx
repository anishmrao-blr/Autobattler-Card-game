import React from 'react';
import { Hero } from '../types';
import { HERO_PROFILES } from '../engine/heroes';
import { CardMediaArt } from './CardMediaArt';
import { sound } from '../audio/sound';

interface HeroProfileModalProps {
  hero: Hero;
  onClose: () => void;
  onSelect?: () => void;
  canSelect?: boolean;
}

export const HeroProfileModal: React.FC<HeroProfileModalProps> = ({
  hero,
  onClose,
  onSelect,
  canSelect = false,
}) => {
  const profile = HERO_PROFILES[hero.id] || {
    lore: 'A revered astral commander battling across the infinite tavern timelines.',
    signatureSynergy: 'Universal warband synergies and tactical adaptability.',
    difficulty: 'Novice',
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-8 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-[#0d071d]/95 border-2 border-yellow-500/60 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-8 my-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-white bg-black/60 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-30 transition-colors"
          title="Close (Esc)"
        >
          ✕
        </button>

        {/* Left: Illustrated Hero Portrait */}
        <div className="relative w-44 h-60 sm:w-72 sm:h-96 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-yellow-500/80 shadow-[0_0_35px_rgba(234,179,8,0.3)] bg-black/90 flex-shrink-0 group">
          <CardMediaArt
            artUrl={hero.artUrl || '/assets/art/hero_chronos.jpg'}
            videoUrl={hero.videoUrl}
            alt={hero.name}
            className="w-full h-full object-cover object-center"
            hoverZoom={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

          {/* Hero Class / Difficulty Floating Badge */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/80 border border-yellow-500/50 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-yellow-300 font-cinzel shadow">
            {profile.difficulty}
          </div>

          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-950/90 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-500/60 shadow">
              ❤️ {hero.hp} Health
            </span>
            <span className="text-[10px] sm:text-xs text-yellow-300 bg-yellow-950/90 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-yellow-500/50 shadow font-cinzel">
              ★ COMMANDER
            </span>
          </div>
        </div>

        {/* Right: Backstory Lore, Hero Power & Strategic Synergies */}
        <div className="w-full flex-1 flex flex-col justify-between h-full space-y-3 sm:space-y-4">
          <div>
            <div className="mb-2">
              <h2 className="font-cinzel text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-wider">
                {hero.name}
              </h2>
              <div className="text-xs font-cinzel font-bold text-cyan-300 tracking-widest uppercase mt-0.5">
                {hero.title}
              </div>
            </div>

            {/* Backstory Lore */}
            <div className="bg-black/50 border-l-2 border-cyan-400/80 p-3.5 rounded-r-2xl text-xs text-purple-200 italic font-serif mb-4 leading-relaxed">
              "{profile.lore}"
            </div>

            {/* Hero Power Showcase */}
            <div className="steel-text-plaque p-4 rounded-2xl border border-[#433961] mb-4">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-purple-950">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-cinzel font-bold text-sm text-yellow-300">
                    {hero.powerName}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-black/80 text-cyan-300 border border-cyan-400/50">
                  {hero.powerType === 'PASSIVE' ? 'PASSIVE POWER' : `COST: 🪙 ${hero.powerCost} COIN`}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {hero.powerDescription}
              </p>
            </div>

            {/* Signature Synergy Guidance */}
            <div>
              <h4 className="text-[11px] font-cinzel font-bold text-yellow-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>🎯</span>
                <span>Signature Warband Synergy</span>
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed bg-[#120a26]/70 p-3 rounded-xl border border-purple-900/50">
                {profile.signatureSynergy}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {canSelect && onSelect && (
            <button
              onClick={() => {
                sound.playTierUpgrade();
                onSelect();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-cinzel font-black text-xs rounded-xl shadow-brass transition-all hover:scale-105 mt-2"
            >
              DEPLOY WITH {hero.name.toUpperCase()} ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
