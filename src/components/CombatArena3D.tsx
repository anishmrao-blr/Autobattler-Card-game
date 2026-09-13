import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CombatSimulationResult } from '../engine/combat';
import { BoardMinion, CombatEvent, PlayerState } from '../types';
import { CardView } from './CardView';
import { CombatVFXCanvas, VFXHandle } from './CombatVFXCanvas';
import { VictoryCelebrationVFX } from './VictoryCelebrationVFX';
import { sound } from '../audio/sound';

interface CombatArena3DProps {
  player: PlayerState;
  combatResult: CombatSimulationResult;
  turnNumber?: number;
  onFinishCombat: () => void;
  onOpenMenu?: () => void;
}

export const CombatArena3D: React.FC<CombatArena3DProps> = ({
  player,
  combatResult,
  turnNumber = 1,
  onFinishCombat,
  onOpenMenu,
}) => {
  // Determine sides
  const isPlayerSide1 = combatResult.p1.id === player.id;
  const opponent = isPlayerSide1 ? combatResult.p2 : combatResult.p1;

  const [currentEventIdx, setCurrentEventIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);

  // Boards (Board1 = Player Bottom, Board2 = Opponent Top)
  const [board1, setBoard1] = useState<BoardMinion[]>(() => {
    const init = isPlayerSide1 ? combatResult.initialBoard1 : combatResult.initialBoard2;
    return init.map(m => ({ ...m, keywords: [...m.keywords] }));
  });

  const [board2, setBoard2] = useState<BoardMinion[]>(() => {
    const init = isPlayerSide1 ? combatResult.initialBoard2 : combatResult.initialBoard1;
    return init.map(m => ({ ...m, keywords: [...m.keywords] }));
  });

  // Combat States
  const [damageMap, setDamageMap] = useState<Record<string, number>>({});
  const [brokenBarrierId, setBrokenBarrierId] = useState<string | undefined>(undefined);
  const [targetedDefenderId, setTargetedDefenderId] = useState<string | null>(null);
  const [dyingMinionIds, setDyingMinionIds] = useState<Set<string>>(new Set());
  const [combatFinished, setCombatFinished] = useState(false);
  const [playerHp, setPlayerHp] = useState(player.hp);
  const [opponentHp, setOpponentHp] = useState(opponent.hp);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const vfxRef = useRef<VFXHandle | null>(null);
  const redshiftRef = useRef<HTMLDivElement | null>(null);
  const cardElements = useRef<Map<string, HTMLDivElement>>(new Map());
  const playerHeroRef = useRef<HTMLDivElement | null>(null);
  const opponentHeroRef = useRef<HTMLDivElement | null>(null);

  const playerWon = (isPlayerSide1 && combatResult.winnerSide === 1) || (!isPlayerSide1 && combatResult.winnerSide === 2);
  const isTie = combatResult.winnerSide === 0;



  // Professional GSAP Redshift Vignette Micro-Flash
  const triggerRedshift = (intensity: 'light' | 'heavy') => {
    if (!redshiftRef.current) return;
    gsap.killTweensOf(redshiftRef.current);
    const peakOpacity = intensity === 'heavy' ? 0.92 : 0.6;
    const dur = (intensity === 'heavy' ? 0.28 : 0.18) / speed;
    gsap.fromTo(
      redshiftRef.current,
      { opacity: peakOpacity, scale: 1.02 },
      { opacity: 0, scale: 1, duration: dur, ease: 'power2.out' }
    );
  };

  // Eased Card Shudder with Elastic Dampening
  const triggerCardShudder = (elem: HTMLElement, recoilY = 0) => {
    gsap.killTweensOf(elem);
    gsap.fromTo(
      elem,
      { x: -5, y: recoilY * 0.4, rotation: -1.5, scale: 0.94 },
      { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.22 / speed, ease: 'elastic.out(1.2, 0.4)' }
    );
  };

  // Process Events Sequentially with Studio-Paced Delays
  useEffect(() => {
    if (!isPlaying || currentEventIdx >= combatResult.events.length) return;

    const event = combatResult.events[currentEventIdx];
    const baseDuration = getEventDuration(event);
    const delay = baseDuration / speed;

    const timer = setTimeout(() => {
      processEvent(event);
      setCurrentEventIdx(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentEventIdx, isPlaying, speed]);

  const getEventDuration = (event: CombatEvent): number => {
    switch (event.type) {
      case 'ATTACK_START': return 750;
      case 'DAMAGE_DEALT':
      case 'CLEAVE_DAMAGE': return 380;
      case 'BARRIER_BROKEN': return 450;
      case 'MINION_DIED': return 500;
      case 'TOKEN_SPAWNED': return 420;
      case 'COMBAT_END': return 850;
      default: return 320;
    }
  };

  const processEvent = (event: CombatEvent) => {
    switch (event.type) {
      case 'ATTACK_START': {
        const isAttackerPlayer = (isPlayerSide1 && event.attackerSide === 1) || (!isPlayerSide1 && event.attackerSide === 2);
        const attackerTribe = getMinionTribe(event.attackerId);

        setLogMessages(prev => [`⚔️ ${event.minionName} strikes ${event.defenderName}`, ...prev.slice(0, 4)]);
        setTargetedDefenderId(event.defenderId);

        const attackerElem = cardElements.current.get(event.attackerId);
        const defenderElem = cardElements.current.get(event.defenderId);

        let deltaX = 0;
        let deltaY = isAttackerPlayer ? -180 : 180;
        let fromX = window.innerWidth / 2;
        let fromY = isAttackerPlayer ? window.innerHeight * 0.7 : window.innerHeight * 0.3;
        let toX = window.innerWidth / 2;
        let toY = isAttackerPlayer ? window.innerHeight * 0.3 : window.innerHeight * 0.7;

        if (attackerElem && defenderElem) {
          const rectA = attackerElem.getBoundingClientRect();
          const rectB = defenderElem.getBoundingClientRect();
          fromX = rectA.left + rectA.width / 2;
          fromY = rectA.top + rectA.height / 2;
          toX = rectB.left + rectB.width / 2;
          toY = rectB.top + rectB.height / 2;
          deltaX = toX - fromX;
          deltaY = toY - fromY;
        }

        if (attackerElem) {
          gsap.killTweensOf(attackerElem);
          attackerElem.style.zIndex = '50';
          const tl = gsap.timeline();

          // Stage 1: Anticipation / Lift-off
          tl.to(attackerElem, {
            y: isAttackerPlayer ? 35 : -35,
            z: 60,
            rotateX: isAttackerPlayer ? -22 : 22,
            scale: 1.14,
            duration: 0.2 / speed,
            ease: 'power2.out',
            onStart: () => {
              vfxRef.current?.spawnTargetReticle(toX, toY);
            },
          })
          // Stage 2: Kinetic Rocket Dash
          .to(attackerElem, {
            x: deltaX * 0.82,
            y: deltaY * 0.82,
            z: 95,
            rotateX: isAttackerPlayer ? 26 : -26,
            scale: 1.25,
            duration: 0.18 / speed,
            ease: 'power3.in',
            onStart: () => {
              sound.playAttackLunge();
              vfxRef.current?.spawnTribeAttackVFX(attackerTribe, fromX, fromY, toX, toY);
            },
          })
          // Stage 3: Crunch Collision & Defender Recoil
          .to(attackerElem, {
            x: deltaX * 0.72,
            y: deltaY * 0.72,
            duration: 0.12 / speed,
            ease: 'elastic.out(1, 0.4)',
            onStart: () => {
              if (defenderElem) {
                triggerCardShudder(defenderElem, isAttackerPlayer ? -32 : 32);
              }
              setTargetedDefenderId(null);
            },
          })
          // Stage 4: Settle & Return
          .to(attackerElem, {
            x: 0,
            y: 0,
            z: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scale: 1,
            duration: 0.22 / speed,
            ease: 'power2.out',
            onComplete: () => {
              attackerElem.style.zIndex = '';
            },
          });
        }

        break;
      }

      case 'DAMAGE_DEALT': {
        const isCrit = event.amount >= 8 || event.isLethal;
        sound.playImpactDamage(event.isLethal, isCrit);
        setDamageMap(prev => ({ ...prev, [event.targetId]: event.amount }));
        setTimeout(() => setDamageMap({}), 450);

        updateMinionHealth(event.targetId, event.remainingHp);

        const elem = cardElements.current.get(event.targetId);
        if (elem) {
          triggerCardShudder(elem);
        }
        triggerRedshift(isCrit ? 'heavy' : 'light');

        if (elem) {
          const rect = elem.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;

          vfxRef.current?.spawnFloatingDamage(
            cx,
            cy,
            `-${event.amount}${isCrit ? '! CRIT' : ''}`,
            isCrit ? 'CRIT' : 'NORMAL'
          );

          vfxRef.current?.spawnFluidSpatters(
            cx,
            cy,
            event.wasMiasmic ? '#10b981' : '#dc2626',
            isCrit
          );

          if (isCrit) {
            vfxRef.current?.spawn3DImpactBurst(cx, cy, '#ffd700', true);
          } else {
            vfxRef.current?.spawn3DImpactBurst(
              cx,
              cy,
              event.wasMiasmic ? '#00e676' : '#ff003c',
              false
            );
          }
        }
        break;
      }

      case 'CLEAVE_DAMAGE': {
        const isCrit = event.amount >= 8 || event.isLethal;
        sound.playImpactDamage(event.isLethal, isCrit);
        setDamageMap(prev => ({ ...prev, [event.targetId]: event.amount }));
        setTimeout(() => setDamageMap({}), 450);
        updateMinionHealth(event.targetId, event.remainingHp);

        const elem = cardElements.current.get(event.targetId);
        if (elem) {
          triggerCardShudder(elem);
        }
        triggerRedshift('light');

        if (elem) {
          const rect = elem.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          vfxRef.current?.spawnCleaveWave(cx, cy, rect.width);
          vfxRef.current?.spawnFloatingDamage(cx, cy, `-${event.amount} CLEAVE`, 'NORMAL');
          vfxRef.current?.spawnFluidSpatters(cx, cy, '#ea580c', false);
          vfxRef.current?.spawn3DImpactBurst(cx, cy, '#ff6600', isCrit);
        }
        break;
      }

      case 'BARRIER_BROKEN': {
        sound.playBarrierBreak();
        setBrokenBarrierId(event.targetId);
        setTimeout(() => setBrokenBarrierId(undefined), 500);

        const elem = cardElements.current.get(event.targetId);
        if (elem) {
          triggerCardShudder(elem);
        }

        if (elem) {
          const rect = elem.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          vfxRef.current?.spawnBarrierShatter(cx, cy);
          vfxRef.current?.spawnFluidSpatters(cx, cy, '#38bdf8', false);
        }
        break;
      }

      case 'MINION_DIED': {
        setLogMessages(prev => [`💀 ${event.minionName} was obliterated!`, ...prev.slice(0, 4)]);
        setDyingMinionIds(prev => new Set(prev).add(event.minionId));

        const elem = cardElements.current.get(event.minionId);
        const minionTribe = getMinionTribe(event.minionId);

        if (elem) {
          gsap.killTweensOf(elem);
          const rect = elem.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          vfxRef.current?.spawnDeathExplosion(cx, cy, minionTribe);
          vfxRef.current?.spawnFluidSpatters(cx, cy, '#ef4444', true);
        }

        setTimeout(() => {
          removeMinionFromBoard(event.minionId);
          setDyingMinionIds(prev => {
            const next = new Set(prev);
            next.delete(event.minionId);
            return next;
          });
        }, 420 / speed);

        break;
      }

      case 'TOKEN_SPAWNED': {
        sound.playCardSnap();
        const targetSide = isPlayerSide1 ? event.side : (event.side === 1 ? 2 : 1);
        if (targetSide === 1) {
          setBoard1(prev => [...prev, event.minion]);
        } else {
          setBoard2(prev => [...prev, event.minion]);
        }
        break;
      }

      case 'COMBAT_END': {
        handleCombatConclusion();
        break;
      }
    }
  };

  const handleCombatConclusion = () => {
    setCombatFinished(true);

    if (!isTie) {
      const sourceY = playerWon ? window.innerHeight * 0.7 : window.innerHeight * 0.3;
      const targetY = playerWon ? 60 : window.innerHeight - 80;
      const midX = window.innerWidth / 2;

      vfxRef.current?.spawnHeroOrb(midX, sourceY, midX, targetY, () => {
        sound.playImpactDamage(true, true);
        triggerRedshift('heavy');
        vfxRef.current?.spawnFluidSpatters(midX, targetY, playerWon ? '#dc2626' : '#ffd700', true);

        if (playerWon) {
          setOpponentHp(prev => Math.max(0, prev - combatResult.damageDealt));
          sound.playVictory();
        } else {
          setPlayerHp(prev => Math.max(0, prev - combatResult.damageDealt));
          sound.playDefeat();
        }
      });
    }
  };

  const updateMinionHealth = (minionId: string, remainingHp: number) => {
    setBoard1(prev =>
      prev.map(m => (m.instanceId === minionId ? { ...m, health: remainingHp } : m))
    );
    setBoard2(prev =>
      prev.map(m => (m.instanceId === minionId ? { ...m, health: remainingHp } : m))
    );
  };

  const removeMinionFromBoard = (minionId: string) => {
    setBoard1(prev => prev.filter(m => m.instanceId !== minionId));
    setBoard2(prev => prev.filter(m => m.instanceId !== minionId));
  };

  const getMinionTribe = (instanceId: string): string => {
    const all = [...board1, ...board2];
    const found = all.find(m => m.instanceId === instanceId);
    return found ? found.tribe : 'NEUTRAL';
  };

  const effectiveWinStreak = playerWon ? player.winStreak + 1 : 0;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#06030e] flex flex-col justify-between p-4">


      {/* Subtle Professional Redshift Vignette Micro-Flash (GSAP Synchronized) */}
      <div
        ref={redshiftRef}
        className="fixed inset-0 pointer-events-none z-30 opacity-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 45%, rgba(153, 27, 27, 0.6) 95%, rgba(69, 10, 10, 0.8) 100%)',
        }}
      />

      {/* Hero-Themed Streak-Scaled Victory Celebration Particles */}
      {combatFinished && playerWon && (
        <VictoryCelebrationVFX
          hero={player.hero}
          winStreak={effectiveWinStreak}
          turnNumber={turnNumber}
        />
      )}

      {/* Top HUD: Opponent Hero Portrait & Controls */}
      <div className="flex items-center justify-between z-30 bg-[#100724]/90 border border-purple-900/50 p-2.5 rounded-2xl shadow-xl backdrop-blur-md">
        <div ref={opponentHeroRef} className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-black/80 border-2 border-red-500/80 flex items-center justify-center text-2xl shadow-brass">
            {opponent.avatar}
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-sm text-red-300">
              {opponent.hero.name} ({opponent.name})
            </h3>
            <span className="text-xs font-bold text-red-400">
              ❤️ {opponentHp} / {opponent.maxHp} HP
            </span>
          </div>
        </div>

        {/* Combat Speed, Playback & Menu Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeed(s => (s === 1 ? 1.5 : s === 1.5 ? 2.5 : 1))}
            className="px-3 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-yellow-300 font-cinzel font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            ⚡ {speed}x SPEED
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-cinzel font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            {isPlaying ? '⏸ PAUSE' : '▶ RESUME'}
          </button>
          {onOpenMenu && (
            <button
              onClick={() => {
                sound.playCardSnap();
                setIsPlaying(false);
                onOpenMenu();
              }}
              className="p-1 px-2.5 bg-[#120a26] hover:bg-yellow-500 hover:text-black border border-yellow-500/50 rounded-xl text-xs text-yellow-300 transition-all shadow-sm cursor-pointer"
              title="Game Menu / Concede / Exit (Esc)"
            >
              <span>⚙️</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Battle Arena Viewport */}
      <div
        className="relative flex-1 flex flex-col justify-around items-center my-2"
        style={{ perspective: '1400px' }}
      >
        {/* Arena Floor Runes Texture with Perspective */}
        <div
          className="absolute inset-0 bg-contain bg-center opacity-35 pointer-events-none"
          style={{
            backgroundImage: `url('/assets/art/arena_bg.jpg')`,
            transform: 'rotateX(38deg) scale(1.15) translateZ(-80px)',
            transformOrigin: '50% 50%',
          }}
        />

        {/* Top Board: Opponent Formation */}
        <div className="flex items-center justify-center gap-3 z-10 w-full min-h-[140px]">
          {board2.length > 0 ? (
            board2.map(minion => {
              const isTargeted = targetedDefenderId === minion.instanceId;
              const isDying = dyingMinionIds.has(minion.instanceId);

              return (
                <div
                  key={minion.instanceId}
                  ref={el => {
                    if (el) cardElements.current.set(minion.instanceId, el);
                  }}
                  className={`${isTargeted ? 'animate-target-lock' : ''} ${isDying ? 'animate-card-dissolve' : ''}`}
                  style={{
                    transformStyle: 'preserve-3d',
                    zIndex: 10,
                  }}
                >
                  <CardView
                    boardMinion={minion}
                    size="md"
                    damageReceived={damageMap[minion.instanceId]}
                    barrierBroken={brokenBarrierId === minion.instanceId}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-slate-500 font-cinzel text-xs py-8">
              Enemy formation shattered.
            </div>
          )}
        </div>

        {/* Middle Clash Zone & Tactical Combat Ticker */}
        <div className="z-20 text-center pointer-events-none py-1">
          {logMessages.length > 0 ? (
            <div className="inline-block bg-black/80 border border-yellow-500/50 px-4 py-1.5 rounded-full text-xs font-cinzel text-yellow-300 shadow-brass animate-fadeIn">
              {logMessages[0]}
            </div>
          ) : (
            <div className="text-[11px] font-cinzel text-slate-500">
              ⚡ ASTRAL CLASH IN PROGRESS
            </div>
          )}
        </div>

        {/* Bottom Board: Player Formation */}
        <div className="flex items-center justify-center gap-3 z-10 w-full min-h-[140px]">
          {board1.length > 0 ? (
            board1.map(minion => {
              const isTargeted = targetedDefenderId === minion.instanceId;
              const isDying = dyingMinionIds.has(minion.instanceId);

              return (
                <div
                  key={minion.instanceId}
                  ref={el => {
                    if (el) cardElements.current.set(minion.instanceId, el);
                  }}
                  className={`${isTargeted ? 'animate-target-lock' : ''} ${isDying ? 'animate-card-dissolve' : ''}`}
                  style={{
                    transformStyle: 'preserve-3d',
                    zIndex: 10,
                  }}
                >
                  <CardView
                    boardMinion={minion}
                    size="md"
                    damageReceived={damageMap[minion.instanceId]}
                    barrierBroken={brokenBarrierId === minion.instanceId}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-slate-500 font-cinzel text-xs py-8">
              Your front line has fallen.
            </div>
          )}
        </div>
      </div>

      {/* Bottom HUD: Player Hero Portrait */}
      <div className="flex items-center justify-between z-30 bg-[#100724]/90 border border-yellow-600/30 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md">
        <div ref={playerHeroRef} className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-black/80 border-2 border-yellow-500 flex items-center justify-center text-2xl shadow-brass">
            {player.avatar}
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-sm text-yellow-300">
              {player.hero.name} (You)
            </h3>
            <span className="text-xs font-bold text-emerald-400">
              ❤️ {playerHp} / {player.maxHp} HP
            </span>
          </div>
        </div>

        <div className="text-xs font-cinzel text-purple-300 font-bold">
          ★ Tavern Tier {player.tavernTier} Formation
        </div>
      </div>

      {/* Hero-Themed Streak-Scaled Victory / Defeat Modal */}
      {combatFinished && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn p-6">
          <div className={`max-w-md w-full bg-[#140b2b]/95 border-2 rounded-3xl p-6 text-center flex flex-col items-center shadow-2xl ${
            playerWon
              ? effectiveWinStreak >= 3
                ? 'border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.7)] animate-pulse'
                : 'border-yellow-500/80 shadow-[0_0_30px_rgba(234,179,8,0.4)]'
              : isTie
              ? 'border-slate-600 shadow-slate-900'
              : 'border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
          }`}>
            {/* Streak Intensity Banner */}
            {playerWon && (
              <div className="mb-2">
                {effectiveWinStreak >= 3 ? (
                  <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border border-yellow-300 text-black font-cinzel font-black text-xs shadow-lg animate-bounce">
                    <span>🔥 {effectiveWinStreak}X UNSTOPPABLE STREAK!</span>
                  </div>
                ) : effectiveWinStreak === 2 ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-yellow-500/60 text-yellow-300 font-cinzel font-bold text-[11px]">
                    <span>⚡ 2X WIN STREAK (+2 BONUS MOMENTUM)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-cinzel font-bold text-[10px]">
                    <span>⚔️ ROUND VICTORY</span>
                  </div>
                )}
              </div>
            )}

            <span className="text-6xl mb-2">
              {playerWon ? '🏆' : isTie ? '⚖️' : '💀'}
            </span>

            <h2 className={`font-cinzel text-2xl font-black mb-1 ${playerWon ? 'text-yellow-400' : isTie ? 'text-slate-300' : 'text-red-500'}`}>
              {playerWon ? 'VICTORY!' : isTie ? 'STALEMATE (TIE)' : 'DEFEAT!'}
            </h2>

            <p className="text-xs text-purple-200 mb-4 font-sans">
              {playerWon
                ? `You dealt ${combatResult.damageDealt} damage to ${opponent.name}!`
                : isTie
                ? 'Both armies wiped each other out simultaneously.'
                : `You suffered ${combatResult.damageDealt} damage from ${opponent.name}!`}
            </p>

            <div className="bg-black/60 rounded-xl p-3 w-full border border-purple-900/50 mb-6 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Winner Tavern Tier:</span>
                <span className="font-bold text-yellow-400">★ {combatResult.winnerTier}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Surviving Units Damage:</span>
                <span className="font-bold text-emerald-400">+{combatResult.damageDealt - combatResult.winnerTier}</span>
              </div>
            </div>

            <button
              onClick={onFinishCombat}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-cinzel font-black text-sm rounded-xl shadow-brass transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              CONTINUE TO TAVERN (NEXT ROUND) ➔
            </button>
          </div>
        </div>
      )}

      {/* 2D/3D WebGL VFX Overlay (Includes real bloom, painted flame/slash/laser textures) */}
      <CombatVFXCanvas ref={vfxRef} className="z-[9999]" />
    </div>
  );
};
