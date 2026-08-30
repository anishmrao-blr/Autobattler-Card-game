import React, { useState, useEffect, useRef } from 'react';
import { CombatSimulationResult } from '../engine/combat';
import { BoardMinion, CombatEvent, PlayerState } from '../types';
import { CardView } from './CardView';
import { CombatVFXCanvas, VFXHandle } from './CombatVFXCanvas';
import { sound } from '../audio/sound';
import confetti from 'canvas-confetti';

interface CombatArena3DProps {
  player: PlayerState;
  combatResult: CombatSimulationResult;
  onFinishCombat: () => void;
}

interface CardTransform {
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
}

export const CombatArena3D: React.FC<CombatArena3DProps> = ({
  player,
  combatResult,
  onFinishCombat,
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

  // 3D Transforms
  const [cardTransforms, setCardTransforms] = useState<Record<string, CardTransform>>({});
  const [damageMap, setDamageMap] = useState<Record<string, number>>({});
  const [brokenBarrierId, setBrokenBarrierId] = useState<string | undefined>();
  const [screenShake, setScreenShake] = useState(false);
  const [combatFinished, setCombatFinished] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([
    `⚔️ Combat Round: ${player.name} vs ${opponent.name}`
  ]);

  // HP tracking
  const [opponentHp, setOpponentHp] = useState(opponent.hp);
  const [playerHp, setPlayerHp] = useState(player.hp);

  // DOM Refs
  const cardElements = useRef<Map<string, HTMLDivElement>>(new Map());
  const vfxRef = useRef<VFXHandle | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const opponentHeroRef = useRef<HTMLDivElement | null>(null);
  const playerHeroRef = useRef<HTMLDivElement | null>(null);

  // Main Playback Loop
  useEffect(() => {
    if (!isPlaying || combatFinished) return;

    const events = combatResult.events;
    if (currentEventIdx >= events.length) {
      handleCombatConclusion();
      return;
    }

    const event = events[currentEventIdx];
    const baseDuration = getEventDuration(event);
    const delay = Math.max(120, baseDuration / speed);

    timerRef.current = setTimeout(() => {
      processEvent3D(event);
      setCurrentEventIdx(prev => prev + 1);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentEventIdx, isPlaying, speed, combatResult, combatFinished]);

  const getEventDuration = (event: CombatEvent): number => {
    switch (event.type) {
      case 'ATTACK_START': return 550;
      case 'DAMAGE_DEALT': return 400;
      case 'CLEAVE_DAMAGE': return 450;
      case 'BARRIER_BROKEN': return 400;
      case 'MINION_DIED': return 350;
      case 'TOKEN_SPAWNED': return 400;
      default: return 300;
    }
  };

  const processEvent3D = (event: CombatEvent) => {
    switch (event.type) {
      case 'ATTACK_START': {
        const { attackerId, defenderId, minionName, defenderName } = event;
        sound.playAttackLunge();

        setLogMessages(prev => [
          `⚔️ ${minionName} leaps across the rift to strike ${defenderName}!`,
          ...prev.slice(0, 4)
        ]);

        const atkElem = cardElements.current.get(attackerId);
        const defElem = cardElements.current.get(defenderId);

        if (atkElem && defElem) {
          const atkRect = atkElem.getBoundingClientRect();
          const defRect = defElem.getBoundingClientRect();

          const deltaX = defRect.left + defRect.width / 2 - (atkRect.left + atkRect.width / 2);
          const deltaY = defRect.top + defRect.height / 2 - (atkRect.top + atkRect.height / 2);

          // 1. Wind-Up
          setCardTransforms(prev => ({
            ...prev,
            [attackerId]: {
              x: 0,
              y: deltaY > 0 ? -25 : 25,
              z: 50,
              rotateX: deltaY > 0 ? 20 : -20,
              rotateY: 0,
              rotateZ: 0,
              scale: 1.15,
            }
          }));

          // 2. Physical Lunge Strike
          setTimeout(() => {
            setCardTransforms(prev => ({
              ...prev,
              [attackerId]: {
                x: deltaX * 0.85,
                y: deltaY * 0.85,
                z: 90,
                rotateX: deltaY > 0 ? -30 : 30,
                rotateY: deltaX > 0 ? 15 : -15,
                rotateZ: (Math.random() - 0.5) * 15,
                scale: 1.25,
              }
            }));

            // Spawn Slash VFX & Impact Sparks at defender position
            const hitX = defRect.left + defRect.width / 2;
            const hitY = defRect.top + defRect.height / 2;

            vfxRef.current?.spawnSlashArc(
              hitX - 70, hitY - 70,
              hitX + 70, hitY + 70,
              '#ff2a5f'
            );
            vfxRef.current?.spawnImpactSparks(hitX, hitY, '#ffd700', 45);
            triggerScreenShake();
          }, 180 / speed);

          // 3. Defender Stagger & Attacker Recoil
          setTimeout(() => {
            setCardTransforms(prev => ({
              ...prev,
              [defenderId]: {
                x: 0,
                y: deltaY > 0 ? 30 : -30,
                z: -25,
                rotateX: deltaY > 0 ? 25 : -25,
                rotateY: 0,
                rotateZ: (Math.random() - 0.5) * 12,
                scale: 0.95,
              }
            }));

            setCardTransforms(prev => ({
              ...prev,
              [attackerId]: {
                x: 0, y: 0, z: 0,
                rotateX: 0, rotateY: 0, rotateZ: 0,
                scale: 1.0,
              }
            }));
          }, 340 / speed);

          // 4. Settle
          setTimeout(() => {
            setCardTransforms(prev => ({
              ...prev,
              [defenderId]: {
                x: 0, y: 0, z: 0,
                rotateX: 0, rotateY: 0, rotateZ: 0,
                scale: 1.0,
              }
            }));
          }, 480 / speed);
        }
        break;
      }

      case 'DAMAGE_DEALT': {
        sound.playImpactDamage(event.isLethal);
        setDamageMap(prev => ({ ...prev, [event.targetId]: event.amount }));
        setTimeout(() => setDamageMap({}), 400);

        updateMinionHealth(event.targetId, event.remainingHp);

        const elem = cardElements.current.get(event.targetId);
        if (elem) {
          const rect = elem.getBoundingClientRect();
          vfxRef.current?.spawnImpactSparks(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            event.wasMiasmic ? '#00e676' : '#ff3366',
            event.isLethal ? 55 : 30
          );
        }
        break;
      }

      case 'CLEAVE_DAMAGE': {
        sound.playImpactDamage(event.isLethal);
        setDamageMap(prev => ({ ...prev, [event.targetId]: event.amount }));
        setTimeout(() => setDamageMap({}), 400);
        updateMinionHealth(event.targetId, event.remainingHp);

        const elem = cardElements.current.get(event.targetId);
        if (elem) {
          const rect = elem.getBoundingClientRect();
          vfxRef.current?.spawnCleaveWave(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width);
        }
        break;
      }

      case 'BARRIER_BROKEN': {
        sound.playBarrierBreak();
        setBrokenBarrierId(event.targetId);
        setTimeout(() => setBrokenBarrierId(undefined), 500);

        const elem = cardElements.current.get(event.targetId);
        if (elem) {
          const rect = elem.getBoundingClientRect();
          vfxRef.current?.spawnBarrierShatter(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
        break;
      }

      case 'MINION_DIED': {
        setLogMessages(prev => [`💀 ${event.minionName} was obliterated!`, ...prev.slice(0, 4)]);
        const elem = cardElements.current.get(event.minionId);
        if (elem) {
          const rect = elem.getBoundingClientRect();
          vfxRef.current?.spawnDeathExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
        removeMinionFromBoard(event.minionId);
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

    const playerWon = (isPlayerSide1 && combatResult.winnerSide === 1) || (!isPlayerSide1 && combatResult.winnerSide === 2);
    const isTie = combatResult.winnerSide === 0;

    if (!isTie) {
      const sourceY = playerWon ? window.innerHeight * 0.7 : window.innerHeight * 0.3;
      const targetY = playerWon ? 60 : window.innerHeight - 80;
      const midX = window.innerWidth / 2;

      vfxRef.current?.spawnHeroOrb(midX, sourceY, midX, targetY, () => {
        sound.playImpactDamage(true);
        triggerScreenShake();
        if (playerWon) {
          setOpponentHp(prev => Math.max(0, prev - combatResult.damageDealt));
          sound.playVictory();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } else {
          setPlayerHp(prev => Math.max(0, prev - combatResult.damageDealt));
        }
      });
    }
  };

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
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

  const skipToEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentEventIdx(combatResult.events.length);
    handleCombatConclusion();
  };

  const playerWon = (isPlayerSide1 && combatResult.winnerSide === 1) || (!isPlayerSide1 && combatResult.winnerSide === 2);
  const isTie = combatResult.winnerSide === 0;

  return (
    <div className={`relative w-full h-full flex flex-col justify-between p-4 bg-[#070412] overflow-hidden select-none ${screenShake ? 'animate-wiggle' : ''}`}>
      <CombatVFXCanvas ref={vfxRef} />

      {/* Cosmic Nebula Backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#211042_0%,_#0d061c_60%,_#020108_100%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#c89b3c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top HUD: Opponent Hero Portrait & Controls */}
      <div className="flex items-center justify-between z-30 bg-[#120a26]/90 border border-yellow-600/30 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md">
        <div ref={opponentHeroRef} className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-black/80 border-2 border-purple-400 flex items-center justify-center text-2xl shadow-void">
            {opponent.avatar}
            <div className="absolute -bottom-1 -right-1 bg-yellow-950 border border-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-yellow-300 shadow">
              ★{opponent.tavernTier}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-cinzel font-bold text-sm text-purple-300">
                {opponent.name}
              </h3>
              <span className="text-[10px] text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                {opponent.hero.name}
              </span>
            </div>
            <span className="text-xs font-bold text-red-400">
              ❤️ {opponentHp} / {opponent.maxHp} HP
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/60 rounded-xl p-1 border border-slate-700 text-xs font-bold">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-0.5 rounded-lg transition-all ${speed === s ? 'bg-cyan-500 text-black font-black shadow' : 'text-slate-400 hover:text-white'}`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl border border-slate-600 shadow"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Resume'}
          </button>

          <button
            onClick={skipToEnd}
            className="px-3.5 py-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black text-xs font-cinzel font-bold rounded-xl shadow-brass"
          >
            ⏩ Fast Forward
          </button>
        </div>
      </div>

      {/* 3D Isometric Battlefield */}
      <div
        className="flex-1 flex flex-col justify-center gap-8 my-2 z-20"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Top 3D Formation (Opponent Minions) */}
        <div
          className="flex items-center justify-center gap-3 p-3 bg-[#130b29]/80 rounded-2xl border-2 border-purple-900/60 shadow-[0_15px_30px_rgba(0,0,0,0.8)] velvet-mat transition-all duration-300 min-h-[140px]"
          style={{
            transform: 'rotateX(18deg) translateZ(0px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {board2.length > 0 ? (
            board2.map(minion => {
              const transform = cardTransforms[minion.instanceId];
              const transformStyle = transform
                ? `translate3d(${transform.x}px, ${transform.y}px, ${transform.z}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) rotateZ(${transform.rotateZ}deg) scale(${transform.scale})`
                : 'translate3d(0,0,0)';

              return (
                <div
                  key={minion.instanceId}
                  ref={el => {
                    if (el) cardElements.current.set(minion.instanceId, el);
                  }}
                  className="transition-transform duration-150"
                  style={{
                    transform: transformStyle,
                    transformStyle: 'preserve-3d',
                    zIndex: transform?.z && transform.z > 0 ? 40 : 10,
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
              Enemy lines obliterated.
            </div>
          )}
        </div>

        {/* Center Clash Rift & Narration Banner */}
        <div className="flex items-center justify-between px-8 z-10">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
          <div className="px-6 py-1.5 bg-[#180e38] border-2 border-yellow-500/60 rounded-full text-xs font-cinzel font-bold text-yellow-300 shadow-brass animate-pulse">
            {logMessages[0] || '⚔️ THE ASTRAL CLASH ⚔️'}
          </div>
          <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
        </div>

        {/* Bottom 3D Formation (Player Minions) */}
        <div
          className="flex items-center justify-center gap-3 p-3 bg-[#100a26]/80 rounded-2xl border-2 border-cyan-900/60 shadow-[0_15px_30px_rgba(0,0,0,0.8)] velvet-mat transition-all duration-300 min-h-[140px]"
          style={{
            transform: 'rotateX(-12deg) translateZ(0px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {board1.length > 0 ? (
            board1.map(minion => {
              const transform = cardTransforms[minion.instanceId];
              const transformStyle = transform
                ? `translate3d(${transform.x}px, ${transform.y}px, ${transform.z}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) rotateZ(${transform.rotateZ}deg) scale(${transform.scale})`
                : 'translate3d(0,0,0)';

              return (
                <div
                  key={minion.instanceId}
                  ref={el => {
                    if (el) cardElements.current.set(minion.instanceId, el);
                  }}
                  className="transition-transform duration-150"
                  style={{
                    transform: transformStyle,
                    transformStyle: 'preserve-3d',
                    zIndex: transform?.z && transform.z > 0 ? 40 : 10,
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

      {/* Victory / Defeat Modal */}
      {combatFinished && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn p-6">
          <div className="max-w-md w-full bg-[#140b2b] border-2 border-yellow-400 rounded-3xl p-6 shadow-golden text-center flex flex-col items-center">
            <span className="text-6xl mb-2 animate-bounce">
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
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-cinzel font-bold text-sm rounded-xl shadow-brass transition-all hover:scale-105 active:scale-95"
            >
              CONTINUE TO TAVERN (NEXT ROUND) ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
