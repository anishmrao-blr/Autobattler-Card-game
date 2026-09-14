import React from 'react';
import { BoardMinion, MinionCard } from '../types';
import { CardView } from './CardView';
import { useCardReorder } from '../hooks/useCardReorder';

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
  const {
    registerCardRef,
    handlePointerDown,
    draggingIndex,
    dragOffset,
    tilt,
    getNeighborShiftX,
    isDragging,
  } = useCardReorder({
    itemCount: minions.length,
    onReorder,
    disabled: isCombatPhase,
  });

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

        {!isCombatPhase && minions.length > 1 && (
          <div className="text-[11px] text-purple-300 font-sans italic">
            Tip: Press and drag cards to reorder (leftmost strikes first)
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3 min-h-[190px] p-2.5 sm:p-4 rounded-2xl border-2 border-[#524775]/60 shadow-[0_12px_32px_rgba(0,0,0,0.9)] relative overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{
          backgroundImage: 'radial-gradient(rgba(18, 12, 38, 0.75), rgba(7, 4, 16, 0.94)), url(/assets/art/runic_table.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
        }}
      >
        {minions.length > 0 ? (
          minions.map((minion, idx) => {
            const isSelfDragging = draggingIndex === idx;
            const shiftX = getNeighborShiftX(idx);

            const itemStyle: React.CSSProperties = isSelfDragging
              ? {
                  transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.08) rotate(${tilt}deg)`,
                  zIndex: 50,
                  touchAction: 'none',
                }
              : {
                  transform: shiftX ? `translate3d(${shiftX}px, 0, 0)` : undefined,
                  transition: 'transform 200ms cubic-bezier(0.2, 0, 0.2, 1)',
                  touchAction: isCombatPhase ? 'auto' : 'none',
                };

            return (
              <div
                key={minion.instanceId}
                ref={(el) => registerCardRef(idx, el)}
                onPointerDown={(e) => handlePointerDown(e, idx)}
                style={itemStyle}
                className={`relative group snap-center select-none ${
                  isSelfDragging
                    ? 'ring-4 ring-yellow-400 rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(234,179,8,0.6)] cursor-grabbing'
                    : isCombatPhase
                    ? ''
                    : 'cursor-grab hover:-translate-y-1 transition-[transform,box-shadow]'
                }`}
              >
                <CardView
                  boardMinion={minion}
                  size="md"
                  onClick={() => !isDragging && onMinionClick?.(idx)}
                  onInspect={onInspect}
                />

                {!isCombatPhase && !isSelfDragging && onSellMinion && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSellMinion(idx);
                    }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-950/95 hover:bg-red-800 text-red-300 border border-red-500/60 rounded-full px-2.5 py-0.5 text-[9px] font-bold opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity shadow-lg z-30"
                  >
                    Sell (1🪙)
                  </button>
                )}
              </div>
            );
          })
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
