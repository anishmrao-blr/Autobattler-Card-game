import React, { useRef, useCallback } from 'react';
import { MinionCard, PlayerState } from '../types';
import { CardView } from './CardView';
import { CommanderHeroStation } from './CommanderHeroStation';
import { sound } from '../audio/sound';
import { useCardReorder } from '../hooks/useCardReorder';
import { useCardFan } from '../hooks/useCardFan';

interface HandTrayProps {
  player: PlayerState;
  hand: MinionCard[];
  boardCount: number;
  onPlayCard: (index: number) => void;
  onReorderHand?: (fromIndex: number, toIndex: number) => void;
  onUseHeroPower: () => void;
  onInspectHero?: () => void;
  onInspect?: (card?: MinionCard) => void;
}

let handCardIdCounter = 0;
const cardInstanceIdMap = new WeakMap<MinionCard, string>();

export function getHandCardInstanceId(card: MinionCard): string {
  let id = cardInstanceIdMap.get(card);
  if (!id) {
    id = `${card.id}_hand_${++handCardIdCounter}`;
    cardInstanceIdMap.set(card, id);
  }
  return id;
}

export const HandTray: React.FC<HandTrayProps> = ({
  player,
  hand,
  boardCount,
  onPlayCard,
  onReorderHand,
  onUseHeroPower,
  onInspectHero,
  onInspect,
}) => {
  const isBoardFull = boardCount >= 7;

  const handRef = useRef(hand);
  handRef.current = hand;

  const handleInternalReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const updated = [...handRef.current];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      handRef.current = updated;
      onReorderHand?.(fromIndex, toIndex);
    },
    [onReorderHand]
  );

  const resolveCurrentIndex = useCallback((id: string | number) => {
    return handRef.current.findIndex((c: MinionCard) => getHandCardInstanceId(c) === id);
  }, []);

  const {
    registerCardRef,
    handlePointerDown,
    draggingIndex,
    dragOffset,
    tilt,
    getNeighborShiftX,
    isDragging,
  } = useCardReorder({
    itemCount: hand.length,
    onReorder: handleInternalReorder,
    disabled: false,
    resolveCurrentIndex,
  });

  const { setHoveredIndex, getCardFanStyle } = useCardFan(hand.length);

  return (
    <div className="w-full bg-[#0a0618]/95 border-t-2 border-[#3b2a59] px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 shadow-2xl backdrop-blur-md z-30">
      {/* 1. Bottom-Left Prominent Commander Hero Station */}
      <CommanderHeroStation
        player={player}
        onUseHeroPower={onUseHeroPower}
        onInspectHero={onInspectHero}
      />

      {/* 2. Hand Tray Cards Section */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center justify-between px-1 sm:px-2 mb-1 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="font-cinzel text-xs font-bold text-yellow-400">
              🃏 HAND TRAY
            </span>
            <span className="text-xs bg-slate-900 px-1.5 sm:px-2 py-0.5 rounded border border-slate-700 text-slate-300 font-bold">
              {hand.length}/10
            </span>
            {isBoardFull && (
              <span className="text-[10px] sm:text-xs text-rose-400 font-bold bg-rose-950/80 px-1.5 sm:px-2 py-0.5 rounded border border-rose-800 animate-pulse">
                Full
              </span>
            )}
          </div>
          <div className="hidden sm:block text-[11px] text-slate-400 font-sans flex-shrink-0">
            <span className="text-purple-300 font-bold">Tap to deploy • Drag to reorder</span>
          </div>
        </div>

        {/* Hand Cards Horizontal Scroll with Tabletop Fan Arc Headroom */}
        <div
          className="flex items-end gap-1 sm:gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth pt-7 pb-2 px-2 min-h-[200px]"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
          }}
        >
          {hand.length > 0 ? (
            hand.map((card, idx) => {
              const isSelfDragging = draggingIndex === idx;
              const shiftX = getNeighborShiftX(idx);
              const fanStyle = getCardFanStyle(idx, isSelfDragging);
              const stableId = getHandCardInstanceId(card);

              const itemStyle: React.CSSProperties = isSelfDragging
                ? {
                    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.08) rotate(${tilt}deg)`,
                    zIndex: 50,
                    touchAction: 'none',
                  }
                : {
                    transform: shiftX ? `translate3d(${shiftX}px, 0, 0)` : fanStyle.transform,
                    transformOrigin: fanStyle.transformOrigin,
                    zIndex: fanStyle.zIndex,
                    transition: 'transform 200ms cubic-bezier(0.2, 0, 0.2, 1)',
                    touchAction: 'none',
                  };

              return (
                <div
                  key={stableId}
                  data-testid="hand-card"
                  ref={(el) => { registerCardRef(idx, el); }}
                  onPointerDown={(e) => handlePointerDown(e, idx, stableId)}
                  onMouseEnter={() => !isDragging && setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onDragStart={(e) => e.preventDefault()}
                  style={itemStyle}
                  className={`flex-shrink-0 snap-center select-none relative ${
                    isSelfDragging
                      ? 'ring-4 ring-yellow-400 rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(234,179,8,0.6)] cursor-grabbing z-50'
                      : 'cursor-grab'
                  }`}
                >
                  <CardView
                    card={card}
                    size="sm"
                    disabled={isBoardFull}
                    onInspect={onInspect}
                    onClick={() => {
                      if (!isDragging && !isBoardFull) {
                        sound.playCardSnap();
                        onPlayCard(idx);
                      }
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-slate-400 font-cinzel text-xs py-5 px-4 text-center w-full bg-black/30 rounded-xl border border-slate-900/60">
              Hand empty. Recruit minions from the Astral Atrium above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
