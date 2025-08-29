type Props = {
  voteCount: number;
  totalActivePlayers: number;
  shouldVote: boolean;
  votedFor: string | "skipped" | null;
};

export function VotingProgress({ voteCount, totalActivePlayers, votedFor, shouldVote }: Props) {
  return (
    <div className=" rounded-lg">
      <h2 className="text-base text-center mb-2">Voting Poll</h2>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
