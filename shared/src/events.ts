import type { RolesTypes } from "./roles";

export interface Player {
  name: string;
}

export interface Spectator {
  name: string;
}

export interface GameSettings {
  wordCategories: string[];
  imposterCount: number;
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
    gameSettings: GameSettings;
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
      settings: GameSettings;
      imposterNames: string[];
      imposterWord: string;
      civilianWord: string;
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

interface PingRequestEvent {
  type: "ping";
  payload: {};
}

interface PongResponseEvent {
  type: "pong";
  payload: {};
}

export const ErrorCodes = Object.freeze({
  /** room related error, should be prefixed by room */
  Room_NotFound: "room.not_found",
  Room_PlayerNotFound: "room.player_not_found",
  Room_Invalid: "room.invalid",
  Room_UnauthorizedPermission: "room.unauthorized_permission",

  /** auth related errors, should be prefixed by auth */
  Auth_InvalidProfile: "auth.invalid_profile",
});

type ObjValue<T extends Object> = T[keyof T];
type ErrorCodesValue = ObjValue<typeof ErrorCodes>;

export interface ServerErrorEvent {
  type: "ServerErrorEvent";
  payload: {
    code: ErrorCodesValue;
    message: string;
  };
}

export type ClientRequestEvents =
  | JoinRoomRequestEvent
  | StartGameRequestEvent
  | GetRoomInfoRequestEvent
  | StartNextRoundRequestEvent
  | KickPlayerRequestEvent
  | PingRequestEvent;

export type ServerResponseEvents =
  | JoinRoomResponseEvent
  | GameStartedResponseEvent
  | GetRoomInfoResponseEvent
  | PlayerKickedResponseEvent
  | PongResponseEvent
  | ServerErrorEvent;
