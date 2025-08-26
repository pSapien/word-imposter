export interface SessionProfile {
  sessionId: string;
  connectionId: string;
  lastActiveAt: number;
  profile: { id: string; displayName: string };
}

function randomStr(length = 12) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export class SessionService {
  private sessions = new Map<string, SessionProfile>();
  private indexByConnectionId = new Map<string, string>();
  private indexByProfileId = new Map<string, string>();

  createSession(connectionId: string, profile: SessionProfile["profile"]): SessionProfile {
    const session: SessionProfile = {
      sessionId: randomStr(8),
      connectionId,
      profile,
      lastActiveAt: Date.now(),
    };

    this.sessions.set(session.sessionId, session);
    this.indexByConnectionId.set(connectionId, session.sessionId);
    this.indexByProfileId.set(profile.id, session.sessionId);

    return session;
  }

  getSession(sessionId: string): SessionProfile | null {
    return this.sessions.get(sessionId) || null;
  }

  updateLastActive(connectionId: string) {
    const session = this.getSessionByConnectionId(connectionId);
    if (session) session.lastActiveAt = Date.now();
  }

  resignConnection(sessionId: string, newConnectionId: string): SessionProfile | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    /** remove the old connection id from index */
    this.indexByConnectionId.delete(session.connectionId);

    /** assign the new connection */
    session.connectionId = newConnectionId;
    this.indexByConnectionId.set(newConnectionId, session.sessionId);
    return session;
  }

  updateProfile(sessionId: string, displayName: string) {
    const session = this.getSessionByProfileId(sessionId);
    if (!session) return null;

    session.profile.displayName = displayName;
    return session;
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

  cleanupInactiveSessions(maxInActiveMs: number): void {
    const now = Date.now();

    this.sessions.forEach((session) => {
      if (now - session.lastActiveAt > maxInActiveMs) {
        console.log(`Cleaning up inactive session for ${session.profile.displayName}`);
        this.removeSession(session.sessionId);
      }
    });
  }

  getStats() {
    return this.sessions.size;
  }

  shutdown() {
    this.sessions.clear();
    this.indexByConnectionId.clear();
    this.indexByProfileId.clear();
  }
}
