export interface WebSocketConnection {
  id: string;
  socket: Bun.WebSocket;
  lastPing: number;
}

interface Message {
  type: string;
  payload: any;
}

export class WebSocketManager<M extends Message> {
  private connectionsById = new Map<string, WebSocketConnection>();
  private connectionToId = new WeakMap<Bun.WebSocket, string>();

  addConnection(socket: Bun.WebSocket): string {
    const connectionId = this.generateConnectionId();
    const connection: WebSocketConnection = {
      id: connectionId,
      socket,
      lastPing: Date.now(),
    };

    this.connectionsById.set(connectionId, connection);
    this.connectionToId.set(socket, connectionId);

    return connectionId;
  }

  removeConnection(connectionId: string): void {
    const connection = this.connectionsById.get(connectionId);
    if (connection) this.connectionToId.delete(connection.socket);
    this.connectionsById.delete(connectionId);
  }

  getConnection(connectionId: string): WebSocketConnection | null {
    return this.connectionsById.get(connectionId) || null;
  }

  getConnectionId(socket: Bun.WebSocket): string | null {
    return this.connectionToId.get(socket) || null;
  }

  broadcast(connectionIds: string[], message: M): void {
    const messageStr = JSON.stringify(message);
    connectionIds.forEach((id) => {
      const connection = this.connectionsById.get(id);
      if (connection && connection.socket.readyState === 1) {
        try {
          connection.socket.send(messageStr);
        } catch (error) {
          console.error(`Failed to send message to connection ${id}:`, error);
        }
      }
    });
  }

  send(connectionId: string, message: M): boolean {
    const connection = this.connectionsById.get(connectionId);
    if (!connection || connection.socket.readyState !== 1) return false;

    try {
      connection.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to connection ${connectionId}:`, error);
      return false;
    }
  }

  updatePing(connectionId: string): void {
    const connection = this.connectionsById.get(connectionId);
    if (connection) connection.lastPing = Date.now();
  }

  cleanupStaleConnections(maxStaleMs: number = 60000): void {
    const now = Date.now();
    Array.from(this.connectionsById.entries()).forEach(([id, connection]) => {
      if (now - connection.lastPing > maxStaleMs) {
        this.removeConnection(id);
      }
    });
  }

  getActiveConnectionIds(): string[] {
    return Array.from(this.connectionsById.values())
      .filter((c) => c.socket.readyState === 1)
      .map((c) => c.id);
  }

  getAllConnections() {
    return Array.from(this.connectionsById.values());
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
