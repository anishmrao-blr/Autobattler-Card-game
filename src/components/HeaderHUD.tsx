import React from 'react';
import { PlayerState } from '../types';
import { sound } from '../audio/sound';

interface HeaderHUDProps {
  player: PlayerState;
  currentTurn: number;
  timeLeft: number;
  onReadyCombat: () => void;
  onUseHeroPower: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  player,
  currentTurn,
  timeLeft,
  onReadyCombat,
  onUseHeroPower,
  isMuted,
  onToggleMute,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  let hpColor = 'text-emerald-400';
  let hpBg = 'bg-emerald-500';
  if (player.hp < 15) {
    hpColor = 'text-red-400';
    hpBg = 'bg-red-500';
  } else if (player.hp < 28) {
    hpColor = 'text-yellow-400';
    hpBg = 'bg-yellow-500';
  }

  const canUseHeroPower =
    player.hero.powerType === 'ACTIVE' && player.coins >= player.hero.powerCost;

  return (
    <header className="w-full bg-[#0d071d]/90 border-b border-[#3b2a59] px-4 py-2 flex items-center justify-between shadow-xl backdrop-blur-md z-30">
      {/* Left: Hero Info & Health */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full bg-black/80 border-2 border-yellow-500 flex items-center justify-center text-2xl shadow-brass flex-shrink-0">
          {player.avatar}
          <div className="absolute -bottom-1 -right-1 bg-yellow-950 border border-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-yellow-300 shadow">
            ★{player.tavernTier}
          </div>
        </div>

        {/* Hero Name & HP */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-cinzel font-bold text-sm text-yellow-300 tracking-wide">
              {player.hero.name}
            </h1>
            <span className="text-[10px] text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800">
              {player.hero.title}
            </span>
          </div>

          {/* Health Bar */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-28 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className={`h-full ${hpBg} transition-all duration-300`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <span className={`text-xs font-black ${hpColor}`}>
              ❤️ {player.hp} / {player.maxHp}
            </span>
          </div>
        </div>

        {/* Hero Power Slot */}
        <div className="ml-4 pl-4 border-l border-purple-950 flex items-center gap-2">
          <button
            onClick={() => {
              if (canUseHeroPower) {
                sound.playCoinClink();
                onUseHeroPower();
              }
            }}
            disabled={!canUseHeroPower}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-cinzel font-bold transition-all
              ${player.hero.powerType === 'PASSIVE'
                ? 'bg-purple-950/60 border-purple-800 text-purple-300 cursor-default'
                : canUseHeroPower
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white hover:scale-105 shadow-aether active:scale-95'
                : 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'}
            `}
          >
            <span className="text-base">⚡</span>
            <div className="text-left">
              <div className="text-[11px] leading-none">{player.hero.powerName}</div>
              <div className="text-[9px] text-yellow-300 font-sans font-normal mt-0.5">
                {player.hero.powerType === 'PASSIVE' ? 'Passive' : `Use for 🪙 ${player.hero.powerCost}`}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Center: Cog-Coins Purse */}
      <div className="flex items-center gap-2 bg-[#090414]/90 border border-yellow-500/40 px-4 py-1.5 rounded-2xl shadow-inner">
        <span className="text-lg animate-spin-slow">🪙</span>
        <div className="flex items-center gap-1">
          <span className="font-cinzel text-base font-black text-yellow-400">
            {player.coins}
          </span>
          <span className="text-xs text-yellow-600 font-bold">
            / {player.maxCoins} COINS
          </span>
        </div>

        {/* Coin Pips visual */}
        <div className="flex items-center gap-0.5 ml-2 hidden sm:flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-3.5 rounded-sm border ${
                i < player.coins
                  ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_5px_rgba(255,215,0,0.8)]'
                  : i < player.maxCoins
                  ? 'bg-yellow-950/60 border-yellow-800/40'
                  : 'bg-slate-950 border-slate-800 opacity-30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right: Round Timer, Engage Combat Button, Sound Toggle */}
      <div className="flex items-center gap-3">
        {/* Turn Number */}
        <div className="text-right">
          <div className="text-xs font-bold text-slate-300 font-cinzel">
            TURN {currentTurn}
          </div>
          <div className="text-[11px] font-bold text-cyan-400">
            ⏳ {timeLeft}s remaining
          </div>
        </div>

        {/* Engage Combat Button */}
        <button
          onClick={() => {
            sound.playAttackLunge();
            onReadyCombat();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 border border-red-300 text-white font-cinzel font-bold text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <span>⚔️ ENGAGE COMBAT</span>
        </button>

        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
};
