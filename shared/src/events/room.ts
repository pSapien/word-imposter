import type { Profile } from "./auth.js";

export interface RoomMember extends Profile {
  role: string;
  status: "connected" | "disconnected";
}

export interface Room {
  roomName: string;
  roomId: string;
  hostId: string;
  members: RoomMember[];
}

export interface CreateRoomRequest {
  type: "create_room";
  payload: {
    roomName: string;
  };
}

export interface JoinRoomRequest {
  type: "join_room";
  payload: {
    roomName: string;
    role: string;
  };
}

export interface LeaveRoomRequest {
  type: "leave_room";
  payload: {
    roomId: string;
  };
}

export interface KickRoomMemberRequest {
  type: "kick_room_member";
  payload: {
    memberId: string;
    roomId: string;
  };
}

export interface RoomJoinedResponse {
  type: "room_joined";
  payload: Room;
}

export interface RoomCreatedResponse {
  type: "room_created";
  payload: Room;
}
