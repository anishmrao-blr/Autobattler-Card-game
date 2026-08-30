// Fix TavernShop.tsx
import React from 'react';
import { PlayerState } from '../types';
import { CardView } from './CardView';
import { sound } from '../audio/sound';

interface TavernShopProps {
  player: PlayerState;
  onBuyMinion: (index: number) => void;
  onReroll: () => void;
  onToggleFreeze: () => void;
  onUpgradeTier: () => void;
}

export const TavernShop: React.FC<TavernShopProps> = ({
  player,
  onBuyMinion,
  onReroll,
  onToggleFreeze,
  onUpgradeTier,
}) => {
  const upgradeCost = Math.max(0, player.tierUpgradeCost - (player.hero.id === 'hero_baron' ? 1 : 0));
  const canAffordUpgrade = player.coins >= upgradeCost && player.tavernTier < 6;
  const canAffordReroll = player.coins >= 1;

  return (
    <div className="relative w-full bg-[#120a26]/90 border border-yellow-600/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-yellow-950/80 border border-yellow-500/50 px-3 py-1.5 rounded-xl shadow-inner">
            <span className="text-sm font-bold text-yellow-400 font-cinzel">TAVERN TIER {player.tavernTier}</span>
            <span className="text-xs text-yellow-300">{'★'.repeat(player.tavernTier)}</span>
          </div>

          {player.tavernTier < 6 ? (
            <button
              onClick={() => {
                if (canAffordUpgrade) {
                  sound.playTierUpgrade();
                  onUpgradeTier();
                }
              }}
              disabled={!canAffordUpgrade}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs font-cinzel transition-all duration-200 border
                ${canAffordUpgrade
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 border-yellow-300 text-black hover:scale-105 shadow-brass active:scale-95'
                  : 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'}
              `}
            >
              <span>⬆️ UPGRADE TIER</span>
              <span className="bg-black/40 px-1.5 py-0.5 rounded text-yellow-300">🪙 {upgradeCost}</span>
            </button>
          ) : (
            <div className="text-xs font-bold text-yellow-400 px-3 py-1 bg-yellow-950/40 rounded-xl border border-yellow-600/30">
              👑 MAX TIER REACHED
            </div>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-xs tracking-widest font-cinzel font-bold text-purple-300">
            THE ASTRAL ATRIUM
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playCardSnap();
              onToggleFreeze();
            }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs font-cinzel transition-all border
              ${player.isFrozen
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-aether scale-105 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'}
            `}
          >
            <span>❄️ {player.isFrozen ? 'FROZEN' : 'FREEZE'}</span>
            <span className="text-[10px] text-cyan-400 font-sans">(0🪙)</span>
          </button>

          <button
            onClick={() => {
              if (canAffordReroll) {
                sound.playCoinClink();
                onReroll();
              }
            }}
            disabled={!canAffordReroll}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs font-cinzel transition-all border
              ${canAffordReroll
                ? 'bg-gradient-to-r from-purple-800 to-indigo-700 border-purple-400 text-white hover:scale-105 shadow-void active:scale-95'
                : 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'}
            `}
          >
            <span>🎲 REROLL</span>
            <span className="bg-black/40 px-1.5 py-0.5 rounded text-yellow-300">🪙 1</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 min-h-[220px] p-2 bg-[#090514]/70 rounded-xl border border-purple-950/60 velvet-mat">
        {player.tavernSlots.length > 0 ? (
          player.tavernSlots.map((minion, idx) => {
            const cost = (player.hero.id === 'hero_chronos' && minion.tribe === 'AUTOMATA') ? 2 : 3;
            const canAfford = player.coins >= cost && player.hand.length < 10;
            return (
              <div key={idx} className="relative group">
                <CardView
                  card={minion}
                  showPrice={true}
                  price={cost}
                  disabled={!canAfford}
                  onClick={() => {
                    if (canAfford) {
                      sound.playCardSnap();
                      sound.playCoinClink();
                      onBuyMinion(idx);
                    }
                  }}
                />
                {!canAfford && player.hand.length >= 10 && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-[10px] font-bold text-red-400 text-center p-1 pointer-events-none">
                    Hand Full (10/10)
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-slate-500 font-cinzel text-sm">
            All minions recruited. Press Reroll to summon new recruits.
          </div>
        )}
      </div>
    </div>
  );
};
