import React, { useState, useRef, useEffect } from 'react';
import { MinionCard, BoardMinion, Tribe, Keyword } from '../types';
import { TRIBE_ART_MAP } from '../engine/cards';
import { CardHoverPreview } from './CardHoverPreview';
import { CardMediaArt } from './CardMediaArt';
import { sound } from '../audio/sound';

interface CardViewProps {
  card?: MinionCard;
  boardMinion?: BoardMinion;
  onClick?: () => void;
  onRightClick?: (e: React.MouseEvent) => void;
  onInspect?: (card?: MinionCard, boardMinion?: BoardMinion) => void;
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

const TRIBE_ICONS: Record<Tribe, string> = {
  AUTOMATA: '⚙️',
  VOIDBORN: '👁️',
  ALCHEMIST: '🧪',
  CELESTIAL: '✨',
  BEAST: '🐺',
  PIRATE: '⚔️',
  NEUTRAL: '🔮',
};

const TRIBE_COLORS: Record<Tribe, { text: string; border: string; bg: string }> = {
  AUTOMATA: { text: 'text-amber-300', border: 'border-amber-500/70', bg: 'bg-amber-950/80' },
  VOIDBORN: { text: 'text-purple-300', border: 'border-purple-500/70', bg: 'bg-purple-950/80' },
  ALCHEMIST: { text: 'text-emerald-300', border: 'border-emerald-500/70', bg: 'bg-emerald-950/80' },
  CELESTIAL: { text: 'text-cyan-300', border: 'border-cyan-500/70', bg: 'bg-cyan-950/80' },
  BEAST: { text: 'text-rose-300', border: 'border-rose-500/70', bg: 'bg-rose-950/80' },
  PIRATE: { text: 'text-yellow-300', border: 'border-yellow-500/70', bg: 'bg-yellow-950/80' },
  NEUTRAL: { text: 'text-slate-300', border: 'border-slate-500/70', bg: 'bg-slate-900/80' },
};

const KEYWORD_BADGES: Record<Keyword, { label: string; color: string }> = {
  BASTION: { label: 'Bastion', color: 'text-blue-300' },
  AETHER_BARRIER: { label: 'Barrier', color: 'text-cyan-300' },
  LAST_GASP: { label: 'Last Gasp', color: 'text-purple-300' },
  MIASMIC: { label: 'Miasmic', color: 'text-emerald-300' },
  OVERCLOCK: { label: 'Overclock', color: 'text-yellow-300' },
  RE_WIND: { label: 'Re-wind', color: 'text-indigo-300' },
  SWEEP: { label: 'Sweep', color: 'text-red-300' },
  MAGNETIC: { label: 'Magnetic', color: 'text-amber-300' },
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  boardMinion,
  onClick,
  onRightClick,
  onInspect,
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
  const hasBarrier = boardMinion ? boardMinion.barrierActive : keywords.includes('AETHER_BARRIER');
  const hasBastion = keywords.includes('BASTION');
  const isMiasmic = keywords.includes('MIASMIC');

  const artUrl = boardMinion?.artUrl || card?.artUrl || TRIBE_ART_MAP[tribe] || '/assets/art/hero_chronos.jpg';
  const tribeInfo = TRIBE_COLORS[tribe];

  const cardRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setHoverPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
      }
    }, 350);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoverPosition(null);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    sound.playCardSnap();
    if (onInspect) {
      onInspect(card, boardMinion);
    } else if (onRightClick) {
      onRightClick(e);
    }
  };

  const sizeDimensions = {
    sm: 'w-[140px] h-[220px] text-xs',
    md: 'w-44 h-[272px] text-xs',
    lg: 'w-56 h-[330px] text-sm',
  }[size];

  return (
    <>
      <div
        ref={cardRef}
        onClick={!disabled ? onClick : undefined}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative select-none flex flex-col justify-between rounded-2xl p-1.5 transition-transform duration-200 ease-out cursor-pointer overflow-hidden group/card
          ${sizeDimensions}
          ${isGolden ? 'golden-steel-card shimmer-foil' : 'dark-steel-card'}
          ${isFrozen ? 'frost-card' : ''}
          ${isSelected ? 'ring-4 ring-cyan-400 scale-105 shadow-[0_0_25px_rgba(0,240,255,0.7)]' : 'hover:scale-105 hover:shadow-[0_15px_30px_rgba(0,0,0,0.9)]'}
          ${isAttacking ? 'scale-110 -translate-y-4 ring-4 ring-yellow-400 z-30' : ''}
          ${isHit ? 'animate-wiggle ring-4 ring-red-500 scale-95 duration-100' : ''}
          ${hasBastion ? 'ring-2 ring-blue-500/80 rounded-2xl' : ''}
          ${isMiasmic ? 'shadow-[inset_0_0_15px_rgba(0,230,118,0.4)]' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        `}
      >
      {/* Hexagonal Forcefield Barrier Overlay */}
      {hasBarrier && (
        <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/90 bg-cyan-400/20 hex-barrier pointer-events-none z-30 flex items-center justify-center overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-40 animate-spin" style={{ animationDuration: '12s' }} viewBox="0 0 100 100">
            <polygon points="50 3, 90 25, 90 75, 50 97, 10 75, 10 25" fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray="6,4" />
          </svg>
          <span className="text-[9px] font-black tracking-widest text-cyan-200 uppercase bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-300 shadow-aether">
            ✨ BARRIER
          </span>
        </div>
      )}

      {/* Frost Corners when Frozen in Shop */}
      {isFrozen && (
        <div className="absolute inset-0 pointer-events-none z-30 rounded-2xl overflow-hidden bg-sky-950/25">
          <div className="absolute top-1 right-1 text-sm">❄️</div>
          <div className="absolute bottom-1 left-1 text-sm">❄️</div>
        </div>
      )}

      {/* Quick Inspect Lens Hover Icon */}
      {onInspect && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playCardSnap();
            onInspect(card, boardMinion);
          }}
          title="Zoom & Inspect Artwork"
          className="absolute top-2 right-2 bg-black/80 hover:bg-yellow-500 hover:text-black text-yellow-300 border border-yellow-500/60 rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover/card:opacity-100 transition-all z-40 shadow-lg"
        >
          🔍
        </button>
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

      {/* Top Header: Class/Tribe Crest & Arched Name Plaque */}
      <div className="relative flex items-center gap-1 z-10 w-full mb-1">
        {/* Tribal Metallic Badge */}
        <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${tribeInfo.border} ${tribeInfo.bg} shadow-md text-xs`}>
          {TRIBE_ICONS[tribe]}
        </div>

        {/* Steel Name Plate */}
        <div className="flex-1 steel-name-plate py-0.5 px-2 rounded-md flex items-center justify-between overflow-hidden">
          <span className={`text-sm font-bold truncate leading-tight font-cinzel tracking-wide ${isGolden ? 'text-yellow-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]' : 'text-slate-100'}`}>
            {name.replace('★ ', '')}
          </span>
          <span className="text-xs text-yellow-400 font-bold ml-1 font-mono">
            {'★'.repeat(tier)}
          </span>
        </div>
      </div>

      {/* Illustrated Painterly Portrait Viewport */}
      <div className="relative w-full flex-1 rounded-lg overflow-hidden border border-[#5a4d7a] shadow-inner group bg-black/80 min-h-[90px]">
        <CardMediaArt
          artUrl={artUrl}
          videoUrl={boardMinion?.videoUrl || card?.videoUrl}
          alt={name}
          hoverZoom={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

        {/* Flanking Tribe Ribbon Badge on Art */}
        <div className={`absolute bottom-1 right-1 text-xs font-bold px-2 py-0.5 rounded-full border shadow-md backdrop-blur-md ${tribeInfo.bg} ${tribeInfo.text} ${tribeInfo.border}`}>
          {tribe}
        </div>
      </div>

      {/* Description Slate Plaque */}
      <div className="relative steel-text-plaque p-1.5 rounded-lg my-1 flex flex-col justify-between min-h-[46px] z-10">
        <div className="text-[13px] text-slate-200 line-clamp-2 leading-snug font-sans">
          {description ? (
            <span>
              {keywords.map(kw => (
                <strong key={kw} className={`font-bold mr-1 ${KEYWORD_BADGES[kw]?.color || 'text-yellow-400'}`}>
                  {KEYWORD_BADGES[kw]?.label || kw}:
                </strong>
              ))}
              {description}
            </span>
          ) : (
            <span className="text-slate-400 italic">No additional combat triggers.</span>
          )}
        </div>

        {/* 5-Diamond Tier Pips */}
        <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px]">
          {[1, 2, 3, 4, 5, 6].map(t => (
            <span key={t} className={t <= tier ? (isGolden ? 'text-yellow-400' : 'text-purple-400') : 'text-slate-700'}>
              ◆
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Footer: Attack Medallion, Price Coin, Health Medallion */}
      <div className="flex items-center justify-between mt-auto pt-0.5 z-20">
        {/* Attack Stat Medallion */}
        <div className="stat-medallion-atk flex items-center justify-center w-8 h-8 rounded-full font-black text-white font-mono text-sm">
          {attack}
        </div>

        {showPrice && (
          <div className="flex items-center gap-1 bg-yellow-950/90 border border-yellow-400 text-yellow-300 font-mono font-bold text-xs px-2 py-0.5 rounded-full shadow-md">
            <span>🪙</span> {price}
          </div>
        )}

        {/* Health Stat Medallion */}
        <div className={`stat-medallion-hp flex items-center justify-center w-8 h-8 rounded-full font-black text-white font-mono text-sm ${health < maxHealth ? 'animate-pulse text-red-200' : ''}`}>
          {health}
        </div>
      </div>
    </div>
    {hoverPosition && (
      <CardHoverPreview card={card} boardMinion={boardMinion} position={hoverPosition} />
    )}
  </>
  );
};
