import type { GameConfig } from "../types";

export const ImposterBlitzConfig: GameConfig = {
  id: "imposter-blitz",
  name: "Imposter Blitz",
  description: "A fast-paced version of Word Imposter with a twist",
  icon: "⚡️",
  minPlayers: 3,
  maxPlayers: 20,
  displayName: "Imposter Blitz",
  defaultSettings: {
    imposterCount: 1,
    wordCategories: ["general"],
  },
};
