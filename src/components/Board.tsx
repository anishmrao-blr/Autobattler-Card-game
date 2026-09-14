import React, { useRef, useState } from 'react';
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

// HTML5 drag-and-drop (draggable/dataTransfer) has no touch support in any
// mobile browser, so reordering is driven by Pointer Events instead - the
// same handlers cover mouse, touch, and pen.
const DRAG_THRESHOLD_PX = 6;

export const Board: React.FC<BoardProps> = ({
  minions,
  onMinionClick,
  onSellMinion,
  onReorder,
  onInspect,
  isCombatPhase = false,
}) => {
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragOrigin = useRef<{ index: number; x: number; y: number } | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const findIndexAtPoint = (x: number, y: number): number | null => {
    for (const [index, el] of cardRefs.current) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return index;
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (isCombatPhase || e.button > 0) return;
    dragOrigin.current = { index, x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragOrigin.current) return;
    const { index, x, y } = dragOrigin.current;

    if (draggingIndex === null) {
      const movedPx = Math.hypot(e.clientX - x, e.clientY - y);
      if (movedPx < DRAG_THRESHOLD_PX) return;
      setDraggingIndex(index);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }

    // Pointer capture keeps events targeted at the origin card, so hit-test
    // sibling positions manually rather than relying on pointerenter.
    const overIndex = findIndexAtPoint(e.clientX, e.clientY);
    setDropTargetIndex(overIndex);
  };

  const endDrag = () => {
    if (draggingIndex !== null && dropTargetIndex !== null && dropTargetIndex !== draggingIndex) {
      onReorder?.(draggingIndex, dropTargetIndex);
    }
    dragOrigin.current = null;
    setDraggingIndex(null);
    setDropTargetIndex(null);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    endDrag();
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
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {minions.length > 0 ? (
          minions.map((minion, idx) => (
            <div
              key={minion.instanceId}
              ref={(el) => {
                if (el) cardRefs.current.set(idx, el);
                else cardRefs.current.delete(idx);
              }}
              onPointerDown={(e) => handlePointerDown(e, idx)}
              style={{ touchAction: isCombatPhase ? 'auto' : 'none' }}
              className={`relative group snap-center transition-transform duration-150 ${
                draggingIndex === idx ? 'opacity-60 scale-95 z-30' : 'active:scale-95'
              } ${
                dropTargetIndex === idx && draggingIndex !== null && draggingIndex !== idx
                  ? 'ring-4 ring-yellow-400 rounded-2xl'
                  : ''
              }`}
            >
              <CardView
                boardMinion={minion}
                size="md"
                onClick={() => draggingIndex === null && onMinionClick?.(idx)}
                onInspect={onInspect}
              />

              {!isCombatPhase && onSellMinion && (
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
