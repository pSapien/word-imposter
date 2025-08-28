import { useState, useEffect } from "react";

type ImposterBlitzPlayer = {
  id: string;
  displayName: string;
};

type Props = {
  players: ImposterBlitzPlayer[];
  selectedPlayerId: string;
  onAnimationComplete: () => void;
};

export function PlayerSelectionAnimation({ players, selectedPlayerId, onAnimationComplete }: Props) {
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"scanning" | "revealing">("scanning");
  const [scanSpeed, setScanSpeed] = useState(400);

  useEffect(() => {
    let currentIndex = 0;
    let scanCount = 0;

    // Phase 1: Gentle scanning with slower initial speed
    setPhase("scanning");
    const interval = setInterval(() => {
      setHighlightedPlayerId(players[currentIndex].id);
      currentIndex = (currentIndex + 1) % players.length;

      // Count full cycles and gradually slow down more gently
      if (currentIndex === 0) {
        scanCount++;
        if (scanCount > 4) {
          // After 4 full cycles, start slowing down gradually
          setScanSpeed((prev) => Math.min(prev + 100, 1000));
        }
      }
    }, scanSpeed);

    const selectTimeout = setTimeout(() => {
      clearInterval(interval);
      setPhase("revealing");
      setHighlightedPlayerId(selectedPlayerId);

      setTimeout(onAnimationComplete, 1500);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(selectTimeout);
    };
  }, [players, selectedPlayerId, onAnimationComplete, scanSpeed]);

  const getPlayerStyles = (player: ImposterBlitzPlayer) => {
    const isHighlighted = highlightedPlayerId === player.id;
    const isSelected = phase === "revealing" && player.id === selectedPlayerId;

    let baseClasses = "p-6 border-2 rounded-lg transition-all duration-500 ease-in-out ";

    if (isSelected) {
      baseClasses += "border-green-400 bg-green-900/20 scale-105 shadow-lg shadow-green-400/30 ";
    } else if (isHighlighted) {
      baseClasses += "border-yellow-400 bg-yellow-900/10 scale-101 shadow-sm shadow-yellow-400/15 ";
    } else {
      baseClasses += "border-gray-600 bg-gray-900/30 ";
    }

    return baseClasses;
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case "scanning":
        return "Selecting next player...";
      case "revealing":
        return "Your turn!";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="text-white text-center w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {getPhaseTitle()}
          </h2>

          {/* Progress indicator */}
          <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                phase === "scanning" ? "w-1/2 bg-yellow-400" : "w-full bg-green-400"
              }`}
            />
          </div>
        </div>

        {/* Column of players instead of grid */}
        <div className="flex flex-col gap-4 items-center">
          {players.map((player) => (
            <div key={player.id} className={`${getPlayerStyles(player)} w-2/3 max-w-sm text-center`}>
              <div className="text-xl font-semibold">{player.displayName}</div>
            </div>
          ))}
        </div>

        {phase === "revealing" && (
          <div className="mt-8 text-2xl font-bold text-green-400 animate-pulse">🎯 Selected!</div>
        )}
      </div>
    </div>
  );
}
