type Props = {
  voteCount: number;
  totalActivePlayers: number;
  shouldVote: boolean;
  votedFor: string | "skipped" | null;
};

export function VotingProgress({ totalActivePlayers, voteCount, shouldVote, votedFor }: Props) {
  return (
    <div className="bg-white/20 rounded-lg p-3">
      <div className="text-white text-sm text-center">
        Votes cast: {voteCount}/{totalActivePlayers}
      </div>
      <div className="w-full bg-black/20 rounded-full h-2 mt-2">
        <div
          className="bg-green-500 rounded-full h-2 transition-all duration-300"
          style={{ width: `${(voteCount / totalActivePlayers) * 100}%` }}
        />
      </div>
      <div className="text-sm text-white/80 py-2 text-center">
        {(() => {
          if (!shouldVote) return null;

          if (votedFor === "skipped") return `🤷‍♂️ Skipped Voting!`;
          if (votedFor === null) return "⏳ Cast your vote below";

          return (
            <p>
              ✅ You have voted: <strong>{votedFor}</strong>
            </p>
          );
        })()}
      </div>
    </div>
  );
}
