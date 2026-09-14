import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../audio/sound';
import { isReducedMotion } from '../utils/motion';
import gsap from 'gsap';
import { LoopingVideo } from './LoopingVideo';

interface HomePageModalProps {
  onLogin: (playerName: string, title: string) => void;
  onOpenCodex?: () => void;
}

const COMMANDER_TITLES = [
  'Grand Clocksmith',
  'Void Transmuter',
  'High Artificer',
  'Celestial Oracle',
  'Aether Consortium Tycoon',
  'Void Corsair Admiral',
];

export const HomePageModal: React.FC<HomePageModalProps> = ({ onLogin, onOpenCodex }) => {
  const [playerName, setPlayerName] = useState('Commander Thorne');
  const [selectedTitle, setSelectedTitle] = useState(COMMANDER_TITLES[0]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isReducedMotion()) return;
    const tl = gsap.timeline();
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: -20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        '-=0.3'
      );
    }
    if (submitBtnRef.current) {
      tl.fromTo(
        submitBtnRef.current,
        { opacity: 0, scale: 0.85, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.3)' },
        '-=0.15'
      );
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isAuthenticating) return;

    setIsAuthenticating(true);
    sound.playTierUpgrade();
    sound.playSteamHiss();

    setTimeout(() => {
      onLogin(playerName.trim(), selectedTitle);
    }, 1100);
  };

  return (
    <main
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-[transform,opacity,filter] duration-1000 ${
        isAuthenticating ? 'scale-125 opacity-0 filter blur-md' : 'scale-100 opacity-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(rgba(5, 3, 15, 0.4), rgba(3, 1, 8, 0.88)), url(/assets/art/astral_portal.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background Cinematic Video with Static Poster Fallback */}
      <LoopingVideo
        poster="/assets/art/astral_portal.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        src="/assets/video/title_portal.mp4"
      />

      {/* Top Right: Codex Button */}
      {onOpenCodex && (
        <button
          onClick={() => {
            sound.playCardSnap();
            onOpenCodex();
          }}
          className="absolute top-6 right-6 bg-[#0c071d]/90 hover:bg-yellow-500 hover:text-black text-yellow-300 border-2 border-yellow-500/60 px-4 py-2 rounded-2xl font-cinzel font-bold text-xs shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-colors duration-150 flex items-center gap-2 z-20"
        >
          <span>📖</span>
          <span>ASTRAL CODEX</span>
        </button>
      )}

      {/* Ambient Pulsating Glow & Particle Aura */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

      {/* Login Portal Card Container */}
      <div className="relative max-w-xl w-full mx-4 dark-steel-card rounded-3xl p-8 border-2 border-yellow-500/60 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl flex flex-col items-center text-center z-10">
        {/* Arcane Seal Crest */}
        <div className="relative w-24 h-24 rounded-full border-2 border-cyan-400 bg-[#0c071d]/90 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.6)] mb-4 group">
          <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '18s' }} viewBox="0 0 100 100">
            <polygon points="50 3, 90 25, 90 75, 50 97, 10 75, 10 25" fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray="8,6" />
          </svg>
          <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(0,240,255,0.9)] animate-pulse">
            🌌
          </span>
        </div>

        {/* Title & Tagline */}
        <h1 ref={titleRef} className="font-cinzel text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-wider drop-shadow-[0_0_20px_rgba(234,179,8,0.6)] mb-2">
          AETHERIUM
        </h1>
        <div ref={subtitleRef} className="text-xs sm:text-sm font-cinzel font-bold text-cyan-300 tracking-widest uppercase mb-6 flex items-center gap-2">
          <span className="h-px w-8 bg-cyan-400/50" />
          <span>ASTRAL BATTLEGROUNDS</span>
          <span className="h-px w-8 bg-cyan-400/50" />
        </div>

        <p className="text-xs text-slate-300 font-sans max-w-md mb-6 leading-relaxed">
          Authenticate your commander credentials to access the 8-Player Astral Lobby, forge warbands, and dominate the dark steel runic arena.
        </p>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="w-full space-y-4 text-left">
          <div>
            <label className="block text-[11px] font-cinzel font-bold text-yellow-300 uppercase tracking-wider mb-1">
              Commander Callsign
            </label>
            <div className="relative">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Enter Callsign..."
                className="w-full bg-[#0d071d]/90 border-2 border-[#524775] focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors duration-150 shadow-inner font-sans"
              />
              <span className="absolute right-3 top-2.5 text-slate-500 text-xs">⚔️</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-cinzel font-bold text-yellow-300 uppercase tracking-wider mb-1">
              Astral Title
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMANDER_TITLES.map((title) => (
                <button
                  type="button"
                  key={title}
                  onClick={() => {
                    sound.playCardSnap();
                    setSelectedTitle(title);
                  }}
                  className={`text-[11px] py-1.5 px-2 rounded-lg border font-sans truncate transition-colors duration-150 text-left ${
                    selectedTitle === title
                      ? 'bg-yellow-950/80 border-yellow-400 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.3)] font-bold'
                      : 'bg-black/50 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>

          {/* Enter Button */}
          <button
            ref={submitBtnRef}
            type="submit"
            disabled={isAuthenticating || !playerName.trim()}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-black font-cinzel font-black text-sm rounded-xl shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-[transform,opacity] duration-150 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider"
          >
            {isAuthenticating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>AUTHENTICATING ASTRAL SEAL...</span>
              </>
            ) : (
              <>
                <span>ENTER THE AETHERIUM</span>
                <span>➔</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
};
