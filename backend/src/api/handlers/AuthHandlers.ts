import type { SessionProfile, SessionService, WebSocketManager, AuthService } from "@server/core";
import { Validators, ErrorCodes, type LoginRequest, type ServerResponseEvents, ApiError } from "@imposter/shared";
import { randomStr } from "@server/utils";

type Services = {
  session: SessionService;
  auth: AuthService;
};

export class AuthHandlers {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>, private services: Services) {}

  private async sendLoginSuccess(connectionId: string, session: SessionProfile) {
    const token = await this.services.auth.generateToken({
      profileId: session.profile.id,
      sessionId: session.sessionId,
    });
    this.wsManager.send(connectionId, {
      type: "login_success",
      payload: {
        token: token,
        profile: {
          id: session.profile.id,
          displayName: session.profile.displayName,
        },
      },
    });
  }

  private handleReconnection(connectionId: string, profileId: string, displayName: string) {
    const prevSession = this.services.session.getSessionByProfileId(profileId);
    console.log("Handling Reconnection for", displayName);

    if (prevSession) {
      this.services.session.resignConnection(prevSession.sessionId, connectionId);
      this.services.session.updateProfile(prevSession.profile.id, displayName);
      return prevSession;
    }

    return this.services.session.createSession(connectionId, {
      id: profileId,
      displayName,
    });
  }

  public async handleLogin(connectionId: string, payload: LoginRequest["payload"]) {
    try {
      const { id, displayName } = payload;
      Validators.validatePlayerName(displayName);

      const session = id
        ? this.handleReconnection(connectionId, id, displayName.trim())
        : this.services.session.createSession(connectionId, { displayName: displayName.trim(), id: randomStr(8) });

      await this.sendLoginSuccess(connectionId, session);
    } catch (error: any) {
      this.wsManager.send(connectionId, {
        type: "error",
        payload: {
          code: error?.code ?? ErrorCodes.authInvalidRequest,
          message: error instanceof Error ? error.message : "Authentication failed",
        },
      });
    }
  }
}
