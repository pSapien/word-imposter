import { BaseGame, GameConfig } from "../core/GameEngine.js";
import { WordImposterGame } from "./imposter/WordImposterGame.js";

export interface GameTypeConfig {
  name: string;
  displayName: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  defaultSettings: any;
}

export const GAME_TYPES: Record<string, GameTypeConfig> = {
  "word-imposter": {
    name: "word-imposter",
    displayName: "Word Imposter",
    description: "Find the imposter who has a different word",
    minPlayers: 3,
    maxPlayers: 20,
    defaultSettings: {
      imposterCount: 1,
      wordCategories: ["general"],
    },
  },
  // Future games can be added here
  // 'codenames': { ... },
};

export class GameFactory {
  static createGame(gameType: string, settings: any): BaseGame {
    const gameConfig = GAME_TYPES[gameType];
    if (!gameConfig) {
      throw new Error(`Unknown game type: ${gameType}`);
    }

    const config: GameConfig = {
      minPlayers: gameConfig.minPlayers,
      maxPlayers: gameConfig.maxPlayers,
      allowSpectators: true,
      settings: { ...gameConfig.defaultSettings, ...settings },
    };

    switch (gameType) {
      case "word-imposter":
        return new WordImposterGame(config as any);
      default:
        throw new Error(`Game type ${gameType} not implemented`);
    }
  }

  static getAvailableGames(): GameTypeConfig[] {
    return Object.values(GAME_TYPES);
  }

  static validateGameSettings(gameType: string, settings: any): boolean {
    const gameConfig = GAME_TYPES[gameType];
    if (!gameConfig) {
      return false;
    }

    // Add specific validation logic for each game type
    switch (gameType) {
      case "word-imposter":
        return (
          settings.imposterCount > 0 && Array.isArray(settings.wordCategories) && settings.wordCategories.length > 0
        );
      case "hangman":
        return (
          settings.maxWrongGuesses > 0 && Array.isArray(settings.wordCategories) && settings.wordCategories.length > 0
        );
      default:
        return true;
    }
  }
}
