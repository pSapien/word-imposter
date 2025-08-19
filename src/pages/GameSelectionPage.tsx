import { useNavigate } from "react-router-dom";
import { AVAILABLE_GAMES } from "../games/game-registry";
import { Card, CardContent } from "@app/components";
import { cn } from "@app/utils";

export function GameSelectionPage() {
  const navigate = useNavigate();

  const handleGameSelect = (gameId: string) => {
    navigate(`/game/${gameId}/room`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-500" />

      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">🎮 Party Games</h1>
          <p className="text-white/80 text-xl">Choose your game and start the fun!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_GAMES.map((game) => (
            <button onClick={() => handleGameSelect(game.id)}>
              <Card
                key={game.id}
                variant="glass"
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95",
                  "backdrop-blur-xl border-white/20 hover:border-white/40"
                )}
              >
                <CardContent className="p-8">
                  <div
                    className={cn(
                      "w-full h-48 rounded-xl mb-6 flex items-center justify-center",
                      "bg-gradient-to-br",
                      game.color,
                      "shadow-lg"
                    )}
                  >
                    <span className="text-6xl">{game.icon}</span>
                  </div>

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{game.name}</h2>
                    <p className="text-gray-600 mb-4">{game.description}</p>

                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <span>
                        👥 {game.minPlayers}-{game.maxPlayers} players
                      </span>
                      <span>⏱️ {game.estimatedTime}</span>
                    </div>

                    <div className="bg-white/50 rounded-lg p-3">
                      <span className="text-gray-700 font-medium">Tap to play →</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-white/60 text-sm">More games coming soon! 🚀</p>
        </div>
      </div>
    </div>
  );
}
