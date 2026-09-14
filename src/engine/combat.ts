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
  private activeP1?: PlayerState;
  private activeP2?: PlayerState;

  public simulate1v1(p1: PlayerState, p2: PlayerState): CombatSimulationResult {
    this.activeP1 = p1;
    this.activeP2 = p2;
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
    const MAX_TURNS = 120;

    while (this.hasLivingMinions(board1) && this.hasLivingMinions(board2) && turnCount < MAX_TURNS) {
      turnCount++;

      if (currentSide === 1) {
        if (!this.hasLivingMinions(board1)) {
          currentSide = 2;
          continue;
        }

        const livingAttacking = board1.filter(m => m.health > 0);
        if (p1Cursor >= livingAttacking.length) p1Cursor = 0;
        const attacker = livingAttacking[p1Cursor];

        const defender = this.selectDefender(board2);
        if (attacker && defender) {
          this.executeSingleAttack(attacker, defender, 1, board1, board2, events);

          // Kinetic Overclock (Attacks twice)
          if (attacker.keywords.includes('OVERCLOCK') && attacker.health > 0) {
            const secondDefender = this.selectDefender(board2);
            if (secondDefender) {
              this.executeSingleAttack(attacker, secondDefender, 1, board1, board2, events);
            }
          }
        }

        p1Cursor++;
        currentSide = 2;
      } else {
        if (!this.hasLivingMinions(board2)) {
          currentSide = 1;
          continue;
        }

        const livingAttacking = board2.filter(m => m.health > 0);
        if (p2Cursor >= livingAttacking.length) p2Cursor = 0;
        const attacker = livingAttacking[p2Cursor];

        const defender = this.selectDefender(board1);
        if (attacker && defender) {
          this.executeSingleAttack(attacker, defender, 2, board2, board1, events);

          // Kinetic Overclock (Attacks twice)
          if (attacker.keywords.includes('OVERCLOCK') && attacker.health > 0) {
            const secondDefender = this.selectDefender(board1);
            if (secondDefender) {
              this.executeSingleAttack(attacker, secondDefender, 2, board2, board1, events);
            }
          }
        }

        p2Cursor++;
        currentSide = 1;
      }
    }

    const p1Alive = board1.filter(m => m.health > 0);
    const p2Alive = board2.filter(m => m.health > 0);

    let winnerSide: 1 | 2 | 0 = 0;
    let winnerName = 'Draw';
    let loserName = 'Draw';
    let damageDealt = 0;
    let winnerTier = 1;

    if (p1Alive.length > 0 && p2Alive.length === 0) {
      winnerSide = 1;
      winnerName = p1.name;
      loserName = p2.name;
      winnerTier = p1.tavernTier;
      const minionStars = p1Alive.reduce((sum, m) => sum + m.tier, 0);
      damageDealt = p1.tavernTier + minionStars;
    } else if (p2Alive.length > 0 && p1Alive.length === 0) {
      winnerSide = 2;
      winnerName = p2.name;
      loserName = p1.name;
      winnerTier = p2.tavernTier;
      const minionStars = p2Alive.reduce((sum, m) => sum + m.tier, 0);
      damageDealt = p2.tavernTier + minionStars;
    }

    events.push({
      type: 'COMBAT_END',
      winnerSide,
      winnerName,
      loserName,
      winnerTier,
      damageDealt,
      survivingMinionTiers: (winnerSide === 1 ? p1Alive : p2Alive).map(m => m.tier),
    });

    this.activeP1 = undefined;
    this.activeP2 = undefined;

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

    // Trigger Rally Cry attack auras
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

    this.applyDamageToMinion(defender, atkDamage, attacker.keywords.includes('MIASMIC'), attacker.instanceId, events, false, attacker, attackingBoard);

    for (const cleaveTarget of cleaveTargets) {
      this.applyDamageToMinion(cleaveTarget, atkDamage, attacker.keywords.includes('MIASMIC'), attacker.instanceId, events, true, attacker, attackingBoard);
    }

    if (defDamage > 0) {
      this.applyDamageToMinion(attacker, defDamage, defender.keywords.includes('MIASMIC'), defender.instanceId, events, false, defender, defendingBoard);
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
    isCleave = false,
    attacker?: BoardMinion,
    attackerBoard?: BoardMinion[]
  ): void {
    if (target.health <= 0) return;

    if (target.barrierActive) {
      target.barrierActive = false;
      target.keywords = target.keywords.filter(k => k !== 'AETHER_BARRIER');
      events.push({
        type: 'BARRIER_BROKEN',
        targetId: target.instanceId,
      });

      // Automata Tier 4: Chrono-Juggernaut (+2 Atk on Barrier break, Golden +4 Atk)
      // Celestial Tier 6: Galaxy Sovereign (deal 4 radiant damage back, Golden 8)
      if (attacker && attackerBoard) {
        for (const ally of attackerBoard) {
          if (ally.cardId === 'auto_juggernaut' && ally.health > 0) {
            const gain = ally.isGolden ? 4 : 2;
            ally.attack += gain;
          }
          if (ally.cardId === 'celest_galaxy_weaver' && ally.health > 0) {
            const dmg = ally.isGolden ? 8 : 4;
            attacker.health -= dmg;
          }
        }
      }
      return;
    }

    const lethal = isMiasmic || damage >= target.health;
    const actualDamage = isMiasmic ? target.health : Math.min(damage, target.health);

    target.health -= actualDamage;

    if (isCleave) {
      events.push({
        type: 'CLEAVE_DAMAGE',
        targetId: target.instanceId,
        amount: actualDamage,
        isLethal: lethal,
        remainingHp: target.health,
      });
    } else {
      events.push({
        type: 'DAMAGE_DEALT',
        targetId: target.instanceId,
        amount: actualDamage,
        isLethal: lethal,
        remainingHp: target.health,
        wasMiasmic: isMiasmic,
        sourceId,
      });
    }
  }

  private triggerAttackAuras(attacker: BoardMinion, board: BoardMinion[], events: CombatEvent[]): void {
    if (attacker.tribe === 'PIRATE') {
      for (const m of board) {
        // Pirate Tier 2: Chrono Smuggler (+1 Atk, Golden +2 Atk)
        if (m.cardId === 'pirate_smuggler' && m.health > 0) {
          const buff = m.isGolden ? 2 : 1;
          attacker.attack += buff;
          events.push({
            type: 'STAT_BUFF',
            targetId: attacker.instanceId,
            attackGain: buff,
            healthGain: 0,
            reason: 'Chrono Smuggler Rally Cry',
            newAttack: attacker.attack,
            newHealth: attacker.health,
          });
        }

        // Pirate Tier 5: Fleet Admiral Vane (+2/+1 to ALL allies, Golden +4/+2)
        if (m.cardId === 'pirate_admiral' && m.instanceId !== attacker.instanceId && m.health > 0) {
          const buffAtk = m.isGolden ? 4 : 2;
          const buffHp = m.isGolden ? 2 : 1;
          for (const ally of board) {
            if (ally.health > 0) {
              ally.attack += buffAtk;
              ally.health += buffHp;
            }
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

        // Temporal Re-wind
        if (minion.rewindAvailable) {
          minion.rewindAvailable = false;
          minion.health = minion.isGolden ? minion.maxHealth : 1;
          if (minion.isGolden) minion.attack += 2;
          minion.keywords = minion.keywords.filter(k => k !== 'RE_WIND');
          events.push({
            type: 'REWOUND',
            targetId: minion.instanceId,
            newMinion: { ...minion },
          });
          continue;
        }

        board.splice(i, 1);

        // Death Passives for Allies
        for (const ally of board) {
          const originalPlayer = side === 1 ? this.activeP1 : this.activeP2;
          const originalMinion = originalPlayer?.board.find(m => m.instanceId === ally.instanceId);

          // Voidborn Tier 3: Star Devourer (+2/+1, Golden +4/+2, max 4 times)
          if (ally.cardId === 'void_devourer' && minion.tribe === 'VOIDBORN') {
            const triggers = ally.permanentBuffTriggers ?? 0;
            if (triggers < 4) {
              const atk = ally.isGolden ? 4 : 2;
              const hp = ally.isGolden ? 2 : 1;
              ally.attack += atk;
              ally.health += hp;
              ally.permanentBuffTriggers = triggers + 1;
              if (originalMinion) {
                originalMinion.attack += atk;
                originalMinion.health += hp;
                originalMinion.maxHealth += hp;
                originalMinion.permanentBuffTriggers = triggers + 1;
              }
            }
          }

          // Voidborn Tier 5: Cosmic Abomination (absorbs Attack of friendly Voidborn, max +15 total, Golden 2x Attack, max +30 total)
          if (ally.cardId === 'void_abomination' && minion.tribe === 'VOIDBORN') {
            const cap = ally.isGolden ? 30 : 15;
            const currentAbsorbed = ally.permanentBuffTriggers ?? 0;
            const remainingCap = Math.max(0, cap - currentAbsorbed);
            if (remainingCap > 0 && minion.attack > 0) {
              const potentialGain = minion.attack * (ally.isGolden ? 2 : 1);
              const actualGain = Math.min(potentialGain, remainingCap);
              ally.attack += actualGain;
              ally.permanentBuffTriggers = currentAbsorbed + actualGain;
              if (originalMinion) {
                originalMinion.attack += actualGain;
                originalMinion.permanentBuffTriggers = currentAbsorbed + actualGain;
              }
            }
          }

          // Beast Tier 4: Apex Alpha Wolf (+2/+2 to adjacent allies, Golden +4/+4)
          if (ally.cardId === 'beast_alpha' && minion.tribe === 'BEAST') {
            const buff = ally.isGolden ? 4 : 2;
            const allyIdx = board.findIndex(b => b.instanceId === ally.instanceId);
            if (allyIdx > 0 && board[allyIdx - 1].health > 0) {
              board[allyIdx - 1].attack += buff;
              board[allyIdx - 1].health += buff;
            }
            if (allyIdx < board.length - 1 && board[allyIdx + 1].health > 0) {
              board[allyIdx + 1].attack += buff;
              board[allyIdx + 1].health += buff;
            }
          }

          // Beast Tier 6: Apex World-Eater (+2/+2 on friendly Beast death, Golden +4/+4, max 3 times)
          if (ally.cardId === 'beast_god_behemoth' && minion.tribe === 'BEAST') {
            const triggers = ally.permanentBuffTriggers ?? 0;
            if (triggers < 3) {
              const buff = ally.isGolden ? 4 : 2;
              ally.attack += buff;
              ally.health += buff;
              ally.permanentBuffTriggers = triggers + 1;
              if (originalMinion) {
                originalMinion.attack += buff;
                originalMinion.health += buff;
                originalMinion.maxHealth += buff;
                originalMinion.permanentBuffTriggers = triggers + 1;
              }
            }
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
    // Voidborn Tier 1: Abyssal Larva (Summon 1 Tendril, Golden: 2 Tendrils)
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

    // Voidborn Tier 4: Eldritch Fleshweaver (Summon two 3/3 Spawns, Golden: two 6/6 Spawns)
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

    // Beast Tier 1: Cave Ripper (Deal 1 damage, Golden 2 damage twice)
    if (minion.cardId === 'beast_ripper') {
      const dmg = minion.isGolden ? 2 : 1;
      const count = minion.isGolden ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const livingEnemies = enemyBoard.filter(e => e.health > 0);
        if (livingEnemies.length > 0) {
          const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
          this.applyDamageToMinion(target, dmg, false, minion.instanceId, events);
        }
      }
    }

    // Celestial Tier 5: Cosmic Weaver (Grant Barrier and +2/+2 to all allies, Golden: +4/+4)
    if (minion.cardId === 'celest_constellation') {
      const buff = minion.isGolden ? 4 : 2;
      board.forEach(m => {
        m.barrierActive = true;
        if (!m.keywords.includes('AETHER_BARRIER')) {
          m.keywords.push('AETHER_BARRIER');
        }
        m.attack += buff;
        m.health += buff;
      });
    }

    // Beast Tier 5: Hydra Colossus (Summon three 3/3 Hydra Heads, Golden: three 6/6 Heads)
    if (minion.cardId === 'beast_hydra_colossus') {
      for (let k = 0; k < 3 && board.length < 7; k++) {
        const token = createBoardMinion(TOKEN_MINIONS.hydra_head, minion.isGolden);
        board.splice(insertPos, 0, token);
        events.push({
          type: 'TOKEN_SPAWNED',
          minion: token,
          side,
          position: insertPos,
        });
      }
    }

    // Voidborn Tier 6: Singularity Sovereign (Destroy enemy with highest HP & summon Void Horror, Golden: Destroy 2 & summon two)
    if (minion.cardId === 'void_singularity_lord') {
      const count = minion.isGolden ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const living = enemyBoard.filter(e => e.health > 0).sort((a, b) => b.health - a.health);
        if (living.length > 0) {
          living[0].health = 0;
        }
        if (board.length < 7) {
          const token = createBoardMinion(TOKEN_MINIONS.void_horror, minion.isGolden);
          board.splice(insertPos, 0, token);
          events.push({
            type: 'TOKEN_SPAWNED',
            minion: token,
            side,
            position: insertPos,
          });
        }
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

  private applyStartOfCombatMinionAuras(_board: BoardMinion[]): void {
    // Reserved for start of combat static auras
  }
}
