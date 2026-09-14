import React, { useEffect, useRef } from 'react';
import { MinionCard } from '../types';
import { CardView } from './CardView';
import { sound } from '../audio/sound';
import { motion, isReducedMotion } from '../utils/motion';
import gsap from 'gsap';

interface DiscoverModalProps {
  options: MinionCard[];
  tier: number;
  onChoose: (index: number) => void;
  onInspect?: (card?: MinionCard) => void;
}

export const DiscoverModal: React.FC<DiscoverModalProps> = ({ options, tier, onChoose, onInspect }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const chestRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    motion.modalEnter(modalRef.current, 1.25);

    if (isReducedMotion()) return;
    const tl = gsap.timeline();

    // Chest anticipation shake -> burst
    if (chestRef.current) {
      tl.to(chestRef.current, {
        rotation: 5,
        x: -2,
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        ease: 'power1.inOut',
      })
      .to(chestRef.current, {
        scale: 1.16,
        duration: 0.12,
        ease: 'power2.out',
      })
      .to(chestRef.current, {
        scale: 1,
        rotation: 0,
        x: 0,
        duration: 0.28,
        ease: 'elastic.out(1, 0.4)',
      });
    }

    // Center-staggered card entrance (center card first)
    if (cardsContainerRef.current) {
      const cards = cardsContainerRef.current.children;
      gsap.fromTo(
        cards,
        { scale: 0.7, opacity: 0, y: 30 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: {
            each: 0.1,
            from: 'center',
          },
          ease: 'back.out(1.3)',
          delay: 0.35,
        }
      );
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center z-50 animate-fadeIn p-3 sm:p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="relative max-w-3xl w-full my-auto bg-gradient-to-b from-[#1c1236] via-[#100a21] to-[#080412] border-2 border-yellow-400 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-golden flex flex-col items-center text-center overflow-hidden"
      >
        {/* Placeholder Radial Glow Slot for Flow Video (discover_reveal_burst.mp4) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-3xl z-0">
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.22)_0%,rgba(168,85,247,0.12)_50%,transparent_72%)] animate-pulse" />
        </div>

        {/* Animated Reward Chest Cinematic */}
        <div
          ref={chestRef}
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-yellow-400/60 shadow-[0_0_25px_rgba(234,179,8,0.5)] mb-2 sm:mb-3 bg-black/80 z-10"
        >
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
        <div className="relative flex items-center gap-1.5 sm:gap-2 mb-1 z-10">
          <span className="text-xl sm:text-3xl animate-spin-slow">✨</span>
          <h2 className="font-cinzel text-lg sm:text-2xl font-black text-yellow-300 tracking-wider">
            ASTRAL FORGE SYNTHESIS
          </h2>
          <span className="text-xl sm:text-3xl animate-spin-slow">✨</span>
        </div>

        <p className="relative text-[11px] sm:text-xs text-purple-200 mb-4 sm:mb-6 font-sans z-10">
          You fused 3 identical units into an <span className="text-yellow-400 font-bold">Astral Forged Form</span>!
          Choose 1 bonus minion from <span className="text-cyan-300 font-bold">Tavern Tier {tier}</span>:
        </p>

        {/* 3 Choices with Center Stagger */}
        <div
          ref={cardsContainerRef}
          className="relative flex items-center justify-start sm:justify-center gap-3 sm:gap-6 my-2 sm:my-4 w-full overflow-x-auto pb-2 scrollbar-thin px-2 z-10"
        >
          {options.map((card, idx) => (
            <div
              key={idx}
              className="transform transition-[transform] duration-200 hover:scale-105 hover:-translate-y-1 cursor-pointer flex-shrink-0"
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
                className="mt-2 sm:mt-3 w-full py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-cinzel font-bold text-xs rounded-xl shadow-brass active:scale-95 transition-[background-color,transform] duration-150"
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
