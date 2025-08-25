import type { GameEngine } from "../GameEngine.js";
import type { GuestProfile } from "./SessionService.js";
import type { RoomMember } from "@imposter/shared";

export interface GameRoom {
  roomId: string;
  roomCode: string;
  name: string;
  hostId: string;
  lastActiveAt: number;
  members: RoomMember[];
  currentGame?: GameEngine<any>;
  createdAt: number;
  settings: {
    maxMembers: number;
    allowSpectators: boolean;
    isPrivate: boolean;
  };
}

export class RoomService {
  private rooms = new Map<string, GameRoom>();
  private roomCodes = new Map<string, string>();
  private memberToRoom = new Map<string, string>();
  private graceDisconnectionTimers = new Map<string, NodeJS.Timeout>();

  create(host: GuestProfile, roomName: string): GameRoom {
    const roomId = roomName.trim();
    const existingRoom = this.rooms.get(roomId);

    if (existingRoom) {
      // It's the same host re-creating the room. Let's treat this as a rejoin.
      if (existingRoom.hostId === host.id) {
        let hostMember = existingRoom.members.find((m) => m.id === host.id);
        if (hostMember) {
          hostMember.status = "connected";
        } else {
          // If the host wasn't in the list for some reason, add them back.
          existingRoom.members.push({
            id: host.id,
            displayName: host.displayName,
            role: "host",
            status: "connected",
          });
        }

        // Update the mapping in case they had left
        this.memberToRoom.set(host.id, existingRoom.roomId);

        // Clear any pending disconnection timer for the host
        this.clearDisconnectionTimerIfExists(host.id);

        this.updateLastActive(existingRoom.roomId);
        return existingRoom;
      } else {
        // A different user is trying to use an existing room name.
        throw new Error("Room name already taken.");
      }
    }

    // --- Original creation logic from here ---
    const roomCode = this.generateRoomCode();
    const newRoom: GameRoom = {
      roomId: roomId,
      name: roomName.trim(),
      roomCode,
      hostId: host.id,
      lastActiveAt: Date.now(),
      members: [
        {
          id: host.id,
          displayName: host.displayName,
          role: "host",
          status: "connected",
        },
      ],
      createdAt: Date.now(),
      settings: {
        maxMembers: 20,
        allowSpectators: true,
        isPrivate: false,
      },
    };

    this.rooms.set(newRoom.roomId, newRoom);
    this.roomCodes.set(roomCode, newRoom.roomId);
    this.memberToRoom.set(host.id, newRoom.roomId);

    return newRoom;
  }

  exists(roomId: string) {
    return this.rooms.has(roomId);
  }

  setGame(room: GameRoom, game: GameEngine<any>) {
    room.currentGame = game;
    this.updateLastActive(room.roomId);
  }

  updateLastActive(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.lastActiveAt = Date.now();
    return room;
  }

  join(roomId: string, profile: GuestProfile, role: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    const memberIndex = room.members.findIndex((m) => m.id === profile.id);
    if (memberIndex >= 0) room.members.splice(memberIndex, 1);

    const member: RoomMember = {
      id: profile.id,
      displayName: profile.displayName,
      role,
      status: "connected",
    };

    room.members.push(member);
    this.memberToRoom.set(profile.id, room.roomId);
    this.updateLastActive(room.roomId);

    return room;
  }

  leave(profileId: string): GameRoom | null {
    const roomId = this.memberToRoom.get(profileId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const memberIndex = room.members.findIndex((m) => m.id === profileId);
    if (memberIndex === -1) return null;

    room.members.splice(memberIndex, 1);
    this.memberToRoom.delete(profileId);

    if (room.members.length === 0) {
      this.rooms.delete(roomId);
      this.roomCodes.delete(room.roomCode);
    }

    const timer = this.graceDisconnectionTimers.get(profileId);
    if (timer) {
      clearTimeout(timer);
      this.graceDisconnectionTimers.delete(profileId);
    }

    return room;
  }

  getRoomByCode(roomCode: string): GameRoom | null {
    const roomId = this.roomCodes.get(roomCode);
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  getRoomByMember(profileId: string): GameRoom | null {
    const roomId = this.memberToRoom.get(profileId);
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  getStats() {
    return this.rooms.size;
  }

  kickMember(hostId: string, roomId: string, targetProfileId: string): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    if (room.hostId !== hostId) throw new Error("Only host can kick members");
    if (targetProfileId === hostId) throw new Error("Host cannot kick themselves");

    this.leave(targetProfileId);
    return room;
  }

  private generateRoomCode(): string {
    let code: string;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.roomCodes.has(code));
    return code;
  }

  cleanupStaleRooms(maxInActiveMs: number): void {
    const now = Date.now();

    this.rooms.forEach((room) => {
      if (room.members.length === 0 || now - room.lastActiveAt > maxInActiveMs) {
        room.members.forEach((member) => {
          this.clearDisconnectionTimerIfExists(member.id);
          this.memberToRoom.delete(member.id);
        });
        this.rooms.delete(room.roomId);
        this.roomCodes.delete(room.roomCode);
      }
    });
  }

  private clearDisconnectionTimerIfExists(profileId: string) {
    const timer = this.graceDisconnectionTimers.get(profileId);
    if (!timer) return false;

    clearTimeout(timer);
    this.graceDisconnectionTimers.delete(profileId);
    return true;
  }

  handleReconnect(profileId: string) {
    const room = this.getRoomByMember(profileId);
    if (!room) return null;

    const member = room.members.find((r) => r.id === profileId);
    if (member && member.status === "disconnected") {
      member.status = "connected";
      this.clearDisconnectionTimerIfExists(profileId);
    }

    return room;
  }

  handleDisconnect(profileId: string) {
    const room = this.getRoomByMember(profileId);
    if (!room) return null;

    const member = room.members.find((r) => r.id === profileId);
    if (member) {
      member.status = "disconnected";

      /** Set a timer to kick the player after 60 seconds */
      const disconnectionTimer = setTimeout(() => {
        console.log(`Player ${profileId} did not reconnect in time. Removing`);
        this.leave(profileId);
      }, 60000 * 10);

      this.graceDisconnectionTimers.set(profileId, disconnectionTimer);
    }

    return room;
  }

  shutdown() {
    this.rooms.clear();
    this.roomCodes.clear();
    this.memberToRoom.clear();
  }
}
