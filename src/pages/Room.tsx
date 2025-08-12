import { useState } from "react";
import { useParams } from "react-router";
import type { Player, GameSettings } from "../../shared";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useSocket } from "../context";
import { Constants } from "../constants.ts";
import { AnimatedBanner, SettingsModal, WordBlock, ViewSettingsModal } from "../components";

type GameState = {
  hostName: string;
  players: Player[];
  spectators: Player[];
  civilianWord: string;
  imposterWord: string;
  imposterName: string;
  gameSettings: GameSettings;
};

const defaultGameState: GameState = {
  hostName: "",
  players: [],
  spectators: [],
  civilianWord: "",
  imposterWord: "",
  imposterName: "",
  gameSettings: {
    wordCategories: [],
  },
};

export function Room() {
  const queryParams = useParams<{ roomName: string }>();
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [userName] = useLocalStorage<string>(Constants.StorageKeys.Name);
  const [hostGameSettings, setHostGameSettings] = useLocalStorage<GameSettings>(Constants.StorageKeys.GameSettings, {
    wordCategories: ["legacy"],
  });
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const { gameSettings, hostName, imposterName, imposterWord, players, spectators, civilianWord } = gameState;

  const isGameStarted = civilianWord.length > 0;
  const roomName = queryParams.roomName as string;
  const isHost = userName === hostName;
  const isConnected = isConnecting === false;

  const send = useSocket({
    onOpen: () => {
      setIsConnecting(false);
      updateRoom();
    },
    onClose: () => {
      setIsConnecting(true);
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
      setGameState({
        hostName: payload.hostName,
        players: payload.players,
        spectators: payload.spectators,
        civilianWord: payload.game?.civilianWord ?? "",
        imposterWord: payload.game?.imposterWord ?? "",
        imposterName: payload.game?.imposterName ?? "",
        gameSettings: {
          wordCategories: payload.game?.settings?.wordCategories ?? [],
        },
      });
    },
  });

  function updateRoom() {
    send({ type: "GetRoomInfoRequestEvent", payload: { roomName: roomName, playerName: userName } });
  }

  function start() {
    if (isGameStarted) {
      const confirmed = window.confirm("Are you sure you want to start next round?");
      if (!confirmed) return;
    }

    send({
      type: "StartGameRequestEvent",
      payload: { playerName: userName as string, roomName, gameSettings: hostGameSettings },
    });
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
    <>
      {isConnecting && <AnimatedBanner.Connecting />}
      {isSettingsOpen && isHost && (
        <SettingsModal
          state={hostGameSettings}
          onChange={setHostGameSettings}
          onClose={() => {
            setSettingsOpen(false);
          }}
        />
      )}
      {isSettingsOpen && !isHost && (
        <ViewSettingsModal
          state={gameSettings}
          onClose={() => {
            setSettingsOpen(false);
          }}
        />
      )}

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="w-full bg-white shadow-sm p-4 flex justify-between items-center border-b border-gray-200">
          <button
            onClick={() => {
              window.history.back();
            }}
            className="text-gray-600 hover:text-gray-900 font-semibold text-sm px-3 py-1 rounded-md border border-gray-300 hover:border-gray-400 transition"
            aria-label="Back"
          >
            ← Back
          </button>

          <div className="flex items-center space-x-2">
            <span className={`inline-block rounded-full w-4 h-4 ${isConnected ? "bg-green-700" : "bg-red-700"}`} />

            <h2 className="text-sm font-medium text-gray-600">
              Room ID: <span className="font-semibold text-gray-900">{roomName}</span>
            </h2>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="text-green-600 hover:text-green-800 font-semibold text-sm px-3 py-1 rounded-md border border-green-600 hover:bg-green-50 transition"
            aria-label="Game Settings"
          >
            Settings ⚙️
          </button>
        </header>

        <div className="w-full bg-white shadow-md z-10 sticky top-0 p-4 flex justify-center border-b border-gray-200">
          <div className="max-w-md w-full">
            <WordBlock word={civilianWord} shouldHighlight={!!imposterWord} />
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
                  const isUserName = player.name === userName;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <span className="text-base font-medium text-gray-800 flex items-center">
                        {player.name}
                        {isPlayerHost && (
                          <span className="ml-2 text-xs font-semibold text-white bg-blue-600 px-2 py-0.5 rounded-full">
                            H
                          </span>
                        )}
                        {isUserName && (
                          <span className="ml-2 text-xs font-semibold text-black border-black border-2 px-2 py-0.5 rounded-full">
                            You
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
              {spectators.map((player, index) => {
                const isUserName = player.name === userName;
                return (
                  <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                    <span className="text-base font-medium text-gray-800">
                      {player.name}
                      {isUserName && (
                        <span className="ml-2 text-xs font-semibold text-black border-black border-2 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
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
                {isGameStarted ? "Next" : "Play"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </>
  );
}
