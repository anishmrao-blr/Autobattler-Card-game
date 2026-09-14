import React, { useState } from 'react';
import { MinionCard, BoardMinion, PlayerState } from '../types';
import { CardView } from './CardView';
import { sound } from '../audio/sound';
import { CombatOdds } from '../engine/combat';

interface TavernShopProps {
  player: PlayerState;
  forecastOdds?: CombatOdds;
  opponentName?: string;
  onBuyMinion: (index: number) => void;
  onReroll: () => void;
  onToggleFreeze: () => void;
  onUpgradeTier: () => void;
  onInspect?: (card?: MinionCard, boardMinion?: BoardMinion) => void;
}

export const TavernShop: React.FC<TavernShopProps> = ({
  player,
  forecastOdds,
  opponentName,
  onBuyMinion,
  onReroll,
  onToggleFreeze,
  onUpgradeTier,
  onInspect,
}) => {
  const [isRerolling, setIsRerolling] = useState(false);
  const upgradeCost = Math.max(0, player.tierUpgradeCost - (player.hero.id === 'hero_baron' ? 1 : 0));
  const canAffordUpgrade = player.coins >= upgradeCost && player.tavernTier < 6;
  const canAffordReroll = player.coins >= 1;

  const handleReroll = () => {
    if (!canAffordReroll) return;
    setIsRerolling(true);
    sound.playGearRattle();
    sound.playSteamHiss();
    sound.playCoinClink();
    onReroll();
    setTimeout(() => setIsRerolling(false), 400);
  };

  const handleToggleFreeze = () => {
    sound.playFreezeLock();
    onToggleFreeze();
  };

  return (
    <div className="relative w-full bg-[#120a26]/90 border border-yellow-600/40 rounded-2xl p-2 sm:p-3 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 mb-2 px-1 sm:px-2">
        {/* Tier & Upgrade */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-yellow-950/80 border border-yellow-500/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-inner">
            <span className="text-xs sm:text-sm font-bold text-yellow-400 font-cinzel">TIER {player.tavernTier}</span>
            <span className="text-[10px] sm:text-xs text-yellow-300">{'★'.repeat(player.tavernTier)}</span>
          </div>

          {player.tavernTier < 6 ? (
            <button
              onClick={() => {
                if (canAffordUpgrade) {
                  sound.playSteamHiss();
                  sound.playTierUpgrade();
                  onUpgradeTier();
                }
              }}
              disabled={!canAffordUpgrade}
              className={`
                flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs font-cinzel transition-[transform,colors] duration-150 ease-out border
                ${canAffordUpgrade
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 border-yellow-300 text-black hover:scale-105 shadow-brass active:scale-95'
                  : 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'}
              `}
            >
              <span>⬆️ <span className="hidden xs:inline">UPGRADE</span></span>
              <span className="bg-black/40 px-1 py-0.5 rounded text-yellow-300">🪙 {upgradeCost}</span>
            </button>
          ) : (
            <div className="text-xs font-bold text-yellow-400 px-2 py-1 bg-yellow-950/40 rounded-xl border border-yellow-600/30">
              👑 MAX
            </div>
          )}
        </div>

        <div className="text-center hidden md:block">
          <h2 className="text-xs tracking-widest font-cinzel font-bold text-purple-300">
            THE ASTRAL ATRIUM
          </h2>
        </div>

        {/* Freeze & Reroll Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Mechanical Freeze Padlock Button */}
          <button
            onClick={handleToggleFreeze}
            className={`
              flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs font-cinzel transition-[transform,colors] duration-150 ease-out border
              ${player.isFrozen
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-aether scale-105 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 hover:scale-105 active:scale-95'}
            `}
          >
            <span className="text-sm">{player.isFrozen ? '🔒' : '🔓'}</span>
            <span className="hidden xs:inline">{player.isFrozen ? 'FROZEN' : 'FREEZE'}</span>
            <span className="text-[10px] text-cyan-400 font-sans hidden sm:inline">(0🪙)</span>
          </button>

          {/* Mechanical Steam Reroll Lever */}
          <button
            onClick={handleReroll}
            disabled={!canAffordReroll}
            className={`
              relative overflow-hidden flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs font-cinzel transition-[transform,colors] duration-150 ease-out border
              ${canAffordReroll
                ? 'bg-gradient-to-r from-purple-800 to-indigo-700 border-purple-400 text-white hover:scale-105 shadow-void active:scale-95'
                : 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'}
            `}
          >
            <span className={`inline-block text-sm transition-transform duration-300 ${isRerolling ? 'rotate-180 scale-125' : ''}`}>
              ⚙️
            </span>
            <span className="hidden xs:inline">REROLL</span>
            <span className="bg-black/40 px-1 py-0.5 rounded text-yellow-300">🪙 1</span>

            {isRerolling && (
              <span className="absolute inset-0 bg-white/20 animate-ping pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      {/* HearthSim Combat Odds Predictor - Dedicated Slim Strip */}
      {forecastOdds && (
        <div
          data-testid="combat-forecast-badge"
          className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 py-0.5 mb-2 rounded-lg bg-slate-950/70 border border-purple-500/30 text-[10px] sm:text-xs font-cinzel shadow-inner backdrop-blur-sm w-full"
          title={opponentName ? `Headless Monte Carlo forecast (100 simulations) vs ${opponentName}` : 'Headless Monte Carlo forecast'}
        >
          <span className="text-purple-400 font-bold flex items-center gap-1">
            <span>🔮</span>
            <span className="hidden sm:inline">Forecast{opponentName ? ` vs ${opponentName}` : ''}:</span>
            <span className="sm:hidden">{opponentName ? `${opponentName.split(' ')[0]}:` : 'Odds:'}</span>
          </span>
          <span className="font-bold text-emerald-400" title="Win Rate">{forecastOdds.winRate}% W</span>
          <span className="text-slate-600">•</span>
          <span className="font-bold text-amber-300" title="Tie Rate">{forecastOdds.tieRate}% T</span>
          <span className="text-slate-600">•</span>
          <span className="font-bold text-rose-400" title="Loss Rate">{forecastOdds.lossRate}% L</span>
        </div>
      )}

      {/* Shop Board */}
      <div
        className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3 min-h-[240px] p-2.5 sm:p-4 rounded-2xl border-2 border-[#524775]/60 shadow-[0_12px_32px_rgba(0,0,0,0.9)] relative overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{
          backgroundImage: 'radial-gradient(rgba(18, 12, 38, 0.75), rgba(7, 4, 16, 0.94)), url(/assets/art/runic_table.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
        }}
      >
        {player.tavernSlots.length > 0 ? (
          player.tavernSlots.map((minion, idx) => {
            const cost = (player.hero.id === 'hero_chronos' && minion.tribe === 'AUTOMATA') ? 2 : 3;
            const canAfford = player.coins >= cost && player.hand.length < 10;
            return (
              <div key={idx} data-testid="shop-card" className="relative group snap-center">
                <CardView
                  card={minion}
                  showPrice={true}
                  price={cost}
                  isFrozen={player.isFrozen}
                  disabled={!canAfford}
                  onInspect={onInspect}
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
            All minions recruited. Pull Reroll lever to summon new recruits.
          </div>
        )}
      </div>
    </div>
  );
};
