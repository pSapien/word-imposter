export interface PingRequest {
  type: "ping";
  payload: {};
}

export interface PongResponse {
  type: "pong";
  payload: {};
}
