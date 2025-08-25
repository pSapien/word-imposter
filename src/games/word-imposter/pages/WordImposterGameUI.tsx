import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ErrorCodes, type Room, type WordImposterState, type WordImposterStatePlayer } from "../../../../shared";
import { useSocket, useSocketHandler } from "@app/socket";

import {
  WordCard,
  FooterSection,
  GameSummary,
  PlayerList,
  SpectatorList,
  BackgroundEffects,
  GameHeader,
  VotingProgress,
} from "../components";
import { ImposterGameSettingsStorage, RoleStorage } from "../../../context/profile.ts";
import { useLocalStorage } from "@app/hooks";

export function WordImposterGameUI() {
  const params = useParams<{ roomName: string }>();
  const roomName = params.roomName as string;
  const navigate = useNavigate();
  const { status, send, currentUserId } = useSocket();
  const [role] = useLocalStorage(RoleStorage);

  const [room, setRoom] = useState<Room | null>(null);

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
      if (error.code === ErrorCodes.authSessionExpiry) navigate("/");
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
    const gameSettings = ImposterGameSettingsStorage.get();
    send({
      type: "start_game",
      payload: {
        gameType: "imposter",
        settings: gameSettings,
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

  function handleVotePlayer(playerId: string) {
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

  const voteCount = Number(gameState?.players.filter((player) => player.hasVoted).length);
  const totalActivePlayers = gameState ? getTotalActivePlayers(gameState) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 relative overflow-hidden flex flex-col">
      <BackgroundEffects />
      <GameHeader isCurrentUserHost={isHost} onBack={handleLeaveRoom} roomName={room?.roomName || ""} />

      <main className="flex-1 overflow-y-auto relative z-10 max-w-4xl mx-auto p-4 space-y-8 w-full">
        <WordCard word={gameState?.civilianWord || ""} />

        {gameState?.stage === "voting" && (
          <VotingProgress
            shouldVote={totalActivePlayers.some((p) => p.id === currentUserId)}
            totalActivePlayers={totalActivePlayers.length}
            voteCount={voteCount}
            votedFor={getVotedFor(gameState, currentUserId)}
          />
        )}

        {!gameState && room && (
          <>
            <PlayerList
              players={players.map((p) => ({
                ...p,
                isCurrentUser: p.id === currentUserId,
                isHost: p.id === room?.hostId,
                hasVoted: false,
                imposterWord: "",
                isEliminated: false,
              }))}
              stage=""
              currentUserId={currentUserId}
              currentUserIsHost={isHost}
              onKickPlayer={handleKickPlayer}
              onVotePlayer={() => {}}
            />

            <SpectatorList currentUserId={currentUserId} spectators={spectators} />
          </>
        )}

        {gameState && (gameState.stage === "discussion" || gameState.stage === "voting") && (
          <>
            <PlayerList
              players={sortPlayers(gameState.players).map((p) => ({
                id: p.id,
                displayName: p.displayName,
                isCurrentUser: p.id === currentUserId,
                isHost: p.id === room?.hostId,
                hasVoted: p.hasVoted,
                imposterWord: gameState.imposterIds.includes(p.id) ? gameState.imposterWord : "",
                isEliminated: p.status === "eliminated",
              }))}
              stage={gameState.stage}
              currentUserId={currentUserId}
              currentUserIsHost={isHost}
              onKickPlayer={handleKickPlayer}
              onVotePlayer={handleVotePlayer}
            />
            <SpectatorList currentUserId={currentUserId} spectators={spectators} />
          </>
        )}

        {gameState && gameState.stage === "results" && <GameSummary gameState={gameState} />}

        {/* empty div so that the main content does not overlap the sticky footer  */}
        <div className="h-24" />
      </main>

      {isHost && (
        <FooterSection
          stage={gameState?.stage ?? ""}
          noWinner={Boolean(gameState?.summary?.winner === null)}
          onStartGame={handleStartGame}
          onStartVoting={handleStartVoting}
          onEndVoting={handleEndVoting}
          onNextRound={handleNextRound}
        />
      )}
    </div>
  );
}

function getVotedFor(state: WordImposterState, playerId: string) {
  if (!(playerId in state.votes)) return null;

  const votedForPlayerId = state.votes[playerId];
  if (votedForPlayerId === "") return "Skipped";

  const votedForPlayer = state.players.find((p) => p.id === votedForPlayerId);
  if (!votedForPlayer) return null;

  return votedForPlayer.displayName;
}

function getTotalActivePlayers(state: WordImposterState) {
  return state.players.filter((p) => p.role !== "spectator" && p.status === "alive");
}

export function sortPlayers(players: WordImposterStatePlayer[]): WordImposterStatePlayer[] {
  return players.slice().sort((a, b) => {
    // 1. Host comes first
    if (a.role === "host") return -1;
    if (b.role === "host") return 1;

    // 2. Alive players before eliminated
    if (a.status === "eliminated" && b.status !== "eliminated") return 1;
    if (a.status !== "eliminated" && b.status === "eliminated") return -1;

    // 3. Alphabetical by displayName
    return a.displayName.localeCompare(b.displayName);
  });
}
