import React from 'react';
import { PlayerState } from '../types';

interface LeaderboardProps {
  players: PlayerState[];
  currentTurn: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ players, currentTurn }) => {
  const sorted = [...players].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    if (a.hp !== b.hp) return b.hp - a.hp;
    return b.tavernTier - a.tavernTier;
  });

  return (
    <div className="w-64 h-full bg-[#0a0717]/95 border-r border-[#3b2a59] flex flex-col p-3 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-yellow-600/30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌌</span>
          <span className="font-cinzel font-bold text-sm tracking-wider text-yellow-300">
            ASTRAL LOBBY
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 font-bold border border-purple-600/40">
          Turn {currentTurn}
        </span>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sorted.map((p, idx) => {
          const isDead = p.isEliminated || p.hp <= 0;
          const hpPercent = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));

          // HP color
          let hpColor = 'text-emerald-400';
          let hpBarColor = 'bg-emerald-500';
          if (p.hp < 15) {
            hpColor = 'text-red-400';
            hpBarColor = 'bg-red-500';
          } else if (p.hp < 28) {
            hpColor = 'text-yellow-400';
            hpBarColor = 'bg-yellow-500';
          }

          return (
            <div
              key={p.id}
              className={`
                relative flex items-center gap-2 p-2 rounded-lg border transition-all duration-200
                ${p.isHuman ? 'border-cyan-400 bg-cyan-950/40 shadow-aether' : 'border-slate-800 bg-[#120e24]/80'}
                ${isDead ? 'opacity-40 grayscale border-red-950 bg-black/80' : 'hover:border-yellow-500/50'}
              `}
            >
              {/* Rank Position Badge */}
              <div className="w-5 text-center font-bold text-xs font-cinzel text-slate-400">
                #{idx + 1}
              </div>

              {/* Avatar Icon */}
              <div className="relative w-9 h-9 rounded-full bg-black/60 border border-yellow-500/50 flex items-center justify-center text-lg shadow-inner flex-shrink-0">
                {p.avatar}
                {/* Tavern Tier Badge */}
                <div className="absolute -bottom-1 -right-1 bg-yellow-950 border border-yellow-400 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold text-yellow-300 shadow">
                  {p.tavernTier}
                </div>
              </div>

              {/* Player Info & HP Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold truncate ${p.isHuman ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {p.name}
                  </span>
                  <span className={`font-bold ${isDead ? 'text-red-500' : hpColor}`}>
                    {isDead ? '☠️ ELIMINATED' : `${p.hp} HP`}
                  </span>
                </div>

                {/* HP Progress Bar */}
                {!isDead && (
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-700/50">
                    <div
                      className={`h-full ${hpBarColor} transition-all duration-300`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                )}

                {/* Status / Streaks */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                  <span className="truncate text-[9px]">{p.hero.name}</span>
                  {p.winStreak >= 2 && !isDead && (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      🔥 {p.winStreak}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
