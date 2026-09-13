import React from 'react';
import { BoardMinion, MinionCard } from '../types';
import { CardView } from './CardView';

interface BoardProps {
  minions: BoardMinion[];
  onMinionClick?: (index: number) => void;
  onSellMinion?: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onInspect?: (card?: MinionCard, boardMinion?: BoardMinion) => void;
  isCombatPhase?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  minions,
  onMinionClick,
  onSellMinion,
  onReorder,
  onInspect,
  isCombatPhase = false,
}) => {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== targetIndex && onReorder) {
      onReorder(fromIndex, targetIndex);
    }
  };

  return (
    <div className="relative w-full bg-[#100722]/90 border border-[#524775]/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="font-cinzel text-xs font-bold text-yellow-400">
            WARBAND FORMATION
          </span>
          <span className="text-xs text-slate-400 font-bold">
            ({minions.length} / 7 Units)
          </span>
        </div>

        {!isCombatPhase && (
          <div className="text-[11px] text-purple-300 font-sans italic">
            Tip: Drag cards to position attack order (leftmost strikes first)
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-center gap-3 min-h-[190px] p-4 rounded-2xl border-2 border-[#524775]/60 shadow-[0_12px_32px_rgba(0,0,0,0.9)] relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(rgba(18, 12, 38, 0.75), rgba(7, 4, 16, 0.94)), url(/assets/art/runic_table.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {minions.length > 0 ? (
          minions.map((minion, idx) => (
            <div
              key={minion.instanceId}
              draggable={!isCombatPhase}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, idx)}
              className="relative group transition-transform duration-150 active:scale-95"
            >
              <CardView
                boardMinion={minion}
                size="md"
                onClick={() => onMinionClick?.(idx)}
                onInspect={onInspect}
              />

              {!isCombatPhase && onSellMinion && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSellMinion(idx);
                  }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-950/95 hover:bg-red-800 text-red-300 border border-red-500/60 rounded-full px-2.5 py-0.5 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30"
                >
                  Sell (1🪙)
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 py-8 font-cinzel text-xs">
            <span className="text-2xl mb-1">⚔️</span>
            <span>Your warband is empty. Recruit minions from the Astral Atrium above.</span>
          </div>
        )}
      </div>
    </div>
  );
};
