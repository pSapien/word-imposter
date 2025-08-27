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
  const [phase, setPhase] = useState<"scanning" | "selecting" | "revealing">("scanning");
  const [scanSpeed, setScanSpeed] = useState(120);

  useEffect(() => {
    let currentIndex = 0;
    let scanCount = 0;

    // Phase 1: Fast scanning
    setPhase("scanning");
    const interval = setInterval(() => {
      setHighlightedPlayerId(players[currentIndex].id);
      currentIndex = (currentIndex + 1) % players.length;

      // Count full cycles and gradually slow down
      if (currentIndex === 0) {
        scanCount++;
        if (scanCount > 8) {
          // After 8 full cycles, start slowing down
          setScanSpeed((prev) => Math.min(prev + 40, 400));
        }
      }
    }, scanSpeed);

    const selectTimeout = setTimeout(() => {
      clearInterval(interval);

      const finalCandidates = players.slice(-3);
      let finalIndex = 0;

      const finalInterval = setInterval(() => {
        setHighlightedPlayerId(finalCandidates[finalIndex].id);
        finalIndex = (finalIndex + 1) % finalCandidates.length;
      }, 600);

      setTimeout(() => {
        clearInterval(finalInterval);
        setPhase("revealing");
        setHighlightedPlayerId(selectedPlayerId);

        setTimeout(onAnimationComplete, 1200);
      }, 2000);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(selectTimeout);
    };
  }, [players, selectedPlayerId, onAnimationComplete, scanSpeed]);

  const getPlayerStyles = (player: ImposterBlitzPlayer) => {
    const isHighlighted = highlightedPlayerId === player.id;
    const isSelected = phase === "revealing" && player.id === selectedPlayerId;

    let baseClasses = "p-6 border-2 rounded-lg transition-all duration-200 ";

    if (isSelected) {
      baseClasses += "border-green-400 bg-green-900/30 scale-115 shadow-lg shadow-green-400/50 ";
    } else if (isHighlighted) {
      if (phase === "selecting") {
        baseClasses += "border-blue-400 bg-blue-900/30 scale-110 shadow-md shadow-blue-400/30 ";
      } else {
        baseClasses += "border-yellow-400 bg-yellow-900/20 scale-105 shadow-sm shadow-yellow-400/20 ";
      }
    } else {
      baseClasses += "border-gray-600 bg-gray-900/50 ";
    }

    return baseClasses;
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case "scanning":
        return "Selecting next player...";
      case "selecting":
        return "Almost there...";
      case "revealing":
        return "Your turn!";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="text-white text-center w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {getPhaseTitle()}
          </h2>

          {/* Progress indicator */}
          <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                phase === "scanning"
                  ? "w-1/3 bg-yellow-400"
                  : phase === "selecting"
                  ? "w-2/3 bg-blue-400"
                  : "w-full bg-green-400"
              }`}
            />
          </div>
        </div>

        {/* Column of players instead of grid */}
        <div className="flex flex-col gap-4 items-center">
          {players.map((player) => (
            <div key={player.id} className={`${getPlayerStyles(player)} w-full max-w-sm text-center`}>
              <div className="text-xl font-semibold">{player.displayName}</div>
            </div>
          ))}
        </div>

        {phase === "revealing" && (
          <div className="mt-8 text-2xl font-bold text-green-400 animate-bounce">🎯 Selected!</div>
        )}
      </div>
    </div>
  );
}
