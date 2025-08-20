import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useLocalStorage } from "@uidotdev/usehooks";
import type { ClientRequestEvents, ServerResponseEvents } from "../../shared";
import { Constants } from "../constants.ts";

type SocketEventHandlers = {
  [K in ServerResponseEvents["type"]]?: (payload: Extract<ServerResponseEvents, { type: K }>["payload"]) => void;
} & {
  onClose?: () => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
};

export type SocketStatus = "connecting" | "connected" | "authenticated" | "closed" | "error";

interface SocketContextType {
  status: SocketStatus;
  currentUserId: string;
  login: (playerName: string) => void;
  send: (message: ClientRequestEvents) => void;
  addHandler: (handler: SocketEventHandlers) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [{ sessionId, currentUserId }, setSessionProfile] = useLocalStorage(Constants.StorageKeys.SessionProfile, {
    sessionId: "",
    currentUserId: "",
  });
  const sessionIdRef = useRef<string>(sessionId);
  sessionIdRef.current = sessionId;

  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [ws] = useState(new ReconnectingWebSocket(Constants.Endpoint));

  const handlersRef = useRef<Set<SocketEventHandlers>>(new Set());
  const pingIntervalRef = useRef<number | null>(null);

  const send = useCallback((message: ClientRequestEvents) => {
    if (message.type !== "ping") console.log("📤 SX:", message.type);
    ws.send(JSON.stringify(message));
  }, []);

  const login = useCallback((playerName: string) => {
    send({
      type: "login",
      payload: {
        displayName: playerName.trim(),
        sessionId: sessionIdRef.current ?? undefined,
      },
    });
  }, []);

  const startPing = () => {
    stopPing();
    pingIntervalRef.current = window.setInterval(() => {
      send({ type: "ping", payload: {} });
    }, Constants.PingInterval);
  };

  const stopPing = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  // Handle all server messages
  const handleGlobalMessage = (message: ServerResponseEvents) => {
    switch (message.type) {
      case "login_success":
        setSessionProfile({
          sessionId: message.payload.sessionId,
          currentUserId: message.payload.profile.id,
        });
        setStatus("authenticated");
        break;
      case "pong":
        break; // ignore
      default:
        break;
    }
  };

  useEffect(() => {
    ws.addEventListener("open", () => {
      console.log("🔌 Global socket connected");
      setStatus("connected");
      startPing();

      // If previous session exists, try to sync login
      const displayName = localStorage.getItem(Constants.StorageKeys.Name);
      if (sessionIdRef.current && displayName) login(JSON.parse(displayName));

      handlersRef.current.forEach((h) => h.onOpen?.());
    });

    ws.addEventListener("close", () => {
      console.log("🔌 Global socket disconnected");
      setStatus("closed");
      stopPing();
      handlersRef.current.forEach((h) => h.onClose?.());
    });

    ws.addEventListener("error", (event) => {
      console.error("❌ Global socket error:", event);
      setStatus("error");
      handlersRef.current.forEach((h) =>
        h.onError?.(event instanceof ErrorEvent ? event.error : new Error("Unknown error"))
      );
    });

    ws.addEventListener("message", (event: any) => {
      try {
        const message = JSON.parse(event.data) as ServerResponseEvents;
        if (message.type !== "pong") console.log("📨 RX:", message.type);

        handleGlobalMessage(message);

        handlersRef.current.forEach((h) => {
          const handler = h[message.type];
          // @ts-expect-error typescript cannot narrow down types
          if (handler) handler(message.payload);
        });
      } catch (error) {
        console.error("Failed to parse socket message:", error);
      }
    });

    /** called whenever the browser tab's is switched */
    function handleVisibilityChange() {
      /** if the tab is visible and the socket is closing or closed, we reconnect again! */
      if (!document.hidden && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) {
        console.log("Socket Reconnect");
        ws.reconnect();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPing();
      ws.close();
    };
  }, []);

  const addHandler = useCallback((handler: SocketEventHandlers) => {
    handlersRef.current.add(handler);
    return () => handlersRef.current.delete(handler);
  }, []);

  const contextValue: SocketContextType = {
    status,
    currentUserId,
    send,
    addHandler,
    login,
  };

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
}

export function useSocketHandler(handler: SocketEventHandlers) {
  const { addHandler } = useSocket();

  useEffect(() => {
    const removeHandler = addHandler(handler);
    return removeHandler;
  }, [addHandler, handler]);

  return null;
}
