import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { ErrorCodes, type ClientRequestEvents, type ServerResponseEvents } from "../../shared";
import { Constants } from "../constants.ts";
import { useLocalStorage } from "@app/hooks";
import { NameStorage, ProfileStorage, TokenStorage } from "./profile.ts";

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
  const [profile, setProfile] = useLocalStorage(ProfileStorage);

  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [ws] = useState(
    new ReconnectingWebSocket(Constants.Endpoint, "", {
      maxRetries: Constants.Connection.MaxRetries,
    })
  );

  const handlersRef = useRef<Set<SocketEventHandlers>>(new Set());
  const pingIntervalRef = useRef<number | null>(null);

  const send = useCallback((message: ClientRequestEvents) => {
    console.log("Socket.Send::", message.type);
    ws.send(JSON.stringify(message));
  }, []);

  const login = useCallback(
    (name: string) => {
      console.log(profile ? "Reconnecting" : "Login");
      send({
        type: "login",
        payload: {
          id: profile.id || undefined,
          displayName: name.trim(),
        },
      });
    },
    [profile]
  );

  const tryReconnectionIfPossible = useCallback(() => {
    const displayName = NameStorage.get();
    if (!profile) return null;
    console.log("Reconnecting");
    send({
      type: "login",
      payload: {
        id: profile.id,
        displayName: displayName.trim(),
      },
    });
  }, [profile]);

  const startPing = () => {
    console.log("Start ping");
    stopPing();
    pingIntervalRef.current = window.setInterval(() => {
      send({ type: "ping", payload: {} });
    }, Constants.Connection.PingInterval);
  };

  const stopPing = () => {
    console.log("Stop ping");
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  // Handle all server messages
  const handleGlobalMessage = (message: ServerResponseEvents) => {
    switch (message.type) {
      case "login_success":
        console.log("New Profile Updated");
        TokenStorage.set(message.payload.token);
        setProfile({
          displayName: message.payload.profile.displayName,
          id: message.payload.profile.id,
        });
        setStatus("authenticated");
        break;
      case "error":
        if (message.payload.code === ErrorCodes.authSessionExpiry) {
          console.log("Session Expired");
          ProfileStorage.remove();
        }
        break;
      case "pong":
        break; // ignore
      default:
        break;
    }
  };

  useEffect(() => {
    ws.addEventListener("open", () => {
      console.log("Socket.Open");
      setStatus("connected");
      startPing();
      tryReconnectionIfPossible();

      handlersRef.current.forEach((h) => h.onOpen?.());
    });

    ws.addEventListener("close", () => {
      console.log("Socket.Close");
      setStatus("closed");
      stopPing();
      handlersRef.current.forEach((h) => h.onClose?.());
    });

    ws.addEventListener("error", (event) => {
      console.log("Socket.Error");
      console.error("❌ Global socket error:", event);
      setStatus("error");
      handlersRef.current.forEach((h) =>
        h.onError?.(event instanceof ErrorEvent ? event.error : new Error("Unknown error"))
      );
    });

    ws.addEventListener("message", (event: any) => {
      try {
        const message = JSON.parse(event.data) as ServerResponseEvents;
        console.log("Socket.message:", message.type);

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

    function handleVisibilityChange() {
      if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
        console.log("Socket.Reconnect");
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
    currentUserId: profile.id,
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
