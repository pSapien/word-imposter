import type { GameEngine } from "../GameEngine.js";
import type { GuestProfile } from "./SessionService.js";
import { RoomMember } from "@imposter/shared";

export interface GameRoom {
  roomId: string;
  roomCode: string;
  name: string;
  hostId: string;
  members: RoomMember[];
  currentGame?: GameEngine<any>;
  gameHistory: string[];
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

  create(host: GuestProfile, roomName: string): GameRoom {
    const roomCode = this.generateRoomCode();
    const newRoom: GameRoom = {
      roomId: roomName.trim(),
      name: roomName.trim(),
      roomCode,
      hostId: host.id,
      members: [
        {
          id: host.id,
          displayName: host.displayName,
          role: "host",
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

    if (this.rooms.has(newRoom.roomId)) throw new Error("Room already created!");

    this.rooms.set(newRoom.roomId, newRoom);
    this.roomCodes.set(roomCode, newRoom.roomId);
    this.memberToRoom.set(host.id, newRoom.roomId);

    return newRoom;
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
    };

    room.members.push(member);
    this.memberToRoom.set(profile.id, room.roomId);

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

  kickMember(hostId: string, roomId: string, targetProfileId: string): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    if (room.hostId !== hostId) throw new Error("Only host can kick members");

    if (targetProfileId === hostId) throw new Error("Host cannot kick themselves");

    const memberIndex = room.members.findIndex((m) => m.id === targetProfileId);
    if (memberIndex === -1) throw new Error("Member not found");

    room.members.splice(memberIndex, 1);
    this.memberToRoom.delete(targetProfileId);

    return room;
  }

  setGame(roomId: string, game: GameEngine<any>): void {
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

  cleanupEmptyRooms(): void {
    for (const [roomId, room] of Array.from(this.rooms.entries())) {
      if (room.members.length === 0) {
        this.rooms.delete(roomId);
        this.roomCodes.delete(room.roomCode);
      }
    }
  }

  shutdown() {
    this.rooms.clear();
    this.roomCodes.clear();
    this.memberToRoom.clear();
  }
}
