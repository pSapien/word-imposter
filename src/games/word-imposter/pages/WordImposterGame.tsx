import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { PlayerList } from "../../../components/game/PlayerList";
import { useSocket, useSocketHandler } from "../../../context/SocketContext";
import { WordCard } from "../components";
import { WORD_CATEGORIES } from "../config";
import type { WordImposterGameState } from "../types";
import { cn } from "../../../utils";
import type { Room } from "../../../../shared";

interface GameSettings {
  imposterCount: number;
  wordCategories: string[];
}

export function WordImposterGame() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode as string;
  const navigate = useNavigate();
  const { status, send, currentUserId } = useSocket();
  const isConnected = status === "connected" || status === "authenticated";

  // Room state (before game starts)
  const [room, setRoom] = useState<Room | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    imposterCount: 1,
    wordCategories: ["general"],
  });
  // const [showSettings, setShowSettings] = useState(false);

  // Game state (during game)
  const [gameState, setGameState] = useState<WordImposterGameState | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  console.log({ setGameState, setHasVoted });

  useSocketHandler({
    room_joined: (payload) => setRoom(payload),
    error: (error) => toast.error(error.message),
    onError: (error) => toast.error(error.message),
  });

  // Handle socket messages
  // useSocketHandler((message) => {
  //   switch (message.type) {
  //     case "player_joined": {
  //       // Add new player to room
  //       const { player } = message.payload;
  //       setRoomState((prev) =>
  //         prev
  //           ? {
  //               ...prev,
  //               members: [
  //                 ...prev.members,
  //                 {
  //                   profileId: player.profileId,
  //                   displayName: player.displayName,
  //                   role: "player",
  //                   isReady: false,
  //                 },
  //               ],
  //             }
  //           : null
  //       );
  //       toast.success(`${player.displayName} joined the room! 👋`);
  //       break;
  //     }

  //     case "player_left": {
  //       // Remove player from room
  //       const { player } = message.payload;
  //       setRoomState((prev) =>
  //         prev
  //           ? {
  //               ...prev,
  //               members: prev.members.filter((m) => m.profileId !== player.profileId),
  //             }
  //           : null
  //       );
  //       toast(`${player.displayName} left the room`);
  //       break;
  //     }

  //     case "game_starting": {
  //       toast.success("Game is starting! 🚀");
  //       setRoomState((prev) => (prev ? { ...prev, status: "starting" } : null));
  //       break;
  //     }

  //     case "game_started": {
  //       toast.success("Game started! 🎮");
  //       setRoomState((prev) => (prev ? { ...prev, status: "active" } : null));
  //       // The game state will be provided in the next message
  //       break;
  //     }

  //     case "game_state": {
  //       if (message.payload) {
  //         setGameState(message.payload as WordImposterGameState);
  //       }
  //       break;
  //     }

  //     case "game_event": {
  //       const { event, gameState: newGameState } = message.payload;

  //       switch (event.type) {
  //         case "voting_started":
  //           toast.success("Voting has begun! 🗳️");
  //           setHasVoted(false);
  //           setGameState(newGameState);
  //           break;

  //         case "vote_cast":
  //           if (event.data.voterId === currentUserId) {
  //             setHasVoted(true);
  //             toast.success("Vote cast! ✅");
  //           }
  //           setGameState(newGameState);
  //           break;

  //         case "voting_finished": {
  //           setHasVoted(false);
  //           const results = event.data;

  //           if (results.eliminatedPlayerId) {
  //             const eliminatedPlayer = newGameState?.players.find(
  //               (p: any) => p.profileId === results.eliminatedPlayerId
  //             );
  //             if (results.imposterFound) {
  //               toast.success(`🎉 Imposter ${eliminatedPlayer?.displayName} was eliminated!`);
  //             } else {
  //               toast.error(`😔 Innocent ${eliminatedPlayer?.displayName} was eliminated!`);
  //             }
  //           } else {
  //             toast("🤝 Vote was tied - no one eliminated");
  //           }

  //           setGameState(newGameState);
  //           break;
  //         }

  //         case "round_started":
  //           toast.success("New round started! 🔄");
  //           setGameState(newGameState);
  //           break;

  //         case "game_finished": {
  //           const gameResults = event.data;
  //           if (gameResults.imposterFound) {
  //             toast.success("🎉 Civilians win! Imposter was caught!");
  //           } else {
  //             toast.error("😈 Imposters win! They survived!");
  //           }
  //           setGameState(newGameState);
  //           break;
  //         }

  //         default:
  //           setGameState(newGameState);
  //           break;
  //       }
  //       break;
  //     }

  //     case "error":
  //       toast.error(message.payload.message);
  //       if (message.payload.code === "room.not_found") {
  //         navigate("/");
  //       }
  //       break;
  //   }
  // });

  useEffect(() => {
    if (status === "authenticated") {
      send({
        type: "join_room",
        payload: { roomCode, role: "player" },
      });
    }
  }, [status, roomCode, send]);

  const isHost = room?.hostId === currentUserId;
  const isDiscussion = gameState?.stage === "discussion";
  const isVotingStage = gameState?.stage === "voting";
  const isResults = gameState?.stage === "results";
  const isGameActive = false;

  const handleStartGame = () => {
    // if (!roomState || roomState.members.length < 3) {
    //   toast.error("Need at least 3 players to start");
    //   return;
    // }
    // send({
    //   type: "start_game",
    //   payload: {
    //     gameType: "word-imposter",
    //     settings: gameSettings,
    //   },
    // });
  };

  const handleStartVoting = () => {
    // send({
    //   type: "game_action",
    //   payload: { actionType: "start_voting" },
    // });
  };

  const handleFinishVoting = () => {
    // send({
    //   type: "game_action",
    //   payload: { actionType: "finish_voting" },
    // });
  };

  const handleNextRound = () => {
    // send({
    //   type: "game_action",
    //   payload: { actionType: "next_round" },
    // });
  };

  const handleVotePlayer = (targetId: string) => {
    console.log({ targetId });
    // send({
    //   type: "game_action",
    //   payload: { actionType: "cast_vote", data: { targetId } },
    // });
  };

  const handleLeaveRoom = () => {
    send({
      type: "leave_room",
      payload: {},
    });
    navigate("/");
  };

  const handleCategoryToggle = (categoryId: string) => {
    setGameSettings((prev) => ({
      ...prev,
      wordCategories: prev.wordCategories.includes(categoryId)
        ? prev.wordCategories.filter((id) => id !== categoryId)
        : [...prev.wordCategories, categoryId],
    }));
  };

  // Get players for display
  const roomPlayers = room?.members.filter((m) => m.role !== "spectator") || [];
  const spectators = room?.members.filter((m) => m.role === "spectator") || [];
  const gamePlayers = gameState?.players.filter((p) => !p.isEliminated) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 relative overflow-hidden">
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
            ← Leave Room
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
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto p-4 space-y-6">
        {/* Game Content */}
        {isGameActive ? (
          <>
            {/* Word Card - Always visible when game is active */}
            {gameState?.word && (
              <div className="sticky top-4 z-20">
                <WordCard word={gameState.word} isImposter={gameState.isImposter} isRevealed={true} />
              </div>
            )}

            {/* Game Controls */}
            <Card variant="glass" className="backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {/* Stage Indicator */}
                  <div className="flex items-center justify-center space-x-4">
                    <div
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-semibold",
                        isDiscussion && "bg-blue-500 text-white",
                        isVotingStage && "bg-red-500 text-white",
                        isResults && "bg-green-500 text-white"
                      )}
                    >
                      {isDiscussion && "💬 Discussion Phase"}
                      {isVotingStage && "🗳️ Voting Phase"}
                      {isResults && "📊 Results Phase"}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    {isHost && isDiscussion && (
                      <Button onClick={handleStartVoting} variant="danger">
                        Start Voting 🗳️
                      </Button>
                    )}

                    {isHost && isVotingStage && (
                      <Button onClick={handleFinishVoting} variant="primary">
                        Finish Voting 📊
                      </Button>
                    )}

                    {isHost && isResults && (
                      <Button onClick={handleNextRound} variant="primary">
                        Next Round 🔄
                      </Button>
                    )}
                  </div>

                  {/* Voting Status */}
                  {isVotingStage && (
                    <div className="text-sm text-gray-600">
                      {hasVoted ? "✅ You have voted" : "⏳ Cast your vote below"}
                    </div>
                  )}

                  {/* Results Display */}
                  {isResults && gameState.roundResults && (
                    <div className="bg-white/20 rounded-lg p-4 text-white">
                      <h3 className="font-bold mb-2">Round Results:</h3>
                      {gameState.roundResults.eliminatedPlayerId ? (
                        <div>
                          <p>{gameState.roundResults.imposterFound ? "🎉" : "😔"} Player eliminated</p>
                          {gameState.roundResults.imposterFound && (
                            <p className="text-sm mt-1">
                              The imposter word was: <strong>{gameState.roundResults.imposterWord}</strong>
                            </p>
                          )}
                        </div>
                      ) : (
                        <p>🤝 Vote was tied - no elimination</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Players List */}
              <PlayerList
                players={gamePlayers.map((p) => ({
                  ...p,
                  id: p.profileId,
                  isHost: p.profileId === room?.hostId,
                  isCurrentUser: p.profileId === currentUserId,
                  hasVoted: gameState?.votes?.[p.profileId] !== undefined,
                }))}
                spectators={spectators}
                currentUserId={currentUserId || ""}
                hostId={room?.hostId}
                canVote={isVotingStage && !hasVoted}
                votingStage={isVotingStage}
                onVotePlayer={handleVotePlayer}
              />

              {/* Voting Interface */}
              {isVotingStage && !hasVoted && (
                <Card variant="glass">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 text-center">Vote to eliminate a player:</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {gamePlayers
                        .filter((p) => p.profileId !== currentUserId)
                        .map((player) => (
                          <Button
                            key={player.profileId}
                            onClick={() => handleVotePlayer(player.profileId)}
                            variant="secondary"
                            className="justify-start"
                          >
                            Vote out {player.displayName}
                          </Button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Players List */}
            <PlayerList
              players={roomPlayers.map((p) => ({
                id: p.id,
                displayName: p.displayName,
                isEliminated: false,
                isHost: p.role === "host",
                isCurrentUser: p.id === currentUserId,
                hasVoted: false,
              }))}
              spectators={spectators}
              currentUserId={currentUserId || ""}
              hostId={room?.hostId}
            />

            {/* Game Settings */}
            <Card variant="glass">
              <CardHeader>
                <h3 className="text-xl font-bold text-gray-800 flex items-center">🎭 Game Settings</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Word Categories */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Word Categories</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {WORD_CATEGORIES.slice(0, 8).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryToggle(category.id)}
                        disabled={!isHost}
                        className={cn(
                          "p-3 rounded-lg border transition-all duration-200 text-sm",
                          "hover:scale-105 active:scale-95",
                          gameSettings.wordCategories.includes(category.id)
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white/50 text-gray-700",
                          !isHost && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Imposter Count */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Number of Imposters</label>
                  <Input
                    type="number"
                    min={1}
                    max={Math.floor(roomPlayers.length / 2)}
                    value={gameSettings.imposterCount}
                    onChange={(e) =>
                      setGameSettings((prev) => ({
                        ...prev,
                        imposterCount: Math.max(
                          1,
                          Math.min(Number(e.target.value), Math.floor(roomPlayers.length / 2))
                        ),
                      }))
                    }
                    disabled={!isHost}
                    className="w-full"
                  />
                </div>

                {/* Player Count Info */}
                <div className="bg-blue-50/50 rounded-lg p-3">
                  <div className="text-sm text-blue-700">
                    <strong>Current Players:</strong> {roomPlayers.length}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    <strong>Required:</strong> 3-20 players
                  </div>
                </div>

                {/* Start Game Button */}
                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    disabled={roomPlayers.length < 3 || gameSettings.wordCategories.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {roomPlayers.length < 3
                      ? `Need ${3 - roomPlayers.length} more players`
                      : gameSettings.wordCategories.length === 0
                      ? "Select at least one category"
                      : "🚀 Start Game"}
                  </Button>
                )}

                {!isHost && <div className="text-center py-4 text-gray-500">Waiting for host to start the game...</div>}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading/Waiting States */}
        {!room && (
          <Card variant="glass" className="backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Joining Room...</h2>
              <p className="text-gray-600">Please wait while we connect you to the room.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
