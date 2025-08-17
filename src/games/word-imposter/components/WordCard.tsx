import { useState } from "react";
import { Card } from "../../../components/ui/Card";
import { cn } from "@app/utils";

interface WordCardProps {
  word: string;
  isRevealed?: boolean;
  className?: string;
}

export function WordCard({ word, className }: WordCardProps) {
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
        className
      )}
      onClick={handleToggleVisibility}
    >
      <div
        className={cn("text-4xl font-bold mb-4 transition-all duration-200", isVisible ? "opacity-100" : "opacity-30")}
      >
        {isVisible ? word : "• • •"}
      </div>

      <p className="text-sm text-gray-600">{isVisible ? "Tap to hide" : "Tap to reveal"}</p>
    </Card>
  );
}
