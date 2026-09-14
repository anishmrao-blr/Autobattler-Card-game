import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameCoordinator } from './engine/game';
import { Hero, PlayerState, MinionCard, BoardMinion } from './types';
import { getFactionForHero } from './engine/lore';
import { MINION_DATABASE, createBoardMinion } from './engine/cards';
import { HomePageModal } from './components/HomePageModal';
import { HeroSelectModal } from './components/HeroSelectModal';
import { HeroProfileModal } from './components/HeroProfileModal';
import { CardInspectorModal } from './components/CardInspectorModal';
import { AstralCodexModal } from './components/AstralCodexModal';
import { DiscoverModal } from './components/DiscoverModal';
import { HeaderHUD } from './components/HeaderHUD';
import { Leaderboard } from './components/Leaderboard';
import { TavernShop } from './components/TavernShop';
import { Board } from './components/Board';
import { HandTray } from './components/HandTray';
import { CombatArena3D } from './components/CombatArena3D';
import { GameMenuModal } from './components/GameMenuModal';
import { TutorialOverlay, TUTORIAL_STORAGE_KEY } from './components/TutorialOverlay';
import { LoopingVideo } from './components/LoopingVideo';
import { sound } from './audio/sound';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const gameRef = useRef<GameCoordinator>(new GameCoordinator());
  const [phase, setPhase] = useState<'HOME' | 'HERO_SELECT' | 'TAVERN' | 'COMBAT' | 'GAME_OVER'>('HOME');
  const [human, setHuman] = useState<PlayerState | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerState[]>([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [timeLeft, setTimeLeft] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [discoverOptions, setDiscoverOptions] = useState<MinionCard[] | null>(null);
  const [discoverTier, setDiscoverTier] = useState<number>(2);

  // Inspector & Codex States
  const [inspectingCard, setInspectingCard] = useState<MinionCard | undefined>(undefined);
  const [inspectingBoardMinion, setInspectingBoardMinion] = useState<BoardMinion | undefined>(undefined);
  const [inspectingHero, setInspectingHero] = useState<Hero | null>(null);
  const [showCodex, setShowCodex] = useState<boolean>(false);
  const [showGameMenu, setShowGameMenu] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showMobileLobby, setShowMobileLobby] = useState<boolean>(false);
  const [playerCallsign, setPlayerCallsign] = useState<string>('Commander Thorne');

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

  const nextOpponent = useMemo(() => {
    if (phase !== 'TAVERN' || !human) return undefined;
    return gameRef.current.getNextOpponent(human);
  }, [phase, currentTurn, human?.id]);

  const combatOdds = useMemo(() => {
    if (phase !== 'TAVERN' || !human || !nextOpponent) return undefined;
    return gameRef.current.combat.simulateMonteCarloOdds(human, nextOpponent, 100);
  }, [phase, currentTurn, human?.board, nextOpponent]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__testHarness = {
        addCoins: (amount: number) => {
          const p = gameRef.current.getHumanPlayer();
          p.coins += amount;
          syncState();
        },
        setupTestBoard: (count = 4) => {
          const p = gameRef.current.getHumanPlayer();
          p.board = MINION_DATABASE.slice(0, count).map(card => createBoardMinion(card));
          syncState();
        },
        setupTestHand: (count = 3) => {
          const p = gameRef.current.getHumanPlayer();
          p.hand = MINION_DATABASE.slice(0, count).map(card => ({ ...card }));
          syncState();
        },
        gameCoordinator: gameRef.current,
        syncState,
      };
    }
  }, []);

  useEffect(() => {
    if (phase !== 'TAVERN' || inspectingCard || inspectingBoardMinion || inspectingHero || showCodex || showTutorial || showGameMenu) return;

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
  }, [phase, currentTurn, inspectingCard, inspectingBoardMinion, inspectingHero, showCodex, showTutorial, showGameMenu]);

  // Global ESC Key Handler (Closes submodals first, then toggles Game Menu)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTutorial) {
          setShowTutorial(false);
          return;
        }
        if (showCodex) {
          setShowCodex(false);
          return;
        }
        if (inspectingCard || inspectingBoardMinion) {
          setInspectingCard(undefined);
          setInspectingBoardMinion(undefined);
          return;
        }
        if (inspectingHero) {
          setInspectingHero(null);
          return;
        }
        if (phase === 'TAVERN' || phase === 'COMBAT') {
          sound.playCardSnap();
          setShowGameMenu(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, showCodex, showTutorial, inspectingCard, inspectingBoardMinion, inspectingHero]);

  const handleLogin = (name: string, _title: string) => {
    setPlayerCallsign(name);
    setPhase('HERO_SELECT');
  };

  const handleSelectHero = (hero: Hero) => {
    const game = gameRef.current;
    const isFirstEverMatch = typeof window !== 'undefined' && !localStorage.getItem(TUTORIAL_STORAGE_KEY);
    // A brand-new player's first turn is genuinely harder than every turn
    // after it - unfamiliar shop, unfamiliar keywords - so it gets extra
    // real time on top of the standard 70s. Returning players are unaffected.
    setTimeLeft(isFirstEverMatch ? 100 : 70);
    game.initGame(hero, playerCallsign || 'Commander Player');
    syncState();
    if (isFirstEverMatch) {
      setShowTutorial(true);
    }
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

  const handleReorderHand = (fromIndex: number, toIndex: number) => {
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    game.tavern.reorderHand(p, fromIndex, toIndex);
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

  const handleInspectCard = (card?: MinionCard, boardMinion?: BoardMinion) => {
    setInspectingCard(card);
    setInspectingBoardMinion(boardMinion);
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
      setTimeLeft(70);
      game.startNewTurn();
      syncState();
    }
  };

  const handleConcede = () => {
    setShowGameMenu(false);
    const game = gameRef.current;
    const p = game.getHumanPlayer();
    game.concedeGame(p);
    syncState();
  };

  const handleExitToLogin = () => {
    setShowGameMenu(false);
    handleRestartGame();
  };

  const handleRestartGame = () => {
    gameRef.current = new GameCoordinator();
    setPhase('HOME');
    setHuman(null);
    setDiscoverOptions(null);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // HOME / LOGIN PHASE
  if (phase === 'HOME') {
    return (
      <>
        {showCodex && <AstralCodexModal onClose={() => setShowCodex(false)} />}
        <HomePageModal
          onLogin={handleLogin}
          onOpenCodex={() => setShowCodex(true)}
        />
      </>
    );
  }

  // HERO SELECT PHASE
  if (phase === 'HERO_SELECT' || !human) {
    return (
      <>
        {showCodex && <AstralCodexModal onClose={() => setShowCodex(false)} />}
        <HeroSelectModal onSelectHero={handleSelectHero} onBackToLogin={handleRestartGame} />
      </>
    );
  }

  // GAME OVER SCREEN
  if (phase === 'GAME_OVER') {
    const isWinner = human?.placement === 1;
    const humanFaction = human?.hero ? getFactionForHero(human.hero) : undefined;
    if (isWinner) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }

    return (
      <main className="fixed inset-0 bg-[#05030b] flex flex-col items-center justify-center p-6 text-center z-50 overflow-hidden">
        {/* Ambient Victory / Defeat Background Video with Static Poster Fallback */}
        <LoopingVideo
          aria-hidden="true"
          poster={isWinner ? '/assets/art/astral_portal.jpg' : '/assets/art/void_devourer.jpg'}
          className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none filter blur-sm"
          src={isWinner ? '/assets/video/reward_chest.mp4' : '/assets/video/defeat_monster.mp4'}
        />
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />

        <div className="relative max-w-md w-full bg-[#120a26]/95 border-2 border-yellow-500 rounded-3xl p-8 shadow-golden flex flex-col items-center z-10">
          {/* Result Cinematic Video Badge */}
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-yellow-500/70 shadow-lg mb-3 bg-black/90 flex items-center justify-center">
            <LoopingVideo
              poster={isWinner ? '/assets/art/hero_chronos.jpg' : '/assets/art/void_devourer.jpg'}
              className="w-full h-full object-cover"
              src={isWinner ? '/assets/video/elemental_burst.mp4' : '/assets/video/defeat_monster.mp4'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <span className="absolute bottom-1 right-1 text-xl">
              {isWinner ? '👑' : '💀'}
            </span>
          </div>

          <h1 className={`font-cinzel text-3xl font-black mb-2 ${isWinner ? 'text-yellow-400' : 'text-red-500'}`}>
            {isWinner ? 'CHAMPION OF THE AETHERIUM!' : 'MATCH CONCLUDED'}
          </h1>
          <p className="text-sm text-purple-200 mb-4 font-sans">
            You finished in <span className="font-bold text-yellow-300">#{human?.placement || 8} Place</span> out of 8 players!
          </p>

          {/* Faction Narrative Stake */}
          {humanFaction && (
            <div className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-center shadow-inner">
              <div className="text-xs font-cinzel font-bold text-amber-300">
                🛡️ {humanFaction.name}
              </div>
              <div className="text-[11px] text-purple-200 italic font-serif mt-0.5 leading-snug">
                {isWinner
                  ? `The ${humanFaction.name}'s grip on the Infinite Core tightens.`
                  : `The ${humanFaction.name}'s grip on the Infinite Core slips into entropy.`}
              </div>
            </div>
          )}

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
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-cinzel font-bold text-sm rounded-xl shadow-brass transition-[transform,background-color,box-shadow] hover:scale-105 cursor-pointer"
          >
            PLAY AGAIN ➔
          </button>
          <button
            onClick={handleRestartGame}
            className="w-full mt-2 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-cinzel font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            🚪 EXIT TO LOGIN SCREEN
          </button>
        </div>
      </main>
    );
  }

  // 3D COMBAT VIEW PHASE
  if (phase === 'COMBAT' && gameRef.current.lastHumanCombatResult) {
    return (
      <>
        <CombatArena3D
          key={`combat-${currentTurn}`}
          player={human}
          combatResult={gameRef.current.lastHumanCombatResult}
          turnNumber={currentTurn}
          onFinishCombat={handleFinishCombat}
          onOpenMenu={() => setShowGameMenu(true)}
        />
        {showGameMenu && (
          <GameMenuModal
            onClose={() => setShowGameMenu(false)}
            onConcede={handleConcede}
            onExitToLogin={handleExitToLogin}
            onOpenCodex={() => setShowCodex(true)}
            predictedPlacement={gameRef.current.getPredictedPlacement(human || undefined)}
            playerName={human?.name}
            heroName={human?.hero.name}
            avatar={human?.avatar}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            currentPhase="COMBAT"
          />
        )}
        {showCodex && <AstralCodexModal onClose={() => setShowCodex(false)} />}
      </>
    );
  }

  // MAIN TAVERN SHOP & BATTLEFIELD VIEW
  return (
    <div className="relative w-screen h-screen flex flex-col justify-between overflow-hidden bg-[#070412]">
      {/* Astral Codex Modal */}
      {showCodex && <AstralCodexModal onClose={() => setShowCodex(false)} />}

      {/* Global Card Inspector Modal */}
      {(inspectingCard || inspectingBoardMinion) && (
        <CardInspectorModal
          card={inspectingCard}
          boardMinion={inspectingBoardMinion}
          onClose={() => {
            setInspectingCard(undefined);
            setInspectingBoardMinion(undefined);
          }}
        />
      )}

      {/* Hero Profile Showcase Modal */}
      {inspectingHero && (
        <HeroProfileModal
          hero={inspectingHero}
          onClose={() => setInspectingHero(null)}
        />
      )}

      {/* Triplet Discover Modal */}
      {discoverOptions && (
        <DiscoverModal
          options={discoverOptions}
          tier={discoverTier}
          onChoose={handleChooseDiscover}
          onInspect={handleInspectCard}
        />
      )}

      {/* AAA Game Menu / Settings Modal */}
      {showGameMenu && (
        <GameMenuModal
          onClose={() => setShowGameMenu(false)}
          onConcede={handleConcede}
          onExitToLogin={handleExitToLogin}
          onOpenCodex={() => setShowCodex(true)}
          onOpenTutorial={() => setShowTutorial(true)}
          predictedPlacement={gameRef.current.getPredictedPlacement(human || undefined)}
          playerName={human?.name}
          heroName={human?.hero.name}
          avatar={human?.avatar}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          currentPhase="TAVERN"
        />
      )}

      {/* Guided First-Match Tutorial Overlay */}
      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <HeaderHUD
        player={human}
        currentTurn={currentTurn}
        timeLeft={timeLeft}
        onReadyCombat={handleReadyCombat}
        onOpenCodex={() => setShowCodex(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenMenu={() => setShowGameMenu(true)}
        onToggleMobileLobby={() => setShowMobileLobby(prev => !prev)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar Leaderboard */}
        <aside className="hidden lg:block h-full flex-shrink-0">
          <Leaderboard players={allPlayers} currentTurn={currentTurn} />
        </aside>

        {/* Mobile Slide-Over Lobby Drawer */}
        {showMobileLobby && (
          <div className="fixed inset-0 z-40 lg:hidden flex animate-fadeIn">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowMobileLobby(false)}
            />
            <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-[#0a0717] border-r border-yellow-500/40 shadow-2xl">
              <Leaderboard
                players={allPlayers}
                currentTurn={currentTurn}
                onClose={() => setShowMobileLobby(false)}
              />
            </aside>
          </div>
        )}

        <main className="w-full flex-1 flex flex-col justify-start p-2 sm:p-4 overflow-y-auto scroll-stable gap-2 sm:gap-3">
          <TavernShop
            player={human}
            forecastOdds={combatOdds}
            opponentName={nextOpponent?.name}
            onBuyMinion={handleBuyMinion}
            onReroll={handleReroll}
            onToggleFreeze={handleToggleFreeze}
            onUpgradeTier={handleUpgradeTier}
            onInspect={handleInspectCard}
          />

          <Board
            minions={human.board}
            onReorder={handleReorderBoard}
            onSellMinion={handleSellMinion}
            onInspect={handleInspectCard}
          />
        </main>
      </div>

      <footer>
        <HandTray
          player={human}
          hand={human.hand}
          boardCount={human.board.length}
          onPlayCard={handlePlayCard}
          onReorderHand={handleReorderHand}
          onUseHeroPower={handleUseHeroPower}
          onInspectHero={() => setInspectingHero(human.hero)}
          onInspect={handleInspectCard}
        />
      </footer>
    </div>
  );
};

export default App;
