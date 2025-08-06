import type { RolesTypes } from "./roles";

export interface Player {
  name: string;
  role: RolesTypes;
}

interface JoinRoomRequestEvent {
  type: "JoinRoomRequestEvent";
  payload: { playerId: string; roomName: string; role: RolesTypes };
}

interface JoinRoomResponseEvent {
  type: "JoinRoomResponseEvent";
  payload: { roomId: string };
}

interface GetRoomInfoRequestEvent {
  type: "GetRoomInfoRequestEvent";
  payload: { roomId: string };
}

interface GetRoomInfoResponseEvent {
  type: "GetRoomInfoResponseEvent";
  payload: {
    roomId: string;
    players: Player[];
    word: string;
  };
}

export type ClientRequestEvents = JoinRoomRequestEvent | GetRoomInfoRequestEvent;
export type ServerResponseEvents = JoinRoomResponseEvent | GetRoomInfoResponseEvent;
