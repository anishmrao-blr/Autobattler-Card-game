import React from 'react';
import { MinionCard } from '../types';
import { CardView } from './CardView';
import { sound } from '../audio/sound';

interface DiscoverModalProps {
  options: MinionCard[];
  tier: number;
  onChoose: (index: number) => void;
  onInspect?: (card?: MinionCard) => void;
}

export const DiscoverModal: React.FC<DiscoverModalProps> = ({ options, tier, onChoose, onInspect }) => {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center z-50 animate-fadeIn p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-3xl w-full my-auto bg-gradient-to-b from-[#1c1236] via-[#100a21] to-[#080412] border-2 border-yellow-400 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-golden flex flex-col items-center text-center">
        {/* Animated Reward Chest Cinematic */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-yellow-400/60 shadow-[0_0_25px_rgba(234,179,8,0.5)] mb-2 sm:mb-3 bg-black/80">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            src="/assets/video/reward_chest.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Glow Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
          <span className="text-xl sm:text-3xl animate-spin-slow">✨</span>
          <h2 className="font-cinzel text-lg sm:text-2xl font-black text-yellow-300 tracking-wider">
            ASTRAL FORGE SYNTHESIS
          </h2>
          <span className="text-xl sm:text-3xl animate-spin-slow">✨</span>
        </div>

        <p className="text-[11px] sm:text-xs text-purple-200 mb-4 sm:mb-6 font-sans">
          You fused 3 identical units into an <span className="text-yellow-400 font-bold">Astral Forged Form</span>!
          Choose 1 bonus minion from <span className="text-cyan-300 font-bold">Tavern Tier {tier}</span>:
        </p>

        {/* 3 Choices */}
        <div className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 my-2 sm:my-4 w-full overflow-x-auto pb-2 scrollbar-thin px-2">
          {options.map((card, idx) => (
            <div
              key={idx}
              className="transform transition-all duration-200 hover:scale-105 hover:-translate-y-1 cursor-pointer flex-shrink-0"
            >
              <CardView
                card={card}
                size="sm"
                onInspect={onInspect}
                onClick={() => {
                  sound.playCardSnap();
                  sound.playVictory();
                  onChoose(idx);
                }}
              />
              <button
                onClick={() => {
                  sound.playCardSnap();
                  sound.playVictory();
                  onChoose(idx);
                }}
                className="mt-2 sm:mt-3 w-full py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-cinzel font-bold text-xs rounded-xl shadow-brass active:scale-95"
              >
                CHOOSE
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
