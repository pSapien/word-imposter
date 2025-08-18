import { SessionProfile, SessionService, WebSocketManager } from "../../core";
import type { LoginRequest, ServerResponseEvents, SyncLoginRequest } from "@imposter/shared";

type Services = {
  session: SessionService;
};

export class AuthHandlers {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>, private services: Services) {}

  private sendLoginSuccess(connectionId: string, session: SessionProfile) {
    this.wsManager.send(connectionId, {
      type: "login_success",
      payload: {
        sessionId: session.sessionId,
        profile: {
          id: session.profile.id,
          displayName: session.profile.displayName,
        },
      },
    });
  }

  handleSyncLogin = (connectionId: string, payload: SyncLoginRequest["payload"]) => {
    const session = this.services.session.getSession(payload.sessionId);

    if (!session) {
      this.wsManager.send(connectionId, {
        type: "error",
        payload: {
          code: "auth.session_expire",
          message: "Session Expiry",
        },
      });
      return;
    }

    this.services.session.updateSession({
      connectionId,
      profile: session.profile,
      sessionId: payload.sessionId,
    });

    this.sendLoginSuccess(connectionId, session);
  };

  handleLogin = (connectionId: string, payload: LoginRequest["payload"]) => {
    try {
      const session = this.services.session.createGuestSession(connectionId, payload.displayName);
      this.sendLoginSuccess(connectionId, session);
    } catch (error) {
      this.wsManager.send(connectionId, {
        type: "error",
        payload: {
          code: "auth.invalid_request",
          message: error instanceof Error ? error.message : "Authentication failed",
        },
      });
    }
  };
}
