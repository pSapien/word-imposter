const server = Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      return undefined;
    }

    return new Response("Hello world!");
  },
  websocket: {
    open(ws) {
      console.log("connection is opened");
    },
    async message(ws, data) {
      console.log("got message::");
      let message;
      try {
        message = JSON.parse(data as string);
      } catch {
        ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid message format" } }));
        return;
      }

      const { type, payload } = message;
    },
    close: (ws) => {
      console.log("Client disconnected");
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
