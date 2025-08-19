import type { SessionProfile, SessionService, WebSocketManager } from "../../core";
import { Validators, type LoginRequest, type ServerResponseEvents } from "@imposter/shared";

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

  handleLogin = (connectionId: string, payload: LoginRequest["payload"]) => {
    try {
      Validators.validatePlayerName(payload.displayName);

      let session: SessionProfile | null = payload.sessionId
        ? this.services.session.getSession(payload.sessionId)
        : null;

      if (session) {
        /** if previous session exists, we update it with new profile */
        session = this.services.session.updateSession({
          connectionId,
          profile: { ...session.profile, displayName: payload.displayName },
          sessionId: payload.sessionId!,
        });
      } else {
        /** if no prev session exists, we create a new guest session */
        session = this.services.session.createGuestSession(connectionId, payload.displayName);
      }

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
