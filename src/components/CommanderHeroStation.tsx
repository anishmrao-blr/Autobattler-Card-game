import React, { useState } from 'react';
import { PlayerState } from '../types';
import { sound } from '../audio/sound';

interface CommanderHeroStationProps {
  player: PlayerState;
  onUseHeroPower: () => void;
  onInspectHero?: () => void;
}

export const CommanderHeroStation: React.FC<CommanderHeroStationProps> = ({
  player,
  onUseHeroPower,
  onInspectHero,
}) => {
  const [isPowerHovered, setIsPowerHovered] = useState(false);

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  let hpColor = 'from-emerald-500 to-green-600';
  let hpText = 'text-emerald-300';
  let hpBorder = 'border-emerald-500/60';
  if (player.hp < 15) {
    hpColor = 'from-red-600 to-rose-700 animate-pulse';
    hpText = 'text-red-400';
    hpBorder = 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  } else if (player.hp < 28) {
    hpColor = 'from-amber-500 to-yellow-600';
    hpText = 'text-yellow-300';
    hpBorder = 'border-amber-500/60';
  }

  const canUseHeroPower =
    player.hero.powerType === 'ACTIVE' && player.coins >= player.hero.powerCost;

  return (
    <div className="relative flex items-center gap-3 bg-[#0d071d]/90 p-2.5 rounded-2xl border-2 border-yellow-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-xl select-none z-30">
      {/* 1. Large Hero Artwork Frame */}
      <div
        onClick={() => {
          sound.playCardSnap();
          onInspectHero?.();
        }}
        title="Click to inspect Commander Lore & Stats"
        className="group relative w-20 h-28 sm:w-24 sm:h-32 rounded-2xl border-2 border-yellow-400/80 overflow-hidden bg-black/90 shadow-[0_0_20px_rgba(234,179,8,0.35)] cursor-pointer hover:border-yellow-300 hover:scale-105 transition-all flex-shrink-0"
      >
        <img
          src={player.hero.artUrl || player.artUrl || '/assets/art/hero_chronos.jpg'}
          alt={player.hero.name}
          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

        {/* Tavern Tier Star Crown */}
        <div className="absolute top-1.5 left-1.5 bg-black/85 border border-yellow-400 text-yellow-300 px-1.5 py-0.5 rounded-lg text-[10px] font-cinzel font-black shadow-md">
          ★ {player.tavernTier}
        </div>

        {/* Lore Lens Hint */}
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 text-yellow-300 border border-yellow-500/60 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">
          🔍
        </div>

        {/* Hero Name Badge */}
        <div className="absolute bottom-1 inset-x-1 text-center">
          <span className="font-cinzel text-[10px] sm:text-[11px] font-black text-yellow-200 truncate block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {player.hero.name}
          </span>
        </div>
      </div>

      {/* 2. Hero Power Token & Highly Viewable HP Bar */}
      <div className="flex flex-col justify-between h-28 sm:h-32 py-0.5 min-w-[135px] sm:min-w-[160px]">
        {/* Commander Callsign & Title */}
        <div className="flex flex-col">
          <span className="font-cinzel text-[10px] text-purple-300 uppercase tracking-wider truncate">
            {player.hero.title}
          </span>
          <span className="text-[11px] font-bold text-slate-200 truncate font-sans">
            {player.name}
          </span>
        </div>

        {/* Prominent Hero Power / Passive Token with Hover Tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => {
              sound.playCardHover();
              setIsPowerHovered(true);
            }}
            onMouseLeave={() => setIsPowerHovered(false)}
            onClick={() => {
              if (canUseHeroPower) {
                sound.playCoinClink();
                onUseHeroPower();
              }
            }}
            disabled={!canUseHeroPower}
            className={`w-full flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
              player.hero.powerType === 'PASSIVE'
                ? 'bg-purple-950/70 border-purple-500/50 text-purple-200 cursor-help'
                : canUseHeroPower
                ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-yellow-300 text-black font-black shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-900/80 border-slate-700 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-black/70 border border-yellow-500/60 flex items-center justify-center text-sm shadow-inner flex-shrink-0">
              {player.hero.avatarIcon || '⚡'}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-cinzel text-[10px] font-black truncate">
                {player.hero.powerName}
              </div>
              <div className="text-[9px] font-sans font-bold opacity-85">
                {player.hero.powerType === 'PASSIVE'
                  ? '🛡️ PASSIVE'
                  : `🪙 ${player.hero.powerCost} COIN${player.hero.powerCost === 1 ? '' : 'S'}`}
              </div>
            </div>
          </button>

          {/* Interactive Hover Tooltip Explaining Hero Power */}
          {isPowerHovered && (
            <div className="absolute bottom-full left-0 mb-2 w-64 dark-steel-card rounded-2xl p-3.5 border-2 border-yellow-400 shadow-[0_15px_40px_rgba(0,0,0,0.95)] z-50 animate-fadeIn pointer-events-none">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-purple-900">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{player.hero.avatarIcon || '⚡'}</span>
                  <span className="font-cinzel text-xs font-black text-yellow-300">
                    {player.hero.powerName}
                  </span>
                </div>
                <span className="text-[10px] font-cinzel font-bold px-1.5 py-0.5 rounded bg-purple-950 text-cyan-300 border border-purple-800">
                  {player.hero.powerType}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 font-sans leading-relaxed">
                {player.hero.powerDescription}
              </p>
              {player.hero.powerType === 'ACTIVE' && (
                <div className="mt-2 pt-1.5 border-t border-purple-950 flex items-center justify-between text-[10px] font-sans">
                  <span className="text-slate-400">Cost:</span>
                  <span className="font-bold text-yellow-400">🪙 {player.hero.powerCost} Cog-Coins</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Highly Viewable HP Bar with Bevel & Big Numbers */}
        <div className={`p-1.5 rounded-xl bg-black/80 border ${hpBorder} shadow-inner`}>
          <div className="flex items-center justify-between text-[11px] font-cinzel font-black mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <span>❤️</span>
              <span>HEALTH</span>
            </span>
            <span className={hpText}>
              {player.hp} / {player.maxHp}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.4)]`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
