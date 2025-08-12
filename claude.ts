export interface Connection {
  id: string;
  send<T = any>(message: T): void;
  close(code?: number, reason?: string): void;
  metadata: Record<string, any>;
  isAlive: boolean;
  lastPing: number;
}

export interface RoomState {
  [key: string]: any;
}

export interface BroadcastOptions {
  exclude?: string[];
  include?: string[];
  filter?: (connection: Connection) => boolean;
}

export interface Room<TState extends RoomState = RoomState> {
  id: string;
  connections: Map<string, Connection>;
  state: TState;
  metadata: Record<string, any>;

  // Core methods
  broadcast<T = any>(message: T, options?: BroadcastOptions): void;
  getConnection(id: string): Connection | undefined;
  getConnections(): Connection[];
  setState<K extends keyof TState>(key: K, value: TState[K]): void;
  getState<K extends keyof TState>(key: K): TState[K] | undefined;
  updateState(updates: Partial<TState>): void;

  // Lifecycle
  destroy(): void;
}

export interface RoomHandlers<TState extends RoomState = RoomState> {
  onConnect?(connection: Connection, room: Room<TState>): void | Promise<void>;
  onMessage?<T = any>(message: T, connection: Connection, room: Room<TState>): void | Promise<void>;
  onDisconnect?(connection: Connection, room: Room<TState>): void | Promise<void>;
  onDestroy?(room: Room<TState>): void | Promise<void>;
}

export interface GameKitConfig {
  pingInterval?: number;
  connectionTimeout?: number;
  maxConnectionsPerRoom?: number;
  enableLogging?: boolean;
}

// packages/gamekit/src/connection.ts
export class GameKitConnection implements Connection {
  public isAlive = true;
  public lastPing = Date.now();
  public metadata: Record<string, any> = {};

  constructor(
    public id: string,
    private socket: any, // Generic socket interface
    private onClose?: () => void
  ) {}

  send<T = any>(message: T): void {
    try {
      if (this.socket && this.socket.readyState === 1) {
        // WebSocket.OPEN
        this.socket.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error(`Failed to send message to connection ${this.id}:`, error);
      this.close();
    }
  }

  close(code?: number, reason?: string): void {
    this.isAlive = false;
    if (this.socket) {
      this.socket.close(code, reason);
    }
    this.onClose?.();
  }

  ping(): void {
    this.lastPing = Date.now();
    this.send({ type: "ping", timestamp: this.lastPing });
  }

  isTimedOut(timeout: number): boolean {
    return Date.now() - this.lastPing > timeout;
  }
}

import { EventEmitter } from "node:events";

export class GameKitRoom<TState extends RoomState = RoomState> extends EventEmitter implements Room<TState> {
  public connections = new Map<string, Connection>();
  public metadata: Record<string, any> = {};

  private _state: TState;
  private destroyed = false;

  constructor(
    public id: string,
    initialState: TState,
    private handlers: RoomHandlers<TState> = {},
    private config: GameKitConfig = {}
  ) {
    super();
    this._state = { ...initialState };
  }

  get state(): TState {
    return this._state;
  }

  // Connection Management
  async addConnection(connection: Connection): Promise<void> {
    if (this.destroyed) return;

    if (this.config.maxConnectionsPerRoom && this.connections.size >= this.config.maxConnectionsPerRoom) {
      connection.send({
        type: "error",
        message: "Room is full",
        code: "ROOM_FULL",
      });
      connection.close();
      return;
    }

    this.connections.set(connection.id, connection);
    this.log(`Connection ${connection.id} joined room ${this.id}`);

    try {
      await this.handlers.onConnect?.(connection, this);
    } catch (error) {
      console.error(`Error in onConnect handler:`, error);
    }

    this.emit("connection:added", connection);
  }

  async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.connections.delete(connectionId);
    this.log(`Connection ${connectionId} left room ${this.id}`);

    try {
      await this.handlers.onDisconnect?.(connection, this);
    } catch (error) {
      console.error(`Error in onDisconnect handler:`, error);
    }

    this.emit("connection:removed", connection);

    // Auto-destroy empty rooms
    if (this.connections.size === 0) {
      setTimeout(() => {
        if (this.connections.size === 0) {
          this.destroy();
        }
      }, 5000); // 5 second grace period
    }
  }

