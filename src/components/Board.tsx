import React, { useState } from 'react';
import { BoardMinion } from '../types';
import { CardView } from './CardView';
import { sound } from '../audio/sound';

interface BoardProps {
  minions: BoardMinion[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSellMinion: (index: number) => void;
  isCombat?: boolean;
  attackingId?: string;
  hitTargetId?: string;
  damageMap?: Record<string, number>;
  brokenBarrierId?: string;
}

export const Board: React.FC<BoardProps> = ({
  minions,
  onReorder,
  onSellMinion,
  isCombat = false,
  attackingId,
  hitTargetId,
  damageMap = {},
  brokenBarrierId,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleMinionClick = (index: number) => {
    if (isCombat) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
      sound.playCardSnap();
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      // Swap positions
      onReorder(selectedIndex, index);
      setSelectedIndex(null);
      sound.playCardSnap();
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isCombat) return;
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorder(draggedIndex, targetIndex);
      sound.playCardSnap();
    }
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative w-full bg-[#0c081d]/85 border border-[#3b2a59] rounded-2xl p-3 shadow-2xl backdrop-blur-md">
      {/* Board Header / Sell Controls */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="font-cinzel text-xs font-bold text-slate-300">
            {isCombat ? '⚔️ ACTIVE COMBAT FORMATION' : '🛡️ BATTLEFIELD (ATTACKS LEFT TO RIGHT)'}
          </span>
          <span className="text-xs text-purple-400 font-bold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
            {minions.length} / 7 Minions
          </span>
        </div>

        {/* Sell Button if minion selected */}
        {!isCombat && selectedIndex !== null && minions[selectedIndex] && (
          <div className="flex items-center gap-2 animate-bounce">
            <span className="text-xs text-yellow-300 font-bold">
              Selected: {minions[selectedIndex].name}
            </span>
            <button
              onClick={() => {
                sound.playCoinClink();
                onSellMinion(selectedIndex);
                setSelectedIndex(null);
              }}
              className="flex items-center gap-1 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 border border-red-400 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-lg transition-all"
            >
              <span>💰 SELL FOR 🪙 {minions[selectedIndex].cardId === 'pirate_swab' ? (minions[selectedIndex].isGolden ? 4 : 2) : 1}</span>
            </button>
            <button
              onClick={() => setSelectedIndex(null)}
              className="text-xs text-slate-400 hover:text-white px-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* 7 Minion Slots */}
      <div className="flex items-center justify-center gap-2.5 min-h-[220px] p-2 bg-[#06030e]/80 rounded-xl border border-yellow-900/30 velvet-mat">
        {Array.from({ length: Math.max(7, minions.length) }).map((_, idx) => {
          const minion = minions[idx];
          return (
            <div
              key={minion?.instanceId || `empty_${idx}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              className={`
                relative flex flex-col items-center justify-center rounded-xl transition-all duration-150
                ${minion ? '' : 'w-36 h-52 border-2 border-dashed border-purple-900/40 bg-purple-950/10'}
              `}
            >
              {minion ? (
                <div
                  draggable={!isCombat}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  className="relative cursor-grab active:cursor-grabbing"
                >
                  {/* Attack Order Indicator Number */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-950 border border-yellow-500 text-yellow-300 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md z-30">
                    {idx + 1}
                  </div>

                  <CardView
                    boardMinion={minion}
                    isSelected={selectedIndex === idx}
                    isAttacking={attackingId === minion.instanceId}
                    isHit={hitTargetId === minion.instanceId}
                    damageReceived={damageMap[minion.instanceId]}
                    barrierBroken={brokenBarrierId === minion.instanceId}
                    onClick={() => handleMinionClick(idx)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 text-xs font-cinzel">
                  <span className="text-xl opacity-30">✦</span>
                  <span className="text-[10px] text-purple-400/40 font-bold mt-1">Slot {idx + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
