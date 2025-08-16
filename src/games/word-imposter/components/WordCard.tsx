import { useState } from "react";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";

interface WordCardProps {
  word: string;
  isImposter?: boolean;
  isRevealed?: boolean;
  className?: string;
}

export function WordCard({ word, isImposter = false, isRevealed = false, className }: WordCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!word) {
    return (
      <Card variant="glass" className={cn("p-8 text-center", className)}>
        <div className="text-4xl font-bold text-gray-400 mb-2">? ? ?</div>
        <p className="text-sm text-gray-500">Waiting for game to start...</p>
      </Card>
    );
  }

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <Card
      variant="glass"
      className={cn(
        "p-8 text-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95",
        isImposter && isRevealed && "ring-4 ring-red-400 bg-red-50/80",
        !isImposter && isRevealed && "ring-4 ring-green-400 bg-green-50/80",
        className
      )}
      onClick={handleToggleVisibility}
    >
      <div
        className={cn(
          "text-4xl font-bold mb-4 transition-all duration-200",
          isVisible ? "opacity-100" : "opacity-30",
          isImposter && isRevealed ? "text-red-600" : "text-gray-800"
        )}
      >
        {isVisible ? word : "• • •"}
      </div>

      {isImposter && isRevealed && (
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
            🎭 You're the Imposter!
          </span>
        </div>
      )}

      <p className="text-sm text-gray-600">{isVisible ? "Tap to hide" : "Tap to reveal"}</p>

      {isRevealed && (
        <div className="mt-4 text-xs text-gray-500">
          {isImposter ? "Your secret word - keep it hidden!" : "This is the civilian word"}
        </div>
      )}
    </Card>
  );
}
