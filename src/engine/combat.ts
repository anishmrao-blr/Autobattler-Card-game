// Fix combat.ts to include initial boards and players in CombatSimulationResult
import { BoardMinion, CombatEvent, PlayerState } from '../types';
import { createBoardMinion, TOKEN_MINIONS } from './cards';

export interface CombatSimulationResult {
  winnerSide: 1 | 2 | 0;
  winnerName: string;
  loserName: string;
  damageDealt: number;
  winnerTier: number;
  survivingMinions: BoardMinion[];
  events: CombatEvent[];
  p1: PlayerState;
  p2: PlayerState;
  initialBoard1: BoardMinion[];
  initialBoard2: BoardMinion[];
}

export class CombatResolver {
  public simulate1v1(p1: PlayerState, p2: PlayerState): CombatSimulationResult {
    const events: CombatEvent[] = [];

    // Capture initial boards before combat
    const initialBoard1: BoardMinion[] = p1.board.map(m => ({ ...m, keywords: [...m.keywords] }));
    const initialBoard2: BoardMinion[] = p2.board.map(m => ({ ...m, keywords: [...m.keywords] }));

    // Deep clones for mutable simulation
    const board1: BoardMinion[] = p1.board.map(m => ({ ...m, keywords: [...m.keywords] }));
    const board2: BoardMinion[] = p2.board.map(m => ({ ...m, keywords: [...m.keywords] }));

    this.applyStartOfCombatPassives(p1, board1);
    this.applyStartOfCombatPassives(p2, board2);

    this.applyStartOfCombatMinionAuras(board1);
    this.applyStartOfCombatMinionAuras(board2);

    let currentSide: 1 | 2 = 1;
    if (board1.length > board2.length) {
      currentSide = 1;
    } else if (board2.length > board1.length) {
      currentSide = 2;
    } else {
      currentSide = Math.random() < 0.5 ? 1 : 2;
    }

    events.push({
      type: 'COMBAT_START',
      player1Name: p1.name,
      player2Name: p2.name,
      player1Hero: p1.hero.name,
      player2Hero: p2.hero.name,
      firstAttacker: currentSide,
    });

    let p1Cursor = 0;
    let p2Cursor = 0;
    let turnCount = 0;
    const MAX_TURNS = 100;

    while (this.hasLivingMinions(board1) && this.hasLivingMinions(board2) && turnCount < MAX_TURNS) {
      turnCount++;

      const attackingBoard = currentSide === 1 ? board1 : board2;
      const defendingBoard = currentSide === 1 ? board2 : board1;
      let cursor = currentSide === 1 ? p1Cursor : p2Cursor;

      const livingAttackers = attackingBoard.filter(m => m.health > 0 && m.attack > 0);
      if (livingAttackers.length === 0) {
        currentSide = currentSide === 1 ? 2 : 1;
        continue;
      }

      if (cursor >= attackingBoard.length) {
        cursor = 0;
      }

      let attacker: BoardMinion | undefined;
      for (let i = 0; i < attackingBoard.length; i++) {
        const idx = (cursor + i) % attackingBoard.length;
        if (attackingBoard[idx].health > 0 && attackingBoard[idx].attack > 0) {
          attacker = attackingBoard[idx];
          cursor = (idx + 1) % attackingBoard.length;
          break;
        }
      }

      if (!attacker) {
        currentSide = currentSide === 1 ? 2 : 1;
        continue;
      }

      if (currentSide === 1) p1Cursor = cursor;
      else p2Cursor = cursor;

      const attackIterations = attacker.keywords.includes('OVERCLOCK') ? 2 : 1;
      for (let iter = 0; iter < attackIterations; iter++) {
        if (attacker.health <= 0 || !this.hasLivingMinions(defendingBoard)) break;

        const defender = this.selectDefender(defendingBoard);
        if (!defender) break;

        this.executeSingleAttack(
          attacker,
          defender,
          currentSide,
          attackingBoard,
          defendingBoard,
          events
        );
      }

      currentSide = currentSide === 1 ? 2 : 1;
    }

    const p1Alive = board1.filter(m => m.health > 0);
    const p2Alive = board2.filter(m => m.health > 0);

    let winnerSide: 1 | 2 | 0 = 0;
    let damageDealt = 0;
    let winnerName = 'Tie';
    let loserName = 'Tie';
    let winnerTier = 1;
    let survivingMinionTiers: number[] = [];

    if (p1Alive.length > 0 && p2Alive.length === 0) {
      winnerSide = 1;
      winnerName = p1.name;
      loserName = p2.name;
      winnerTier = p1.tavernTier;
      survivingMinionTiers = p1Alive.map(m => m.tier);
      damageDealt = winnerTier + survivingMinionTiers.reduce((a, b) => a + b, 0);
    } else if (p2Alive.length > 0 && p1Alive.length === 0) {
      winnerSide = 2;
      winnerName = p2.name;
      loserName = p1.name;
      winnerTier = p2.tavernTier;
      survivingMinionTiers = p2Alive.map(m => m.tier);
      damageDealt = winnerTier + survivingMinionTiers.reduce((a, b) => a + b, 0);
    }

    events.push({
      type: 'COMBAT_END',
      winnerSide,
      damageDealt,
      winnerName,
      loserName,
      winnerTier,
      survivingMinionTiers,
    });

    return {
      winnerSide,
      winnerName,
      loserName,
      damageDealt,
      winnerTier,
      survivingMinions: winnerSide === 1 ? p1Alive : p2Alive,
      events,
      p1,
      p2,
      initialBoard1,
      initialBoard2,
    };
  }