  // Message Handling
  async handleMessage<T = any>(message: T, connectionId: string): Promise<void> {
    if (this.destroyed) return;

    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      await this.handlers.onMessage?.(message, connection, this);
    } catch (error) {
      console.error(`Error in onMessage handler:`, error);
      connection.send({
        type: "error",
        message: "Internal server error",
        code: "HANDLER_ERROR",
      });
    }
  }

  // Broadcasting
  broadcast<T = any>(message: T, options: BroadcastOptions = {}): void {
    if (this.destroyed) return;

    let targetConnections = Array.from(this.connections.values());

    // Apply filters
    if (options.include?.length) {
      targetConnections = targetConnections.filter((conn) => options.include!.includes(conn.id));
    }

    if (options.exclude?.length) {
      targetConnections = targetConnections.filter((conn) => !options.exclude!.includes(conn.id));
    }

    if (options.filter) {
      targetConnections = targetConnections.filter(options.filter);
    }

    // Send to filtered connections
    targetConnections.forEach((connection) => {
      if (connection.isAlive) {
        connection.send(message);
      }
    });

    this.log(`Broadcasted message to ${targetConnections.length} connections`);
  }

  // State Management
  setState<K extends keyof TState>(key: K, value: TState[K]): void {
    const oldValue = this._state[key];
    this._state[key] = value;
    this.emit("state:changed", { key, value, oldValue });
  }

  getState<K extends keyof TState>(key: K): TState[K] | undefined {
    return this._state[key];
  }

  updateState(updates: Partial<TState>): void {
    const oldState = { ...this._state };
    this._state = { ...this._state, ...updates };
    this.emit("state:updated", { updates, oldState, newState: this._state });
  }

  // Utility Methods
  getConnection(id: string): Connection | undefined {
    return this.connections.get(id);
  }

  getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  getActiveConnections(): Connection[] {
    return this.getConnections().filter((conn) => conn.isAlive);
  }

  // Health Check
  performHealthCheck(timeout: number): void {
    this.connections.forEach((connection, id) => {
      if (connection.isTimedOut(timeout)) {
        this.log(`Connection ${id} timed out`);
        connection.close(1000, "Connection timeout");
        this.removeConnection(id);
      } else {
        (connection as GameKitConnection).ping();
      }
    });
  }

  // Lifecycle
  async destroy(): Promise<void> {
    if (this.destroyed) return;

    this.destroyed = true;
    this.log(`Destroying room ${this.id}`);

    // Close all connections
    this.connections.forEach((connection) => {
      connection.close(1000, "Room destroyed");
    });
    this.connections.clear();

    try {
      await this.handlers.onDestroy?.(this);
    } catch (error) {
      console.error(`Error in onDestroy handler:`, error);
    }

    this.emit("destroyed");
    this.removeAllListeners();
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[GameKit Room ${this.id}] ${message}`);
    }
  }
}

// packages/gamekit/src/server.ts
export class GameKitServer<TState extends RoomState = RoomState> {
  private rooms = new Map<string, GameKitRoom<TState>>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(private roomHandlers: RoomHandlers<TState>, private config: GameKitConfig = {}) {
    this.config = {
      pingInterval: 30000, // 30 seconds
      connectionTimeout: 60000, // 60 seconds
      enableLogging: true,
      ...config,
    };

    this.startHealthCheck();
  }

  // Room Management
  createRoom(roomId: string, initialState: TState): GameKitRoom<TState> {
    if (this.rooms.has(roomId)) {
      throw new Error(`Room ${roomId} already exists`);
    }

    const room = new GameKitRoom(roomId, initialState, this.roomHandlers, this.config);
    this.rooms.set(roomId, room);

    // Auto-cleanup when room is destroyed
    room.once("destroyed", () => {
      this.rooms.delete(roomId);
    });

    this.log(`Created room: ${roomId}`);
    return room;
  }

  getRoom(roomId: string): GameKitRoom<TState> | undefined {
    return this.rooms.get(roomId);
  }

  getOrCreateRoom(roomId: string, initialState: TState): GameKitRoom<TState> {
    return this.getRoom(roomId) || this.createRoom(roomId, initialState);
  }

  getRooms(): GameKitRoom<TState>[] {
    return Array.from(this.rooms.values());
  }

  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      room.destroy();
      return this.rooms.delete(roomId);
    }
    return false;
  }

  // Connection Handling (WebSocket agnostic)
  async handleConnection(roomId: string, connectionId: string, socket: any): Promise<void> {
    const connection = new GameKitConnection(connectionId, socket, () =>
      this.handleDisconnection(roomId, connectionId)
    );

    // Set up socket event handlers
    socket.onmessage = (event: any) => {
      try {
        const message = JSON.parse(event.data || event);
        this.handleMessage(roomId, connectionId, message);
      } catch (error) {
        console.error("Failed to parse message:", error);
        connection.send({
          type: "error",
          message: "Invalid message format",
          code: "PARSE_ERROR",
        });
      }
    };

    socket.onclose = () => {
      this.handleDisconnection(roomId, connectionId);
    };

    socket.onerror = (error: any) => {
      console.error(`Socket error for connection ${connectionId}:`, error);
      this.handleDisconnection(roomId, connectionId);
    };

    // Handle pong responses
    const originalSend = socket.send.bind(socket);
    socket.send = (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "pong") {
          connection.lastPing = Date.now();
        }
      } catch {}
      return originalSend(data);
    };

    // Add to room
    const room = this.rooms.get(roomId);
    if (room) {
      await room.addConnection(connection);
    } else {
      connection.send({
        type: "error",
        message: "Room not found",
        code: "ROOM_NOT_FOUND",
      });
      connection.close();
    }
  }

  private async handleMessage(roomId: string, connectionId: string, message: any): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      await room.handleMessage(message, connectionId);
    }
  }

  private async handleDisconnection(roomId: string, connectionId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      await room.removeConnection(connectionId);
    }
  }

  // Health Check
  private startHealthCheck(): void {
    if (this.config.pingInterval && this.config.connectionTimeout) {
      this.healthCheckInterval = setInterval(() => {
        this.rooms.forEach((room) => {
          room.performHealthCheck(this.config.connectionTimeout!);
        });
      }, this.config.pingInterval);
    }
  }

  // Server Lifecycle
  async shutdown(): Promise<void> {
    this.log("Shutting down GameKit server...");

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Destroy all rooms
    const destroyPromises = Array.from(this.rooms.values()).map((room) => room.destroy());
    await Promise.all(destroyPromises);

    this.rooms.clear();
    this.log("GameKit server shutdown complete");
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[GameKit Server] ${message}`);
    }
  }
}
