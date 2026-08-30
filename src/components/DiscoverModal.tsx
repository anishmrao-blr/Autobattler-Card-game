import React from 'react';
import { MinionCard } from '../types';
import { CardView } from './CardView';
import { sound } from '../audio/sound';

interface DiscoverModalProps {
  options: MinionCard[];
  tier: number;
  onChoose: (index: number) => void;
}

export const DiscoverModal: React.FC<DiscoverModalProps> = ({ options, tier, onChoose }) => {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn p-4">
      <div className="max-w-3xl w-full bg-gradient-to-b from-[#1c1236] via-[#100a21] to-[#080412] border-2 border-yellow-400 rounded-3xl p-6 shadow-golden flex flex-col items-center text-center">
        {/* Glow Title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl animate-spin-slow">✨</span>
          <h2 className="font-cinzel text-2xl font-black text-yellow-300 tracking-wider">
            ASTRAL FORGE SYNTHESIS
          </h2>
          <span className="text-3xl animate-spin-slow">✨</span>
        </div>

        <p className="text-xs text-purple-200 mb-6 font-sans">
          You fused 3 identical units into an <span className="text-yellow-400 font-bold">Astral Forged Form</span>!
          Choose 1 bonus minion from <span className="text-cyan-300 font-bold">Tavern Tier {tier}</span>:
        </p>

        {/* 3 Choices */}
        <div className="flex items-center justify-center gap-6 my-4">
          {options.map((card, idx) => (
            <div
              key={idx}
              onClick={() => {
                sound.playCardSnap();
                sound.playVictory();
                onChoose(idx);
              }}
              className="transform transition-all duration-200 hover:scale-110 hover:-translate-y-2 cursor-pointer"
            >
              <CardView card={card} size="lg" />
              <button className="mt-3 w-full py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-cinzel font-bold text-xs rounded-xl shadow-brass">
                CHOOSE
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