  private hasLivingMinions(board: BoardMinion[]): boolean {
    return board.some(m => m.health > 0);
  }

  private selectDefender(board: BoardMinion[]): BoardMinion | undefined {
    const living = board.filter(m => m.health > 0);
    if (living.length === 0) return undefined;

    const bastions = living.filter(m => m.keywords.includes('BASTION'));
    if (bastions.length > 0) {
      return bastions[Math.floor(Math.random() * bastions.length)];
    }

    return living[Math.floor(Math.random() * living.length)];
  }

  private executeSingleAttack(
    attacker: BoardMinion,
    defender: BoardMinion,
    attackerSide: 1 | 2,
    attackingBoard: BoardMinion[],
    defendingBoard: BoardMinion[],
    events: CombatEvent[]
  ): void {
    events.push({
      type: 'ATTACK_START',
      attackerId: attacker.instanceId,
      defenderId: defender.instanceId,
      attackerSide,
      minionName: attacker.name,
      defenderName: defender.name,
    });

    this.triggerAttackAuras(attacker, attackingBoard, events);

    const defenderIdx = defendingBoard.findIndex(m => m.instanceId === defender.instanceId);
    const cleaveTargets: BoardMinion[] = [];
    if (attacker.keywords.includes('SWEEP')) {
      if (defenderIdx > 0 && defendingBoard[defenderIdx - 1].health > 0) {
        cleaveTargets.push(defendingBoard[defenderIdx - 1]);
      }
      if (defenderIdx < defendingBoard.length - 1 && defendingBoard[defenderIdx + 1].health > 0) {
        cleaveTargets.push(defendingBoard[defenderIdx + 1]);
      }
    }

    const atkDamage = attacker.attack;
    const defDamage = defender.attack;

    this.applyDamageToMinion(defender, atkDamage, attacker.keywords.includes('MIASMIC'), attacker.instanceId, events);

    for (const cleaveTarget of cleaveTargets) {
      this.applyDamageToMinion(cleaveTarget, atkDamage, attacker.keywords.includes('MIASMIC'), attacker.instanceId, events, true);
    }

    if (defDamage > 0) {
      this.applyDamageToMinion(attacker, defDamage, defender.keywords.includes('MIASMIC'), defender.instanceId, events);
    }

    this.processBoardDeathsAndTriggers(attackingBoard, attackerSide, defendingBoard, events);
    const defendingSide = attackerSide === 1 ? 2 : 1;
    this.processBoardDeathsAndTriggers(defendingBoard, defendingSide, attackingBoard, events);
  }

  private applyDamageToMinion(
    target: BoardMinion,
    damage: number,
    isMiasmic: boolean,
    sourceId: string,
    events: CombatEvent[],
    isCleave = false
  ): void {
    if (target.health <= 0) return;

    if (target.barrierActive) {
      target.barrierActive = false;
      target.keywords = target.keywords.filter(k => k !== 'AETHER_BARRIER');
      events.push({
        type: 'BARRIER_BROKEN',
        targetId: target.instanceId,
      });
      return;
    }

    const lethal = isMiasmic || damage >= target.health;
    target.health -= damage;

    if (isCleave) {
      events.push({
        type: 'CLEAVE_DAMAGE',
        targetId: target.instanceId,
        amount: damage,
        isLethal: lethal,
        remainingHp: target.health,
      });
    } else {
      events.push({
        type: 'DAMAGE_DEALT',
        targetId: target.instanceId,
        amount: damage,
        isLethal: lethal,
        sourceId,
        wasMiasmic: isMiasmic,
        remainingHp: target.health,
      });
    }

    if (target.health > 0) {
      this.triggerTakeDamagePassives(target, events);
    }
  }

  private triggerTakeDamagePassives(minion: BoardMinion, events: CombatEvent[]): void {
    if (minion.cardId === 'auto_sentry') {
      const buff = minion.isGolden ? 2 : 1;
      minion.attack += buff;
      events.push({
        type: 'FRENZY_TRIGGERED',
        targetId: minion.instanceId,
        buffAttack: buff,
        buffHealth: 0,
      });
    }

    if (minion.cardId === 'beast_frenzy') {
      const buff = minion.isGolden ? 4 : 2;
      minion.attack += buff;
      events.push({
        type: 'FRENZY_TRIGGERED',
        targetId: minion.instanceId,
        buffAttack: buff,
        buffHealth: 0,
      });
    }
  }

