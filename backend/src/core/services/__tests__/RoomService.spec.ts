import { describe, it, expect, beforeEach } from "bun:test";
import { RoomService } from "../RoomService";

const hostProfile = { id: "host1", displayName: "Host" };
const userProfile = { id: "user1", displayName: "User" };

describe("RoomService", () => {
  let service: RoomService;

  beforeEach(() => {
    service = new RoomService();
  });

  it("should create a room", () => {
    const room = service.create(hostProfile, "TestRoom");
    expect(room).toBeDefined();
    expect(room.hostId).toBe(hostProfile.id);
    expect(room.members.length).toBe(1);
    expect(service.exists(room.roomId)).toBe(true);
  });

  it("should allow host to re-create existing room", () => {
    const room1 = service.create(hostProfile, "TestRoom");
    const room2 = service.create(hostProfile, "TestRoom");
    expect(room1).toBe(room2);
    expect(room2.members[0]!.status).toBe("connected");
  });

  it("should not rejoin same player", () => {
    const room = service.create(hostProfile, "TestRoom");
    service.join("TestRoom", { id: "Player1", displayName: "Player1" }, "player");
    expect(room.members).toHaveLength(2);
    service.join("TestRoom", { id: "Player1", displayName: "UpdatedPlayer1" }, "player");
    expect(room.members).toHaveLength(2);
    expect(room.members.map((p) => p.displayName)).toStrictEqual([hostProfile.displayName, "UpdatedPlayer1"]);
  });

  it("should throw if another user tries to reuse room name", () => {
    service.create(hostProfile, "TestRoom");
    expect(() => service.create(userProfile, "TestRoom")).toThrowError();
  });

  it("should join a room", () => {
    const room = service.create(hostProfile, "TestRoom");
    service.join(room.roomId, userProfile, "player");
    const updated = service.getRoomByMember(userProfile.id)!;
    expect(updated.members.find((m) => m.id === userProfile.id)).toBeDefined();
  });

  it("should remove a member on leave", () => {
    const room = service.create(hostProfile, "TestRoom");
    service.join(room.roomId, userProfile, "player");

    service.leave(userProfile.id);
    const updated = service.getRoomByMember(userProfile.id);
    expect(updated).toBeNull();
  });

  it("should delete room when last member leaves", () => {
    const room = service.create(hostProfile, "TestRoom");
    service.leave(hostProfile.id);
    expect(service.exists(room.roomId)).toBe(false);
  });

  it("should kick a member if host requests", () => {
    const room = service.create(hostProfile, "TestRoom");
    service.join(room.roomId, userProfile, "player");

    const updated = service.kickMember(hostProfile.id, room.roomId, userProfile.id);
    expect(updated.members.find((m) => m.id === userProfile.id)).toBeUndefined();
  });

  it("should throw if host tries to kick themselves", () => {
    const room = service.create(hostProfile, "TestRoom");
    expect(() => service.kickMember(hostProfile.id, room.roomId, hostProfile.id)).toThrowError();
  });

  it("should handle disconnect and reconnect", () => {
    const room = service.create(hostProfile, "TestRoom");
    service.join(room.roomId, userProfile, "player");

    service.handleDisconnect(userProfile.id);
    const disconnected = room.members.find((m) => m.id === userProfile.id)!;
    expect(disconnected.status).toBe("disconnected");

    service.handleReconnect(userProfile.id);
    const reconnected = room.members.find((m) => m.id === userProfile.id)!;
    expect(reconnected.status).toBe("connected");
  });

  it("should cleanup stale rooms", () => {
    const room = service.create(hostProfile, "OldRoom");
    room.lastActiveAt = Date.now() - 1000000;
    service.cleanupStaleRooms(100);

    expect(service.exists(room.roomId)).toBe(false);
  });

  it("should return room by code", () => {
    const room = service.create(hostProfile, "CodeRoom");
    const found = service.getRoomByCode(room.roomCode);
    expect(found?.roomId).toBe(room.roomId);
  });

  it("should shutdown and clear state", () => {
    service.create(hostProfile, "Room1");
    service.shutdown();
    expect(service.getStats()).toBe(0);
  });
});
