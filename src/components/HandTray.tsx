import React from 'react';
import { MinionCard } from '../types';
import { CardView } from './CardView';
import { sound } from '../audio/sound';

interface HandTrayProps {
  hand: MinionCard[];
  boardCount: number;
  onPlayCard: (index: number) => void;
}

export const HandTray: React.FC<HandTrayProps> = ({ hand, boardCount, onPlayCard }) => {
  const isBoardFull = boardCount >= 7;

  return (
    <div className="w-full bg-[#0a0618]/95 border-t border-[#3b2a59] px-4 py-2 flex items-center justify-between shadow-2xl backdrop-blur-md">
      {/* Hand Label & Count */}
      <div className="flex items-center gap-2">
        <span className="font-cinzel text-xs font-bold text-yellow-400">
          🃏 HAND TRAY
        </span>
        <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-300 font-bold">
          {hand.length} / 10
        </span>
        {isBoardFull && (
          <span className="text-xs text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
            Battlefield Full (7/7)
          </span>
        )}
      </div>

      {/* Cards in Hand */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-4 max-w-[80vw]">
        {hand.length > 0 ? (
          hand.map((card, idx) => (
            <div
              key={idx}
              className="transform transition-transform hover:-translate-y-4 hover:z-20 cursor-pointer"
            >
              <CardView
                card={card}
                size="sm"
                disabled={isBoardFull}
                onClick={() => {
                  if (!isBoardFull) {
                    sound.playCardSnap();
                    onPlayCard(idx);
                  }
                }}
              />
            </div>
          ))
        ) : (
          <div className="text-slate-500 font-cinzel text-xs py-4">
            Hand empty. Recruit minions from the Astral Atrium above.
          </div>
        )}
      </div>

      {/* Deploy Tip */}
      <div className="text-right text-[11px] text-slate-400 font-sans hidden md:block">
        <p className="text-purple-300 font-bold">Click card to deploy</p>
        <p className="text-slate-500">Max 7 minions on board</p>
      </div>
    </div>
  );
};
