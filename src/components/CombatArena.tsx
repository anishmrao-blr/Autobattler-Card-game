// Fix CombatArena.tsx
import React, { useState, useEffect, useRef } from 'react';
import { CombatSimulationResult } from '../engine/combat';
import { BoardMinion, CombatEvent, PlayerState } from '../types';
import { CardView } from './CardView';
import { sound } from '../audio/sound';
import confetti from 'canvas-confetti';

interface CombatArenaProps {
  player: PlayerState;
  combatResult: CombatSimulationResult;
  onFinishCombat: () => void;
}

export const CombatArena: React.FC<CombatArenaProps> = ({
  player,
  combatResult,
  onFinishCombat,
}) => {
  const [currentEventIdx, setCurrentEventIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);

  const [board1, setBoard1] = useState<BoardMinion[]>([]);
  const [board2, setBoard2] = useState<BoardMinion[]>([]);
  const [attackingId, setAttackingId] = useState<string | undefined>();
  const [hitTargetId, setHitTargetId] = useState<string | undefined>();
  const [damageMap, setDamageMap] = useState<Record<string, number>>({});
  const [brokenBarrierId, setBrokenBarrierId] = useState<string | undefined>();
  const [combatFinished, setCombatFinished] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBoard1(player.board.map(m => ({ ...m, keywords: [...m.keywords] })));
    setLogMessages([`Combat initiated: ${player.name} vs ${combatResult.winnerSide === 1 ? combatResult.loserName : combatResult.winnerName}`]);
  }, [player, combatResult]);

  useEffect(() => {
    if (!isPlaying || combatFinished) return;

    const events = combatResult.events;
    if (currentEventIdx >= events.length) {
      setCombatFinished(true);
      if (combatResult.winnerSide === 1) {
        sound.playVictory();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
      return;
    }

    const event = events[currentEventIdx];
    const delay = Math.max(150, 700 / speed);

    timerRef.current = setTimeout(() => {
      processEvent(event);
      setCurrentEventIdx(prev => prev + 1);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentEventIdx, isPlaying, speed, combatResult, combatFinished]);

  const processEvent = (event: CombatEvent) => {
    switch (event.type) {
      case 'ATTACK_START':
        setAttackingId(event.attackerId);
        setHitTargetId(event.defenderId);
        sound.playAttackLunge();
        setLogMessages(prev => [
          `⚔️ ${event.minionName} lunges at ${event.defenderName}`,
          ...prev.slice(0, 4)
        ]);
        break;

      case 'DAMAGE_DEALT':
        sound.playImpactDamage(event.isLethal);
        setDamageMap(prev => ({ ...prev, [event.targetId]: event.amount }));
        setTimeout(() => setDamageMap({}), 400);
        updateMinionHealth(event.targetId, event.remainingHp);
        break;

      case 'CLEAVE_DAMAGE':
        sound.playImpactDamage(event.isLethal);
        setDamageMap(prev => ({ ...prev, [event.targetId]: event.amount }));
        setTimeout(() => setDamageMap({}), 400);
        updateMinionHealth(event.targetId, event.remainingHp);
        break;

      case 'BARRIER_BROKEN':
        sound.playBarrierBreak();
        setBrokenBarrierId(event.targetId);
        setTimeout(() => setBrokenBarrierId(undefined), 500);
        break;

      case 'MINION_DIED':
        setLogMessages(prev => [`💀 ${event.minionName} was destroyed!`, ...prev.slice(0, 4)]);
        removeMinionFromBoard(event.minionId);
        break;

      case 'TOKEN_SPAWNED':
        sound.playCardSnap();
        if (event.side === 1) {
          setBoard1(prev => [...prev, event.minion]);
        } else {
          setBoard2(prev => [...prev, event.minion]);
        }
        break;

      case 'COMBAT_END':
        setAttackingId(undefined);
        setHitTargetId(undefined);
        setCombatFinished(true);
        if (event.winnerSide === 1) {
          sound.playVictory();
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        }
        break;
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

  const skipToEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentEventIdx(combatResult.events.length);
    setCombatFinished(true);
    if (combatResult.winnerSide === 1) {
      sound.playVictory();
    }
  };

  const isPlayerWinner = combatResult.winnerSide === 1;
  const isTie = combatResult.winnerSide === 0;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 bg-[#070412] overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-950/30 via-transparent to-black pointer-events-none" />

      <div className="flex items-center justify-between z-10 bg-[#120a26]/90 border border-yellow-600/30 p-2.5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black/80 border border-purple-400 flex items-center justify-center text-xl shadow">
            ⚔️
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-sm text-purple-300">
              {combatResult.winnerSide === 1 ? combatResult.loserName : combatResult.winnerName}
            </h3>
            <span className="text-[10px] text-slate-400">Enemy Formation</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/60 rounded-xl p-1 border border-slate-700 text-xs font-bold">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded-lg transition-all ${speed === s ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl border border-slate-600"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Resume'}
          </button>

          <button
            onClick={skipToEnd}
            className="px-3 py-1 bg-yellow-950/80 hover:bg-yellow-900 border border-yellow-500 text-yellow-300 text-xs font-bold rounded-xl shadow"
          >
            ⏩ Skip
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6 my-2 z-10">
        <div className="flex items-center justify-center gap-3 min-h-[140px] p-2 bg-[#120c24]/60 rounded-2xl border border-purple-950/60 velvet-mat">
          {board2.length > 0 ? (
            board2.map(minion => (
              <CardView
                key={minion.instanceId}
                boardMinion={minion}
                size="md"
                isAttacking={attackingId === minion.instanceId}
                isHit={hitTargetId === minion.instanceId}
                damageReceived={damageMap[minion.instanceId]}
                barrierBroken={brokenBarrierId === minion.instanceId}
              />
            ))
          ) : (
            <div className="text-slate-600 font-cinzel text-xs py-8">
              Enemy lines shattered.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
          <div className="px-4 py-1 bg-[#160d33] border border-yellow-500/50 rounded-full text-xs font-cinzel font-bold text-yellow-300 shadow-brass">
            {logMessages[0] || '⚔️ COMBAT CLASH ⚔️'}
          </div>
          <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        </div>

        <div className="flex items-center justify-center gap-3 min-h-[140px] p-2 bg-[#120c24]/60 rounded-2xl border border-cyan-950/60 velvet-mat">
          {board1.length > 0 ? (
            board1.map(minion => (
              <CardView
                key={minion.instanceId}
                boardMinion={minion}
                size="md"
                isAttacking={attackingId === minion.instanceId}
                isHit={hitTargetId === minion.instanceId}
                damageReceived={damageMap[minion.instanceId]}
                barrierBroken={brokenBarrierId === minion.instanceId}
              />
            ))
          ) : (
            <div className="text-slate-600 font-cinzel text-xs py-8">
              Your minions have fallen.
            </div>
          )}
        </div>
      </div>

      {combatFinished && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn p-6">
          <div className="max-w-md w-full bg-[#120b24] border-2 border-yellow-500 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
            <span className="text-5xl mb-2">
              {isPlayerWinner ? '🏆' : isTie ? '⚖️' : '💀'}
            </span>
            <h2 className={`font-cinzel text-2xl font-black mb-1 ${isPlayerWinner ? 'text-yellow-400' : isTie ? 'text-slate-300' : 'text-red-500'}`}>
              {isPlayerWinner ? 'VICTORY!' : isTie ? 'STALEMATE (TIE)' : 'DEFEAT!'}
            </h2>

            <p className="text-xs text-slate-300 mb-4 font-sans">
              {isPlayerWinner
                ? `You dealt ${combatResult.damageDealt} damage to ${combatResult.loserName}!`
                : isTie
                ? 'Both armies wiped each other out simultaneously.'
                : `You suffered ${combatResult.damageDealt} damage from ${combatResult.winnerName}!`}
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
