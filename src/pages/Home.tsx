import { Roles } from "../../shared";
import type { RolesTypes } from "../../shared";
import { useLocalStorage } from "@uidotdev/usehooks";

import { useSocket } from "../context";
import { useNavigate } from "react-router";
import { useState } from "react";
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
    onOpen: () => console.log("Socket connected"),
    onClose: () => console.log("Socket disconnected"),
    onError: (error) => console.error("Socket error:", error),
    JoinRoomResponseEvent: (payload) => {
      setIsLoading(false);
      navigate(`/room/${payload.roomName}`);
    },
  });

  const handleContinue = () => {
    if (!selectedRole) return alert("Please select a role.");
    if (name.trim() === "") return alert("Please enter your name.");
    if (roomName.trim() === "") return alert("Please enter a room name");

    setIsLoading(true);
    socketSend({
      type: "JoinRoomRequestEvent",
      payload: { playerName: name, roomName, role: selectedRole },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Join Word Imposter</h1>

      <input
        type="text"
        placeholder="Enter your name"
        className="border border-gray-500 p-2 w-80 mb-4 rounded-md bg-white"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        autoCapitalize="off"
      />

      <input
        type="text"
        placeholder="Enter the room name"
        className="border border-gray-500 p-2 w-80 mb-4 rounded-md bg-white"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        disabled={isLoading}
        autoCapitalize="off"
      />

      <div className="flex mb-6 mt-2 w-80 justify-between">
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
        className="bg-green-600 w-80 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
        onClick={handleContinue}
        disabled={isLoading}
      >
        Continue
      </button>
    </div>
  );
}
