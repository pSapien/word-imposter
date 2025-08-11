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
  const [spectators, setSpectators] = useState<Player[]>([]);
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
      if (payload.spectators) setSpectators(payload.spectators);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-white shadow-sm p-4 flex justify-center border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-600">
          Room ID: <span className="font-semibold text-gray-900">{roomName}</span>
        </h2>
      </header>

      <div className="w-full bg-white shadow-md z-10 sticky top-0 p-4 flex justify-center border-b border-gray-200">
        <div className="max-w-md w-full">
          <WordBlock word={word} shouldHighlight={!!imposterWord} />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
        <section className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Players<span className="text-sm font-normal text-gray-500"> ({players.length})</span>
          </h3>
          <div className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
            {players
              .slice()
              .sort((a, b) => {
                if (a.name === hostName) return -1;
                if (b.name === hostName) return 1;
                return 0;
              })
              .map((player, index) => {
                const shouldShowKick = isHost && player.name !== userName;
                const isPlayerHost = player.name === hostName;

                return (
                  <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                    <span className="text-base font-medium text-gray-800 flex items-center">
                      {player.name}
                      {isPlayerHost && (
                        <span className="ml-2 text-xs font-semibold text-white bg-blue-600 px-2 py-0.5 rounded-full">
                          H
                        </span>
                      )}
                    </span>

                    {imposterName === player.name && imposterWord && (
                      <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-0.5 border border-red-400 rounded-md">
                        {imposterWord}
                      </span>
                    )}

                    {shouldShowKick && (
                      <button
                        onClick={() => kickPlayer(player)}
                        className="text-red-500 hover:text-red-700 text-lg px-2 py-1"
                        title="Kick player"
                      >
                        ⛔
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </section>

        <section className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Spectators<span className="text-sm font-normal text-gray-500"> ({spectators.length})</span>
          </h3>
          <div className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
            {spectators.map((player, index) => (
              <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                <span className="text-base font-medium text-gray-800">{player.name}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="w-full bg-white shadow-inner p-4 sticky bottom-0 border-t border-gray-200">
        <div className="max-w-md mx-auto">
          {isHost && (
            <button
              onClick={start}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
            >
              {isGameStarted ? "Next Round" : "Play Again"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
