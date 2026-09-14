import React from 'react';
import { MinionCard, PlayerState } from '../types';
import { CardView } from './CardView';
import { CommanderHeroStation } from './CommanderHeroStation';
import { sound } from '../audio/sound';
import { useCardReorder } from '../hooks/useCardReorder';

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
    onReorder: onReorderHand,
    disabled: false,
  });

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
        <div className="flex items-center justify-between px-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-xs font-bold text-yellow-400">
              🃏 HAND TRAY
            </span>
            <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-300 font-bold">
              {hand.length} / 10
            </span>
            {isBoardFull && (
              <span className="text-xs text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 animate-pulse">
                Battlefield Full (7/7)
              </span>
            )}
          </div>
          <div className="hidden sm:block text-[11px] text-slate-400 font-sans flex-shrink-0">
            <span className="text-purple-300 font-bold">Tap to deploy • Drag to reorder</span>
          </div>
        </div>

        {/* Hand Cards Horizontal Scroll */}
        <div
          className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth py-1 px-2"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
          }}
        >
          {hand.length > 0 ? (
            hand.map((card, idx) => {
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
                    touchAction: 'none',
                  };

              return (
                <div
                  key={`${card.id}-${idx}`}
                  ref={(el) => registerCardRef(idx, el)}
                  onPointerDown={(e) => handlePointerDown(e, idx)}
                  style={itemStyle}
                  className={`flex-shrink-0 snap-center select-none relative ${
                    isSelfDragging
                      ? 'ring-4 ring-yellow-400 rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(234,179,8,0.6)] cursor-grabbing z-50'
                      : 'cursor-grab hover:-translate-y-3 transition-[transform] duration-150'
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
