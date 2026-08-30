// Fix ai.ts
import { PlayerState, Tribe } from '../types';
import { TavernManager } from './tavern';

export interface AIProfile {
  favoriteTribe: Tribe;
  aggression: number;
  levelingGreed: number;
}

const AI_PROFILES: Record<string, AIProfile> = {
  'bot_1': { favoriteTribe: 'AUTOMATA', aggression: 0.7, levelingGreed: 0.5 },
  'bot_2': { favoriteTribe: 'VOIDBORN', aggression: 0.8, levelingGreed: 0.4 },
  'bot_3': { favoriteTribe: 'ALCHEMIST', aggression: 0.5, levelingGreed: 0.7 },
  'bot_4': { favoriteTribe: 'CELESTIAL', aggression: 0.4, levelingGreed: 0.8 },
  'bot_5': { favoriteTribe: 'BEAST', aggression: 0.9, levelingGreed: 0.3 },
  'bot_6': { favoriteTribe: 'PIRATE', aggression: 0.6, levelingGreed: 0.6 },
  'bot_7': { favoriteTribe: 'NEUTRAL', aggression: 0.5, levelingGreed: 0.5 },
};

export class BotAI {
  constructor(private tavern: TavernManager) {}

  public executeBotTurn(bot: PlayerState, turnNumber: number): void {
    const profile = AI_PROFILES[bot.id] || { favoriteTribe: 'NEUTRAL', aggression: 0.5, levelingGreed: 0.5 };

    const canAffordUpgrade = bot.coins >= bot.tierUpgradeCost;
    const shouldUpgrade = canAffordUpgrade && (
      turnNumber === 2 ||
      (turnNumber >= 5 && bot.board.length >= 4 && bot.hp > 20) ||
      (bot.tierUpgradeCost <= 4 && bot.coins >= bot.tierUpgradeCost + 3)
    );

    if (shouldUpgrade && bot.tavernTier < 6) {
      this.tavern.upgradeTier(bot);
    }

    let safetyCounter = 0;
    while (bot.coins >= 3 && safetyCounter < 10) {
      safetyCounter++;
      const bestShopIndex = this.findBestShopMinion(bot, profile);
      if (bestShopIndex !== -1) {
        this.tavern.buyMinion(bot, bestShopIndex);
      } else if (bot.coins >= 4) {
        this.tavern.reroll(bot);
      } else {
        if (bot.tavernSlots.length > 0) {
          this.tavern.buyMinion(bot, 0);
        } else {
          break;
        }
      }
    }

    while (bot.hand.length > 0 && bot.board.length < 7) {
      let bestHandIdx = 0;
      let highestScore = -1;
      bot.hand.forEach((c, idx) => {
        const score = c.tier * 2 + c.attack + c.health + (c.tribe === profile.favoriteTribe ? 3 : 0);
        if (score > highestScore) {
          highestScore = score;
          bestHandIdx = idx;
        }
      });

      this.tavern.playMinionFromHand(bot, bestHandIdx);
    }

    if (bot.discoverOptions && bot.discoverOptions.length > 0) {
      this.tavern.chooseDiscover(bot, 0);
      if (bot.board.length < 7 && bot.hand.length > 0) {
        this.tavern.playMinionFromHand(bot, bot.hand.length - 1);
      }
    }

    this.optimizeBoardPositioning(bot);
  }

  private findBestShopMinion(bot: PlayerState, profile: AIProfile): number {
    let bestIdx = -1;
    let highestScore = -1;

    bot.tavernSlots.forEach((minion, idx) => {
      let score = minion.tier * 3 + minion.attack + minion.health;
      if (minion.tribe === profile.favoriteTribe) score += 5;
      if (minion.keywords.includes('AETHER_BARRIER')) score += 3;
      if (minion.keywords.includes('SWEEP')) score += 4;
      if (minion.keywords.includes('MIASMIC')) score += 5;

      const existing = bot.board.filter(b => b.cardId === minion.id).length +
                       bot.hand.filter(h => h.id === minion.id).length;
      if (existing === 2) score += 15;

      if (score > highestScore) {
        highestScore = score;
        bestIdx = idx;
      }
    });

    return bestIdx;
  }

  private optimizeBoardPositioning(bot: PlayerState): void {
    bot.board.sort((a, b) => {
      const aIsCleave = a.keywords.includes('SWEEP') || a.keywords.includes('OVERCLOCK') ? 10 : 0;
      const bIsCleave = b.keywords.includes('SWEEP') || b.keywords.includes('OVERCLOCK') ? 10 : 0;

      const aIsBastion = a.keywords.includes('BASTION') ? -10 : 0;
      const bIsBastion = b.keywords.includes('BASTION') ? -10 : 0;

      const aScore = aIsCleave + aIsBastion + a.attack;
      const bScore = bIsCleave + bIsBastion + b.attack;

      return bScore - aScore;
    });
  }
}
