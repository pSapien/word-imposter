import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocket, useSocketHandler } from "@app/socket";
import { cn } from "@app/utils";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Constants } from "@app/constants";
import { Button, Input, Card, CardContent, CardHeader } from "@app/components";
import { getGameInfo } from "../../game-registry.ts";
import { Validators } from "../../../../shared";

export function WordImposterRoom() {
  const navigate = useNavigate();
  const { status, send, login } = useSocket();

  const [playerName, setPlayerName] = useLocalStorage(Constants.StorageKeys.Name, "");
  const [roomName, setRoomName] = useLocalStorage(Constants.StorageKeys.RoomName, "");
  const [_, setRole] = useLocalStorage(Constants.StorageKeys.Role, "player");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    playerName: "",
    roomName: "",
  });

  const gameInfo = getGameInfo("imposter")!;

  function handleChange(field: "playerName" | "roomName", e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    if (field === "playerName") setPlayerName(value);
    if (field === "roomName") setRoomName(value);

    try {
      if (field === "playerName") Validators.validatePlayerName(value);
      if (field === "roomName") Validators.validateRoomName(value);

      setErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [field]: err.message }));
    }
  }

  useSocketHandler({
    login_success: (payload) => {
      toast.success(`Welcome, ${payload.profile.displayName}! 🎉`);
    },
    room_created: (payload) => {
      setIsLoading(false);
      navigate(`/game/imposter/room/${payload.roomName}`);
    },
    room_joined: (payload) => {
      setIsLoading(false);
      navigate(`/game/imposter/room/${payload.roomName}`);
    },
    error: (payload) => {
      setIsLoading(false);
      toast.error(payload.message);
    },
  });

  function handleCreateOrJoinedRoom(action: "create" | "join", role: string) {
    setIsLoading(true);
    setRole(role);

    login(playerName);

    if (action === "create") {
      return send({
        type: "create_room",
        payload: { roomName: roomName.trim() },
      });
    }

    send({
      type: "join_room",
      payload: { role, roomName: roomName.trim() },
    });
  }

  const isFormValid = Boolean(errors.playerName.length === 0 && errors.roomName.length === 0);

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4 relative overflow-hidden",
        "bg-gradient-to-br",
        gameInfo.color
      )}
    >
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-500" />

      <Button
        onClick={() => navigate("/")}
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:bg-white/20"
      >
        ←
      </Button>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{gameInfo.icon}</div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{gameInfo.name}</h1>
          <p className="text-white/80 text-lg">{gameInfo.description}</p>
          <div className="flex justify-center space-x-4 mt-4 text-white/70 text-sm">
            <span>
              👥 {gameInfo.minPlayers}-{gameInfo.maxPlayers} players
            </span>
            <span>⏱️ {gameInfo.estimatedTime}</span>
          </div>
        </div>

        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-800 text-center">Let's Get Started! 🎮</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              name="playerName"
              label="Your Name"
              placeholder="Enter your display name"
              value={playerName}
              onChange={(e) => handleChange("playerName", e)}
              disabled={isLoading}
              error={errors.playerName}
              required
            />

            <Input
              name="roomName"
              label="Room Name"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => handleChange("roomName", e)}
              disabled={isLoading}
              error={errors.roomName}
              required
            />

            <div className="space-y-4">
              <Button
                onClick={() => handleCreateOrJoinedRoom("create", "host")}
                variant="primary"
                className="w-full"
                size="lg"
                disabled={isLoading || !isFormValid}
              >
                🏠 Create New Room
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleCreateOrJoinedRoom("join", "spectator")}
                    disabled={isLoading || !isFormValid}
                  >
                    <Card className="h-20 flex flex-col items-center justify-center space-y-2">
                      👀 <p className="font-bold">Join as Spectator</p>
                    </Card>
                  </button>
                  <button
                    onClick={() => handleCreateOrJoinedRoom("join", "player")}
                    disabled={isLoading || !isFormValid}
                  >
                    <Card className="h-20 flex flex-col items-center justify-center space-y-2">
                      🚪 <p className="font-bold">Join as Player</p>
                    </Card>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div
                className={cn("inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm", {
                  "bg-green-100 text-green-700": status === "authenticated" || status === "connected",
                  "bg-yellow-100 text-yellow-700": status === "connecting",
                  "bg-red-100 text-red-700": status === "closed" || status === "error",
                })}
              >
                <div
                  className={cn("w-2 h-2 rounded-full", {
                    "bg-green-500": status === "authenticated" || status === "connected",
                    "bg-yellow-500 animate-pulse": status === "connecting",
                    "bg-red-500": status === "closed" || status === "error",
                  })}
                />
                <span className="capitalize">{status}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="backdrop-blur-xl">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-2">How to Play:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Everyone gets a word except the imposter</li>
              <li>• Discuss and find who has the different word</li>
              <li>• Vote to eliminate the imposter</li>
              <li>• Imposters win if they survive!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
