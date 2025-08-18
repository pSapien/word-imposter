import type { GameConfig } from "../types";

export const WORD_CATEGORIES = [
  { id: "general", name: "General", icon: "📝" },
  { id: "animals", name: "Animals", icon: "🐾" },
  { id: "food", name: "Food", icon: "🍕" },
  { id: "technology", name: "Technology", icon: "💻" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "nature", name: "Nature", icon: "🌿" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "movies", name: "Movies", icon: "🎬" },
  { id: "abstract", name: "Abstract", icon: "🎨" },
  { id: "fantasy", name: "Fantasy", icon: "🧙" },
  { id: "geography", name: "Geography", icon: "🌍" },
  { id: "hobbies", name: "Hobbies", icon: "🎯" },
  { id: "science", name: "Science", icon: "🔬" },
  { id: "history", name: "History", icon: "📚" },
  { id: "people", name: "People", icon: "👥" },
  { id: "profession", name: "Profession", icon: "💼" },
  { id: "vehicle", name: "Vehicle", icon: "🚗" },
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
