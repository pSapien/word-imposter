import type { GameConfig } from "./types";
import { WordImposterConfig } from "./word-imposter/config";

export const GAME_REGISTRY: Record<string, GameConfig> = {
  imposter: WordImposterConfig,
  // 'codenames': CodenamesConfig,
};

export function getGameConfig(gameType: string): GameConfig | null {
  return GAME_REGISTRY[gameType] || null;
}

export function getAllGameConfigs(): GameConfig[] {
  return Object.values(GAME_REGISTRY);
}

export function validateGameType(gameType: string): boolean {
  return gameType in GAME_REGISTRY;
}
