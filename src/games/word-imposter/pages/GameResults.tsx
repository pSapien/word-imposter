import { Users, Target, AlertCircle } from "lucide-react";
import type { WordImposterState } from "../../../../shared";
import { Card, CardHeader, CardContent, CardFooter } from "@app/components";

type Props = {
  gameState: WordImposterState;
  players: Array<{
    id: string;
    displayName: string;
    role: "spectator" | "host" | "player";
  }>;
};

export function GameResults({ gameState, players }: Props) {
  const eliminatedPlayer = players.find((p) => p.id === gameState.roundResults?.eliminatedPlayerId);
  const isImposterFound = gameState.roundResults?.imposterFound;

  const voteCount: Record<string, number> = {};
  Object.values(gameState.votes).forEach((votedFor: string) => {
    voteCount[votedFor] = (voteCount[votedFor] || 0) + 1;
  });

  const sortedVotes = Object.entries(voteCount).sort(([, countA], [, countB]) => countB - countA);

  console.log("gameResults", gameState.roundResults);

  return (
    <Card variant="glass" className="bg-gradient-to-br from-purple-500 via-purple-600">
      <CardHeader className="bg-white/10 backdrop-blur-sm rounded-t-3xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7" />
            Round {gameState.round} Results
          </h2>
        </div>
      </CardHeader>

      <CardContent>
        <div className="bg-white/10 rounded-2xl p-4  my-8 transform transition-all duration-500 animate-in">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Voting Results
          </h3>

          <div className="space-y-2">
            {sortedVotes.map(([votedForId, voteCount]) => {
              const votedFor = players.find((p) => p.id === votedForId);
              const voters = Object.entries(gameState.votes)
                .filter(([_, votedId]) => votedId === votedForId)
                .map(([voterId]) => players.find((p) => p.id === voterId)?.displayName);

              return (
                <div
                  key={votedForId}
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 bg-white/10 hover:bg-gradient-to-r hover:from-white/20 hover:to-purple-600/20 hover:shadow-lg hover:-translate-y-1 animate-in zoom-in-95"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 shadow-md"
                      style={{ animation: voteCount > 0 ? "pulse 2s infinite" : "none" }}
                    >
                      {votedFor?.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-semibold text-lg">{votedFor?.displayName}</span>
                        <span className="px-3 py-1 bg-blue-500/80 text-white text-sm font-bold rounded-full shadow-sm border border-blue-300/50 transition-all duration-200 hover:scale-105">
                          {voteCount} vote{voteCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-sm text-white/70 mt-1">
                        Voted by: <span className="italic">{voters.length > 0 ? voters.join(", ") : "None"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {eliminatedPlayer && (
          <div
            className={`rounded-2xl p-6 mb-6 transform transition-all duration-500 animate-in ${
              isImposterFound
                ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-400/30"
                : "bg-gradient-to-r from-orange-500/20 to-red-600/20 border border-orange-400/30"
            }`}
          >
            <div className="text-center">
              <h3 className="text-white text-2xl font-bold mb-2">{eliminatedPlayer.displayName} was eliminated!</h3>
              {isImposterFound ? (
                <div className="space-y-2">
                  <p className="text-red-300 text-lg font-bold animate-pulse">🎭 They were the IMPOSTER!</p>
                  <p className="text-white/80">
                    Their word was: <strong className="text-red-300">"{gameState.roundResults?.imposterWord}"</strong>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-blue-300 text-lg font-bold">😇 They were a civilian!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-center">
        {gameState.roundResults?.winner ? (
          <div
            className={`p-4 rounded-2xl ${
              gameState.roundResults.winner === "civilians"
                ? "bg-gradient-to-r from-green-400 to-emerald-600"
                : "bg-gradient-to-r from-red-400 to-pink-600"
            }`}
          >
            <h2 className="text-white text-3xl font-bold mb-2">
              {gameState.roundResults.winner === "civilians" ? "🎉 Civilians Win!" : "🎭 Imposters Win!"}
            </h2>
            <p className="text-white/90">
              {gameState.roundResults.winner === "civilians"
                ? "All imposters have been found!"
                : "The imposters have outlasted the civilians!"}
            </p>
          </div>
        ) : (
          <div className="bg-white/10 p-4 rounded-2xl border border-yellow-400/30">
            <h3 className="text-yellow-300 text-xl font-bold mb-2 flex items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6" />
              {gameState.roundResults?.eliminatedPlayerId ? "Player Eliminated!" : "Round Tied!"}
            </h3>
            <p className="text-white/80">
              {gameState.roundResults?.eliminatedPlayerId
                ? "A player was eliminated, but the imposter is still among us."
                : "No one was eliminated this round. The imposter is still among us."}{" "}
              Prepare for round {gameState.round + 1}!
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
