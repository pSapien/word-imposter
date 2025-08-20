import React, { useState } from "react";
import { CodenamesCard } from "./WordCard.tsx";

// Mock assets for demonstration - replace with your actual imports
const mockAssets = {
  red: {
    bg: "https://images.unsplash.com/photo-1542736667-069246bdbc6d?w=400&h=400&fit=crop",
    agent: "https://images.unsplash.com/photo-1542736667-069246bdbc6d?w=400&h=400&fit=crop&sat=2&hue=0",
    card: "https://images.unsplash.com/photo-1542736667-069246bdbc6d?w=400&h=400&fit=crop&sat=2&hue=0",
  },
  blue: {
    bg: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    agent: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&sat=2&hue=240",
    card: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&sat=2&hue=240",
  },
  grey: {
    bg: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop",
    agent: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop&sat=0",
    card: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop&sat=0",
  },
  black: {
    bg: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop",
    agent: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&sat=0&brightness=0.3",
    card: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&sat=0&brightness=0.1",
  },
};

type CardColor = "red" | "blue" | "grey" | "black";

// Main grid component
export const CodenamesGameUI = ({ cards = [], assets = mockAssets, onCardClick = () => {} }) => {
  const [flippedCards, setFlippedCards] = useState(new Set());

  // Generate default cards if none provided
  const defaultCards = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    word: `WORD${i + 1}`,
    color: ["red", "blue", "grey", "black"][Math.floor(Math.random() * 4)] as CardColor,
  }));

  const gameCards = cards.length === 25 ? cards : defaultCards;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="w-full max-w-5xl overflow-hidden">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">CODENAMES</h1>
          <p className="text-slate-600">Click cards to reveal their team colors</p>
        </div>

        <div className="grid grid-cols-5 gap-0.5 sm:gap-1 md:gap-2 w-full aspect-square">
          {gameCards.map((card, index) => {
            return <CodenamesCard word="Hello" color="red" key={index} />;
          })}
        </div>
      </div>
    </div>
  );
};
