// @ts-nocheck

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
import { cn } from "../../../utils";
import type { Room } from "../../../../shared";
import type { WordImposterGameState } from "../types.ts";

interface GameSettings {
  imposterCount: number;
  wordCategories: string[];
  discussionTimeMs?: number;
  votingTimeMs?: number;
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
    discussionTimeMs: 300000, // 5 minutes
    votingTimeMs: 120000, // 2 minutes
  });

  const [gameState, setGameState] = useState<WordImposterGameState | null>(null);

  console.log("getGameState:", gameState);

  useSocketHandler({
    room_joined: (payload) => {
      setRoom(payload);
      toast.success("Joined room successfully! 👋");
    },

    game_state: (payload) => {
      const newGameState = payload.state as WordImposterGameState;

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
  const isGameWaiting = !gameState;
  const isGameActive = gameState?.gameStatus === "active";
  const isGameFinished = gameState?.gameStatus === "finished";

  const isDiscussion = gameState?.stage === "discussion";
  const isVotingStage = gameState?.stage === "voting";
  const isResults = gameState?.stage === "results";

  const currentUserWord = gameState?.playerRole === "imposter" ? gameState.imposterWord : gameState?.civilianWord;

  const handleStartGame = () => {
    send({
      type: "start_game",
      payload: {
        gameType: "imposter",
        settings: gameSettings,
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

  const handleFinishVoting = () => {
    // send({
    //   type: "game_action",
    //   payload: {
    //     actionType: "finish_voting",
    //     gameId: gameState?.gameId,
    //   },
    // });
  };

  const handleNextRound = () => {
    // send({
    //   type: "game_action",
    //   payload: {
    //     actionType: "next_round",
    //     gameId: gameState?.gameId,
    //   },
    // });
  };

  const handleRestartGame = () => {
    // send({
    //   type: "game_action",
    //   payload: {
    //     actionType: "restart_game",
    //     gameId: gameState?.gameId,
    //   },
    // });
  };

  const handleVotePlayer = (targetId: string) => {
    if (targetId === currentUserId) {
      toast.error("You cannot vote for yourself!");
      return;
    }

    // send({
    //   type: "game_action",
    //   payload: {
    //     actionType: "cast_vote",
    //     gameId: gameState?.gameId,
    //     data: { targetId },
    //   },
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
    if (!isHost) return;

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
  const activePlayers = gameState?.players.filter((p) => !p.isEliminated) || [];
  const eliminatedPlayers = gameState?.players.filter((p) => p.isEliminated) || [];

  // Vote counts for display
  const voteCount = gameState?.votes ? Object.keys(gameState.votes).length : 0;
  const totalActivePlayers = activePlayers.length;

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
        {isGameActive && gameState ? (
          <>
            {/* Word Card - Always visible when game is active */}
            {currentUserWord && (
              <div className="sticky top-4 z-20">
                <WordCard word={currentUserWord} />
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
                        isResults && "bg-green-500 text-white",
                        isGameFinished && "bg-purple-500 text-white"
                      )}
                    >
                      {isDiscussion && "💬 Discussion Phase"}
                      {isVotingStage && "🗳️ Voting Phase"}
                      {isResults && "📊 Results Phase"}
                      {isGameFinished && "🏁 Game Finished"}
                    </div>
                  </div>

                  {/* Voting Progress */}
                  {isVotingStage && (
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-white text-sm">
                        Votes cast: {voteCount}/{totalActivePlayers}
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                        <div
                          className="bg-white rounded-full h-2 transition-all duration-300"
                          style={{ width: `${(voteCount / totalActivePlayers) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

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

                    {isHost && isResults && !gameState.roundResults?.gameOver && (
                      <Button onClick={handleNextRound} variant="primary">
                        Next Round 🔄
                      </Button>
                    )}

                    {isHost && (isResults || isGameFinished) && gameState.roundResults?.gameOver && (
                      <Button onClick={handleRestartGame} variant="danger">
                        New Game 🎮
                      </Button>
                    )}
                  </div>

                  {/* Voting Status */}
                  {isVotingStage && (
                    <div className="text-sm text-white/80">
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
                          <div className="text-sm mt-2 space-y-1">
                            <p>
                              Civilian word was: <strong>{gameState.roundResults.civilianWord}</strong>
                            </p>
                            <p>
                              Imposter word was: <strong>{gameState.roundResults.imposterWord}</strong>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p>🤝 Vote was tied - no elimination</p>
                          <div className="text-sm mt-2 space-y-1">
                            <p>
                              Civilian word was: <strong>{gameState.roundResults.civilianWord}</strong>
                            </p>
                            <p>
                              Imposter word was: <strong>{gameState.roundResults.imposterWord}</strong>
                            </p>
                          </div>
                        </div>
                      )}

                      {gameState.roundResults.gameOver && (
                        <div className="mt-3 p-3 bg-white/20 rounded">
                          <h4 className="font-bold text-lg">🏁 Game Over!</h4>
                          <p className="text-lg">
                            {gameState.roundResults.winner === "civilians" ? "🎉 Civilians Win!" : "😈 Imposters Win!"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Players List */}
              <PlayerList
                // title="Active Players"
                players={activePlayers.map((p) => ({
                  id: p.profileId,
                  displayName: p.displayName,
                  isEliminated: false,
                  isHost: p.profileId === room?.hostId,
                  isCurrentUser: p.profileId === currentUserId,
                  hasVoted: gameState?.votes?.[p.profileId] !== undefined,
                  role:
                    gameState?.playerRole === "spectator"
                      ? gameState.imposterIds.includes(p.profileId)
                        ? "imposter"
                        : "civilian"
                      : undefined,
                }))}
                spectators={spectators}
                currentUserId={currentUserId || ""}
                hostId={room?.hostId}
                canVote={isVotingStage && !hasVoted && gameState?.playerRole !== "spectator"}
                votingStage={isVotingStage}
                onVotePlayer={handleVotePlayer}
              />

              {/* Voting Interface or Eliminated Players */}
              {isVotingStage && !hasVoted && gameState?.playerRole !== "spectator" ? (
                <Card variant="glass">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 text-center">Vote to eliminate a player:</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {activePlayers
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
              ) : eliminatedPlayers.length > 0 ? (
                <Card variant="glass">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 text-center">Eliminated Players</h3>
                    <div className="space-y-2">
                      {eliminatedPlayers.map((player) => (
                        <div
                          key={player.profileId}
                          className="flex items-center justify-between p-2 bg-gray-100 rounded"
                        >
                          <span className="text-gray-600">{player.displayName}</span>
                          <span className="text-sm text-gray-500">
                            {gameState?.playerRole === "spectator" && gameState.imposterIds.includes(player.profileId)
                              ? "👤 Imposter"
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div /> // Empty space when not voting and no eliminated players
              )}
            </div>
          </>
        ) : isGameWaiting ? (
          /* Pre-game lobby */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Players List */}
            <PlayerList
              // title="Players"
              players={roomPlayers.map((p) => ({
                id: p.id,
                displayName: p.displayName,
                isEliminated: false,
                isHost: p.id === room?.hostId,
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
                    max={Math.max(1, Math.floor(roomPlayers.length / 3))}
                    value={gameSettings.imposterCount}
                    onChange={(e) =>
                      setGameSettings((prev) => ({
                        ...prev,
                        imposterCount: Math.max(
                          1,
                          Math.min(Number(e.target.value), Math.max(1, Math.floor(roomPlayers.length / 3)))
                        ),
                      }))
                    }
                    disabled={!isHost}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">Recommended: 1 imposter per 3-4 players</div>
                </div>

                {/* Timer Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 text-sm">Discussion (minutes)</label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={Math.floor((gameSettings.discussionTimeMs || 300000) / 60000)}
                      onChange={(e) =>
                        setGameSettings((prev) => ({
                          ...prev,
                          discussionTimeMs: Number(e.target.value) * 60000,
                        }))
                      }
                      disabled={!isHost}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 text-sm">Voting (minutes)</label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={Math.floor((gameSettings.votingTimeMs || 120000) / 60000)}
                      onChange={(e) =>
                        setGameSettings((prev) => ({
                          ...prev,
                          votingTimeMs: Number(e.target.value) * 60000,
                        }))
                      }
                      disabled={!isHost}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Player Count Info */}
                <div className="bg-blue-50/50 rounded-lg p-3">
                  <div className="text-sm text-blue-700">
                    <strong>Current Players:</strong> {roomPlayers.length}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    <strong>Required:</strong> 3-20 players
                  </div>
                  {gameSettings.imposterCount > 0 && (
                    <div className="text-sm text-blue-600 mt-1">
                      <strong>Imposters:</strong> {gameSettings.imposterCount}
                    </div>
                  )}
                </div>

                {/* Start Game Button */}
                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    disabled={roomPlayers.length < 3 || gameSettings.wordCategories.length === 0 || isStartingGame}
                    className="w-full"
                    size="lg"
                  >
                    {isStartingGame
                      ? "Starting Game..."
                      : roomPlayers.length < 3
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
        ) : null}

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
