import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import {
  type Player,
  type GameSettings,
  ErrorCodes,
  type RolesTypes,
  Roles,
  type ImposterGameState,
} from "../../shared";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useSocket } from "../context";
import { Constants } from "../constants.ts";
import {
  AnimatedBanner,
  SettingsModal,
  WordBlock,
  ViewSettingsModal,
  useModal,
  PlayerList,
  VotingPhase,
  Summary,
} from "../components";

type GameState = {
  hostName: string;
  players: Player[];
  spectators: Player[];
  civilianWord: string;
  imposterWord: string;
  imposterNames: string[];
  gameSettings: GameSettings;
  votes: Record<string, string>;
  stage: string;
  summary: ImposterGameState["summary"];
  eliminated: string[];
};

const defaultGameState: GameState = {
  hostName: "",
  players: [],
  spectators: [],
  civilianWord: "",
  imposterWord: "",
  imposterNames: [],
  votes: {},
  stage: "",
  summary: null,
  eliminated: [],
  gameSettings: {
    wordCategories: [],
    imposterCount: 0,
  },
};
export function Room() {
  /** modals */
  const hostSettingsModal = useModal(SettingsModal);
  const playerSettingsModal = useModal(ViewSettingsModal);

  const queryParams = useParams<{ roomName: string }>();
  const [isConnecting, setIsConnecting] = useState(true);
  const [userName] = useLocalStorage<string>(Constants.StorageKeys.Name);
  const [selectedRole] = useLocalStorage<RolesTypes>(Constants.StorageKeys.SelectedRole);
  const [hostGameSettings, setHostGameSettings] = useLocalStorage<GameSettings>(Constants.StorageKeys.GameSettings, {
    wordCategories: ["legacy"],
    imposterCount: 1,
  });
  const [gameState, setGameState] = useState<GameState>(defaultGameState);

  const { hostName, players, spectators, civilianWord, imposterWord, imposterNames } = gameState;
  const roomName = queryParams.roomName as string;
  const isHost = userName === hostName;
  const isConnected = !isConnecting;
  const isPlayer = players.some((p) => p.name === userName);
  const isSpectator = spectators.some((p) => p.name === userName);
  const stageIsVoting = gameState.stage === "voting";
  const isEliminated = gameState.eliminated.includes(userName);
  const canVote = isPlayer && stageIsVoting && !isEliminated;
  const isGameStarted = civilianWord.length > 0;

  const navigate = useNavigate();

  const send = useSocket({
    onOpen: () => {
      setIsConnecting(false);
      updateRoom();
    },
    onClose: () => setIsConnecting(true),
    PlayerKickedResponseEvent: updateRoom,
    JoinRoomResponseEvent: updateRoom,
    GameStartedResponseEvent: updateRoom,
    VotedStartedResponseEvent: updateRoom,
    CastVoteResponseEvent: updateRoom,
    VotingRoundFinishedResponseEvent: updateRoom,
    StartNextRoundResponseEvent: updateRoom,
    GetRoomInfoResponseEvent: (payload) => {
      setGameState({
        hostName: payload.hostName,
        players: payload.players,
        spectators: payload.spectators,
        civilianWord: payload.game?.civilianWord ?? "",
        imposterWord: payload.game?.imposterWord ?? "",
        imposterNames: payload.game?.imposterNames ?? [],
        stage: payload.game?.stage || "",
        votes: payload.game?.votes || {},
        summary: payload.game?.summary || null,
        eliminated: payload.game?.eliminated || [],
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
        send({ type: "JoinRoomRequestEvent", payload: { playerName: userName, roomName, role } });
        updateRoom();
        return;
      }

      toast.error(payload.message);
    },
  });

  function updateRoom() {
    send({ type: "GetRoomInfoRequestEvent", payload: { roomName, playerName: userName } });
  }

  function start() {
    if (gameState.stage === "discussion") {
      if (!window.confirm("Start voting?")) return;
      send({ type: "StartVoteRequestEvent", payload: { playerName: userName, roomName } });
      return;
    }
    if (gameState.stage === "voting") {
      if (!window.confirm("Reveal votes?")) return;
      send({ type: "FinishVotingRequestEvent", payload: { playerName: userName, roomName } });
      return;
    }
    if (gameState.stage === "round_finished") {
      if (!window.confirm("Start Another Round")) return;
      send({ type: "StartNextRoundRequestEvent", payload: { playerName: userName, roomName } });
      return;
    }
    playNextGame();
  }

  function playNextGame() {
    if (isGameStarted && !window.confirm("Start next round?")) return;
    send({
      type: "StartGameRequestEvent",
      payload: { playerName: userName, roomName, gameSettings: hostGameSettings },
    });
  }

  function kickPlayer(player: Player) {
    if (!window.confirm("Kick this player?")) return;
    send({
      type: "KickPlayerRequestEvent",
      payload: { playerName: userName, roomName, playerNameToBeKicked: player.name },
    });
  }

  function castVote(voteeName: string) {
    if (!window.confirm(`Vote for ${voteeName}?`)) return;
    send({ type: "CastVoteRequestEvent", payload: { roomName, voteeName, voterName: userName } });
  }

  function openSettings() {
    if (isHost) hostSettingsModal.show({ state: hostGameSettings, onChange: setHostGameSettings });
    else playerSettingsModal.show({ state: gameState.gameSettings });
  }

  return (
    <>
      {isConnecting && <AnimatedBanner.Connecting />}

      <div className="min-h-screen bg-gradient-to-br from-green-100 via-yellow-50 to-pink-100 flex flex-col relative overflow-hidden">
        {/* Background Pulses */}
        <div className="absolute top-12 left-8 w-40 h-40 bg-green-300/30 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-12 right-6 w-48 h-48 bg-pink-300/30 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>

        {/* Header */}
        <header className="w-full bg-white/60 backdrop-blur-md shadow-sm p-4 flex justify-between items-center border-b border-gray-200">
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900 font-semibold text-sm px-3 py-1 rounded-md border border-gray-300 hover:border-gray-400 transition"
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
            onClick={openSettings}
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50 transition"
          >
            Settings ⚙️
          </button>
        </header>

        {/* WordBlock */}
        <div className="w-full bg-white/60 backdrop-blur-md shadow-md z-10 sticky top-0 p-4 flex justify-center border-b border-gray-200">
          <div className="max-w-md w-full">
            <WordBlock word={civilianWord} shouldHighlight={!!imposterWord} />
          </div>
        </div>

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          {(gameState.stage === "" || gameState.stage === "discussion") && isPlayer && (
            <>
              <PlayerList
                title="Players"
                players={sortPlayers(gameState.players, hostName, gameState.eliminated)}
                hostName={hostName}
                userName={userName}
                eliminated={gameState.eliminated}
              >
                {(player) => (
                  <span>
                    {imposterNames.includes(player.name) && imposterWord && (
                      <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-0.5 border border-red-400 rounded-md">
                        {imposterWord}
                      </span>
                    )}
                    {isHost && player.name !== userName && (
                      <button
                        onClick={() => kickPlayer(player)}
                        className="text-red-500 hover:text-red-700 text-lg px-2 py-1"
                      >
                        ⛔
                      </button>
                    )}
                  </span>
                )}
              </PlayerList>

              <PlayerList
                title="Spectators"
                players={spectators}
                hostName={hostName}
                userName={userName}
                eliminated={gameState.eliminated}
              />
            </>
          )}

          {(isSpectator || isEliminated) && (
            <>
              <PlayerList
                title="Players"
                players={sortPlayers(gameState.players, hostName, gameState.eliminated)}
                hostName={hostName}
                userName={userName}
                eliminated={gameState.eliminated}
              >
                {(player) => (
                  <span>
                    {imposterNames.includes(player.name) && imposterWord && (
                      <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-0.5 border border-red-400 rounded-md">
                        {imposterWord}
                      </span>
                    )}
                    {isHost && player.name !== userName && (
                      <button
                        onClick={() => kickPlayer(player)}
                        className="text-red-500 hover:text-red-700 text-lg px-2 py-1"
                      >
                        ⛔
                      </button>
                    )}
                  </span>
                )}
              </PlayerList>

              <PlayerList
                title="Spectators"
                players={spectators}
                hostName={hostName}
                userName={userName}
                eliminated={gameState.eliminated}
              />
            </>
          )}

          {gameState.stage === "voting" && canVote && (
            <VotingPhase
              userName={userName}
              players={players}
              votes={gameState.votes}
              summary={gameState.summary}
              onVote={castVote}
              eliminated={gameState.eliminated}
            />
          )}

          {gameState.summary && isPlayer && (
            <Summary players={players} summary={gameState.summary} userName={userName} votes={gameState.votes} />
          )}
        </main>

        <footer className="w-full bg-white/60 backdrop-blur-md shadow-inner p-4 sticky bottom-0 border-t border-gray-200">
          <div className="max-w-md mx-auto space-y-3">
            {stageIsVoting && canVote && (
              <button
                disabled={!!gameState.votes[userName]}
                onClick={() => castVote("skip")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105"
              >
                Skip Vote
              </button>
            )}
            {isHost && (
              <button
                onClick={start}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105"
              >
                {renderButtonText(gameState.stage)}
              </button>
            )}
            {isHost && (
              <button
                onClick={playNextGame}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105"
              >
                Play Next Game
              </button>
            )}
          </div>
        </footer>
      </div>
    </>
  );
}

function renderButtonText(stage: string) {
  if (stage === "") return "Start";
  if (stage === "discussion") return "Start Voting";
  if (stage === "voting") return "Reveal";
  return "Next Round";
}

function sortPlayers(players: Player[], hostName: string, eliminated: string[]): Player[] {
  const eliminatedSet = new Set(eliminated);

  return players.slice().sort((a, b) => {
    // 1. Host comes first
    if (a.name === hostName) return -1;
    if (b.name === hostName) return 1;

    // 2. Non-eliminated players before eliminated
    const aEliminated = eliminatedSet.has(a.name);
    const bEliminated = eliminatedSet.has(b.name);
    if (aEliminated && !bEliminated) return 1;
    if (!aEliminated && bEliminated) return -1;

    // 3. Otherwise alphabetical
    return a.name.localeCompare(b.name);
  });
}
