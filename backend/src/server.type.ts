import type { ClientRequestEvents, ServerResponseEvents } from "@imposter/shared";

export type Player = {
  name: string;
};

export type Spectator = {
  name: string;
};

export type Game = {
  imposterName: string;
  round: string;
  startedAt: number;
  imposterWord: string;
  normalWord: string;
};

export type Room = {
  roomName: string;
  hostName: string;
  players: Player[];
  spectators: Spectator[];
  games: Game[];
};

export type EventHandlerMap = {
  [K in ClientRequestEvents["type"]]?: (
    ws: Bun.WebSocket,
    payload: Extract<ClientRequestEvents, { type: K }>["payload"]
  ) => void;
};
