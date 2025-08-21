export interface Profile {
  id: string;
  displayName: string;
}

export interface LoginRequest {
  type: "login";
  payload: {
    token?: string;
    displayName: string;
  };
}

export interface LoginResponse {
  type: "login_success";
  payload: {
    token: string;
    profile: {
      id: string;
      displayName: string;
    };
  };
}

export interface AuthenticatedRequest {
  connectionId: string;
  sessionId: string;
  profileId: string;
}
