import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { useSocket, useSocketHandler } from "../../../context/SocketContext";
import { WordCard } from "../components";
import { cn } from "../../../utils";
import type { Room, WordImposterState } from "../../../../shared";
import { Card, CardContent } from "../../../components/ui/Card.tsx";
import { PlayerList } from "../../../components/game/PlayerList.tsx";
import { GameSettingsSection, type GameSettingState } from "./GameSettingsSection.tsx";
import { FooterSection } from "./FooterSection.tsx";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Constants } from "@app/constants";

export function WordImposterGame() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode as string;
  const navigate = useNavigate();
  const { status, send, currentUserId } = useSocket();
  const isConnected = status === "connected" || status === "authenticated";

  const [room, setRoom] = useState<Room | null>(null);
  const [hostGameSettings, setHostGameSettings] = useLocalStorage<GameSettingState>(
    Constants.StorageKeys.GameSettings,
    {
      wordCategories: ["legacy"],
      imposterCount: 1,
    }
  );

  const [gameState, setGameState] = useState<WordImposterState | null>(null);

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
    if (status === "authenticated" && roomCode) {
      send({
        type: "join_room",
        payload: { roomCode, role: "player" },
      });
    }
  }, [status, roomCode, send]);

  // Helper variables
  const isHost = room?.hostId === currentUserId;

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
    // send({
    //   type: "game_action",
    //   payload: {
    //     actionType: "start_voting",
    //     gameId: gameState?.gameId,
    //   },
    // });
  };

  // const handleFinishVoting = () => {
  // send({
  //   type: "game_action",
  //   payload: {
  //     actionType: "finish_voting",
  //     gameId: gameState?.gameId,
  //   },
  // });
  // };

  // const handleNextRound = () => {
  // send({
  //   type: "game_action",
  //   payload: {
  //     actionType: "next_round",
  //     gameId: gameState?.gameId,
  //   },
  // });
  // };

  // const handleVotePlayer = (targetId: string) => {
  //   if (targetId === currentUserId) {
  //     toast.error("You cannot vote for yourself!");
  //     return;
  //   }

  // send({
  //   type: "game_action",
  //   payload: {
  //     actionType: "cast_vote",
  //     gameId: gameState?.gameId,
  //     data: { targetId },
  //   },
  // });
  // };

  const handleLeaveRoom = () => {
    send({
      type: "leave_room",
      payload: {},
    });
    navigate("/");
  };

  // const handleCategoryToggle = (categoryId: string) => {
  //   if (!isHost) return;

  //   setGameSettings((prev) => ({
  //     ...prev,
  //     wordCategories: prev.wordCategories.includes(categoryId)
  //       ? prev.wordCategories.filter((id) => id !== categoryId)
  //       : [...prev.wordCategories, categoryId],
  //   }));
  // };

  const isDiscussion = gameState?.stage === "discussion";
  const players = room?.members.filter((p) => p.role !== "spectator") || [];
  const spectators = room?.members.filter((p) => p.role === "spectator") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 relative overflow-hidden flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={handleLeaveRoom} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            ←
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">🎭 Word Imposter</h1>
            <div className="text-sm text-white/80">Room: {roomCode}</div>
            <div
              className={cn(
                "text-sm px-3 py-1 rounded-full inline-block mt-1",
                isConnected ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-100"
              )}
            >
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </div>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto relative z-10 max-w-4xl mx-auto p-4 space-y-6 w-full">
        <div className="sticky top-4 z-20">
          <WordCard word={gameState?.civilianWord || ""} />
        </div>

        {/* Room players always visible */}
        {room && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlayerList
              players={players.map((p) => ({
                id: p.id,
                displayName: p.displayName,
                isEliminated: false,
                isHost: p.id === room.hostId,
                isCurrentUser: p.id === currentUserId,
                hasVoted: false,
              }))}
              spectators={spectators}
              currentUserId={currentUserId}
              hostId={room.hostId}
            />
          </div>
        )}

        <Card variant="glass" className="backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <div
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold",
                    isDiscussion && "bg-blue-500 text-white"
                  )}
                >
                  Discussion
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isHost && (
          <GameSettingsSection
            isHost={isHost}
            state={hostGameSettings}
            onChange={setHostGameSettings}
            playersCount={room?.members?.length || 1}
          />
        )}
      </main>

      <FooterSection
        isHost={isHost}
        stage={gameState?.stage ?? ""}
        onStartGame={handleStartGame}
        onStartVoting={handleStartVoting}
      />
    </div>
  );
}
