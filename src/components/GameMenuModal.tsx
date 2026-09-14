import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../audio/sound';
import { motion, isReducedMotion } from '../utils/motion';
import gsap from 'gsap';

interface GameMenuModalProps {
  onClose: () => void;
  onConcede: () => void;
  onExitToLogin: () => void;
  onOpenCodex?: () => void;
  onOpenTutorial?: () => void;
  predictedPlacement?: number;
  playerName?: string;
  heroName?: string;
  avatar?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  currentPhase?: 'TAVERN' | 'COMBAT' | 'HERO_SELECT';
}

type ConfirmState = 'NONE' | 'CONCEDE' | 'EXIT_LOGIN';

export const GameMenuModal: React.FC<GameMenuModalProps> = ({
  onClose,
  onConcede,
  onExitToLogin,
  onOpenCodex,
  onOpenTutorial,
  predictedPlacement = 8,
  playerName = 'Commander',
  heroName = 'Hero',
  avatar = '⚙️',
  isMuted,
  onToggleMute,
  currentPhase = 'TAVERN',
}) => {
  const [confirmState, setConfirmState] = useState<ConfirmState>('NONE');
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    motion.modalEnter(modalRef.current, 1.2);
    if (buttonsContainerRef.current && !isReducedMotion()) {
      const btns = buttonsContainerRef.current.querySelectorAll('button');
      gsap.fromTo(
        btns,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.08, ease: 'power2.out', delay: 0.1 }
      );
    }
  }, []);

  // Handle ESC key to cancel confirmation or close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmState !== 'NONE') {
          sound.playCardSnap();
          setConfirmState('NONE');
        } else {
          sound.playCardSnap();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState, onClose]);

  const handleResume = () => {
    sound.playCardSnap();
    onClose();
  };

  const handleTriggerConcede = () => {
    sound.playCardSnap();
    setConfirmState('CONCEDE');
  };

  const handleConfirmConcede = () => {
    sound.playDefeat();
    onConcede();
  };

  const handleTriggerExit = () => {
    sound.playCardSnap();
    setConfirmState('EXIT_LOGIN');
  };

  const handleConfirmExit = () => {
    sound.playCardSnap();
    onExitToLogin();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-fadeIn">
      {/* Click outside to resume if not in confirmation */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (confirmState === 'NONE') {
            handleResume();
          } else {
            setConfirmState('NONE');
          }
        }}
      />

      <div
        ref={modalRef}
        className="relative max-w-md w-full bg-[#0d071d]/95 border-2 border-yellow-500/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(234,179,8,0.3)] overflow-hidden z-10 flex flex-col"
      >
        {/* AAA Artwork Header Banner */}
        <div className="relative h-36 w-full overflow-hidden border-b-2 border-yellow-500/50">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url('/assets/art/game_menu_bg.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d071d] via-[#0d071d]/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={handleResume}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-yellow-500 hover:text-black border border-yellow-500/50 text-yellow-300 flex items-center justify-center text-sm font-bold transition-[background-color,color] duration-150 shadow-lg cursor-pointer"
            title="Resume Game (Esc)"
          >
            ✕
          </button>

          {/* Commander Profile Capsule */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-black/80 border-2 border-yellow-400 flex items-center justify-center text-xl shadow-brass">
                {avatar}
              </div>
              <div>
                <h3 className="font-cinzel font-black text-sm text-yellow-300 drop-shadow">
                  {heroName}
                </h3>
                <span className="text-[11px] text-purple-300 font-sans font-medium">
                  {playerName} • {currentPhase === 'COMBAT' ? '⚔️ In Combat' : '🍺 In Tavern'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-cinzel text-slate-400 block">
                Menu
              </span>
              <span className="text-xs font-cinzel font-bold text-cyan-300">
                AETHERIUM
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body: State-Driven Actions */}
        <div ref={buttonsContainerRef} className="p-6 flex flex-col gap-3">
          {confirmState === 'NONE' && (
            <>
              {/* 1. Resume Game */}
              <button
                onClick={handleResume}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-300/80 text-white font-cinzel font-black text-sm rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-[background-color,transform] duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>▶</span>
                <span>RESUME GAME</span>
              </button>

              {/* 2. Audio & Codex Toolbar */}
              <div className="grid grid-cols-2 gap-2 my-1">
                <button
                  onClick={() => {
                    sound.playCardSnap();
                    onToggleMute();
                  }}
                  className="py-2.5 px-3 bg-[#170e30] hover:bg-[#231548] border border-purple-800/60 rounded-xl text-xs font-cinzel font-bold text-slate-200 flex items-center justify-center gap-2 transition-[background-color] duration-150 cursor-pointer"
                >
                  <span>{isMuted ? '🔇' : '🔊'}</span>
                  <span>{isMuted ? 'UNMUTE SOUND' : 'MUTE SOUND'}</span>
                </button>

                {onOpenCodex ? (
                  <button
                    onClick={() => {
                      sound.playCardSnap();
                      onClose();
                      onOpenCodex();
                    }}
                    className="py-2.5 px-3 bg-[#170e30] hover:bg-[#231548] border border-purple-800/60 rounded-xl text-xs font-cinzel font-bold text-yellow-300 flex items-center justify-center gap-2 transition-[background-color] duration-150 cursor-pointer"
                  >
                    <span>📖</span>
                    <span>WORLD CODEX</span>
                  </button>
                ) : (
                  <div className="py-2.5 px-3 bg-[#170e30]/40 border border-purple-900/30 rounded-xl text-[11px] font-cinzel text-slate-500 flex items-center justify-center">
                    ASTRAL v1.0
                  </div>
                )}
              </div>

              {/* How to Play / Tutorial */}
              {onOpenTutorial && (
                <button
                  onClick={() => {
                    sound.playCardSnap();
                    onClose();
                    onOpenTutorial();
                  }}
                  className="w-full py-2.5 px-4 bg-[#181035] hover:bg-[#25174f] border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 font-cinzel font-bold text-xs rounded-xl shadow transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🎓</span>
                  <span>HOW TO PLAY (GUIDED TUTORIAL)</span>
                </button>
              )}

              <div className="h-px bg-gradient-to-r from-transparent via-purple-700/50 to-transparent my-1" />

              {/* 3. Concede Match */}
              <button
                onClick={handleTriggerConcede}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950/80 via-red-900/80 to-rose-950/80 hover:from-rose-900 hover:to-red-800 border border-rose-600/60 hover:border-rose-400 text-rose-200 font-cinzel font-bold text-xs rounded-xl shadow transition-[background-color,border-color,transform] duration-150 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🏳️</span>
                <span>CONCEDE MATCH</span>
                <span className="text-[10px] text-rose-400 font-sans font-normal">
                  (Take #{predictedPlacement} Place)
                </span>
              </button>

              {/* 4. Exit to Login Screen */}
              <button
                onClick={handleTriggerExit}
                className="w-full py-2.5 px-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-cinzel font-bold text-xs rounded-xl shadow transition-[background-color,border-color,color,transform] duration-150 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚪</span>
                <span>EXIT TO LOGIN SCREEN</span>
              </button>
            </>
          )}

          {/* CONFIRMATION: Concede Match */}
          {confirmState === 'CONCEDE' && (
            <div className="flex flex-col items-center text-center p-2 animate-fadeIn">
              <span className="text-4xl mb-2 animate-pulse">🏳️</span>
              <h4 className="font-cinzel font-black text-base text-rose-400 mb-1">
                FORFEIT & CONCEDE MATCH?
              </h4>
              <p className="text-xs text-purple-200 mb-3 font-sans max-w-xs">
                You will immediately surrender and be eliminated. You will take{' '}
                <span className="font-bold text-yellow-300">#{predictedPlacement} Place</span> out of 8 commanders.
              </p>

              <div className="w-full flex items-center gap-3">
                <button
                  onClick={() => setConfirmState('NONE')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-cinzel font-bold text-xs rounded-xl transition-[background-color] duration-150 cursor-pointer"
                >
                  CANCEL (ESC)
                </button>
                <button
                  onClick={handleConfirmConcede}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border border-red-300 text-white font-cinzel font-black text-xs rounded-xl shadow-lg transition-[background-color,transform] duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  CONFIRM CONCEDE
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMATION: Exit to Login */}
          {confirmState === 'EXIT_LOGIN' && (
            <div className="flex flex-col items-center text-center p-2 animate-fadeIn">
              <span className="text-4xl mb-2 animate-pulse">🚪</span>
              <h4 className="font-cinzel font-black text-base text-yellow-400 mb-1">
                QUIT TO LOGIN SCREEN?
              </h4>
              <p className="text-xs text-purple-200 mb-3 font-sans max-w-xs">
                Your current match in progress will be abandoned and you will return to the Commander Callsign screen.
              </p>

              <div className="w-full flex items-center gap-3">
                <button
                  onClick={() => setConfirmState('NONE')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-cinzel font-bold text-xs rounded-xl transition-[background-color] duration-150 cursor-pointer"
                >
                  CANCEL (ESC)
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 border border-purple-400 text-white font-cinzel font-black text-xs rounded-xl shadow-lg transition-[background-color,transform] duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  CONFIRM QUIT
                </button>
              </div>
            </div>
          )}

          {/* Bottom Hint */}
          <div className="text-center mt-1">
            <span className="text-[10px] text-slate-500 font-cinzel">
              Press [ESC] anytime to return
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
