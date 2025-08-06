import ReconnectingWebSocket from "reconnecting-websocket";

type EventMap = Record<string, any>;

export class TypedSocket<T extends EventMap> {
  private ws: ReconnectingWebSocket;
  private listeners = new Map<keyof T, (payload: T[keyof T]) => void>();

  constructor(url: string) {
    this.ws = new ReconnectingWebSocket(url);

    this.ws.addEventListener("message", (event: MessageEvent<string>) => {
      try {
        const message: { type: keyof T; payload: T[keyof T] } = JSON.parse(event.data);

        const listener = this.listeners.get(message.type);
        if (listener) {
          listener(message.payload);
        }
      } catch (err) {
        console.error("Invalid message received", err);
      }
    });
  }

  on<K extends keyof T>(type: K, callback: (payload: T[K]) => void): void {
    this.listeners.set(type, callback as (payload: T[keyof T]) => void);
  }

  off<K extends keyof T>(type: K): void {
    this.listeners.delete(type);
  }

  send<K extends keyof T>(type: K, payload: T[K]): void {
    const message = JSON.stringify({ type, payload });
    this.ws.send(message);
  }

  close(): void {
    this.ws.close();
  }
}
