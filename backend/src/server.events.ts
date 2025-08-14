import { Roles, type ServerResponseEvents, type ServerErrorEvent, ErrorCodes } from "@imposter/shared";
import type { EventHandlerMap, Game, Room } from "./server.type.js";
import { getRandomWordPair } from "./wordpairs.js";
import { random, randomArr } from "./utils";

// --- In-Memory Stores ---
const rooms = new Map<string, Room>();
const playerSockets = new Map<string, Bun.WebSocket>();
const socketToPlayer = new Map<Bun.WebSocket, string>();

export const eventHandlers: EventHandlerMap = {
  ping: (ws) => {
    sendResponse(ws, { type: "pong", payload: {} });
  },

  JoinRoomRequestEvent: (ws, payload) => {
    const { playerName, role, roomName } = payload;
    console.log("JoinRoomRequestEvent:", playerName, role, roomName);

    if (!playerName?.trim()) {
      sendError(ws, { code: ErrorCodes.Auth_InvalidProfile, message: "Invalid User Name" });
      return;
    }

    if (!roomName?.trim()) {
      sendError(ws, { code: ErrorCodes.Room_Invalid, message: "Invalid Room Name" });
      return;
    }

    let room = rooms.get(roomName);

    if (!room) {
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
      if (!isPlayerInRoom(room, playerName)) {
        if (role === Roles.SPECTATOR) room.spectators.push({ name: playerName });
        if (role === Roles.PLAYER) room.players.push({ name: playerName });
      }
    }

    playerSockets.set(playerName, ws);
    socketToPlayer.set(ws, playerName);

    broadcastToRoom(room, {
      type: "JoinRoomResponseEvent",
      payload: { roomName },
    });
  },

  KickPlayerRequestEvent: (ws, payload) => {
    const { playerName, playerNameToBeKicked, roomName } = payload;
    const room = rooms.get(roomName);

    if (!room) {
      sendError(ws, { code: ErrorCodes.Room_NotFound, message: `Room of ${roomName} not found` });
      return;
    }

    if (room.hostName !== playerName) {
      sendError(ws, {
        code: ErrorCodes.Room_UnauthorizedPermission,
        message: "Host is allowed to kick players",
      });
      return;
    }

    if (playerNameToBeKicked === playerName) {
      sendError(ws, {
        code: ErrorCodes.Room_UnauthorizedPermission,
        message: `Host cannot kick themselves`,
      });
      return;
    }

    const playerIndex = room.players.findIndex((p) => p.name === playerNameToBeKicked);
    const spectatorIndex = room.spectators.findIndex((s) => s.name === playerNameToBeKicked);

    if (playerIndex !== -1) room.players.splice(playerIndex, 1);
    if (spectatorIndex !== -1) room.spectators.splice(spectatorIndex, 1);

    playerSockets.set(playerName, ws);
    socketToPlayer.set(ws, playerName);

    const kickedSocket = playerSockets.get(playerNameToBeKicked);
    playerSockets.delete(playerNameToBeKicked);
    socketToPlayer.delete(kickedSocket);

    broadcastToRoom(room, {
      type: "PlayerKickedResponseEvent",
      payload: { playerName, roomName },
    });
  },

  StartGameRequestEvent: (ws, payload) => {
    const { roomName, playerName, gameSettings } = payload;
    const { wordCategories, imposterCount } = gameSettings;
    const room = rooms.get(roomName);

    if (!room) {
      sendError(ws, { code: ErrorCodes.Room_NotFound, message: `Room of ${roomName} not found` });
      return;
    }

    if (room.hostName !== playerName) {
      sendError(ws, {
        code: ErrorCodes.Room_UnauthorizedPermission,
        message: "Host is allowed to start the game",
      });
      return;
    }
    const maxImposters = Math.min(Math.floor(room.players.length / 2), imposterCount);
    const imposterPlayers = randomArr(room.players, maxImposters);
    const randomWordCategory = random(wordCategories);
    const { imposterWord, civilianWord } = getRandomWordPair(randomWordCategory);

    const newGame: Game = {
      imposterNames: imposterPlayers.map((i) => i.name),
      wordCategories: wordCategories,
      round: (room.games.length + 1).toString(),
      startedAt: Date.now(),
      imposterWord,
      civilianWord,
    };

    room.games.push(newGame);

    playerSockets.set(playerName, ws);
    socketToPlayer.set(ws, playerName);

    broadcastToRoom(room, {
      type: "GameStartedResponseEvent",
      payload: { roomName },
    });
  },

  GetRoomInfoRequestEvent: (ws, payload) => {
    const { roomName, playerName } = payload;
    const room = rooms.get(roomName);

    if (!room) {
      sendError(ws, { code: ErrorCodes.Room_NotFound, message: `Room of ${roomName} not found` });
      return;
    }

    if (!isPlayerInRoom(room, playerName)) {
      sendError(ws, { code: ErrorCodes.Room_PlayerNotFound, message: `Player Not Found` });
      return;
    }

    const baseRoomInfo = {
      hostName: room.hostName,
      players: room.players,
      spectators: room.spectators,
      roomName: room.roomName,
    };

    const currentGame = getCurrentGame(room.games);

    playerSockets.set(playerName, ws);
    socketToPlayer.set(ws, playerName);

    if (!currentGame) {
      return sendResponse(ws, {
        type: "GetRoomInfoResponseEvent",
        payload: {
          ...baseRoomInfo,
          game: null,
        },
      });
    }

    const isSpectator = room.spectators.some((s) => s.name === playerName);
    const isImposter = currentGame.imposterNames.includes(playerName);

    let gameInfo;

    if (isSpectator) {
      // Spectators see everything
      gameInfo = {
        imposterNames: currentGame.imposterNames,
        imposterWord: currentGame.imposterWord,
        civilianWord: currentGame.civilianWord,
        settings: {
          wordCategories: currentGame.wordCategories,
          imposterCount: currentGame.imposterNames.length,
        },
      };
    } else if (isImposter) {
      // Imposter sees their word but not who the imposter is
      gameInfo = {
        imposterNames: [],
        imposterWord: "",
        civilianWord: currentGame.imposterWord,
        settings: {
          wordCategories: currentGame.wordCategories,
          imposterCount: currentGame.imposterNames.length,
        },
      };
    } else {
      // Regular players see the normal word
      gameInfo = {
        imposterNames: [],
        imposterWord: "",
        civilianWord: currentGame.civilianWord,
        settings: {
          wordCategories: currentGame.wordCategories,
          imposterCount: currentGame.imposterNames.length,
        },
      };
    }

    playerSockets.set(playerName, ws);
    socketToPlayer.set(ws, playerName);

    sendResponse(ws, {
      type: "GetRoomInfoResponseEvent",
      payload: {
        ...baseRoomInfo,
        game: gameInfo,
      },
    });
  },
};

// --- Utility Functions ---
function sendResponse(ws: Bun.WebSocket, response: ServerResponseEvents): void {
  try {
    ws.send(JSON.stringify(response));
  } catch (error) {
    console.error("Failed to send response:", error);
  }
}

function sendError(ws: Bun.WebSocket, payload: ServerErrorEvent["payload"]) {
  try {
    ws.send(JSON.stringify({ type: "ServerErrorEvent", payload }));
  } catch (error) {
    console.error("Failed to send response:", error);
  }
}

function getCurrentGame(games: Game[]): Game | null {
  return games.length > 0 ? games[games.length - 1] : null;
}

function isPlayerInRoom(room: Room, playerName: string): boolean {
  return room.players.some((p) => p.name === playerName) || room.spectators.some((s) => s.name === playerName);
}

function broadcastToRoom(room: Room, response: ServerResponseEvents): void {
  room.players.forEach((player) => {
    const socket = playerSockets.get(player.name);
    if (socket) {
      console.log("Broadcasting to::", socket.readyState, player.name, response.type);
      sendResponse(socket, response);
    }
  });

  room.spectators.forEach((spectator) => {
    const socket = playerSockets.get(spectator.name);
    if (socket) sendResponse(socket, response);
  });
}

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
