import React, { useState } from "react";

const CodenamesGrid = ({ cards = [], onCardClick = () => {} }) => {
  const [flippedCards, setFlippedCards] = useState(new Set());

  // Generate default cards if none provided
  const defaultCards = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    word: `WORD ${i + 1}`,
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
    backColor: ["bg-red-500", "bg-blue-500", "bg-gray-700", "bg-amber-100"][Math.floor(Math.random() * 4)],
    revealed: false,
  }));

  const gameCards = cards.length === 25 ? cards : defaultCards;

  const handleCardClick = (cardId) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
    onCardClick(cardId);
  };

  const getBackgroundColorClass = (backColor) => {
    if (backColor?.startsWith("bg-")) return backColor;

    const colorMap = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      black: "bg-gray-900",
      neutral: "bg-amber-100",
      beige: "bg-amber-100",
    };

    return colorMap[backColor] || "bg-gray-300";
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-4xl">
        {/* Grid container with responsive sizing */}
        <div
          className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 w-full mx-auto"
          style={{
            maxWidth: "min(90vw, 90vh)",
            aspectRatio: "1",
          }}
        >
          {gameCards.map((card, index) => {
            const isFlipped = flippedCards.has(card.id ?? index) || card.revealed;

            return (
              <div
                key={card.id ?? index}
                className="relative aspect-square cursor-pointer transform-style-preserve-3d transition-transform duration-500 hover:scale-105"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
                onClick={() => handleCardClick(card.id ?? index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(card.id ?? index);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Card ${index + 1}: ${card.word}`}
                aria-pressed={isFlipped}
              >
                {/* Front side */}
                <div
                  className="absolute inset-0 w-full h-full backface-hidden rounded-lg overflow-hidden shadow-lg bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {/* Image */}
                  <div className="relative w-full h-full">
                    <img src={card.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />

                    {/* Word overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-1 sm:p-2">
                      <p
                        className="text-center font-bold leading-tight break-words"
                        style={{
                          fontSize: "clamp(0.5rem, 2.5vw, 1rem)",
                        }}
                      >
                        {card.word}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back side */}
                <div
                  className={`absolute inset-0 w-full h-full backface-hidden rounded-lg shadow-lg border-2 border-gray-400 ${getBackgroundColorClass(
                    card.backColor
                  )} flex items-center justify-center`}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  {/* Team indicator or pattern */}
                  <div className="text-center">
                    {card.backColor === "bg-gray-900" || card.backColor === "black" ? (
                      <div className="text-white text-2xl sm:text-4xl">💀</div>
                    ) : card.backColor === "bg-red-500" || card.backColor === "red" ? (
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-600 rounded-full border-4 border-red-300"></div>
                    ) : card.backColor === "bg-blue-500" || card.backColor === "blue" ? (
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-600 rounded-full border-4 border-blue-300"></div>
                    ) : (
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-200 rounded-full border-4 border-amber-400"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm sm:text-base">Click cards to flip them and reveal their team colors</p>
          <div className="flex justify-center items-center gap-4 mt-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Red Team</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Blue Team</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
              <span>Assassin</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-200 rounded-full border border-amber-400"></div>
              <span>Neutral</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodenamesGrid;
