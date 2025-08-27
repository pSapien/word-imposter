type Props = {
  votedCount: number;
  totalPlayers: number;
  votedFor: string | null;
};

export function VotingProgress({ votedCount, totalPlayers, votedFor }: Props) {
  const progress = totalPlayers > 0 ? (votedCount / totalPlayers) * 100 : 0;

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-center mb-2">Voting Progress</h2>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-center mt-2">
        {votedCount} / {totalPlayers} players have voted
      </p>
      {votedFor && (
        <p className="text-center mt-2">
          You voted for: <strong>{votedFor}</strong>
        </p>
      )}
    </div>
  );
}
