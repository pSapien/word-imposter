export const Constants = {
  StorageKeys: {
    Name: "$$name$$",
    RoomName: "$$roomName$$",
    Profile: "$$profile$$",
    Token: "$$token$$",
    GameSettings: "$$game_settings$$",
    Role: "$$role$$",
  },
  Endpoint: "ws://10.10.100.200:3001",
  ShowDebugLogs: false,
  ToastShowDuration: 3000,

  Connection: {
    PingInterval: 15 * 1000,
    MinReconnectionDelay: 1 * 1000,
    MaxRetries: 5,
  },
};
