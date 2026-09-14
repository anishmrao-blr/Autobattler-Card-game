import React, { useState } from 'react';
import { Hero } from '../types';
import { HERO_DATABASE } from '../engine/heroes';
import { getFactionForHero } from '../engine/lore';
import { HeroProfileModal } from './HeroProfileModal';
import { CardMediaArt } from './CardMediaArt';
import { sound } from '../audio/sound';

interface HeroSelectModalProps {
  onSelectHero: (hero: Hero) => void;
  onBackToLogin?: () => void;
}

export const HeroSelectModal: React.FC<HeroSelectModalProps> = ({ onSelectHero, onBackToLogin }) => {
  const [heroes] = useState<Hero[]>(() => {
    return [...HERO_DATABASE].sort(() => 0.5 - Math.random()).slice(0, 4);
  });

  const [inspectingHero, setInspectingHero] = useState<Hero | null>(null);

  return (
    <main className="fixed inset-0 bg-[#05030b]/95 backdrop-blur-lg flex flex-col items-center justify-start sm:justify-center z-50 p-3 sm:p-6 overflow-y-auto scroll-stable">
      {inspectingHero && (
        <HeroProfileModal
          hero={inspectingHero}
          onClose={() => setInspectingHero(null)}
          onSelect={() => {
            const h = inspectingHero;
            setInspectingHero(null);
            onSelectHero(h);
          }}
          canSelect={true}
        />
      )}

      <div className="w-full max-w-6xl my-auto flex flex-col items-center py-4">
        {/* Title & Banner */}
        <div className="text-center mb-4 sm:mb-6 max-w-full px-2">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <span className="text-xl sm:text-3xl text-amber-400">⚡</span>
            <h1 className="font-cinzel text-xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-wider sm:tracking-widest drop-shadow-[0_0_15px_rgba(200,155,60,0.6)]">
              AETHERIUM: ASTRAL BATTLEGROUNDS
            </h1>
            <span className="text-xl sm:text-3xl text-amber-400">⚡</span>
          </div>
          <p className="text-[11px] sm:text-sm text-purple-300 font-sans tracking-wide">
            Select your Commander to lead your Astral Warband into the Dark Steel Arena
          </p>
        </div>

        {/* Hero Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {heroes.map((hero) => {
          const faction = getFactionForHero(hero);
          return (
          <div
            key={hero.id}
            className="group relative flex flex-col justify-between dark-steel-card rounded-3xl p-4 shadow-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out transform hover:-translate-y-2 hover:border-yellow-400 hover:shadow-[0_15px_35px_rgba(234,179,8,0.3)] cursor-pointer"
          >
            {/* Quick Inspect Button on Top Right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playCardSnap();
                setInspectingHero(hero);
              }}
              title="Zoom & Inspect Hero Lore"
              className="absolute top-3 right-3 bg-black/80 hover:bg-yellow-500 hover:text-black text-yellow-300 border border-yellow-500/60 rounded-full px-2 py-0.5 text-[10px] font-cinzel font-bold z-30 transition-colors duration-150 shadow-md flex items-center gap-1"
            >
              <span>🔍</span>
              <span>Lore</span>
            </button>

            {/* Top: Avatar & Title */}
            <div
              onClick={() => {
                sound.playCardSnap();
                setInspectingHero(hero);
              }}
              className="flex flex-col items-center text-center group/art"
            >
              {/* Illustrated Hero Portrait Viewport */}
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-yellow-500/70 shadow-lg mb-3 group-hover/art:scale-105 transition-transform bg-black/80">
                <CardMediaArt
                  artUrl={hero.artUrl || '/assets/art/hero_chronos.jpg'}
                  videoUrl={hero.videoUrl}
                  alt={hero.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-1 right-1 text-xs bg-black/70 px-1.5 py-0.5 rounded-full border border-yellow-500/50 z-10">
                  {hero.avatarIcon}
                </div>
              </div>

              <h2 className="font-cinzel font-bold text-base text-yellow-300 tracking-wide group-hover:text-yellow-200">
                {hero.name}
              </h2>
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-2">
                {hero.title}
              </span>
              <div className="text-xs font-bold text-emerald-300 bg-emerald-950/90 px-3 py-0.5 rounded-full border border-emerald-500/60 mb-2 shadow-inner">
                ❤️ {hero.hp} Health
              </div>
              {faction?.motto && (
                <div className="text-[10px] text-amber-300/90 italic text-center px-1 mb-2 font-serif line-clamp-1">
                  {faction.motto}
                </div>
              )}
            </div>

            {/* Middle: Hero Power Card */}
            <div
              onClick={() => {
                sound.playCardSnap();
                setInspectingHero(hero);
              }}
              className="steel-text-plaque rounded-xl p-3 my-2 border border-[#433961]"
            >
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-purple-950/80">
                <span className="font-cinzel text-xs font-bold text-cyan-300">
                  {hero.powerName}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-yellow-300 border border-yellow-500/40">
                  {hero.powerCost === 0 ? 'FREE' : `🪙 ${hero.powerCost}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {hero.powerDescription}
              </p>
            </div>

            {/* Bottom: Select CTA */}
            <button
              onClick={() => {
                sound.playTierUpgrade();
                onSelectHero(hero);
              }}
              className="w-full mt-3 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-cinzel font-bold text-xs tracking-wider rounded-xl shadow-brass transition-[transform,background-color] hover:scale-105 active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
            >
              CHOOSE COMMANDER ➔
            </button>
          </div>
          );
        })}
      </div>

        {/* Back to Login Callsign Option */}
        {onBackToLogin && (
          <button
            onClick={() => {
              sound.playCardSnap();
              onBackToLogin();
            }}
            className="mt-4 sm:mt-6 px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-yellow-500/50 text-slate-300 hover:text-white font-cinzel font-bold text-xs rounded-xl shadow transition-colors duration-150 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>←</span>
            <span>BACK TO LOGIN CALLSIGN</span>
          </button>
        )}
      </div>
    </main>
  );
};
