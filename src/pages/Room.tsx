import { useParams } from "react-router";
import { useState } from "react";
import { useSocket } from "../context";

type Player = { name: string };

export function Room() {
  const queryParams = useParams<{ roomId: string }>();
  const [word, setWord] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const roomId = queryParams.roomId as string;

  const send = useSocket({
    onOpen: () => {
      send({ type: "GetRoomInfoRequestEvent", payload: { roomId } });
    },
    GetRoomInfoResponseEvent: (payload) => {
      console.log("Room info received:", payload);
      if (payload.word) setWord(payload.word);

      /** only add new players if there are any */
      setPlayers((prev) => {
        const newPlayers = payload.players.filter((p) => !prev.some((prevP) => prevP.name === p.name));
        return newPlayers.length === 0 ? prev : prev.concat(newPlayers);
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-md mb-4">
        <WordBlock word={word} />
      </div>

      <div className="w-full max-w-md text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Room: {roomId}</h2>
      </div>

      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-4 space-y-3">
        {players.map((player, index) => (
          <div key={index} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-base font-medium text-gray-800">{player.name}</span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold uppercase
                ${
                  player.role === "host"
                    ? "bg-yellow-100 text-yellow-800"
                    : player.role === "player"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }
              `}
            >
              {player.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordBlock({ word }: { word: string }) {
  const [shouldShowWord, setShouldShowWord] = useState(true);

  if (word === "") {
    return (
      <div className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 border border-gray-300 rounded-xl shadow-md px-4 py-6 text-center">
        <span className="text-2xl font-semibold font-mono tracking-wide break-words opacity-40">— — —</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShouldShowWord((prev) => !prev)}
      className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 border border-gray-300 rounded-xl shadow-md px-4 py-6 text-center"
    >
      <span
        className={`text-2xl font-semibold font-mono tracking-wide break-words transition-opacity duration-200 ${
          shouldShowWord ? "opacity-100" : "opacity-40"
        }`}
      >
        {shouldShowWord ? word : "— — —"}
      </span>
      <p className="mt-1 text-sm text-gray-500">{shouldShowWord ? "Tap to hide" : "Tap to reveal"}</p>
    </button>
  );
}
