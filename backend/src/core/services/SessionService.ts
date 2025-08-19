import { v4 as uuid } from "uuid";

export interface GuestProfile {
  id: string;
  displayName: string;
  createdAt: number;
  lastActiveAt: number;
}

export interface SessionProfile {
  sessionId: string;
  connectionId: string;
  profile: GuestProfile;
}

export class SessionService {
  private sessions = new Map<string, SessionProfile>();
  private indexByConnectionId = new Map<string, string>();
  private indexByProfileId = new Map<string, string>();

  createGuestSession(connectionId: string, displayName: string): SessionProfile {
    if (!displayName?.trim()) throw new Error("Display name is required");

    const profile: GuestProfile = {
      id: uuid(),
      displayName: displayName.trim(),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const session: SessionProfile = {
      sessionId: uuid(),
      connectionId,
      profile,
    };

    this.sessions.set(session.sessionId, session);
    this.indexByConnectionId.set(connectionId, session.sessionId);
    this.indexByProfileId.set(profile.id, session.sessionId);

    return session;
  }

  getSession(sessionId: string): SessionProfile | null {
    return this.sessions.get(sessionId) || null;
  }

  updateSession(updated: SessionProfile) {
    const existing = this.sessions.get(updated.sessionId);
    if (!existing) throw new Error("No previous session to update");

    this.sessions.set(updated.sessionId, updated);

    if (existing.connectionId !== updated.connectionId) {
      this.indexByConnectionId.delete(existing.connectionId);
      this.indexByConnectionId.set(updated.connectionId, updated.sessionId);
    }
    if (existing.profile.id !== updated.profile.id) {
      this.indexByProfileId.delete(existing.profile.id);
      this.indexByProfileId.set(updated.profile.id, updated.sessionId);
    }

    return this.sessions.get(updated.sessionId);
  }

  getSessionByConnectionId(connectionId: string): SessionProfile | null {
    const sessionId = this.indexByConnectionId.get(connectionId);
    return sessionId ? this.getSession(sessionId) : null;
  }

  getSessionByProfileId(profileId: string): SessionProfile | null {
    const sessionId = this.indexByProfileId.get(profileId);
    return sessionId ? this.getSession(sessionId) : null;
  }

  removeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);
    this.indexByConnectionId.delete(session.connectionId);
    this.indexByProfileId.delete(session.profile.id);
    return true;
  }

  shutdown() {
    this.sessions.clear();
    this.indexByConnectionId.clear();
    this.indexByProfileId.clear();
  }
}
