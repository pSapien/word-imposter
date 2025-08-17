export interface StartGameRequest {
  type: "start_game";
  payload: {
    gameType: string;
    settings: any;
  };
}