  private triggerAttackAuras(attacker: BoardMinion, board: BoardMinion[], events: CombatEvent[]): void {
    if (attacker.tribe === 'PIRATE') {
      for (const m of board) {
        if (m.cardId === 'pirate_smuggler' && m.health > 0) {
          const buff = m.isGolden ? 2 : 1;
          attacker.attack += buff;
          events.push({
            type: 'STAT_BUFF',
            targetId: attacker.instanceId,
            attackGain: buff,
            healthGain: 0,
            reason: 'Chrono Smuggler aura',
            newAttack: attacker.attack,
            newHealth: attacker.health,
          });
        }
      }
    }

    if (attacker.tribe === 'AUTOMATA') {
      for (const m of board) {
        if (m.cardId === 'auto_titan' && m.health > 0 && !attacker.barrierActive) {
          attacker.barrierActive = true;
          if (!attacker.keywords.includes('AETHER_BARRIER')) {
            attacker.keywords.push('AETHER_BARRIER');
          }
        }
      }
    }
  }

  private processBoardDeathsAndTriggers(
    board: BoardMinion[],
    side: 1 | 2,
    enemyBoard: BoardMinion[],
    events: CombatEvent[]
  ): void {
    for (let i = board.length - 1; i >= 0; i--) {
      const minion = board[i];
      if (minion.health <= 0) {
        events.push({
          type: 'MINION_DIED',
          minionId: minion.instanceId,
          side,
          minionName: minion.name,
        });

        if (minion.rewindAvailable) {
          minion.rewindAvailable = false;
          minion.health = minion.isGolden ? minion.maxHealth : 1;
          minion.keywords = minion.keywords.filter(k => k !== 'RE_WIND');
          events.push({
            type: 'REWOUND',
            targetId: minion.instanceId,
            newMinion: { ...minion },
          });
          continue;
        }

        board.splice(i, 1);

        for (const ally of board) {
          if (ally.cardId === 'void_devourer' && minion.tribe === 'VOIDBORN') {
            const atk = ally.isGolden ? 4 : 2;
            const hp = ally.isGolden ? 2 : 1;
            ally.attack += atk;
            ally.health += hp;
            events.push({
              type: 'STAT_BUFF',
              targetId: ally.instanceId,
              attackGain: atk,
              healthGain: hp,
              reason: 'Star Devourer sacrifice',
              newAttack: ally.attack,
              newHealth: ally.health,
            });
          }

          if (ally.cardId === 'beast_apex' && minion.tribe === 'BEAST') {
            const buff = ally.isGolden ? 6 : 3;
            ally.attack += buff;
            ally.health += buff;
            events.push({
              type: 'STAT_BUFF',
              targetId: ally.instanceId,
              attackGain: buff,
              healthGain: buff,
              reason: 'Apex Chimeradon feast',
              newAttack: ally.attack,
              newHealth: ally.health,
            });
          }
        }

        this.resolveLastGasp(minion, i, board, enemyBoard, side, events);
      }
    }
  }

  private resolveLastGasp(
    minion: BoardMinion,
    insertPos: number,
    board: BoardMinion[],
    enemyBoard: BoardMinion[],
    side: 1 | 2,
    events: CombatEvent[]
  ): void {
    if (minion.cardId === 'void_larva') {
      const count = minion.isGolden ? 2 : 1;
      for (let k = 0; k < count && board.length < 7; k++) {
        const token = createBoardMinion(TOKEN_MINIONS.void_tendril, minion.isGolden);
        board.splice(insertPos, 0, token);
        events.push({
          type: 'TOKEN_SPAWNED',
          minion: token,
          side,
          position: insertPos,
        });
      }
    }

    if (minion.cardId === 'void_fleshweaver') {
      const count = 2;
      for (let k = 0; k < count && board.length < 7; k++) {
        const token = createBoardMinion(TOKEN_MINIONS.eldritch_spawn, minion.isGolden);
        board.splice(insertPos, 0, token);
        events.push({
          type: 'TOKEN_SPAWNED',
          minion: token,
          side,
          position: insertPos,
        });
      }
    }

    if (minion.cardId === 'beast_ripper') {
      const dmg = minion.isGolden ? 2 : 1;
      const livingEnemies = enemyBoard.filter(e => e.health > 0);
      if (livingEnemies.length > 0) {
        const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
        this.applyDamageToMinion(target, dmg, false, minion.instanceId, events);
      }
    }
  }

  private applyStartOfCombatPassives(player: PlayerState, board: BoardMinion[]): void {
    if (player.hero.id === 'hero_artificer' && board.length > 0) {
      board[0].attack += 3;
      board[0].barrierActive = true;
      if (!board[0].keywords.includes('AETHER_BARRIER')) {
        board[0].keywords.push('AETHER_BARRIER');
      }
    }
  }

  private applyStartOfCombatMinionAuras(board: BoardMinion[]): void {
    for (const m of board) {
      if (m.cardId === 'auto_omega') {
        const buff = m.isGolden ? 10 : 5;
        for (const ally of board) {
          if (ally.tribe === 'AUTOMATA') {
            ally.attack += buff;
            ally.health += buff;
            ally.barrierActive = true;
            if (!ally.keywords.includes('AETHER_BARRIER')) {
              ally.keywords.push('AETHER_BARRIER');
            }
          }
        }
      }
    }
  }
}
