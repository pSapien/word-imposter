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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Join Word Imposter</h1>

      <label htmlFor="name" className="sr-only">
        Your Name
      </label>
      <input
        id="name"
        type="text"
        placeholder="Enter your name"
        className="border border-gray-400 p-3 w-80 mb-5 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
      />

      <label htmlFor="roomName" className="sr-only">
        Room Name
      </label>
      <input
        id="roomName"
        type="text"
        placeholder="Enter the room name"
        className="border border-gray-400 p-3 w-80 mb-6 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
        className={`w-80 px-6 py-3 rounded font-semibold transition ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300"
        } text-white`}
        onClick={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? "Joining..." : "Continue"}
      </button>
    </div>
  );
}
