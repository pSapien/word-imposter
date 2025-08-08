import { Roles, type ServerResponseEvents } from "@imposter/shared";
import type { EventHandlerMap, Game, Player, Room } from "./server.type.js";
import { WORD_PAIRS } from "./wordpairs.js";

// --- In-Memory Stores ---
const rooms = new Map<string, Room>();
const playerSockets = new Map<string, Bun.WebSocket>();
const socketToPlayer = new Map<Bun.WebSocket, string>();

export const eventHandlers: EventHandlerMap = {
  JoinRoomRequestEvent: (ws, payload) => {
    const { playerName, role, roomName } = payload;

    if (!playerName?.trim() || !roomName?.trim()) {
      console.warn("Invalid player name or room name");
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

    if (!room) return console.warn(`Room ${roomName} not found`);

    if (room.hostName !== playerName) return console.warn(`Player ${playerName} is not the host of room ${roomName}`);

    if (playerNameToBeKicked === playerName) return console.warn("Host cannot kick themselves");

    const playerIndex = room.players.findIndex((p) => p.name === playerNameToBeKicked);
    const spectatorIndex = room.spectators.findIndex((s) => s.name === playerNameToBeKicked);

    if (playerIndex !== -1) room.players.splice(playerIndex, 1);
    if (spectatorIndex !== -1) room.spectators.splice(spectatorIndex, 1);

    const kickedSocket = playerSockets.get(playerNameToBeKicked);
    playerSockets.delete(playerNameToBeKicked);
    socketToPlayer.delete(kickedSocket);

    broadcastToRoom(room, {
      type: "PlayerKickedResponseEvent",
      payload: { playerName, roomName },
    });
  },

  StartGameRequestEvent: (ws, payload) => {
    const { roomName, playerName } = payload;
    const room = rooms.get(roomName);

    if (!room) return console.warn(`Room ${roomName} not found`);
    if (room.hostName !== playerName) return console.warn(`Player ${playerName} is not the host of room ${roomName}`);

    const imposterName = selectRandomImposter(room.players);
    if (!imposterName) return console.error("Failed to select imposter");

    const { imposterWord, normalWord } = getRandomWordPair();
    const newGame: Game = {
      imposterName,
      round: (room.games.length + 1).toString(),
      startedAt: Date.now(),
      imposterWord,
      normalWord,
    };

    room.games.push(newGame);

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
      spectators: room.spectators,
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
        imposterWord: "",
        normalWord: lastGame.imposterWord,
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
      console.log("Broadcasting to::", player.name, response.type);
      sendResponse(socket, response);
    }
  });

  room.spectators.forEach((spectator) => {
    const socket = playerSockets.get(spectator.name);
    if (socket) sendResponse(socket, response);
  });
}

function selectRandomImposter(players: Player[]): string | null {
  if (players.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex].name;
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

export function getRandomWordPair(): { normalWord: string; imposterWord: string } {
  const randomPairIndex = Math.floor(Math.random() * WORD_PAIRS.length);
  const selectedPair = WORD_PAIRS[randomPairIndex];
  const randomAssignment = Math.floor(Math.random() * 2);

  return {
    normalWord: selectedPair[randomAssignment],
    imposterWord: selectedPair[1 - randomAssignment],
  };
}
