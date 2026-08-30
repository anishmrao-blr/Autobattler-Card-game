import React, { useState, useEffect, useRef } from 'react';
import { GameCoordinator } from './engine/game';
import { Hero, PlayerState, MinionCard } from './types';
import { HeroSelectModal } from './components/HeroSelectModal';
import { DiscoverModal } from './components/DiscoverModal';
import { HeaderHUD } from './components/HeaderHUD';
import { Leaderboard } from './components/Leaderboard';
import { TavernShop } from './components/TavernShop';
import { Board } from './components/Board';
import { HandTray } from './components/HandTray';
import { CombatArena3D } from './components/CombatArena3D';
import { sound } from './audio/sound';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const gameRef = useRef<GameCoordinator>(new GameCoordinator());
  const [phase, setPhase] = useState<'HERO_SELECT' | 'TAVERN' | 'COMBAT' | 'GAME_OVER'>('HERO_SELECT');
  const [human, setHuman] = useState<PlayerState | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerState[]>([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isMuted, setIsMuted] = useState(false);
  const [discoverOptions, setDiscoverOptions] = useState<MinionCard[] | null>(null);
  const [discoverTier, setDiscoverTier] = useState<number>(2);

  const syncState = () => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    setHuman({ ...p, board: [...p.board], hand: [...p.hand], tavernSlots: [...p.tavernSlots] });
    setAllPlayers([...game.players]);
    setCurrentTurn(game.currentTurn);
    setPhase(game.matchPhase);

    if (p.discoverOptions && p.discoverOptions.length > 0) {
      setDiscoverOptions([...p.discoverOptions]);
      setDiscoverTier(p.tripletRewardPending || 2);
    } else {
      setDiscoverOptions(null);
    }
  };

  useEffect(() => {
    if (phase !== 'TAVERN') return;

    setTimeLeft(45);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleReadyCombat();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, currentTurn]);

  const handleSelectHero = (hero: Hero) => {
    const game = gameRef.current;
    game.initGame(hero, 'Commander Player');
    syncState();
  };

  const handleBuyMinion = (index: number) => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    const success = game.tavern.buyMinion(p, index);
    if (success) syncState();
  };

  const handleSellMinion = (index: number) => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    const success = game.tavern.sellMinion(p, index);
    if (success) syncState();
  };

  const handlePlayCard = (handIndex: number) => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    const success = game.tavern.playMinionFromHand(p, handIndex);
    if (success) syncState();
  };

  const handleReorderBoard = (fromIndex: number, toIndex: number) => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    game.tavern.reorderBoard(p, fromIndex, toIndex);
    syncState();
  };

  const handleReroll = () => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    const success = game.tavern.reroll(p);
    if (success) syncState();
  };

  const handleToggleFreeze = () => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    game.tavern.toggleFreeze(p);
    syncState();
  };

  const handleUpgradeTier = () => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    const success = game.tavern.upgradeTier(p);
    if (success) syncState();
  };

  const handleUseHeroPower = () => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();

    if (p.hero.id === 'hero_nyx' && p.board.length > 0 && p.coins >= 1) {
      p.coins -= 1;
      p.board.splice(0, 1);
      const voidCards = game.pool.rollTavern(p.tavernTier, 1);
      if (voidCards.length > 0 && p.hand.length < 10) {
        p.hand.push(voidCards[0]);
      }
      syncState();
    } else if (p.hero.id === 'hero_aurelius' && p.board.length > 0 && p.coins >= 1) {
      p.coins -= 1;
      const target = p.board[Math.floor(Math.random() * p.board.length)];
      target.attack += 2;
      target.health += 3;
      target.maxHealth += 3;
      syncState();
    } else if (p.hero.id === 'hero_vespera' && p.coins >= 1) {
      p.coins -= 1;
      const celestialOpts = game.pool.getDiscoverOptions(p.tavernTier, 3);
      setDiscoverOptions(celestialOpts);
      setDiscoverTier(p.tavernTier);
    }
  };

  const handleChooseDiscover = (choiceIndex: number) => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    game.tavern.chooseDiscover(p, choiceIndex);
    setDiscoverOptions(null);
    syncState();
  };

  const handleReadyCombat = () => {
    const game = gameRef.current;
    game.resolveCombatPhase();
    syncState();
  };

  const handleFinishCombat = () => {
    const game = gameRef.current;
    if (game.matchPhase === 'GAME_OVER') {
      syncState();
    } else {
      game.startNewTurn();
      syncState();
    }
  };

  const handleRestartGame = () => {
    gameRef.current = new GameCoordinator();
    setPhase('HERO_SELECT');
    setHuman(null);
    setDiscoverOptions(null);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  if (phase === 'HERO_SELECT' || !human) {
    return <HeroSelectModal onSelectHero={handleSelectHero} />;
  }

  if (phase === 'GAME_OVER') {
    const isWinner = human.placement === 1;
    if (isWinner) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }

    return (
      <div className="fixed inset-0 bg-[#05030b] flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="max-w-md w-full bg-[#120a26] border-2 border-yellow-500 rounded-3xl p-8 shadow-golden flex flex-col items-center">
          <span className="text-6xl mb-3">{isWinner ? '👑' : '💀'}</span>
          <h1 className={`font-cinzel text-3xl font-black mb-2 ${isWinner ? 'text-yellow-400' : 'text-red-500'}`}>
            {isWinner ? 'CHAMPION OF THE AETHERIUM!' : 'MATCH CONCLUDED'}
          </h1>
          <p className="text-sm text-purple-200 mb-6 font-sans">
            You finished in <span className="font-bold text-yellow-300">#{human.placement || 8} Place</span> out of 8 players!
          </p>

          <div className="w-full bg-black/60 rounded-xl p-4 border border-purple-900 mb-6 text-xs text-slate-300 space-y-2">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Final Tavern Tier:</span>
              <span className="font-bold text-yellow-400">★ {human.tavernTier}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Astral Forged Triples:</span>
              <span className="font-bold text-cyan-300">{human.triplesFound}</span>
            </div>
            <div className="flex justify-between">
              <span>Highest Win Streak:</span>
              <span className="font-bold text-amber-400">🔥 {human.winStreak}</span>
            </div>
          </div>

          <button
            onClick={handleRestartGame}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-cinzel font-bold text-sm rounded-xl shadow-brass transition-all hover:scale-105"
          >
            PLAY AGAIN ➔
          </button>
        </div>
      </div>
    );
  }

  // 3D COMBAT VIEW PHASE
  if (phase === 'COMBAT' && gameRef.current.lastHumanCombatResult) {
    return (
      <CombatArena3D
        player={human}
        combatResult={gameRef.current.lastHumanCombatResult}
        onFinishCombat={handleFinishCombat}
      />
    );
  }

  // MAIN TAVERN SHOP & BATTLEFIELD VIEW
  return (
    <div className="relative w-screen h-screen flex flex-col justify-between overflow-hidden bg-[#070412]">
      {discoverOptions && (
        <DiscoverModal
          options={discoverOptions}
          tier={discoverTier}
          onChoose={handleChooseDiscover}
        />
      )}

      <HeaderHUD
        player={human}
        currentTurn={currentTurn}
        timeLeft={timeLeft}
        onReadyCombat={handleReadyCombat}
        onUseHeroPower={handleUseHeroPower}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      <div className="flex-1 flex overflow-hidden">
        <Leaderboard players={allPlayers} currentTurn={currentTurn} />

        <main className="flex-1 flex flex-col justify-between p-4 overflow-y-auto gap-3">
          <TavernShop
            player={human}
            onBuyMinion={handleBuyMinion}
            onReroll={handleReroll}
            onToggleFreeze={handleToggleFreeze}
            onUpgradeTier={handleUpgradeTier}
          />

          <Board
            minions={human.board}
            onReorder={handleReorderBoard}
            onSellMinion={handleSellMinion}
          />
        </main>
      </div>

      <HandTray
        hand={human.hand}
        boardCount={human.board.length}
        onPlayCard={handlePlayCard}
      />
    </div>
  );
};

export default App;
