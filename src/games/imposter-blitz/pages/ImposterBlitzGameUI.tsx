import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ErrorCodes,
  type Room,
  type ImposterBlitzGameState,
  ImposterBlitzSubmissionEvent,
  ImposterBlitzVoteEvent,
} from "../../../../shared";
import { useSocket, useSocketHandler } from "@app/socket";
import { ImposterGameSettingsStorage, RoleStorage } from "../../../context/profile.ts";
import { useLocalStorage } from "@app/hooks";
import {
  ChatDisplay,
  FloatingHostControls,
  GameSummary,
  MessageInput,
  PlayerWord,
  VotingProgress,
} from "../components";

import { GameHeader } from "../../word-imposter/components/GameHeader.tsx";
import notification from "./assets/notification.mp3";

export default function ImposterBlitzGameUI() {
  const params = useParams<{ roomName: string }>();
  const roomName = params.roomName as string;
  const navigate = useNavigate();
  const { status, send, currentUserId } = useSocket();
  const [role] = useLocalStorage(RoleStorage);

  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<ImposterBlitzGameState | null>(null);

  const me = gameState?.players.find((p) => p.id === currentUserId);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const isMyTurn = gameState?.turn === me?.id;

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gameState]);

  useSocketHandler({
    room_joined: (payload) => setRoom(payload),
    game_state: (payload) => setGameState(payload.state),
    error: (error) => {
      if (error.code === ErrorCodes.authSessionExpiry) navigate("/");
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

  useEffect(() => {
    if (isMyTurn) {
      const audio = new Audio(notification);
      audio.play();
    }
  }, [isMyTurn]);

  const handleStartGame = () => {
    const gameSettings = ImposterGameSettingsStorage.get();
    send({
      type: "start_game",
      payload: {
        gameType: "imposter-blitz",
        settings: gameSettings,
      },
    });
  };

  const handleSendMessage = (message: string) => {
    if (!gameState) return;

    handleWordSubmission(message);
  };

  const handleWordSubmission = (word: string) => {
    send({
      type: "game_action",
      payload: {
        type: "submit_word",
        payload: { word },
      },
    });
  };

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

  const handleVote = (playerId: string) => {
    send({
      type: "game_action",
      payload: {
        type: "cast_vote",
        payload: { voteeId: playerId },
      },
    });
  };

  const handleSkipVote = () => {
    send({
      type: "game_action",
      payload: {
        type: "cast_vote",
        payload: { voteeId: "" },
      },
    });
  };

  const handleEndVoting = () => {
    send({
      type: "game_action",
      payload: {
        type: "end_voting",
        payload: {},
      },
    });
  };

  const handleNextRound = () => {
    send({
      type: "game_action",
      payload: {
        type: "start_next_round",
        payload: {},
      },
    });
  };

  function getPlaceholder() {
    const random = (list: string[]) => list[Math.floor(Math.random() * list.length)];

    if (me?.status === "eliminated") {
      const eliminatedEmojis = ["💀", "😢", "👻", "☠️"];
      return `${random(eliminatedEmojis)} You are eliminated... So sad!`;
    }

    if (gameState?.turn !== me?.id) {
      const waitingEmojis = ["⏳", "🕒", "🙄", "⌛"];
      const currentPlayer = gameState?.players.find((p) => p.id === gameState.turn);
      return `${random(waitingEmojis)} ${currentPlayer?.displayName}'s turn...`;
    }

    const typingEmojis = ["✍️", "⌨️", "📝", "💡"];
    return `${random(typingEmojis)} Enter your word...`;
  }

  const messages = transformMessages(gameState, room, currentUserId);
  const totalActivePlayers = gameState ? getTotalActivePlayers(gameState) : [];
  const voteCount = Number(gameState?.players.filter((player) => player.hasVoted).length);

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <GameHeader
          title="⚡️ Imposter Blitz"
          isCurrentUserHost={room?.hostId === currentUserId}
          roomName={room?.roomName || ""}
          onBack={handleLeaveRoom}
        />

        <div className="flex-shrink-0 flex flex-col gap-4 sticky top-0 z-10 bg-gray-900 pt-4">
          {Boolean(currentUserId === room?.hostId) && (
            <FloatingHostControls
              onEndVoting={handleEndVoting}
              onNextRound={handleNextRound}
              onStartGame={handleStartGame}
            />
          )}
          {me && gameState && (
            <section className="w-full flex justify-center">
              <div className="w-4/5">
                <PlayerWord word={gameState.civilianWord} />
              </div>
            </section>
          )}
          {gameState?.stage === "voting" && (
            <section className="w-full flex justify-center pt-4">
              <div className="w-4/5">
                <VotingProgress
                  shouldVote={totalActivePlayers.some((p) => p.id === currentUserId)}
                  totalActivePlayers={totalActivePlayers.length}
                  voteCount={voteCount}
                  votedFor={getVotedFor(gameState, currentUserId)}
                />
              </div>
            </section>
          )}
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2">
          <ChatDisplay
            messages={messages}
            stage={gameState?.stage || "waiting"}
            players={gameState?.players || []}
            currentUserId={currentUserId}
            onVote={handleVote}
            onSkipVote={handleSkipVote}
            votedForPlayerId={getVotedForPlayerId(gameState, currentUserId)}
          />
          {gameState && gameState.stage === "results" && gameState.summary && <GameSummary gameState={gameState} />}
          {/* Empty div to scroll into view */}
          <div ref={scrollEndRef} />
        </main>

        {gameState && gameState.stage === "discussion" && (
          <div className="flex-shrink-0 sticky bottom-0 z-10 bg-gray-900 p-4">
            <MessageInput
              onSendMessage={handleSendMessage}
              placeholder={getPlaceholder()}
              disabled={!isMyTurn || me?.status === "eliminated"}
              isHighlighted={isMyTurn}
            />
          </div>
        )}
      </div>
    </>
  );
}

function transformMessages(gameState: ImposterBlitzGameState | null, room: Room | null, currentUserId: string) {
  if (!room) return [];

  const joinEvents = room.members.map((mem) => {
    return {
      author: "System",
      content: `${mem.displayName} has entered the room!`,
      isSelf: currentUserId === mem.id,
      type: "join" as const,
    };
  });

  if (!gameState) return joinEvents;

  const gameEvents = gameState?.events
    .map((ev) => {
      if (ev.type === "submission") {
        const subEvent = ev as ImposterBlitzSubmissionEvent;
        const player = gameState.players.find((p) => p.id === subEvent.playerId);
        return {
          author: player?.displayName || "",
          content: subEvent.content,
          isSelf: subEvent.playerId === currentUserId,
          type: "chat" as const,
        };
      } else if (ev.type === "vote") {
        const voteEvent = ev as ImposterBlitzVoteEvent;
        const voter = gameState.players.find((p) => p.id === voteEvent.voterId);
        const votee = gameState.players.find((p) => p.id === voteEvent.voteeId);

        const content =
          voteEvent.voteeId === ""
            ? `${voter?.displayName} skipped`
            : `${voter?.displayName} voted for ${votee?.displayName}!`;

        return {
          author: "System",
          content,
          isSelf: false,
          type: "vote" as const,
        };
      }
      return null;
    })
    .filter((p) => p !== null);

  const playerTurns = gameState.turnOrder
    .map((turnOrder) => gameState.players.find((p) => p.id === turnOrder))
    .filter((p) => p !== undefined);

  if (!playerTurns.length) return [...joinEvents, ...gameEvents];

  const turnEvents = {
    author: "System",
    content: `🎲 ${playerTurns.map((p) => p.displayName).join(" → ")}`,
    isSelf: false,
    type: "turn" as const,
  };

  return [...joinEvents, ...gameEvents, turnEvents];
}

function getVotedFor(state: ImposterBlitzGameState, playerId: string) {
  if (!(playerId in state.votes)) return null;

  const votedForPlayerId = state.votes[playerId];
  if (votedForPlayerId === "") return "Skipped";

  const votedForPlayer = state.players.find((p) => p.id === votedForPlayerId);
  if (!votedForPlayer) return null;

  return votedForPlayer.displayName;
}

function getVotedForPlayerId(state: ImposterBlitzGameState | null, playerId: string): string | null {
  if (!state) return null;
  if (!(playerId in state.votes)) return null;

  const votedForPlayerId = state.votes[playerId];
  if (votedForPlayerId === "") return "";

  const votedForPlayer = state.players.find((p) => p.id === votedForPlayerId);
  if (!votedForPlayer) return null;

  return votedForPlayer.id;
}

function getTotalActivePlayers(state: ImposterBlitzGameState) {
  return state.players.filter((p) => p.role !== "spectator" && p.status === "alive");
}
