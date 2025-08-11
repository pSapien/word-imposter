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

  function startPinging(instance: ReconnectingWebSocket) {
    cleanupPings();

    pingIntervalRef.current = setInterval(() => {
      if (instance.readyState === WebSocket.OPEN) {
        console.log("SX: ping");
        instance.send(JSON.stringify({ type: "ping" }));
      }
    }, Constants.PingInterval);
  }

  const socket = useMemo(() => {
    const instance = new ReconnectingWebSocket(Constants.Endpoint, "", {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      maxRetries: Infinity,
    });

    instance.addEventListener("open", () => {
      console.log("Socket Opened");
      startPinging(instance);
      handlersRef.current.forEach((h) => h.onOpen?.());
    });

    instance.addEventListener("close", () => {
      console.log("Socket Closed");
      cleanupPings();
      handlersRef.current.forEach((h) => h.onClose?.());
    });

    instance.addEventListener("error", (event) => {
      console.log("Socket Errored", event);
      handlersRef.current.forEach((h) => {
        h.onError?.(event instanceof ErrorEvent ? event.error : new Error("Unknown error"));
      });
    });

    instance.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(event.data) as ServerResponseEvents;
        console.log("RX:", parsed.type);
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
      console.log("SX:", event.type);
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
    const handleVisibilityChange = () => {
      if (!document.hidden && (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED)) {
        console.log("Socket Reconnect");
        socket.reconnect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket]);

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
  }, [addHandlers, removeHandlers]);

  return send;
}
