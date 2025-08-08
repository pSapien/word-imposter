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

interface StartNextRoundRequestEvent {
  type: "StartNextRoundRequestEvent";
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
    spectators: Player[];
    game: {
      imposterName: string;
      imposterWord: string;
      normalWord: string;
    } | null;
  };
}

interface KickPlayerRequestEvent {
  type: "KickPlayerRequestEvent";
  payload: {
    playerName: string;
    roomName: string;
    playerNameToBeKicked: string;
  };
}

interface PlayerKickedResponseEvent {
  type: "PlayerKickedResponseEvent";
  payload: {
    playerName: string;
    roomName: string;
  };
}

export type ClientRequestEvents =
  | JoinRoomRequestEvent
  | StartGameRequestEvent
  | GetRoomInfoRequestEvent
  | StartNextRoundRequestEvent
  | KickPlayerRequestEvent;

export type ServerResponseEvents =
  | JoinRoomResponseEvent
  | GameStartedResponseEvent
  | GetRoomInfoResponseEvent
  | PlayerKickedResponseEvent;
