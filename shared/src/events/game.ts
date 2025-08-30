import type { Operation } from "fast-json-patch";

export interface StartGameRequest {
  type: "start_game";
  payload: {
    gameType: string;
    settings: any;
  };
}

export interface GameActionRequest<S extends {}> {
  type: "game_action";
  payload: S;
}

export interface GameStateRequest<S extends {}> {
  type: "get_game_state";
  payload: S;
}

export interface GameStateResponse<S extends {}> {
  type: "game_state";
  payload: {
    state: S;
  };
}

export interface GameStatePatchEvent {
  type: "game_state_patch";
  payload: {
    patch: Operation[];
  };
}
