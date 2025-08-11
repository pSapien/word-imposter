import ReconnectingWebSocket from "reconnecting-websocket";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { ClientRequestEvents, ServerResponseEvents } from "@imposter/shared";
import { Constants } from "../constants.ts";

type SocketEventHandlers = {
  [K in ServerResponseEvents["type"]]?: (payload: Extract<ServerResponseEvents, { type: K }>["payload"]) => void;
} & {
  onClose?: () => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
};

const SocketContext = createContext<{
  socket: ReconnectingWebSocket | null;
  send: (event: ClientRequestEvents) => void;
  addHandlers: (handlers: SocketEventHandlers) => void;
  removeHandlers: (handlers: SocketEventHandlers) => void;
} | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<Set<SocketEventHandlers>>(new Set());
  const pingIntervalRef = useRef<number>(undefined);

  function cleanupPings() {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }
  }

  const socket = useMemo(() => {
    const instance = new ReconnectingWebSocket(Constants.Endpoint, "", {
      debug: true,
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      maxRetries: Infinity,
    });

    instance.addEventListener("open", () => {
      cleanupPings();
      pingIntervalRef.current = setInterval(() => {
        if (instance.readyState === WebSocket.OPEN) {
          instance.send(JSON.stringify({ type: "ping" }));
        }
      }, Constants.PingInterval);
      handlersRef.current.forEach((h) => h.onOpen?.());
    });

    instance.addEventListener("close", () => {
      cleanupPings();
      handlersRef.current.forEach((h) => h.onClose?.());
    });

    instance.addEventListener("error", (event) => {
      handlersRef.current.forEach((h) =>
        h.onError?.(event instanceof ErrorEvent ? event.error : new Error("Unknown error"))
      );
    });

    instance.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(event.data) as ServerResponseEvents;
        handlersRef.current.forEach((h) => {
          const handler = h[parsed.type];
          // @ts-ignore: to be checked later
          if (handler) handler(parsed.payload);
        });
      } catch (err) {
        console.error("Error parsing socket message", err);
      }
    });

    return instance;
  }, []);

  const send = (event: ClientRequestEvents) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event));
    } else {
      console.warn("Socket not open, can't send:", event);
    }
  };

  const addHandlers = (handlers: SocketEventHandlers) => {
    if (socket.readyState === WebSocket.OPEN) {
      handlers.onOpen?.();
    }

    handlersRef.current.add(handlers);
  };

  const removeHandlers = (handlers: SocketEventHandlers) => {
    handlersRef.current.delete(handlers);
  };

  useEffect(() => {
    return () => {
      cleanupPings();
      socket.close();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, send, addHandlers, removeHandlers }}>{children}</SocketContext.Provider>
  );
}

export function useSocket(handlers: SocketEventHandlers): (event: ClientRequestEvents) => void {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a <SocketProvider>");
  }

  const { send, addHandlers, removeHandlers } = context;
  const handlersRef = useRef(handlers);

  useEffect(() => {
    addHandlers(handlersRef.current);
    return () => removeHandlers(handlersRef.current);
  }, []);

  return send;
}
