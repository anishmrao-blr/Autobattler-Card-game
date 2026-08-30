import React from 'react';
import { MinionCard, BoardMinion, Tribe, Keyword } from '../types';

interface CardViewProps {
  card?: MinionCard;
  boardMinion?: BoardMinion;
  onClick?: () => void;
  onRightClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  showPrice?: boolean;
  price?: number;
  isSelected?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
  damageReceived?: number;
  barrierBroken?: boolean;
  disabled?: boolean;
  isFrozen?: boolean;
}

const TRIBE_COLORS: Record<Tribe, { bg: string; text: string; border: string }> = {
  AUTOMATA: { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-500' },
  VOIDBORN: { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-500' },
  ALCHEMIST: { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500' },
  CELESTIAL: { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-500' },
  BEAST: { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-500' },
  PIRATE: { bg: 'bg-yellow-950/80', text: 'text-yellow-300', border: 'border-yellow-500' },
  NEUTRAL: { bg: 'bg-slate-900/80', text: 'text-slate-300', border: 'border-slate-500' },
};

const KEYWORD_LABELS: Record<Keyword, { label: string; color: string; icon: string }> = {
  BASTION: { label: 'Bastion', color: 'text-blue-300 bg-blue-950/70 border-blue-500', icon: '🛡️' },
  AETHER_BARRIER: { label: 'Barrier', color: 'text-cyan-300 bg-cyan-950/70 border-cyan-400', icon: '✨' },
  LAST_GASP: { label: 'Last Gasp', color: 'text-purple-300 bg-purple-950/70 border-purple-500', icon: '💀' },
  MIASMIC: { label: 'Miasmic', color: 'text-emerald-300 bg-emerald-950/70 border-emerald-400', icon: '☣️' },
  OVERCLOCK: { label: 'Overclock', color: 'text-yellow-300 bg-yellow-950/70 border-yellow-400', icon: '⚡' },
  RE_WIND: { label: 'Re-wind', color: 'text-indigo-300 bg-indigo-950/70 border-indigo-400', icon: '⏳' },
  SWEEP: { label: 'Sweep', color: 'text-red-300 bg-red-950/70 border-red-500', icon: '⚔️' },
  MAGNETIC: { label: 'Magnetic', color: 'text-amber-300 bg-amber-950/70 border-amber-400', icon: '🧲' },
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  boardMinion,
  onClick,
  onRightClick,
  size = 'md',
  showPrice = false,
  price = 3,
  isSelected = false,
  isAttacking = false,
  isHit = false,
  damageReceived,
  barrierBroken = false,
  disabled = false,
  isFrozen = false,
}) => {
  const name = boardMinion?.name || card?.name || 'Unknown';
  const tier = boardMinion?.tier || card?.tier || 1;
  const tribe = boardMinion?.tribe || card?.tribe || 'NEUTRAL';
  const attack = boardMinion ? boardMinion.attack : (card?.attack || 0);
  const health = boardMinion ? boardMinion.health : (card?.health || 0);
  const maxHealth = boardMinion ? boardMinion.maxHealth : health;
  const isGolden = boardMinion?.isGolden || card?.name.startsWith('★') || false;
  const keywords = boardMinion?.keywords || card?.keywords || [];
  const description = card?.description || (isGolden ? card?.goldenDescription : '') || '';
  const icon = boardMinion?.icon || card?.icon || '🃏';
  const hasBarrier = boardMinion ? boardMinion.barrierActive : keywords.includes('AETHER_BARRIER');
  const hasBastion = keywords.includes('BASTION');
  const isMiasmic = keywords.includes('MIASMIC');

  const tribeStyle = TRIBE_COLORS[tribe];

  const sizeClasses = {
    sm: 'w-24 h-36 text-xs',
    md: 'w-36 h-52 text-sm',
    lg: 'w-48 h-68 text-base',
  }[size];

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onContextMenu={onRightClick}
      className={`
        relative select-none flex flex-col justify-between rounded-xl p-2.5 transition-all duration-200 cursor-pointer
        ${sizeClasses}
        ${isGolden ? 'golden-border shimmer-foil' : 'brass-border bg-gradient-to-b from-[#191131] via-[#100b21] to-[#0a0717]'}
        ${isFrozen ? 'frost-card' : ''}
        ${isSelected ? 'ring-4 ring-cyan-400 scale-105 shadow-aether' : 'hover:scale-105 hover:shadow-brass'}
        ${isAttacking ? 'scale-110 -translate-y-4 ring-4 ring-yellow-400 z-30 transition-transform duration-150' : ''}
        ${isHit ? 'animate-wiggle ring-4 ring-red-500 scale-95 duration-100' : ''}
        ${hasBastion ? 'ring-2 ring-blue-500/80 rounded-2xl' : ''}
        ${isMiasmic ? 'shadow-[inset_0_0_12px_rgba(0,230,118,0.35)]' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      `}
    >
      {/* Hexagonal Forcefield Barrier Overlay */}
      {hasBarrier && (
        <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/90 bg-cyan-400/15 hex-barrier pointer-events-none z-20 flex items-center justify-center overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-40 animate-spin" style={{ animationDuration: '12s' }} viewBox="0 0 100 100">
            <polygon points="50 3, 90 25, 90 75, 50 97, 10 75, 10 25" fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray="6,4" />
          </svg>
          <span className="text-[10px] font-black tracking-widest text-cyan-200 uppercase bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-300 shadow-aether">
            ✨ BARRIER
          </span>
        </div>
      )}

      {/* Frost Corners when Frozen in Shop */}
      {isFrozen && (
        <div className="absolute inset-0 pointer-events-none z-20 rounded-xl overflow-hidden bg-sky-950/20">
          <div className="absolute top-1 right-1 text-xs">❄️</div>
          <div className="absolute bottom-1 left-1 text-xs">❄️</div>
        </div>
      )}

      {/* Damage Received Floater */}
      {damageReceived !== undefined && damageReceived > 0 && (
        <div className={`absolute -top-7 left-1/2 -translate-x-1/2 font-black float-damage z-40 ${damageReceived >= 8 ? 'text-3xl text-yellow-300 drop-shadow-[0_0_12px_rgba(255,215,0,1)]' : 'text-2xl text-red-500 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'}`}>
          -{damageReceived}{damageReceived >= 8 ? ' 💥' : ''}
        </div>
      )}

      {barrierBroken && (
        <div className="absolute inset-0 flex items-center justify-center text-cyan-200 font-black text-xl animate-ping z-40">
          SHATTER!
        </div>
      )}

      {/* Top Header: Tier Stars & Card Name */}
      <div className="flex items-start justify-between gap-1 z-10">
        <div className="flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded-md border border-yellow-500/50 text-[10px] text-yellow-400 font-bold shadow">
          {'★'.repeat(tier)}
        </div>
        <span className={`text-[11px] font-bold truncate leading-tight font-cinzel ${isGolden ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : 'text-slate-100'}`}>
          {name.replace('★ ', '')}
        </span>
      </div>

      {/* Center Graphic & Tribe Badge */}
      <div className="relative my-auto flex flex-col items-center justify-center py-1">
        <div className="text-4xl drop-shadow-[0_0_12px_rgba(200,155,60,0.6)] transform transition-transform hover:scale-125">
          {icon}
        </div>

        <div className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border shadow ${tribeStyle.bg} ${tribeStyle.text} ${tribeStyle.border}`}>
          {tribe}
        </div>
      </div>

      {/* Card Rules / Flavor Text */}
      {size !== 'sm' && (
        <div className="text-[10px] text-slate-200 bg-black/70 p-1.5 rounded-lg border border-purple-900/60 line-clamp-2 leading-tight my-1 text-center font-sans">
          {description || keywords.join(', ')}
        </div>
      )}

      {/* Keyword Badges */}
      <div className="flex flex-wrap gap-0.5 justify-center mb-1">
        {keywords.slice(0, 3).map((kw, i) => (
          <span
            key={i}
            className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shadow ${KEYWORD_LABELS[kw]?.color || 'text-slate-300'}`}
          >
            {KEYWORD_LABELS[kw]?.icon} {KEYWORD_LABELS[kw]?.label}
          </span>
        ))}
      </div>

      {/* Bottom Footer: Attack, Price, Health */}
      <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-yellow-600/30 z-10">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-rose-950 border-2 border-amber-400 font-bold text-white shadow-lg text-xs">
          ⚔️ {attack}
        </div>

        {showPrice && (
          <div className="flex items-center gap-1 bg-yellow-950/90 border border-yellow-400 text-yellow-300 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-brass">
            <span>🪙</span> {price}
          </div>
        )}

        <div className={`flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-950 border-2 border-emerald-300 font-bold text-white shadow-lg text-xs ${health < maxHealth ? 'text-red-300 animate-pulse' : ''}`}>
          🛡️ {health}
        </div>
      </div>
    </div>
  );
};
