import type { GameUIProps } from "../../types";
import type { WordImposterGameState } from "../types";
import { WordCard } from "./WordCard";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";

export function WordImposterGameUI({ gameState, currentUserId, isHost, onGameAction }: GameUIProps) {
  const state = gameState as WordImposterGameState;
  const isDiscussion = state.stage === "discussion";
  const isVotingStage = state.stage === "voting";
  const isResults = state.stage === "results";

  const currentUserVoted = state.votes && state.votes[currentUserId];
  const activePlayers = state.players.filter((p) => !p.isEliminated);

  const handleStartVoting = () => onGameAction({ type: "start_voting" });
  const handleFinishVoting = () => onGameAction({ type: "finish_voting" });
  const handleNextRound = () => onGameAction({ type: "next_round" });
  const handleVotePlayer = (targetId: string) =>
    onGameAction({
      type: "cast_vote",
      data: { targetId },
    });

  return (
    <div className="space-y-6">
      {/* Word Card - Sticky on mobile */}
      <div className="sticky top-4 z-20">
        <WordCard word={state.word} isImposter={state.isImposter} isRevealed={true} />
      </div>

      {/* Game Controls */}
      <Card variant="glass" className="backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Stage Indicator */}
            <div className="flex items-center justify-center space-x-4">
              <div
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold",
                  isDiscussion && "bg-blue-500 text-white",
                  isVotingStage && "bg-red-500 text-white",
                  isResults && "bg-green-500 text-white"
                )}
              >
                {isDiscussion && "💬 Discussion Phase"}
                {isVotingStage && "🗳️ Voting Phase"}
                {isResults && "📊 Results Phase"}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              {isHost && isDiscussion && (
                <Button onClick={handleStartVoting} variant="danger">
                  Start Voting 🗳️
                </Button>
              )}

              {isHost && isVotingStage && (
                <Button onClick={handleFinishVoting} variant="primary">
                  Finish Voting 📊
                </Button>
              )}

              {isHost && isResults && (
                <Button onClick={handleNextRound} variant="primary">
                  Next Round 🔄
                </Button>
              )}
            </div>

            {/* Voting Status */}
            {isVotingStage && (
              <div className="text-sm text-gray-600">
                {currentUserVoted ? "✅ You have voted" : "⏳ Cast your vote below"}
              </div>
            )}

            {/* Results Display */}
            {isResults && state.roundResults && (
              <div className="bg-white/20 rounded-lg p-4 text-white">
                <h3 className="font-bold mb-2">Round Results:</h3>
                {state.roundResults.eliminatedPlayerId ? (
                  <div>
                    <p>{state.roundResults.imposterFound ? "🎉" : "😔"} Player eliminated</p>
                    {state.roundResults.imposterFound && (
                      <p className="text-sm mt-1">
                        The imposter word was: <strong>{state.roundResults.imposterWord}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <p>🤝 Vote was tied - no elimination</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voting Interface */}
      {isVotingStage && !currentUserVoted && (
        <Card variant="glass">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-center">Vote to eliminate a player:</h3>
            <div className="grid grid-cols-1 gap-2">
              {activePlayers
                .filter((p) => p.profileId !== currentUserId)
                .map((player) => (
                  <Button
                    key={player.profileId}
                    onClick={() => handleVotePlayer(player.profileId)}
                    variant="secondary"
                    className="justify-start"
                  >
                    Vote out {player.displayName}
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
