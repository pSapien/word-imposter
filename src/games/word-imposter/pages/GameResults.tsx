import { Target, Trophy } from "lucide-react";
import type { WordImposterState } from "../../../../shared";
import { Card } from "@app/components";
import { cn } from "@app/utils";

type Props = {
  gameState: WordImposterState;
  players: Array<{
    id: string;
    displayName: string;
    role: string;
  }>;
};

export function GameResults({ gameState, players }: Props) {
  const eliminatedPlayer = players.find((p) => p.id === gameState.roundResults?.eliminatedPlayerId);

  const voteCount: Record<string, number> = {};
  Object.values(gameState.votes).forEach((votedFor: string) => {
    voteCount[votedFor] = (voteCount[votedFor] || 0) + 1;
  });
  const sortedVotes = Object.entries(voteCount).sort(([, a], [, b]) => b - a);

  const roundFinishedImposterFound =
    gameState.roundResults?.winner === null && gameState.roundResults?.imposterFound === true;
  const roundFinishedCivilianFound =
    gameState.roundResults?.winner === null && gameState.roundResults?.imposterFound === false;

  return (
    <Card variant="glass" className="bg-gradient-to-br">
      {/* Voting Results Section - Now Highlighted! */}
      <div className="relative bg-gradient-to-br rounded-2xl p-4">
        {/* Decorative elements for extra juice */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative z-10">
          <h3 className="text-white font-black text-2xl flex items-center gap-3 drop-shadow-sm">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Trophy className="w-7 h-7" />
            </div>
            Results
          </h3>

          <div className="rounded-2xl p-6">
            <div className="text-center">
              {(() => {
                if (gameState.roundResults?.winner === "civilians") {
                  return (
                    <div className="bg-green-500/20 rounded-xl p-6 border border-green-400/30">
                      <h3 className="text-green-200 text-2xl font-bold mb-3">🎉 Civilians Win!</h3>
                      <p className="text-green-100 text-lg">
                        All <span className="font-semibold text-green-300">Imposters</span> have been found!
                      </p>
                      <p className="text-green-100 mt-2">
                        Their word was:{" "}
                        <strong className="text-yellow-300 text-xl">"{gameState.roundResults?.imposterWord}"</strong>
                      </p>
                    </div>
                  );
                }

                if (gameState.roundResults?.winner === "imposters") {
                  return (
                    <div className="bg-red-500/20 rounded-xl p-6 border border-red-400/30">
                      <h3 className="text-red-200 text-2xl font-bold mb-3">🎭 Imposters Win!</h3>
                      <p className="text-red-100 text-lg">
                        The <span className="font-semibold text-red-300">Imposters</span> have outlasted the civilians!
                      </p>
                      <p className="text-red-100 mt-2">
                        Their secret word was:{" "}
                        <strong className="text-yellow-300 text-xl">"{gameState.roundResults?.imposterWord}"</strong>
                      </p>
                    </div>
                  );
                }

                /** votes are tied */
                if (gameState.roundResults?.eliminatedPlayerId === null) {
                  return (
                    <div className="bg-blue-500/20 rounded-xl p-6 border border-blue-400/30">
                      <h3 className="text-blue-200 text-2xl font-bold mb-3">🤝 Round Tied</h3>
                      <p className="text-blue-100 text-lg">No one was eliminated this round.</p>
                      <p className="text-blue-100 mt-2">
                        The hunt continues in round{" "}
                        <span className="font-semibold text-blue-300">{gameState.round + 1}</span>!
                      </p>
                    </div>
                  );
                }

                if (roundFinishedImposterFound && eliminatedPlayer) {
                  return (
                    <div className="bg-yellow-500/20 rounded-xl p-6 border border-yellow-400/30">
                      <h3 className="text-yellow-200 text-2xl font-bold mb-3">🚨 Imposter Eliminated</h3>
                      <p className="text-yellow-100 text-lg">
                        <span className="font-bold text-yellow-300">{eliminatedPlayer.displayName}</span> was an{" "}
                        <span className="font-bold text-red-400">Imposter</span>.
                      </p>
                      <p className="text-yellow-100 mt-2">
                        Their word was:{" "}
                        <strong className="text-red-400 text-xl">"{gameState.roundResults?.imposterWord}"</strong>
                      </p>
                      <p className="text-yellow-100 mt-3">
                        But other <span className="font-semibold text-red-400">Imposters</span> may still be among
                        you... Prepare for round{" "}
                        <span className="font-semibold text-yellow-300">{gameState.round + 1}</span>!
                      </p>
                    </div>
                  );
                }

                if (roundFinishedCivilianFound && eliminatedPlayer) {
                  return (
                    <div className="bg-orange-500/20 rounded-xl p-6 border border-orange-400/30">
                      <h3 className="text-orange-200 text-2xl font-bold mb-3">❌ Civilian Eliminated</h3>
                      <p className="text-orange-100 text-lg">
                        <span className="font-bold text-orange-300">{eliminatedPlayer.displayName}</span> was a{" "}
                        <span className="font-bold text-green-300">Civilian</span>.
                      </p>
                      <p className="text-orange-100 mt-2">
                        The <span className="font-semibold text-red-400">Imposters</span> are still among you... Prepare
                        for round <span className="font-semibold text-orange-300">{gameState.round + 1}</span>!
                      </p>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>

          <div className="space-y-4">
            {sortedVotes.map(([votedForId, count], index) => {
              let votedFor = players.find((p) => p.id === votedForId);
              if (!votedFor) votedFor = { displayName: "Skipped Voting", id: "1", role: "" };
              const voters = Object.entries(gameState.votes)
                .filter(([_, votedId]) => votedId === votedForId)
                .map(([voterId]) => players.find((p) => p.id === voterId)?.displayName);

              const isTopVoted = index === 0 && sortedVotes.length > 1;

              return (
                <div
                  key={votedForId}
                  className={`relative flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:scale-102 hover:shadow-lg ${
                    isTopVoted ? "bg-white/20 border-2 border-red-400/50 shadow-lg" : "bg-white/10 hover:bg-white/15"
                  }`}
                >
                  {isTopVoted && eliminatedPlayer && (
                    <div className="absolute -top-2 -left-2">
                      <Target className="w-8 h-8 text-red-400 drop-shadow-md" />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-black",
                        isTopVoted && eliminatedPlayer
                          ? "bg-gradient-to-br from-red-500 via-red-600 to-red-500"
                          : "bg-gradient-to-r from-blue-500 to-purple-600"
                      )}
                    >
                      {votedFor?.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={cn("text-medium", isTopVoted && eliminatedPlayer ? "text-red-100" : "text-white")}
                        >
                          {votedFor?.displayName}
                        </span>
                        <span
                          className={cn(
                            "px-4 py-2 text-white text-sm font-bold rounded-full shadow-md border-2",
                            isTopVoted && eliminatedPlayer
                              ? "bg-red-500 border-red-300"
                              : "bg-slate-600 border-slate-400"
                          )}
                        >
                          {count} vote{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 font-medium">
                        Voted by:{" "}
                        <span className="italic font-semibold">{voters.length > 0 ? voters.join(", ") : "None"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
