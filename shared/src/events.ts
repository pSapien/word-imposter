import type { RolesTypes } from "./roles";

export interface Player {
  name: string;
}

export interface Spectator {
  name: string;
}

interface JoinRoomRequestEvent {
  type: "JoinRoomRequestEvent";
  payload: {
    playerName: string;
    roomName: string;
    role: RolesTypes;
  };
}

interface JoinRoomResponseEvent {
  type: "JoinRoomResponseEvent";
  payload: {
    roomName: string;
  };
}

interface StartGameRequestEvent {
  type: "StartGameRequestEvent";
  payload: {
    roomName: string;
    playerName: string;
  };
}

interface GetRoomInfoRequestEvent {
  type: "GetRoomInfoRequestEvent";
  payload: {
    roomName: string;
    playerName: string;
  };
}

interface GameStartedResponseEvent {
  type: "GameStartedResponseEvent";
  payload: {
    roomName: string;
  };
}

interface GetRoomInfoResponseEvent {
  type: "GetRoomInfoResponseEvent";
  payload: {
    roomName: string;
    hostName: string;
    players: Player[];
    game: {
      imposterName: string;
      imposterWord: string;
      normalWord: string;
    } | null;
  };
}

export type ClientRequestEvents = JoinRoomRequestEvent | StartGameRequestEvent | GetRoomInfoRequestEvent;
export type ServerResponseEvents = JoinRoomResponseEvent | GameStartedResponseEvent | GetRoomInfoResponseEvent;
