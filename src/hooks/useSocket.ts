import { useMemo } from "react";

export function useSocket() {
  const socket = useMemo(() => {
    const instance = new WebSocket("ws://localhost:3000");

    instance.addEventListener("connect", () => {
      console.log("connected");
    });

    instance.addEventListener("message", () => {
      console.log("RX: message");
    });

    instance.addEventListener("close", () => {
      console.log("RX: closed");
    });

    return instance;
  }, []);

  return { connected: false, error: null };
}
