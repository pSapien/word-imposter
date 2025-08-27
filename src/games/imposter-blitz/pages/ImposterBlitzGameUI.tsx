import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ErrorCodes, type Room, type ImposterBlitzGameState } from "../../../../shared";
import { useSocket, useSocketHandler } from "@app/socket";
import { ImposterGameSettingsStorage, RoleStorage } from "../../../context/profile.ts";
import { useLocalStorage } from "@app/hooks";
import { ChatDisplay, FloatingHostControls, GameSummary, MessageInput, PlayerSelectionAnimation } from "../components";
import { GameHeader } from "../../word-imposter/components/GameHeader.tsx";
import { WordCard } from "../../word-imposter/components/WordCard.tsx";
import { VotingProgress } from "../../word-imposter/components/VotingProgress.tsx";

function gameStateToMessages(gameState: ImposterBlitzGameState, currentUserId: string) {
  const messages = [];

  for (const player of gameState.players) {
    for (const word of player.submittedWords) {
      messages.push({
        author: player.displayName,
        content: word,
        isSelf: player.id === currentUserId,
      });
    }
  }

  return messages;
}

export default function ImposterBlitzGameUI() {
  const params = useParams<{ roomName: string }>();
  const roomName = params.roomName as string;
  const navigate = useNavigate();
  const { status, send, currentUserId } = useSocket();
  const [role] = useLocalStorage(RoleStorage);

  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<ImposterBlitzGameState | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [systemMessages, setSystemMessages] = useState<{ author: string; content: string; isSelf: boolean }[]>([]);

  const me = gameState?.players.find((p) => p.id === currentUserId);

  useSocketHandler({
    room_joined: (payload) => {
      const systemMessages = payload.members.map((mem) => {
        return {
          author: "System",
          content: `${mem.displayName} has joined the room.`,
          isSelf: currentUserId === mem.id,
        };
      });

      setSystemMessages(systemMessages);
      setRoom(payload);
    },

    game_state: (payload) => {
      const newGameState = payload.state as ImposterBlitzGameState;
      if (
        !gameState ||
        (gameState?.turn !== newGameState.turn &&
          newGameState.stage === "discussion" &&
          newGameState?.turnOrder.length! > 1)
      ) {
        setCountdown(5);
        setShowCountdown(true);
      }
      setGameState(newGameState);
    },

    error: (error) => {
      toast.error(error.message);
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
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown) {
      setShowCountdown(false);
      setShowAnimation(true);
    }
  }, [countdown, showCountdown]);

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

  const getPlaceholder = () => {
    if (!gameState || !me) return "";
    if (me.status === "eliminated") return "You are eliminated";
    if (showCountdown) return `Next player selects in ${countdown}s`;
    if (gameState.turn !== me.id) return "Wait for your turn";

    return "Enter your word...";
  };

  const messages = useMemo(() => {
    if (!gameState) return systemMessages;
    return [...systemMessages, ...gameStateToMessages(gameState, currentUserId)];
  }, [systemMessages, gameState, currentUserId]);

  const totalActivePlayers = gameState ? getTotalActivePlayers(gameState) : [];

  const voteCount = Number(gameState?.players.filter((player) => player.hasVoted).length);
  const isMyTurn = gameState?.turn === me?.id;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {showAnimation && gameState && (
        <PlayerSelectionAnimation
          players={gameState.players
            .filter((p) => p.role !== "spectator" && p.status === "alive")
            .filter((p) => gameState?.turnOrder.includes(p.id))}
          selectedPlayerId={gameState?.turn}
          onAnimationComplete={() => setShowAnimation(false)}
        />
      )}
      <GameHeader
        title="⚡️ Imposter Blitz"
        isCurrentUserHost={room?.hostId === currentUserId}
        roomName={room?.roomName || ""}
        onBack={handleLeaveRoom}
      />
      {Boolean(currentUserId === room?.hostId) && (
        <FloatingHostControls
          gameState={gameState}
          onEndVoting={handleEndVoting}
          onNextRound={handleNextRound}
          onStartGame={handleStartGame}
        />
      )}
      {me && gameState && (
        <section className="w-full flex justify-center pt-4">
          <div className="w-4/5">
            <WordCard word={gameState.civilianWord} />
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
      <main className="flex-1 p-4 overflow-auto flex flex-col">
        <ChatDisplay
          messages={messages}
          stage={gameState?.stage || "waiting"}
          players={gameState?.players || []}
          currentUserId={currentUserId}
          onVote={handleVote}
          onSkipVote={handleSkipVote}
        />
        {gameState && gameState.stage === "results" && gameState.summary && (
          <GameSummary gameState={gameState} onPlayAgain={handleStartGame} />
        )}
        {gameState && gameState.stage === "discussion" && (
          <MessageInput
            onSendMessage={handleSendMessage}
            placeholder={getPlaceholder()}
            disabled={showCountdown || !isMyTurn || me?.status === "eliminated"}
            isHighlighted={!showAnimation && isMyTurn}
          />
        )}
      </main>
    </div>
  );
}

function getVotedFor(state: ImposterBlitzGameState, playerId: string) {
  if (!(playerId in state.votes)) return null;

  const votedForPlayerId = state.votes[playerId];
  if (votedForPlayerId === "") return "Skipped";

  const votedForPlayer = state.players.find((p) => p.id === votedForPlayerId);
  if (!votedForPlayer) return null;

  return votedForPlayer.displayName;
}

function getTotalActivePlayers(state: ImposterBlitzGameState) {
  return state.players.filter((p) => p.role !== "spectator" && p.status === "alive");
}
