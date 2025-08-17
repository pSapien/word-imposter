import { ServerResponseEvents } from "@imposter/shared";
import { WebSocketManager } from "../WebSocketManager.js";
import { SessionService } from "../services/SessionService.js";

export interface AuthenticatedRequest {
  connectionId: string;
  sessionId: string;
  profileId: string;
}

type Services = {
  session: SessionService;
};

export class AuthMiddleware {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>, private services: Services) {}

  requireAuth = (handler: (req: AuthenticatedRequest, payload: any) => void) => {
    return (connectionId: string, payload: any) => {
      const session = this.services.session.getSessionByConnectionId(connectionId);

      if (!session) {
        this.wsManager.send(connectionId, {
          type: "error",
          payload: {
            code: "auth.required",
            message: "Authentication required",
          },
        });
        return;
      }

      const authenticatedRequest = {
        connectionId,
        sessionId: session.sessionId,
        profileId: session.profile.id,
      };

      handler(authenticatedRequest, payload);
    };
  };
}
