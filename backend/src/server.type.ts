import type { ClientRequestEvents, ImposterGameState } from "@imposter/shared";

export type Player = {
  name: string;
};

export type Spectator = {
  name: string;
};

export type Game = ImposterGameState;

export type Room = {
  roomName: string;
  hostName: string;
  players: Player[];
  spectators: Spectator[];
  games: ImposterGameState[];
};

export type EventHandlerMap = {
  [K in ClientRequestEvents["type"]]?: (
    ws: Bun.WebSocket,
    payload: Extract<ClientRequestEvents, { type: K }>["payload"]
  ) => void;
};
