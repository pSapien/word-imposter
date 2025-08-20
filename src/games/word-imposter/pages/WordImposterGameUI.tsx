import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import type { Room, WordImposterState } from "../../../../shared";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Constants } from "@app/constants";

import { WordCard } from "../components/index.ts";
import { FooterSection } from "./FooterSection.tsx";
import { GameSettingsSection, usePersistGameSettings } from "./GameSettingsSection.tsx";
import { Button, PlayerList, useModal } from "@app/components";
import { useSocket, useSocketHandler } from "@app/socket";
import { cn } from "@app/utils";
import { GameResults } from "./GameResults";
import { Settings } from "lucide-react";

export function WordImposterGameUI() {
  const settingsModal = useModal(GameSettingsSection);

  const params = useParams<{ roomName: string }>();
  const roomName = params.roomName as string;
  const navigate = useNavigate();
  const { status, send, currentUserId } = useSocket();
  const [role] = useLocalStorage<"player" | "host" | "spectator">(Constants.StorageKeys.Role, "player");
  const isConnected = status === "connected" || status === "authenticated";

  const [room, setRoom] = useState<Room | null>(null);
  const [hostGameSettings] = usePersistGameSettings();

  const [gameState, setGameState] = useState<WordImposterState | null>(null);

  const players = room?.members.filter((p) => p.role !== "spectator") || [];
  const spectators = room?.members.filter((p) => p.role === "spectator") || [];
  const isVotingPhase = Boolean(gameState?.stage === "voting");
  const isHost = room?.hostId === currentUserId;

  useSocketHandler({
    room_joined: (payload) => {
      setRoom(payload);
    },

    game_state: (payload) => {
      const newGameState = payload.state as WordImposterState;
      setGameState(newGameState);
    },

    error: (error) => {
      toast.error(error.message);
      if (error.code === "room.not_found") navigate("/");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (status === "authenticated" && role) {
      const userRole = role as "player" | "host" | "spectator";
      send({
        type: "join_room",
        payload: { roomName: roomName, role: userRole },
      });
    }
  }, [status, send, role]);

  const handleStartGame = () => {
    send({
      type: "start_game",
      payload: {
        gameType: "imposter",
        settings: hostGameSettings,
      },
    });
  };

  const handleStartVoting = () => {
    send({
      type: "game_action",
      payload: {
        type: "start_voting",
        payload: {},
      },
    });
  };

  function handleEndVoting() {
    send({
      type: "game_action",
      payload: {
        type: "end_voting",
        payload: {},
      },
    });
  }

  const handleLeaveRoom = () => {
    if (room) {
      send({
        type: "leave_room",
        payload: {
          roomId: room.roomId,
        },
      });
    }
    navigate("/");
  };

  function handleKickPlayer(playerId: string) {
    if (!room) return toast.error("Not connected to a room");
    send({
      type: "kick_room_member",
      payload: {
        memberId: playerId,
        roomId: room.roomId,
      },
    });
  }

  function onVotePlayer(playerId: string) {
    if (!isVotingPhase) return toast.error("Not voting stage");

    send({
      type: "game_action",
      payload: {
        type: "cast_vote",
        payload: {
          voteeId: playerId,
        },
      },
    });
  }

  function handleNextRound() {
    send({
      type: "game_action",
      payload: {
        type: "start_next_round",
        payload: {},
      },
    });
  }

  const voteCount = gameState?.votes ? Object.keys(gameState.votes).length : 0;
  const totalActivePlayers =
    room?.members.filter((r) => !gameState?.eliminatedPlayerIds.includes(r.id) && r.role !== "spectator").length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl px-4 py-4 flex items-center justify-between">
          <Button onClick={handleLeaveRoom} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            ←
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">🎭 Word Imposter</h1>
            <div className="text-sm text-white/80">Room: {roomName}</div>
            <div
              className={cn(
                "text-sm px-3 py-1 rounded-full inline-block mt-1",
                isConnected ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-100"
              )}
            >
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={() => {
                settingsModal.show({
                  playersCount: room?.members?.length || 1,
                });
              }}
            >
              <Settings color="white" height={20} width={20} />
            </button>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto relative z-10 max-w-4xl mx-auto p-4 space-y-8 w-full">
        <WordCard word={gameState?.civilianWord || ""} />

        {gameState?.stage === "voting" && (
          <div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-white text-sm text-center">
                Votes cast: {voteCount}/{totalActivePlayers}
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 rounded-full h-2 transition-all duration-300"
                  style={{ width: `${(voteCount / totalActivePlayers) * 100}%` }}
                />
              </div>
              <div className="text-sm text-white/80 py-2 text-center">
                {(() => {
                  if (currentUserId in gameState.votes) {
                    const voteeId = gameState.votes[currentUserId];
                    const votedMember = room?.members.find((r) => r.id === voteeId);

                    if (votedMember)
                      return (
                        <p>
                          ✅ You have voted: <strong>{votedMember.displayName}</strong>
                        </p>
                      );
                    return `🤷‍♂️ Skipped Voting!`;
                  }

                  if (role === "spectator") return null;

                  return "⏳ Cast your vote below";
                })()}
              </div>
            </div>
          </div>
        )}

        {gameState && gameState.stage === "results" && room && (
          <div>
            <GameResults players={room.members} gameState={gameState} />
          </div>
        )}

        {room && gameState?.stage !== "results" && (
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <PlayerList
              stage={gameState?.stage || ""}
              onKickPlayer={handleKickPlayer}
              onVotePlayer={onVotePlayer}
              isHost={isHost}
              role={role}
              isEliminated={Boolean(gameState?.imposterIds.includes(currentUserId))}
              players={sortPlayers(players, room.hostId, gameState?.eliminatedPlayerIds || []).map((p) => ({
                id: p.id,
                displayName: p.displayName,
                isEliminated: Boolean(gameState?.eliminatedPlayerIds.includes(p.id)),
                isHost: p.id === room.hostId,
                isCurrentUser: p.id === currentUserId,
                hasVoted: Boolean(p.id in (gameState?.votes || {})),
                imposterWord: gameState?.imposterIds.includes(p.id) ? gameState?.imposterWord : "",
              }))}
              spectators={spectators.map((p) => ({
                id: p.id,
                displayName: p.displayName,
                isEliminated: false,
                isHost: false,
                isCurrentUser: p.id === currentUserId,
                hasVoted: false,
                imposterWord: "",
              }))}
              currentUserId={currentUserId}
            />
          </div>
        )}

        <div className="h-24" />
      </main>

      {/* empty div so that the main content does not overlap the sticky footer  */}

      <FooterSection
        isHost={isHost}
        stage={gameState?.stage ?? ""}
        noWinner={Boolean(gameState?.roundResults && gameState?.roundResults.winner === null)}
        onStartGame={handleStartGame}
        onStartVoting={handleStartVoting}
        onEndVoting={handleEndVoting}
        onNextRound={handleNextRound}
      />
    </div>
  );
}

function sortPlayers(players: Room["members"], hostId: string, eliminated: string[]): Room["members"] {
  const eliminatedSet = new Set(eliminated);

  return players.slice().sort((a, b) => {
    // 1. Host comes first
    if (a.id === hostId) return -1;
    if (b.id === hostId) return 1;

    // 2. Non-eliminated players before eliminated
    const aEliminated = eliminatedSet.has(a.id);
    const bEliminated = eliminatedSet.has(b.id);
    if (aEliminated && !bEliminated) return 1;
    if (!aEliminated && bEliminated) return -1;

    // 3. Otherwise alphabetical
    return a.id.localeCompare(b.id);
  });
}
