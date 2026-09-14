import React, { useState, useRef, useEffect } from 'react';
import { MinionCard, BoardMinion, Tribe, Keyword } from '../types';
import { TRIBE_ART_MAP } from '../engine/cards';
import { CardHoverPreview } from './CardHoverPreview';
import { CardMediaArt } from './CardMediaArt';
import { sound } from '../audio/sound';
import { isReducedMotion } from '../utils/motion';

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
  const armedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [tapArmed, setTapArmed] = useState(false);

  // No hover on touch, so a mouseenter/click racing off the same tap is what
  // caused a tap to sometimes preview and sometimes instantly buy. Touch
  // devices get an explicit two-step flow instead, scoped to the shop
  // (showPrice) where an accidental purchase is the actual risk - hand and
  // board cards keep their existing single-tap behavior.
  const isTouchDevice = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
  ).current;
  const useTapToPreview = isTouchDevice && showPrice;

  const showPreviewNow = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setHoverPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    }
  };

  const dismissPreview = () => {
    setTapArmed(false);
    setHoverPosition(null);
    if (armedTimerRef.current) {
      clearTimeout(armedTimerRef.current);
      armedTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (useTapToPreview) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(showPreviewNow, 350);
  };

  const [holoStyle, setHoloStyle] = useState<React.CSSProperties>({
    '--holo-x': '50%',
    '--holo-y': '50%',
    '--holo-angle': '115deg',
    '--holo-opacity': '0',
  } as React.CSSProperties);
  const [tiltTransform, setTiltTransform] = useState<string | undefined>(undefined);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isGolden || isReducedMotion()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const tiltX = (py - 0.5) * -12;
    const tiltY = (px - 0.5) * 12;
    const angle = Math.atan2(py - 0.5, px - 0.5) * (180 / Math.PI) + 90;

    setTiltTransform(`perspective(600px) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) scale3d(1.03, 1.03, 1.03)`);
    setHoloStyle({
      '--holo-x': `${(px * 100).toFixed(1)}%`,
      '--holo-y': `${(py * 100).toFixed(1)}%`,
      '--holo-angle': `${angle.toFixed(1)}deg`,
      '--holo-opacity': '0.75',
    } as React.CSSProperties);
  };

  const handlePointerLeave = () => {
    if (useTapToPreview) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoverPosition(null);
    if (isGolden) {
      setTiltTransform(undefined);
      setHoloStyle(prev => ({ ...prev, '--holo-opacity': '0' }));
    }
  };

  const handleActivate = () => {
    if (disabled) return;
    if (!useTapToPreview) {
      onClick?.();
      return;
    }
    if (!tapArmed) {
      setTapArmed(true);
      showPreviewNow();
      sound.playCardSnap();
      // Generous on purpose: this only guards against a preview being left
      // open indefinitely if the player wanders off. A real decision -
      // reading ability text and keyword explanations - can easily take
      // longer than a typical hover-tooltip timeout.
      armedTimerRef.current = setTimeout(dismissPreview, 15000);
      return;
    }
    dismissPreview();
    onClick?.();
  };

  useEffect(() => {
    if (!tapArmed) return;
    const handleOutside = (e: PointerEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        dismissPreview();
      }
    };
    document.addEventListener('pointerdown', handleOutside, true);
    return () => document.removeEventListener('pointerdown', handleOutside, true);
  }, [tapArmed]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
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
        onClick={!disabled ? handleActivate : undefined}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onDragStart={(e) => e.preventDefault()}
        style={{
          ...holoStyle,
          transform: tiltTransform || undefined,
        }}
        className={`
          relative select-none flex flex-col justify-between rounded-2xl p-1.5 transition-transform duration-200 ease-out cursor-pointer overflow-hidden group/card
          ${sizeDimensions}
          ${isGolden ? 'golden-steel-card shimmer-foil' : 'dark-steel-card'}
          ${isFrozen ? 'frost-card' : ''}
          ${tapArmed ? 'ring-4 ring-yellow-400 scale-[1.03] shadow-[0_0_25px_rgba(234,179,8,0.6)]' : isSelected ? 'ring-4 ring-cyan-400 scale-105 shadow-[0_0_25px_rgba(0,240,255,0.7)]' : 'hover:scale-105 hover:shadow-[0_15px_30px_rgba(0,0,0,0.9)]'}
          ${isAttacking ? 'scale-110 -translate-y-4 ring-4 ring-yellow-400 z-30' : ''}
          ${isHit ? 'animate-wiggle ring-4 ring-red-500 scale-95 duration-100' : ''}
          ${hasBastion ? 'ring-2 ring-blue-500/80 rounded-2xl' : ''}
          ${isMiasmic ? 'shadow-[inset_0_0_15px_rgba(0,230,118,0.4)]' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        `}
      >
      {/* Dynamic Holographic Foil Specular Sheen for Golden Minions */}
      {isGolden && (
        <>
          <div className="holo-specular-sheen" />
          <div className="holo-rainbow-stripes" />
        </>
      )}

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
          className="absolute top-2 right-2 bg-black/80 hover:bg-yellow-500 hover:text-black text-yellow-300 border border-yellow-500/60 rounded-full w-6 h-6 flex items-center justify-center text-[11px] opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100 transition-[opacity,background-color,color] duration-150 z-40 shadow-lg"
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

      {tapArmed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-cinzel font-black text-[10px] px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)] z-40 animate-pulse whitespace-nowrap">
          TAP AGAIN TO BUY
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
          <span data-testid="card-title" className={`text-sm font-bold truncate leading-tight font-cinzel tracking-wide ${isGolden ? 'text-yellow-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]' : 'text-slate-100'}`}>
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

        {/* Price Coin Badge (Top-Left of Art Viewport) */}
        {showPrice && (
          <div className="absolute top-1.5 left-1.5 z-20 flex items-center gap-1 bg-yellow-950/90 border border-yellow-400 text-yellow-300 font-mono font-bold text-xs px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm">
            <span>🪙</span> {price}
          </div>
        )}

        {/* Flanking Tribe Ribbon Badge on Art (Centered between medallions) */}
        <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-md backdrop-blur-md ${tribeInfo.bg} ${tribeInfo.text} ${tribeInfo.border}`}>
          {tribe}
        </div>

        {/* Attack Stat Medallion (Bottom-Left of Art Viewport) */}
        <div className="stat-medallion-atk absolute bottom-1.5 left-1.5 z-20 flex items-center justify-center w-8 h-8 rounded-full font-black text-white font-mono text-sm shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {attack}
        </div>

        {/* Health Stat Medallion (Bottom-Right of Art Viewport) */}
        <div className={`stat-medallion-hp absolute bottom-1.5 right-1.5 z-20 flex items-center justify-center w-8 h-8 rounded-full font-black text-white font-mono text-sm shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${health < maxHealth ? 'animate-pulse text-red-200' : ''}`}>
          {health}
        </div>
      </div>

      {/* Description Slate Plaque - kept to one line; full text is one tap away
          via the hover/tap preview, so this only needs to signal, not explain.
          The tier pip row was dropped: tier is already shown as stars above. */}
      <div className="relative steel-text-plaque p-1.5 rounded-lg my-0.5 min-h-[26px] z-10">
        <div className="text-[13px] text-slate-200 line-clamp-1 leading-snug font-sans">
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
      </div>
    </div>
    {hoverPosition && (
      <CardHoverPreview card={card} boardMinion={boardMinion} position={hoverPosition} />
    )}
  </>
  );
};
