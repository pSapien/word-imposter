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

  public async handleLogin(connectionId: string, payload: LoginRequest["payload"]) {
    try {
      /** handle reconnection */
      if (payload.id) {
        const prevSession = this.services.session.getSessionByProfileId(payload.id);
        if (!prevSession) throw new ApiError(ErrorCodes.authSessionExpiry, "Session expired");

        this.services.session.resignConnection(prevSession.sessionId, connectionId);

        /** if there is new displayName, we try to update it */
        if (payload.displayName !== prevSession.profile.displayName) {
          try {
            Validators.validatePlayerName(payload.displayName);
            this.services.session.updateProfile(prevSession.profile.id, payload.displayName);
          } catch (error: any) {}
        }

        await this.sendLoginSuccess(connectionId, prevSession);
        return;
      }

      Validators.validatePlayerName(payload.displayName);

      const newProfile = {
        displayName: payload.displayName.trim(),
        id: randomStr(8),
      };

      const session = this.services.session.createSession(connectionId, newProfile);
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
