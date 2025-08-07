import type { ClientRequestEvents, ServerResponseEvents } from "@imposter/shared";

type Player = {
  name: string;
};

type Spectator = {
  name: string;
};

type Game = {
  imposterName: string;
  round: string;
  startedAt: number;
  imposterWord: string;
  normalWord: string;
};

type Room = {
  roomName: string;
  hostName: string;
  players: Player[];
  spectators: Spectator[];
  games: Game[];
};

type EventHandlerMap = {
  [K in ClientRequestEvents["type"]]?: (
    ws: Bun.WebSocket,
    payload: Extract<ClientRequestEvents, { type: K }>["payload"]
  ) => void;
};

// --- In-Memory Stores ---
const rooms = new Map<string, Room>();
const playerSockets = new Map<string, Bun.WebSocket>();
const socketToPlayer = new Map<Bun.WebSocket, string>();

// --- Utility Functions ---
function sendResponse(ws: Bun.WebSocket, response: ServerResponseEvents): void {
  try {
    ws.send(JSON.stringify(response));
  } catch (error) {
    console.error("Failed to send response:", error);
  }
}

function getLastGame(games: Game[]): Game | null {
  return games.length > 0 ? games[games.length - 1] : null;
}

function isPlayerInRoom(room: Room, playerName: string): boolean {
  return room.players.some((p) => p.name === playerName) || room.spectators.some((s) => s.name === playerName);
}

function broadcastToRoom(room: Room, response: ServerResponseEvents): void {
  room.players.forEach((player) => {
    const socket = playerSockets.get(player.name);
    if (socket) {
      sendResponse(socket, response);
    }
  });

  // Broadcast to all spectators
  room.spectators.forEach((spectator) => {
    const socket = playerSockets.get(spectator.name);
    if (socket) {
      sendResponse(socket, response);
    }
  });
}

function selectRandomImposter(players: Player[]): string | null {
  if (players.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex].name;
}

export const eventHandlers: EventHandlerMap = {
  JoinRoomRequestEvent: (ws, payload) => {
    const { playerName, role, roomName } = payload;

    if (!playerName?.trim() || !roomName?.trim()) {
      console.warn("Invalid player name or room name");
      return;
    }

    let room = rooms.get(roomName);

    if (!room) {
      // Create new room
      const newRoom: Room = {
        roomName,
        hostName: playerName,
        players: [{ name: playerName }],
        spectators: [],
        games: [],
      };
      rooms.set(roomName, newRoom);
      room = newRoom;
    } else {
      // Add player to existing room if not already present
      if (!isPlayerInRoom(room, playerName)) {
        if (role === "spectator") {
          room.spectators.push({ name: playerName });
        } else if (role === "player") {
          room.players.push({ name: playerName });
        }
      }
    }

    // Update socket mappings
    playerSockets.set(playerName, ws);
    socketToPlayer.set(ws, playerName);

    sendResponse(ws, {
      type: "JoinRoomResponseEvent",
      payload: { roomName },
    });
  },

  StartGameRequestEvent: (ws, payload) => {
    const { roomName, playerName } = payload;
    const room = rooms.get(roomName);

    // Validation checks
    if (!room) {
      console.warn(`Room ${roomName} not found`);
      return;
    }

    if (room.hostName !== playerName) {
      console.warn(`Player ${playerName} is not the host of room ${roomName}`);
      return;
    }

    if (room.players.length < 2) {
      console.warn("Need at least 2 players to start a game");
      return;
    }

    // Select random imposter
    const imposterName = selectRandomImposter(room.players);
    if (!imposterName) {
      console.error("Failed to select imposter");
      return;
    }

    // TODO: These should come from a word list or configuration
    const normalWord = "agent";
    const imposterWord = "spy"; // Different word for imposter

    const newGame: Game = {
      imposterName,
      round: (room.games.length + 1).toString(),
      startedAt: Date.now(),
      imposterWord,
      normalWord,
    };

    room.games.push(newGame);

    // Broadcast game start to all room members
    broadcastToRoom(room, {
      type: "GameStartedResponseEvent",
      payload: { roomName },
    });
  },

  GetRoomInfoRequestEvent: (ws, payload) => {
    const { roomName, playerName } = payload;
    const room = rooms.get(roomName);

    if (!room) {
      console.warn(`Room ${roomName} not found`);
      return;
    }

    const baseRoomInfo = {
      hostName: room.hostName,
      players: room.players,
      roomName: room.roomName,
    };

    const lastGame = getLastGame(room.games);

    if (!lastGame) {
      return sendResponse(ws, {
        type: "GetRoomInfoResponseEvent",
        payload: {
          ...baseRoomInfo,
          game: null,
        },
      });
    }

    const isSpectator = room.spectators.some((s) => s.name === playerName);
    const isImposter = lastGame.imposterName === playerName;

    let gameInfo;

    if (isSpectator) {
      // Spectators see everything
      gameInfo = {
        imposterName: lastGame.imposterName,
        imposterWord: lastGame.imposterWord,
        normalWord: lastGame.normalWord,
      };
    } else if (isImposter) {
      // Imposter sees their word but not who the imposter is
      gameInfo = {
        imposterName: "",
        imposterWord: lastGame.imposterWord,
        normalWord: "", // Imposter doesn't see the normal word
      };
    } else {
      // Regular players see the normal word
      gameInfo = {
        imposterName: "",
        imposterWord: "",
        normalWord: lastGame.normalWord,
      };
    }

    sendResponse(ws, {
      type: "GetRoomInfoResponseEvent",
      payload: {
        ...baseRoomInfo,
        game: gameInfo,
      },
    });
  },
};

// --- Cleanup Functions ---
export function handlePlayerDisconnect(ws: Bun.WebSocket): void {
  const playerName = socketToPlayer.get(ws);
  if (!playerName) return;

  // Remove from mappings
  socketToPlayer.delete(ws);
  playerSockets.delete(playerName);

  // Find and update room
  for (const [roomName, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex((p) => p.name === playerName);
    const spectatorIndex = room.spectators.findIndex((s) => s.name === playerName);

    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);

      // If host left, assign new host or remove room
      if (room.hostName === playerName) {
        if (room.players.length > 0) {
          room.hostName = room.players[0].name;
        } else if (room.spectators.length === 0) {
          rooms.delete(roomName);
          continue;
        }
      }
    }

    if (spectatorIndex !== -1) {
      room.spectators.splice(spectatorIndex, 1);

      // Remove empty rooms
      if (room.players.length === 0 && room.spectators.length === 0) {
        rooms.delete(roomName);
      }
    }
  }
}
