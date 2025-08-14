import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { type Player, type GameSettings, ErrorCodes, type RolesTypes, Roles } from "../../shared";
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
  imposterNames: string[];
  gameSettings: GameSettings;
};

const defaultGameState: GameState = {
  hostName: "",
  players: [],
  spectators: [],
  civilianWord: "",
  imposterWord: "",
  imposterNames: [],
  gameSettings: {
    wordCategories: [],
    imposterCount: 0,
  },
};

export function Room() {
  const queryParams = useParams<{ roomName: string }>();
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [userName] = useLocalStorage<string>(Constants.StorageKeys.Name);
  const [selectedRole] = useLocalStorage<RolesTypes>(Constants.StorageKeys.SelectedRole);
  const [hostGameSettings, setHostGameSettings] = useLocalStorage<GameSettings>(Constants.StorageKeys.GameSettings, {
    wordCategories: ["legacy"],
    imposterCount: 1,
  });
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const { gameSettings, hostName, imposterNames, imposterWord, players, spectators, civilianWord } = gameState;

  const isGameStarted = civilianWord.length > 0;
  const roomName = queryParams.roomName as string;
  const isHost = userName === hostName;
  const isConnected = isConnecting === false;
  const navigate = useNavigate();

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
        imposterNames: payload.game?.imposterNames ?? [],
        gameSettings: {
          wordCategories: payload.game?.settings?.wordCategories ?? [],
          imposterCount: payload.game?.settings?.imposterCount ?? 0,
        },
      });
    },
    ServerErrorEvent: (payload) => {
      if (payload.code === ErrorCodes.Room_NotFound) {
        toast.error("The room has not been hosted yet!");
        return navigate("/");
      }

      if (payload.code === ErrorCodes.Room_PlayerNotFound && userName && selectedRole) {
        const role = selectedRole === Roles.HOST ? Roles.PLAYER : selectedRole;
        send({
          type: "JoinRoomRequestEvent",
          payload: { playerName: userName, roomName, role },
        });
        updateRoom();
        return;
      }

      toast.error(payload.message);
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

      <div className="min-h-screen bg-gradient-to-br from-green-100 via-yellow-50 to-pink-100 flex flex-col relative overflow-hidden">
        <div className="absolute top-12 left-8 w-40 h-40 bg-green-300/30 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-12 right-6 w-48 h-48 bg-pink-300/30 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>

        <header className="w-full bg-white/60 backdrop-blur-md shadow-sm p-4 flex justify-between items-center border-b border-gray-200">
          <button
            onClick={() => navigate("/")}
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
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50 transition"
            aria-label="Game Settings"
          >
            Settings ⚙️
          </button>
        </header>

        <div className="w-full bg-white/60 backdrop-blur-md shadow-md z-10 sticky top-0 p-4 flex justify-center border-b border-gray-200">
          <div className="max-w-md w-full">
            <WordBlock word={civilianWord} shouldHighlight={!!imposterWord} />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          <section className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Players<span className="text-sm font-normal text-gray-500"> ({players.length})</span>
            </h3>
            <div className="bg-white/60 backdrop-blur-md shadow-lg rounded-xl divide-y divide-gray-200">
              {players
                .slice()
                .sort((a, b) => (a.name === hostName ? -1 : b.name === hostName ? 1 : 0))
                .map((player, index) => {
                  const shouldShowKick = isHost && player.name !== userName;
                  const isPlayerHost = player.name === hostName;
                  const isUserName = player.name === userName;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/30 transition rounded-lg"
                    >
                      <span className="text-base font-medium text-gray-800 flex items-center space-x-2 mx-2">
                        {player.name}
                        {isPlayerHost && (
                          <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-0.5 mx-2 rounded-full">
                            H
                          </span>
                        )}
                        {isUserName && (
                          <span className="text-xs font-semibold text-black border-black border-2 px-2 py-0.5 mx-2 rounded-full">
                            You
                          </span>
                        )}
                      </span>

                      {imposterNames.includes(player.name) && imposterWord && (
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
            <div className="bg-white/60 backdrop-blur-md shadow-lg rounded-xl divide-y divide-gray-200">
              {spectators.map((player, index) => {
                const isUserName = player.name === userName;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/30 transition rounded-lg"
                  >
                    <span className="text-base font-medium text-gray-800 flex items-center space-x-2">
                      {player.name}
                      {isUserName && (
                        <span className="text-xs font-semibold text-black border-black border-2 px-2 py-0.5 mx-2 rounded-full">
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

        <footer className="w-full bg-white/60 backdrop-blur-md shadow-inner p-4 sticky bottom-0 border-t border-gray-200">
          <div className="max-w-md mx-auto">
            {isHost && (
              <button
                onClick={start}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105"
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
