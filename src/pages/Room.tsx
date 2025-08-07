import { useState } from "react";
import { useParams } from "react-router";
import type { Player } from "../../shared";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useSocket } from "../context";
import { Constants } from "../constants.ts";
import { WordBlock } from "../components";

export function Room() {
  const queryParams = useParams<{ roomName: string }>();
  const [word, setWord] = useState("");
  const [userName] = useLocalStorage(Constants.StorageKeys.Name);
  const [hostName, setHostName] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [imposterWord, setImposterWord] = useState("");
  const [imposterName, setImposterName] = useState("");

  const isGameStarted = word.length > 0;
  const roomName = queryParams.roomName as string;
  const isHost = userName === hostName;

  const send = useSocket({
    onOpen: () => {
      updateRoom();
    },
    PlayerKickedResponseEvent: () => {
      updateRoom();
    },
    JoinRoomResponseEvent: () => {
      updateRoom();
    },
    GameStartedResponseEvent: () => {
      updateRoom();
    },
    GetRoomInfoResponseEvent: (payload) => {
      setHostName(payload.hostName);

      if (payload.game?.normalWord) setWord(payload.game?.normalWord);
      if (payload.game?.imposterWord) setImposterWord(payload.game.imposterWord);
      if (payload.game?.imposterName) setImposterName(payload.game?.imposterName);

      setPlayers(payload.players);
    },
  });

  function updateRoom() {
    send({ type: "GetRoomInfoRequestEvent", payload: { roomName: roomName, playerName: userName as string } });
  }

  function start() {
    if (isGameStarted) {
      const confirmed = window.confirm("Are you sure you want to start next round?");
      if (!confirmed) return;
    }

    send({ type: "StartGameRequestEvent", payload: { playerName: userName as string, roomName } });
  }

  function kickPlayer(player: Player) {
    const confirmed = window.confirm("Are you sure you want to kick the player?");
    if (!confirmed) return;

    send({
      type: "KickPlayerRequestEvent",
      payload: { playerName: userName as string, roomName, playerNameToBeKicked: player.name },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-md mb-4">
        <WordBlock word={word} shouldHighlight={!!imposterWord} />
      </div>

      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-4 space-y-3">
        {players.map((player, index) => {
          const shouldShowKick = isHost && player.name !== userName;

          return (
            <div key={index} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-base font-medium text-gray-800">{player.name}</span>

              {imposterName === player.name && imposterWord && (
                <span className="text-base font-medium text-red-500 bg-red-200 px-2 border border-red-500 rounded-md">
                  {imposterWord}
                </span>
              )}

              {shouldShowKick && (
                <button
                  onClick={() => kickPlayer(player)}
                  className="text-red-500 hover:text-red-700 text-2xl px-2 py-1"
                  title="Kick player"
                >
                  ⛔
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-md text-center mt-auto pt-6">
        {isHost && (
          <div className="w-full max-w-md mt-6">
            <button
              onClick={start}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow"
            >
              {isGameStarted ? "Next Round" : "Start Game"}
            </button>
          </div>
        )}

        <h2 className="text-sm text-gray-500">Room: {roomName}</h2>
      </div>
    </div>
  );
}
