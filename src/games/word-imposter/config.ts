import type { GameConfig } from "../types";

export const WORD_CATEGORIES = [
  { id: "abstract", name: "Abstract", icon: "🎨" },
  { id: "fantasy", name: "Fantasy", icon: "🧙" },
  { id: "food", name: "Food", icon: "🍕" },
  { id: "general", name: "General", icon: "📝" },
  { id: "geography", name: "Geography", icon: "🌍" },
  { id: "hobbies", name: "Hobbies", icon: "🎯" },
  { id: "legacy", name: "Legacy", icon: "🗂️" },
  { id: "pop", name: "Pop Culture", icon: "🎤" },
  { id: "science", name: "Science", icon: "🔬" },
  { id: "synonms", name: "Synonyms", icon: "🔀" },
  { id: "animals", name: "Animals", icon: "🐾" },
  { id: "culinary", name: "Culinary", icon: "🍳" },
  { id: "history", name: "History", icon: "📚" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "people", name: "People", icon: "👥" },
  { id: "nature", name: "Nature", icon: "🌿" },
  { id: "profession", name: "Profession", icon: "💼" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "technology", name: "Technology", icon: "💻" },
  { id: "movies", name: "Movies", icon: "🎬" },
  { id: "vehicle", name: "Vehicle", icon: "🚗" },
  { id: "nepali", name: "Nepali", icon: "🇳🇵" },
];

export const WordImposterConfig: GameConfig = {
  id: "word-imposter",
  name: "word-imposter",
  displayName: "Word Imposter",
  description: "Find the imposter who has a different word",
  icon: "🎭",
  minPlayers: 3,
  maxPlayers: 20,
  defaultSettings: {
    imposterCount: 1,
    wordCategories: ["general"],
  },
  categories: WORD_CATEGORIES.map((cat) => cat.id),
};
