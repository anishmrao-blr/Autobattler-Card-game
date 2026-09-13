import React from 'react';
import { PlayerState } from '../types';
import { sound } from '../audio/sound';

interface HeaderHUDProps {
  player: PlayerState;
  currentTurn: number;
  timeLeft: number;
  onReadyCombat: () => void;
  onOpenCodex?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenMenu?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  player,
  currentTurn,
  timeLeft,
  onReadyCombat,
  onOpenCodex,
  isMuted,
  onToggleMute,
  onOpenMenu,
}) => {
  return (
    <header className="w-full bg-[#0d071d]/90 border-b border-[#3b2a59] px-6 py-2.5 flex items-center justify-between shadow-xl backdrop-blur-md z-30 select-none">
      {/* Left: Astral Lobby Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-black/80 border border-yellow-500/60 flex items-center justify-center text-lg shadow-brass">
          🌌
        </div>
        <div>
          <div className="font-cinzel text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-wider">
            ASTRAL ATRIUM LOBBY
          </div>
          <div className="text-[10px] text-purple-300 font-sans">
            8-Player Competitive Arena • Tavern Tier ★ {player.tavernTier}
          </div>
        </div>
      </div>

      {/* Center: Cog-Coins Treasury */}
      <div className="flex items-center gap-3 bg-[#130b29] px-4 py-1.5 rounded-2xl border-2 border-yellow-500/70 shadow-brass">
        <span className="text-xl animate-bounce">🪙</span>
        <div className="flex items-baseline gap-1">
          <span className="font-cinzel text-lg font-black text-yellow-300 drop-shadow">
            {player.coins}
          </span>
          <span className="text-[11px] font-cinzel font-bold text-slate-400">
            / {player.maxCoins} COINS
          </span>
        </div>

        {/* Coin Pips visual */}
        <div className="flex items-center gap-1 ml-1 hidden sm:flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-4 rounded-sm border transition-all ${
                i < player.coins
                  ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_8px_rgba(255,215,0,0.9)] scale-105'
                  : i < player.maxCoins
                  ? 'bg-yellow-950/60 border-yellow-800/40'
                  : 'bg-slate-950 border-slate-800 opacity-30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right: Round Timer, Engage Combat, Codex, Mute */}
      <div className="flex items-center gap-3">
        {/* Turn Number & Timer */}
        <div className="text-right">
          <div className="text-xs font-black text-yellow-200 font-cinzel tracking-wider">
            TURN {currentTurn}
          </div>
          <div className={`text-[11px] font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
            ⏳ {timeLeft}s remaining
          </div>
        </div>

        {/* Engage Combat Button */}
        <button
          onClick={() => {
            sound.playAttackLunge();
            onReadyCombat();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 border border-red-300 text-white font-cinzel font-black text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <span>⚔️ ENGAGE COMBAT</span>
        </button>

        {/* Codex Button */}
        {onOpenCodex && (
          <button
            onClick={() => {
              sound.playCardSnap();
              onOpenCodex();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#120a26] hover:bg-yellow-500 hover:text-black border border-yellow-500/50 rounded-xl text-xs font-cinzel font-bold text-yellow-300 transition-all shadow-sm"
            title="Open Astral World Codex"
          >
            <span>📖</span>
            <span className="hidden sm:inline">CODEX</span>
          </button>
        )}

        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Game Menu / Settings Cog */}
        {onOpenMenu && (
          <button
            onClick={() => {
              sound.playCardSnap();
              onOpenMenu();
            }}
            className="flex items-center gap-1 p-2 bg-[#120a26] hover:bg-yellow-500 hover:text-black border border-yellow-500/50 rounded-xl text-sm text-yellow-300 transition-all shadow-sm cursor-pointer"
            title="Game Menu / Concede / Exit (Esc)"
          >
            <span>⚙️</span>
          </button>
        )}
      </div>
    </header>
  );
};
