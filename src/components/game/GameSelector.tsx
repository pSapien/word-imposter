import { useState } from "react";
import { getAllGameConfigs, getGameConfig } from "../../games/registry";
import type { GameSettings } from "../../games/types";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

interface GameSelectorProps {
  onStartGame: (gameType: string, settings: GameSettings) => void;
  playerCount: number;
  isHost: boolean;
  className?: string;
}

export function GameSelector({ onStartGame, playerCount, isHost, className }: GameSelectorProps) {
  const [selectedGameType, setSelectedGameType] = useState("word-imposter");
  const [gameSettings, setGameSettings] = useState<Record<string, GameSettings>>({});
  const [isStarting, setIsStarting] = useState(false);

  const availableGames = getAllGameConfigs();
  const selectedGame = getGameConfig(selectedGameType);

  const currentSettings = gameSettings[selectedGameType] || selectedGame?.defaultSettings || {};

  const handleGameTypeChange = (gameType: string) => {
    setSelectedGameType(gameType);
    // Initialize settings if not already set
    if (!gameSettings[gameType]) {
      const config = getGameConfig(gameType);
      if (config) {
        setGameSettings((prev) => ({
          ...prev,
          [gameType]: { ...config.defaultSettings },
        }));
      }
    }
  };

  const handleStartGame = async () => {
    if (!selectedGame || !canStart) return;

    setIsStarting(true);
    try {
      await onStartGame(selectedGameType, currentSettings);
    } finally {
      setIsStarting(false);
    }
  };

  const canStart = selectedGame && playerCount >= selectedGame.minPlayers;

  return (
    <Card variant="glass" className={className}>
      <CardHeader>
        <h3 className="text-xl font-bold text-gray-800 flex items-center">🎮 Choose Game</h3>
        <p className="text-sm text-gray-600">Select a game and configure settings</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Game Type Selection */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Available Games</h4>
          <div className="grid grid-cols-1 gap-3">
            {availableGames.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameTypeChange(game.id)}
                disabled={!isHost}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-200 text-left",
                  "hover:scale-105 active:scale-95",
                  selectedGameType === game.id ? "border-blue-500 bg-blue-50/50" : "border-gray-200 bg-white/50",
                  !isHost && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{game.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{game.displayName}</div>
                    <div className="text-sm text-gray-600">{game.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {game.minPlayers}-{game.maxPlayers} players
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Player Count Info */}
        <div className="bg-blue-50/50 rounded-lg p-3">
          <div className="text-sm text-blue-700">
            <strong>Current Players:</strong> {playerCount}
          </div>
          {selectedGame && (
            <div className="text-sm text-blue-600 mt-1">
              <strong>Required:</strong> {selectedGame.minPlayers}-{selectedGame.maxPlayers} players
            </div>
          )}
        </div>

        {/* Start Game Button */}
        {isHost && (
          <Button onClick={handleStartGame} disabled={!canStart} isLoading={isStarting} className="w-full" size="lg">
            {!canStart
              ? `Need ${selectedGame?.minPlayers || 0} players to start`
              : `🚀 Start ${selectedGame?.displayName}`}
          </Button>
        )}

        {!isHost && <div className="text-center py-4 text-gray-500">Waiting for host to start the game...</div>}
      </CardContent>
    </Card>
  );
}
