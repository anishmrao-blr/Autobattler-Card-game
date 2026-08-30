import React from 'react';
import { Hero } from '../types';
import { HERO_DATABASE } from '../engine/heroes';
import { sound } from '../audio/sound';

interface HeroSelectModalProps {
  onSelectHero: (hero: Hero) => void;
}

export const HeroSelectModal: React.FC<HeroSelectModalProps> = ({ onSelectHero }) => {
  // Show 4 random heroes
  const [heroes] = React.useState<Hero[]>(() => {
    return [...HERO_DATABASE].sort(() => 0.5 - Math.random()).slice(0, 4);
  });

  return (
    <div className="fixed inset-0 bg-[#05030b]/95 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-6">
      {/* Title & Banner */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">⚡</span>
          <h1 className="font-cinzel text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-widest drop-shadow-[0_0_15px_rgba(200,155,60,0.6)]">
            AETHERIUM: ASTRAL BATTLEGROUNDS
          </h1>
          <span className="text-4xl">⚡</span>
        </div>
        <p className="text-sm text-purple-300 font-sans tracking-wide">
          Select your Commander to lead your Astral War-Automata and Voidborn Aberrations
        </p>
      </div>

      {/* Hero Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {heroes.map((hero) => (
          <div
            key={hero.id}
            onClick={() => {
              sound.playCardSnap();
              sound.playTierUpgrade();
              onSelectHero(hero);
            }}
            className="group relative flex flex-col justify-between bg-gradient-to-b from-[#180e2f] via-[#100921] to-[#080512] border-2 border-yellow-600/50 hover:border-yellow-400 rounded-3xl p-5 shadow-2xl hover:shadow-brass transition-all duration-300 transform hover:-translate-y-3 cursor-pointer"
          >
            {/* Top: Avatar & Title */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-black/80 border-2 border-yellow-500 flex items-center justify-center text-4xl shadow-inner mb-3 group-hover:scale-110 transition-transform">
                {hero.avatarIcon}
              </div>
              <h3 className="font-cinzel font-bold text-lg text-yellow-300 tracking-wide">
                {hero.name}
              </h3>
              <span className="text-[11px] text-purple-300 font-bold uppercase tracking-wider mb-2">
                {hero.title}
              </span>
              <div className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/50 mb-3">
                ❤️ {hero.hp} Health
              </div>
            </div>

            {/* Middle: Hero Power Card */}
            <div className="bg-[#090514]/90 border border-purple-900/60 rounded-2xl p-3.5 my-2">
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-purple-950">
                <span className="font-cinzel text-xs font-bold text-cyan-300">
                  {hero.powerName}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-yellow-300 border border-yellow-600/40">
                  {hero.powerType === 'PASSIVE' ? 'PASSIVE' : `🪙 ${hero.powerCost}`}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
                {hero.powerDescription}
              </p>
            </div>

            {/* Bottom Button */}
            <button className="mt-4 w-full py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 group-hover:from-amber-500 group-hover:to-yellow-400 text-black font-cinzel font-bold text-xs rounded-xl shadow-brass transition-all group-hover:scale-105">
              CHOOSE COMMANDER ➔
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
