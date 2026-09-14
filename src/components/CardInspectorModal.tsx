import React, { useState, useRef, useEffect } from 'react';
import { MinionCard, BoardMinion, Tribe, Keyword } from '../types';
import { TRIBE_ART_MAP } from '../engine/cards';
import { CardMediaArt } from './CardMediaArt';
import { sound } from '../audio/sound';
import { motion, isReducedMotion } from '../utils/motion';
import gsap from 'gsap';

interface CardInspectorModalProps {
  card?: MinionCard;
  boardMinion?: BoardMinion;
  onClose: () => void;
}

export const KEYWORD_EXPLANATIONS: Record<Keyword, { label: string; desc: string; icon: string }> = {
  BASTION: { label: 'Bastion', desc: 'Enemies must attack this minion first.', icon: '🛡️' },
  AETHER_BARRIER: { label: 'Aether Barrier', desc: 'Completely absorbs the first instance of damage received.', icon: '✨' },
  LAST_GASP: { label: 'Last Gasp', desc: 'Triggers a special effect when this minion is destroyed in battle.', icon: '💀' },
  MIASMIC: { label: 'Miasmic', desc: 'Instantly destroys any non-barrier minion it damages.', icon: '☣️' },
  OVERCLOCK: { label: 'Overclock', desc: 'Can attack twice per combat round.', icon: '⚡' },
  RE_WIND: { label: 'Re-wind', desc: 'The first time this minion dies, it revives with 1 Health.', icon: '⏳' },
  SWEEP: { label: 'Sweep', desc: 'Also damages the minions adjacent to the chosen defender.', icon: '⚔️' },
  MAGNETIC: { label: 'Magnetic', desc: 'Can be snapped onto friendly Automata to fuse stats and keywords.', icon: '🧲' },
};

export const TRIBE_LORE: Record<Tribe, string> = {
  AUTOMATA: 'Clockwork constructs forged with pressurized steam, magnetic plating, and kinetic barriers.',
  VOIDBORN: 'Eldritch aberrations manifesting from cosmic rifts, thriving on death and sacrificial summoning.',
  ALCHEMIST: 'Arcane transmuters specializing in volatile concoctions, stat surges, and potion brewing.',
  CELESTIAL: 'Divine cosmic entities weaving constellations, providing warband-wide aura amplifications.',
  BEAST: 'Apex cosmic predators that feed on fallen allies and execute devastating pack rushes.',
  PIRATE: 'Void corsairs sailing astral skiffs, looting cog-coins and executing swift sweeping strikes.',
  NEUTRAL: 'Mercenary travelers and enigmatic wanderers across the Aetherium.',
};

