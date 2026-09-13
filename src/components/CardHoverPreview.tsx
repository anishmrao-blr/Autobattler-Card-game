import React from 'react';
import { MinionCard, BoardMinion, Tribe } from '../types';
import { TRIBE_ART_MAP } from '../engine/cards';
import { KEYWORD_EXPLANATIONS, TRIBE_LORE } from './CardInspectorModal';
import { CardMediaArt } from './CardMediaArt';

interface CardHoverPreviewProps {
  card?: MinionCard;
  boardMinion?: BoardMinion;
  position: { x: number; y: number; width: number; height: number };
}

const TRIBE_COLORS: Record<Tribe, { text: string; border: string; bg: string }> = {
  AUTOMATA: { text: 'text-amber-300', border: 'border-amber-500/70', bg: 'bg-amber-950/80' },
  VOIDBORN: { text: 'text-purple-300', border: 'border-purple-500/70', bg: 'bg-purple-950/80' },
  ALCHEMIST: { text: 'text-emerald-300', border: 'border-emerald-500/70', bg: 'bg-emerald-950/80' },
  CELESTIAL: { text: 'text-cyan-300', border: 'border-cyan-500/70', bg: 'bg-cyan-950/80' },
  BEAST: { text: 'text-rose-300', border: 'border-rose-500/70', bg: 'bg-rose-950/80' },
  PIRATE: { text: 'text-yellow-300', border: 'border-yellow-500/70', bg: 'bg-yellow-950/80' },
  NEUTRAL: { text: 'text-slate-300', border: 'border-slate-500/70', bg: 'bg-slate-900/80' },
};

export const CardHoverPreview: React.FC<CardHoverPreviewProps> = ({
  card,
  boardMinion,
  position,
}) => {
  const name = boardMinion?.name || card?.name || 'Unknown';
  const tier = boardMinion?.tier || card?.tier || 1;
  const tribe = boardMinion?.tribe || card?.tribe || 'NEUTRAL';
  const attack = boardMinion ? boardMinion.attack : (card?.attack || 0);
  const health = boardMinion ? boardMinion.health : (card?.health || 0);
  const isGolden = boardMinion?.isGolden || card?.name.startsWith('★') || false;
  const keywords = boardMinion?.keywords || card?.keywords || [];
  const description = card?.description || '';
  const goldenDesc = card?.goldenDescription || description;
  const flavor = card?.flavor;
  const artUrl = boardMinion?.artUrl || card?.artUrl || TRIBE_ART_MAP[tribe] || '/assets/art/hero_chronos.jpg';
  const tribeInfo = TRIBE_COLORS[tribe];

  // Smart horizontal & vertical positioning so the preview never covers the hovered card
  const previewWidth = 320;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 720;

  const showOnRight = position.x + position.width + previewWidth + 24 <= windowWidth;
  const leftPos = showOnRight
    ? position.x + position.width + 12
    : Math.max(12, position.x - previewWidth - 12);

  const topPos = Math.max(
    16,
    Math.min(position.y - 40, windowHeight - 460)
  );

  return (
    <div
      className="fixed z-[9999] pointer-events-none animate-fadeIn"
      style={{
        left: `${leftPos}px`,
        top: `${topPos}px`,
        width: `${previewWidth}px`,
      }}
    >
      <div className={`relative bg-[#0e0a1e]/98 border-2 rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_25px_rgba(200,155,60,0.35)] backdrop-blur-xl ${
        isGolden ? 'border-yellow-400' : 'border-[#62538c]'
      }`}>
        {/* Card Artwork Header */}
        <div className="relative h-44 w-full overflow-hidden border-b border-yellow-500/30">
          <CardMediaArt
            artUrl={artUrl}
            videoUrl={boardMinion?.videoUrl || card?.videoUrl}
            alt={name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a1e] via-[#0e0a1e]/30 to-transparent pointer-events-none" />

          {/* Top Bar inside Art */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-md backdrop-blur-md ${tribeInfo.bg} ${tribeInfo.text} ${tribeInfo.border}`}>
              {tribe}
            </span>
            <div className="bg-black/75 border border-yellow-500/50 px-2 py-0.5 rounded-full text-xs font-mono font-bold text-yellow-300">
              TIER {tier} {'★'.repeat(tier)}
            </div>
          </div>

          {/* Card Title & Stats Badges */}
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <div>
              <h3 className={`font-cinzel font-black text-base drop-shadow-md ${
                isGolden ? 'text-yellow-300' : 'text-slate-100'
              }`}>
                {name}
              </h3>
              {isGolden && (
                <span className="text-[10px] font-cinzel font-bold text-yellow-400 uppercase tracking-wider">
                  ★ Golden Astral Forged (Doubled)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border border-yellow-400 flex items-center justify-center font-black text-sm text-yellow-200 shadow-md">
                {attack}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-700 to-rose-950 border border-red-400 flex items-center justify-center font-black text-sm text-white shadow-md">
                {health}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 space-y-2.5">
          {/* Main Ability Text */}
          <div className="bg-[#17112c]/90 border border-purple-900/50 rounded-xl p-2.5 shadow-inner">
            <span className="text-[10px] uppercase font-cinzel font-bold text-purple-300 tracking-wider block mb-1">
              Combat Mechanics
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {isGolden ? goldenDesc : description || 'Standard combatant without special triggers.'}
            </p>
          </div>

          {/* Inline Keyword Explanations (Sourced from KEYWORD_EXPLANATIONS) */}
          {keywords.length > 0 && (
            <div className="space-y-1.5">
              {keywords.map(kw => {
                const kwInfo = KEYWORD_EXPLANATIONS[kw];
                if (!kwInfo) return null;
                return (
                  <div
                    key={kw}
                    className="flex items-start gap-2 bg-[#120c24] border border-slate-800 rounded-lg p-2 text-xs"
                  >
                    <span className="text-sm">{kwInfo.icon}</span>
                    <div>
                      <strong className="text-yellow-300 font-cinzel font-bold mr-1">
                        {kwInfo.label}:
                      </strong>
                      <span className="text-slate-300 font-sans text-[11px] leading-tight">
                        {kwInfo.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Flavor Text / Tribe Lore */}
          <div className="text-[11px] text-slate-400 italic border-t border-purple-950 pt-2 font-sans">
            {flavor ? `"${flavor}"` : TRIBE_LORE[tribe]}
          </div>

          <div className="text-[10px] text-amber-400/80 font-cinzel text-center">
            Right-click or click 🔍 to inspect full 3D card
          </div>
        </div>
      </div>
    </div>
  );
};
