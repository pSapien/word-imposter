import { useState } from "react";
import type { Player, ImposterGameState } from "../../shared";

type Props = {
  players: Player[];
  userName: string;
  votes: Record<string, string>;
  summary: ImposterGameState["summary"];
  onVote: (voteeName: string) => void;
  eliminated: string[];
};

export function VotingPhase(props: Props) {
  const { players, userName, votes, onVote, eliminated } = props;
  const playerVoteFor = votes[userName] || null;
  const [_, setSelectedVote] = useState<string | null>(playerVoteFor);

  return (
    <section className="bg-white/60 backdrop-blur-md shadow-lg rounded-xl p-6 max-w-md mx-auto space-y-6">
      <h3 className="text-xl font-bold text-gray-800 text-center">Cast Your Vote</h3>
      <ul className="space-y-3">
        {players.map((player) => {
          if (player.name === userName) return null;
          if (eliminated.includes(player.name)) return null;

          return (
            <li key={player.name}>
              <button
                onClick={() => {
                  onVote(player.name);
                  setSelectedVote(player.name);
                }}
                className={`
                    w-full flex justify-between items-center px-4 py-3 rounded-xl font-semibold
                    text-gray-800 bg-gradient-to-r from-green-100 via-green-200 to-green-100
                    shadow-lg hover:shadow-2xl
                    `}
              >
                <span>{player.name}</span>
                <div className="flex items-center space-x-2">
                  {playerVoteFor === player.name && <span className="text-green-600 font-bold">✅</span>}
                </div>
              </button>
            </li>
          );
        })}
        {/* <li>
          <button
            onClick={() => {
              onVote("");
              setSelectedVote("");
            }}
            className={`
              w-full px-4 py-3 rounded-xl font-semibold
              text-gray-800 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
              shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95
              transition-transform duration-200 ease-out
            `}
          >
            Skip
          </button>
        </li> */}
      </ul>

      <div className="pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Votes:</h4>
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {Object.keys(votes).map((voterName) => {
            const votedFor = votes[voterName];
            return (
              <li key={voterName} className="text-sm text-gray-600 animate-pulse flex justify-between">
                <span>{voterName}</span>
                <span>{votedFor ? "✅ voted" : "skipped"}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
