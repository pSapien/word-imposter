export const ErrorCodes = {
  /** server errors */
  serverInvalidMessage: "server.invalid_message",
  serverError: "ws.server_error",

  /** auth related error codes */
  authSessionExpiry: "auth.session_expiry",
  authSessionNotFound: "auth.session_not_found",
  authInvalidToken: "auth.invalid_token",
  authInvalidRequest: "auth.invalid_request",
  authRateLimitExceeded: "auth.rate_limit_exceeded",
  authUnauthorized: "auth.unauthorized",

  /** room related errors */
  roomCreateFailed: "room.create_failed",
  roomJoinedFailed: "room.joined_failed",
  roomKickedFailed: "room.kick_member_failed",
  roomLeaveFailed: "room.leave_failed",
  roomMemberNotFound: "room.member_not_found",

  /** game related errors */
  gameNotFound: "game.not_found",
  gameStartFailed: "game.start_failed",
  gameActionFailed: "game.action_failed",
  gameStateFailed: "game.state_failed",
} as const;

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface ErrorResponse {
  type: "error";
  payload: {
    code: ErrorCode;
    message: string;
  };
}

export class ApiError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
