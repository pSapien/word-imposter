import { uuid } from "uuidv4";
import type { BaseGame } from "../GameEngine.js";
import type { GuestProfile } from "./SessionService.js";

export interface RoomMember {
  profileId: string;
  displayName: string;
  role: "host" | "player" | "spectator";
  joinedAt: number;
}

export interface Room {
  roomId: string;
  roomCode: string;
  name: string;
  hostId: string;
  members: RoomMember[];
  currentGame?: BaseGame;
  gameHistory: string[];
  createdAt: number;
  settings: {
    maxMembers: number;
    allowSpectators: boolean;
    isPrivate: boolean;
  };
}

export class RoomService {
  private rooms = new Map<string, Room>();
  private roomCodes = new Map<string, string>();
  private memberToRoom = new Map<string, string>();

  create(host: GuestProfile, roomName: string): Room {
    const roomCode = this.generateRoomCode();
    const room: Room = {
      roomId: uuid(),
      roomCode,
      name: roomName.trim(),
      hostId: host.id,
      members: [
        {
          profileId: host.id,
          displayName: host.displayName,
          role: "host",
          joinedAt: Date.now(),
        },
      ],
      gameHistory: [],
      createdAt: Date.now(),
      settings: {
        maxMembers: 20,
        allowSpectators: true,
        isPrivate: false,
      },
    };

    this.rooms.set(room.roomId, room);
    this.roomCodes.set(roomCode, room.roomId);
    this.memberToRoom.set(host.id, room.roomId);

    return room;
  }

  join(roomCode: string, profile: GuestProfile, role: "player" | "spectator" = "player"): Room {
    const roomId = this.roomCodes.get(roomCode);
    if (!roomId) throw new Error("Room not found");

    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    if (room.members.some((m) => m.profileId === profile.id)) {
      return room;
    }

    if (room.members.length >= room.settings.maxMembers) {
      throw new Error("Room is full");
    }

    if (role === "spectator" && !room.settings.allowSpectators) {
      throw new Error("Spectators not allowed");
    }

    const member: RoomMember = {
      profileId: profile.id,
      displayName: profile.displayName,
      role,
      joinedAt: Date.now(),
    };

    room.members.push(member);
    this.memberToRoom.set(profile.id, room.roomId);

    return room;
  }

  leave(profileId: string): Room | null {
    const roomId = this.memberToRoom.get(profileId);
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    const memberIndex = room.members.findIndex((m) => m.profileId === profileId);
    if (memberIndex === -1) {
      return null;
    }

    const leavingMember = room.members[memberIndex];
    room.members.splice(memberIndex, 1);
    this.memberToRoom.delete(profileId);

    // Handle host leaving
    if (leavingMember.role === "host") {
      const nextHost = room.members.find((m) => m.role === "player");
      if (nextHost) {
        nextHost.role = "host";
        room.hostId = nextHost.profileId;
      } else if (room.members.length === 0) {
        this.rooms.delete(roomId);
        this.roomCodes.delete(room.roomCode);
        return null;
      }
    }

    return room;
  }

  getRoomByCode(roomCode: string): Room | null {
    const roomId = this.roomCodes.get(roomCode);
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  getRoomByMember(profileId: string): Room | null {
    const roomId = this.memberToRoom.get(profileId);
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  kickMember(hostId: string, roomCode: string, targetProfileId: string): Room {
    const room = this.getRoomByCode(roomCode);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.hostId !== hostId) {
      throw new Error("Only host can kick members");
    }

    if (targetProfileId === hostId) {
      throw new Error("Host cannot kick themselves");
    }

    const memberIndex = room.members.findIndex((m) => m.profileId === targetProfileId);
    if (memberIndex === -1) {
      throw new Error("Member not found");
    }

    room.members.splice(memberIndex, 1);
    this.memberToRoom.delete(targetProfileId);

    return room;
  }

  setGame(roomId: string, game: BaseGame): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    room.currentGame = game;
  }

  private generateRoomCode(): string {
    let code: string;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.roomCodes.has(code));
    return code;
  }

  // Cleanup methods
  cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.members.length === 0) {
        this.rooms.delete(roomId);
        this.roomCodes.delete(room.roomCode);
      }
    }
  }
}
