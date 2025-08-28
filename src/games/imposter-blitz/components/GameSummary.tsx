import type {
  ImposterBlitzGameState,
  WordImposterRoundSummary,
  WordImposterCiviliansWinSummary,
  WordImposterImpostersWinSummary,
} from "../../../../shared";
import { Card } from "@app/components";
import { cn } from "@app/utils";
import { Target, Trophy } from "lucide-react";

type Props = {
  gameState: ImposterBlitzGameState;
};

export function GameSummary({ gameState }: Props) {
  const { players, votes, summary, round } = gameState;

  const voteCount: Record<string, number> = {};
  Object.values(votes).forEach((votedFor: string) => {
    voteCount[votedFor] = (voteCount[votedFor] || 0) + 1;
  });
  const sortedVotes = Object.entries(voteCount).sort(([, a], [, b]) => b - a);

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const renderSummary = (summary: WordImposterRoundSummary | undefined) => {
    if (!summary) return null;

    switch (summary.type) {
      case "civilians-win": {
        const gameSummary = summary as WordImposterCiviliansWinSummary;

        return (
          <div className="bg-green-500/20 rounded-xl p-6 border border-green-400/30">
            <h3 className="text-green-200 text-2xl font-bold mb-3">🎉 Civilians Win!</h3>
            <p className="text-green-100 text-lg">
              All <span className="font-semibold text-green-300">Imposters</span> have been found!
            </p>
            <p className="text-green-100 mt-2">
              Civilians' word: <strong className="text-white-300 text-xl">{gameSummary.civilianWord}</strong>
            </p>
            <p className="text-green-100 mt-1">
              Imposters' word: <strong className="text-yellow-300 text-xl">{gameSummary.imposterWord}</strong>
            </p>
            <p className="text-green-100 mt-2">
              Imposters:{" "}
              {gameSummary.imposterPlayerIds
                .map(getPlayer)
                .map((p) => p?.displayName)
                .join(", ")}
            </p>
          </div>
        );
      }
      case "imposters-win": {
        const gameSummary = summary as WordImposterImpostersWinSummary;

        return (
          <div className="bg-red-500/20 rounded-xl p-6 border border-red-400/30">
            <h3 className="text-red-200 text-2xl font-bold mb-3">🎭 Imposters Win!</h3>
            <p className="text-red-100 text-lg">Imposters have outlasted the civilians!</p>
            <p className="text-green-100 mt-2">
              Civilians' word: <strong className="text-white-300 text-xl">{gameSummary.civilianWord}</strong>
            </p>
            <p className="text-red-100 mt-1">
              Imposters' word: <strong className="text-yellow-300 text-xl">{gameSummary.imposterWord}</strong>
            </p>
            <p className="text-red-100 mt-2">
              Remaining Imposters:{" "}
              {gameSummary.remainingImposters
                .map(getPlayer)
                .map((p) => p?.displayName)
                .join(", ")}
            </p>
          </div>
        );
      }

      case "imposter-found":
      case "civilian-found": {
        const eliminated = getPlayer(summary.eliminatedPlayerId);
        const isImposterEliminated = summary.type === "imposter-found";
        return (
          <div
            className={cn(
              "rounded-xl p-6 border",
              isImposterEliminated ? "bg-yellow-500/20 border-yellow-400/30" : "bg-orange-500/20 border-orange-400/30"
            )}
          >
            <h3 className="text-2xl font-bold mb-3">
              {isImposterEliminated ? "🚨 Imposter Eliminated" : "❌ Civilian Eliminated"}
            </h3>
            <p className="text-lg">
              <span className="font-bold">{eliminated?.displayName ?? "Unknown"}</span> was a{" "}
              <span className="font-bold">{isImposterEliminated ? "Imposter" : "Civilian"}</span>.
            </p>
            <p className="mt-2 text-white/80">
              {isImposterEliminated
                ? `Remaining imposters: ${summary.remainingImposters
                    .map(getPlayer)
                    .map((p) => p?.displayName)
                    .join(", ")}. Prepare for round ${round + 1}!`
                : `Imposters are still among you. Prepare for round ${round + 1}!`}
            </p>
          </div>
        );
      }

      case "votes-tied": {
        return (
          <div className="bg-blue-500/20 rounded-xl p-6 border border-blue-400/30">
            <h3 className="text-blue-200 text-2xl font-bold mb-3">🤝 Round Tied</h3>
            <p className="text-blue-100 text-lg">Votes are tied between players!</p>
            <p className="text-blue-100 mt-2">
              The hunt continues in round <span className="font-semibold text-blue-300">{round + 1}</span>!
            </p>
          </div>
        );
      }
    }
  };

  return (
    <Card variant="glass" className="bg-gradient-to-br">
      <div className="relative bg-gradient-to-br rounded-2xl p-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative z-10">
          <h3 className="text-white font-black text-2xl flex items-center gap-3 drop-shadow-sm">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Trophy className="w-7 h-7" />
            </div>
            Results
          </h3>

          <div className="rounded-2xl p-6 text-center">{renderSummary(summary)}</div>

          <div className="space-y-4">
            {sortedVotes.map(([votedForId, count], index) => {
              const votedFor = getPlayer(votedForId) || { displayName: "Skipped Voting", id: votedForId, role: "" };
              const voters = Object.entries(votes)
                .filter(([_, votedId]) => votedId === votedForId)
                .map(([voterId]) => getPlayer(voterId)?.displayName);

              const isTopVoted = index === 0 && sortedVotes.length > 1;
              return (
                <div
                  key={votedForId}
                  className={cn(
                    "relative flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:scale-102 hover:shadow-lg",
                    isTopVoted ? "bg-white/20 border-2 border-red-400/50 shadow-lg" : "bg-white/10 hover:bg-white/15"
                  )}
                >
                  {isTopVoted && (
                    <div className="absolute -top-2 -left-2">
                      <Target className="w-8 h-8 text-red-400 drop-shadow-md" />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-black",
                        isTopVoted
                          ? "bg-gradient-to-br from-red-500 via-red-600 to-red-500"
                          : "bg-gradient-to-r from-blue-500 to-purple-600"
                      )}
                    >
                      {votedFor.displayName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center space-x-4">
                        <span className={cn("text-medium", isTopVoted ? "text-red-100" : "text-white")}>
                          {votedFor.displayName}
                        </span>
                        <span
                          className={cn(
                            "px-4 py-2 text-white text-sm font-bold rounded-full shadow-md border-2",
                            isTopVoted ? "bg-red-500 border-red-300" : "bg-slate-600 border-slate-400"
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
