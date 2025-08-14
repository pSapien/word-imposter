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

interface StartNextRoundResponseEvent {
  type: "StartNextRoundResponseEvent";
  payload: {
    roomName: string;
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
      stage: "discussion" | "voting" | "round_finished";
      votes: Record<string, string>;
      eliminated: string[];
      summary: null | {
        isImposterFound: boolean;
        imposterWord: string;
        imposterSuspectName: string;
      };
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

interface StartVoteRequestEvent {
  type: "StartVoteRequestEvent";
  payload: {
    playerName: string;
    roomName: string;
  };
}

interface VotedStartedResponseEvent {
  type: "VotedStartedResponseEvent";
  payload: {
    roomName: string;
  };
}

interface CastVoteRequestEvent {
  type: "CastVoteRequestEvent";
  payload: {
    voterName: string;
    voteeName: string;
    roomName: string;
  };
}

interface CastVoteResponseEvent {
  type: "CastVoteResponseEvent";
  payload: {
    roomName: string;
  };
}

interface FinishVotingRequestEvent {
  type: "FinishVotingRequestEvent";
  payload: {
    playerName: string;
    roomName: string;
  };
}

interface VotingRoundFinishedResponseEvent {
  type: "VotingRoundFinishedResponseEvent";
  payload: {
    roomName: string;
  };
}

export const ErrorCodes = Object.freeze({
  /** room related error, should be prefixed by room */
  Room_NotFound: "room.not_found",
  Room_PlayerNotFound: "room.player_not_found",
  Room_Invalid: "room.invalid",
  Room_UnauthorizedPermission: "room.unauthorized_permission",

  /** Game related eveents */
  Game_NotFound: "game.not_found",
  Game_InvalidEvent: "game.invalid_event",

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
  | PingRequestEvent
  | StartVoteRequestEvent
  | CastVoteRequestEvent
  | FinishVotingRequestEvent;

export type ServerResponseEvents =
  | JoinRoomResponseEvent
  | GameStartedResponseEvent
  | GetRoomInfoResponseEvent
  | PlayerKickedResponseEvent
  | PongResponseEvent
  | ServerErrorEvent
  | VotedStartedResponseEvent
  | CastVoteResponseEvent
  | VotingRoundFinishedResponseEvent
  | StartNextRoundResponseEvent;
