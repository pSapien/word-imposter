import { uuid } from "uuidv4";

export interface GuestProfile {
  id: string;
  displayName: string;
  createdAt: number;
  lastActiveAt: number;
}

export interface AuthSession {
  sessionId: string;
  connectionId: string;
  profile: GuestProfile;
}

export class SessionService {
  private sessions = new Map<string, AuthSession>();
  private connections = new Map<string, string>();

  createGuestSession(connectionId: string, displayName: string): AuthSession {
    if (!displayName?.trim()) {
      throw new Error("Display name is required");
    }

    const profile: GuestProfile = {
      id: uuid(),
      displayName: displayName.trim(),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const session: AuthSession = {
      sessionId: uuid(),
      connectionId,
      profile,
    };

    this.sessions.set(session.sessionId, session);
    this.connections.set(session.connectionId, session.sessionId);

    return session;
  }

  updateSession(session: AuthSession) {
    this.sessions.set(session.sessionId, session);
    this.connections.set(session.connectionId, session.sessionId);
  }

  getSession(sessionId: string): AuthSession | null {
    return this.sessions.get(sessionId) || null;
  }

  removeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);
    this.connections.delete(session.connectionId);
  }

  getSessionId(connectionId: string) {
    return this.connections.get(connectionId) || null;
  }
}
