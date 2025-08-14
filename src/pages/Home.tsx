import { useState } from "react";
import toast from "react-hot-toast";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useNavigate } from "react-router";
import { Roles } from "../../shared";
import type { RolesTypes } from "../../shared";
import { useSocket } from "../context";
import { Constants } from "../constants.ts";
import { CheckboxButton } from "../components";

const LabelsToRoles = [
  { label: "Host", role: Roles.HOST },
  { label: "Player", role: Roles.PLAYER },
  { label: "Spectator", role: Roles.SPECTATOR },
];

export function Home() {
  const [name, setName] = useLocalStorage(Constants.StorageKeys.Name, "");
  const [roomName, setRoomName] = useLocalStorage(Constants.StorageKeys.RoomId, "");
  const [selectedRole, setSelectedRole] = useLocalStorage<RolesTypes>(Constants.StorageKeys.SelectedRole, Roles.PLAYER);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const socketSend = useSocket({
    onClose: () => console.log("Socket disconnected"),
    onError: (error) => {
      setIsLoading(false);
      toast.error(error.message);
    },
    JoinRoomResponseEvent: (payload) => {
      setIsLoading(false);
      navigate(`/room/${payload.roomName}`);
    },
    ServerErrorEvent: (payload) => {
      setIsLoading(false);
      toast.error(payload.message);
    },
  });

  const handleContinue = () => {
    if (!selectedRole) return toast.error("Please select a role");
    if (name.trim() === "") return toast.error("Please enter your name.");
    if (roomName.trim() === "") return toast.error("Please enter a room name");

    setIsLoading(true);
    socketSend({
      type: "JoinRoomRequestEvent",
      payload: { playerName: name, roomName, role: selectedRole },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-yellow-50 to-pink-100 p-6 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-40 h-40 bg-green-300/30 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-pink-300/30 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>

      <h1 className="text-5xl font-extrabold mb-10 text-gray-900 drop-shadow-lg tracking-tight text-center animate-fade-in">
        Join <span className="text-green-600">Word</span> Imposter
      </h1>

      <input
        id="name"
        type="text"
        placeholder="Enter your name"
        className="backdrop-blur-md bg-white/60 border border-white/20 p-4 w-80 mb-5 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-green-400 text-lg placeholder-gray-500 transition-transform focus:scale-105"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
      />

      <input
        id="roomName"
        type="text"
        placeholder="Enter the room name"
        className="backdrop-blur-md bg-white/60 border border-white/20 p-4 w-80 mb-6 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-green-400 text-lg placeholder-gray-500 transition-transform focus:scale-105"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        disabled={isLoading}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
      />

      <div className="flex mb-8 w-80 justify-between">
        {LabelsToRoles.map(({ label, role }) => (
          <CheckboxButton
            key={role}
            label={label}
            selected={selectedRole === role}
            onClick={() => setSelectedRole(role)}
            disabled={isLoading}
          />
        ))}
      </div>

      <button
        type="button"
        className={`w-80 px-6 py-4 rounded-xl font-bold tracking-wide text-lg transition-all transform hover:scale-105 shadow-lg ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:ring-4 focus:ring-green-300"
        } text-white`}
        onClick={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? "Joining..." : "Continue"}
      </button>
    </div>
  );
}