export const CardInspectorModal: React.FC<CardInspectorModalProps> = ({
  card,
  boardMinion,
  onClose,
}) => {
  const [showGolden, setShowGolden] = useState(boardMinion?.isGolden || false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    motion.modalEnter(modalRef.current, 1.4);
  }, []);

  useEffect(() => {
    if (showGolden && sparkleRef.current && !isReducedMotion()) {
      const sparks = sparkleRef.current.children;
      gsap.fromTo(
        sparks,
        { scale: 0, opacity: 1, rotation: 0 },
        {
          scale: 1.5,
          opacity: 0,
          rotation: (i) => (i % 2 === 0 ? 90 : -90),
          duration: 0.55,
          stagger: 0.03,
          ease: 'power2.out',
        }
      );
    }
  }, [showGolden]);

  const name = boardMinion?.name || card?.name || 'Unknown';
  const tier = boardMinion?.tier || card?.tier || 1;
  const tribe = boardMinion?.tribe || card?.tribe || 'NEUTRAL';
  const baseAttack = boardMinion ? boardMinion.attack : (card?.attack || 0);
  const baseHealth = boardMinion ? boardMinion.health : (card?.health || 0);
  const keywords = boardMinion?.keywords || card?.keywords || [];
  const flavor = card?.flavor || 'An ancient warrior of the astral cosmos.';
  const description = card?.description || '';
  const goldenDesc = card?.goldenDescription || description;

  const attack = showGolden && !boardMinion?.isGolden ? baseAttack * 2 : baseAttack;
  const health = showGolden && !boardMinion?.isGolden ? baseHealth * 2 : baseHealth;
  const artUrl = boardMinion?.artUrl || card?.artUrl || TRIBE_ART_MAP[tribe] || '/assets/art/hero_chronos.jpg';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({ x: -y / 15, y: x / 15 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-8 overflow-y-auto animate-fadeIn"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-[#0d071d]/95 border-2 border-yellow-500/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-8 my-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-white bg-black/60 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-30 transition-colors"
          title="Close (Esc)"
        >
          ✕
        </button>

        {/* Left: Giant 3D Parallax Dark Steel Card */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="perspective-1000 flex-shrink-0 cursor-grab active:cursor-grabbing relative"
          style={{ perspective: '1200px' }}
        >
          {/* One-shot Golden Sparkle Burst Container */}
          {showGolden && (
            <div ref={sparkleRef} className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
              <span className="absolute text-yellow-300 text-xl -top-3 -left-3">✦</span>
              <span className="absolute text-amber-200 text-lg -bottom-3 -right-3">★</span>
              <span className="absolute text-yellow-400 text-2xl top-1/2 -left-6">✨</span>
              <span className="absolute text-amber-300 text-2xl top-1/2 -right-6">✨</span>
              <span className="absolute text-yellow-200 text-xl -top-4 right-1/4">✦</span>
              <span className="absolute text-yellow-300 text-xl -bottom-4 left-1/4">✦</span>
            </div>
          )}
          <div
            className={`
              relative w-64 sm:w-72 h-[390px] sm:h-[440px] rounded-2xl sm:rounded-3xl p-3 flex flex-col justify-between transition-transform duration-150 select-none
              ${showGolden ? 'golden-steel-card shimmer-foil' : 'dark-steel-card'}
            `}
            style={{
              transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1.02, 1.02, 1.02)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Header Plaque */}
            <div className="flex items-center justify-between gap-1 z-10">
              <div className="flex items-center gap-0.5 bg-black/80 px-2 py-0.5 rounded-md border border-yellow-500/60 text-xs text-yellow-400 font-bold">
                {'★'.repeat(tier)}
              </div>
              <span className={`text-sm font-bold truncate font-cinzel ${showGolden ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : 'text-slate-100'}`}>
                {showGolden ? `★ ${name.replace('★ ', '')}` : name.replace('★ ', '')}
              </span>
            </div>

            {/* Giant Illustrated Artwork Window */}
            <div className="relative my-2 w-full flex-1 rounded-xl overflow-hidden border-2 border-[#5a4d7a] shadow-inner group bg-black/90 min-h-[170px] sm:min-h-[190px]">
              <CardMediaArt
                artUrl={artUrl}
                videoUrl={boardMinion?.videoUrl || card?.videoUrl}
                alt={name}
                hoverZoom={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
              
              <div className="absolute bottom-2 right-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-md bg-purple-950/90 text-purple-300 border-purple-500/70 backdrop-blur-md">
                {tribe}
              </div>
            </div>

            {/* Slate Description Plaque */}
            <div className="steel-text-plaque p-2 rounded-xl my-1 text-xs text-slate-200 leading-snug font-sans min-h-[56px] sm:min-h-[60px] flex flex-col justify-between">
              <div>
                {showGolden ? goldenDesc : description || (
                  <span className="italic text-slate-400">Standard combatant.</span>
                )}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-[9px]">
                {[1, 2, 3, 4, 5, 6].map((t) => (
                  <span key={t} className={t <= tier ? (showGolden ? 'text-yellow-400' : 'text-purple-400') : 'text-slate-700'}>
                    ◆
                  </span>
                ))}
              </div>
            </div>

            {/* Stat Medallions */}
            <div className="flex items-center justify-between mt-auto pt-1 z-20">
              <div className="stat-medallion-atk flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full font-black text-white font-cinzel text-base sm:text-lg">
                {attack}
              </div>
              <div className="text-[10px] sm:text-[11px] font-cinzel font-bold text-slate-400">
                {showGolden ? '★ ASTRAL FORGED' : 'STANDARD'}
              </div>
              <div className="stat-medallion-hp flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full font-black text-white font-cinzel text-base sm:text-lg">
                {health}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Full Lore, Keywords & Synergy Inspection */}
        <div className="w-full flex-1 flex flex-col justify-between h-full space-y-3 sm:space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1 gap-2">
              <h2 className="font-cinzel text-xl sm:text-2xl font-black text-yellow-300 truncate">
                {name.replace('★ ', '')}
              </h2>
              <button
                onClick={() => {
                  sound.playCardSnap();
                  setShowGolden(!showGolden);
                }}
                className={`text-xs font-cinzel font-bold px-3 py-1.5 rounded-xl border transition-[background-color,border-color,color] duration-150 active:scale-95 ${
                  showGolden
                    ? 'bg-yellow-950 border-yellow-400 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                    : 'bg-black/60 border-slate-700 text-slate-400 hover:border-yellow-500/50'
                }`}
              >
                {showGolden ? '✨ Golden Form (Active)' : 'Preview Golden Form ➔'}
              </button>
            </div>

            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-3">
              Tavern Tier {tier} • {tribe} Minion
            </div>

            {/* Flavor Lore Quotation */}
            <div className="bg-black/50 border-l-2 border-yellow-500/70 p-3 rounded-r-xl text-xs text-purple-200 italic font-serif mb-4 leading-relaxed">
              "{flavor}"
            </div>

            {/* Tribe Breakdown */}
            <div className="mb-4">
              <h4 className="text-[11px] font-cinzel font-bold text-yellow-400 uppercase tracking-wider mb-1">
                Tribe Affinity: {tribe}
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {TRIBE_LORE[tribe]}
              </p>
            </div>

            {/* Keywords Breakdown */}
            {keywords.length > 0 && (
              <div>
                <h4 className="text-[11px] font-cinzel font-bold text-yellow-400 uppercase tracking-wider mb-2">
                  Keywords & Combat Triggers
                </h4>
                <div className="space-y-2">
                  {keywords.map((kw) => (
                    <div
                      key={kw}
                      className="bg-[#140c26] border border-purple-900/60 rounded-xl p-2.5 flex items-start gap-2.5"
                    >
                      <span className="text-lg">{KEYWORD_EXPLANATIONS[kw]?.icon || '✨'}</span>
                      <div>
                        <div className="text-xs font-bold text-yellow-300">
                          {KEYWORD_EXPLANATIONS[kw]?.label || kw}
                        </div>
                        <div className="text-[11px] text-slate-300 font-sans">
                          {KEYWORD_EXPLANATIONS[kw]?.desc || 'Special battle trigger.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-sans italic border-t border-purple-950 pt-2 flex items-center justify-between">
            <span>Move cursor over card to inspect metallic 3D depth</span>
            <span>Click outside or ✕ to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
