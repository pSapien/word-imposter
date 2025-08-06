import type { ClientRequestEvents, ServerResponseEvents } from "@imposter/shared";

type EventHandlerMap = {
  [K in ClientRequestEvents["type"]]?: (
    ws: Bun.WebSocket,
    payload: Extract<ClientRequestEvents, { type: K }>["payload"]
  ) => void;
};

function sendResponse(ws: Bun.WebSocket, response: ServerResponseEvents) {
  ws.send(JSON.stringify(response));
}

export const eventHandlers: EventHandlerMap = {
  JoinRoomRequestEvent: (ws, payload) => {
    sendResponse(ws, { type: "JoinRoomResponseEvent", payload: { roomId: payload.roomName } });
  },
  GetRoomInfoRequestEvent: (ws, payload) => {
    const roomInfo = {
      roomId: payload.roomId,
      players: [
        { name: "Player1", role: "host" },
        { name: "Player2", role: "player" },
      ],
      word: "example",
    };
    sendResponse(ws, { type: "GetRoomInfoResponseEvent", payload: roomInfo });
  },
};
