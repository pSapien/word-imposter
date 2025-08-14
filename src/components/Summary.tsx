import type { Player, ImposterGameState } from "../../shared";

type Props = {
  players: Player[];
  votes: Record<string, string>;
  userName: string;
  summary: NonNullable<ImposterGameState["summary"]>;
};

export function Summary({ players, votes, userName, summary }: Props) {
  const voteCountMap: Record<string, number> = {};
  Object.values(votes).forEach((votee) => {
    if (votee === "") return;
    voteCountMap[votee] = (voteCountMap[votee] || 0) + 1;
  });

  const sortedPlayers = [...players].sort((a, b) => (voteCountMap[b.name] || 0) - (voteCountMap[a.name] || 0));

  return (
    <section className="bg-white/60 backdrop-blur-md shadow-lg rounded-xl p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Voting Results</h2>

      <ul className="space-y-4">
        {sortedPlayers.map((player) => {
          const voteCount = voteCountMap[player.name] || 0;

          return (
            <li
              key={player.name}
              className={`flex flex-col p-4 rounded-xl shadow-lg transform transition-transform duration-200`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">{player.name}</span>
                  {player.name === userName && (
                    <span className="text-xs font-semibold text-black border-black border-2 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <span className="font-bold text-green-600 text-lg">
                  {voteCount} vote{voteCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-700">
                {Object.entries(votes)
                  .filter(([_, votee]) => votee === player.name)
                  .map(([voter]) => (
                    <span
                      key={voter}
                      className="bg-gray-200 px-2 py-1 rounded-full font-medium text-gray-800 shadow-sm transform transition-transform duration-200 hover:scale-110"
                    >
                      {voter} ✅
                    </span>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 text-center bg-gray-50 rounded-xl p-4 shadow-inner space-y-2 animate-[fadeIn_0.5s_ease-out]">
        {summary.imposterWord && (
          <p>
            Imposter Word: <span className="font-semibold">{summary.imposterWord}</span>
          </p>
        )}
        <p>
          Imposter Found:{" "}
          <span className={`font-semibold ${summary.isImposterFound ? "text-green-600" : "text-red-600"}`}>
            {summary.isImposterFound ? "Yes" : "No"}
          </span>
        </p>
        {summary.isImposterFound && (
          <p>
            Imposter Word: <span className="font-semibold text-red-600">{summary.imposterWord}</span>
          </p>
        )}
      </div>
    </section>
  );
}
