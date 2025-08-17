import { describe, it, expect, beforeEach } from "bun:test";
import { WordImposterGame } from "../../../games/imposter/WordImposterGame.js";

describe("WordImposterGame", () => {
  let game: WordImposterGame;

  beforeEach(() => {
    game = new WordImposterGame({
      minPlayers: 3,
      maxPlayers: 10,
      allowSpectators: true,
      settings: {
        imposterCount: 1,
        wordCategories: ["general"],
      },
    });
  });

  describe("game setup", () => {
    it("should initialize with correct game type", () => {
      const state = game.getState();
      expect(state.gameType).toBe("word-imposter");
      expect(state.status).toBe("waiting");
    });

    it("should not start with insufficient players", () => {
      expect(game.canStart()).toBe(false);

      const result = game.start();
      expect(result.success).toBe(false);
    });

    it("should start with sufficient players", () => {
      // Add minimum players
      game.addPlayer({ profileId: "1", displayName: "Player1", role: "player" });
      game.addPlayer({ profileId: "2", displayName: "Player2", role: "player" });
      game.addPlayer({ profileId: "3", displayName: "Player3", role: "player" });

      expect(game.canStart()).toBe(true);

      const result = game.start();
      expect(result.success).toBe(true);
      expect(result.events).toContainEqual(expect.objectContaining({ type: "game_started" }));
    });
  });

  describe("player management", () => {
    it("should add players successfully", () => {
      const result = game.addPlayer({
        profileId: "1",
        displayName: "Player1",
        role: "player",
      });

      expect(result.success).toBe(true);
      expect(result.events).toContainEqual(expect.objectContaining({ type: "player_joined" }));
    });

    it("should not add duplicate players", () => {
      game.addPlayer({ profileId: "1", displayName: "Player1", role: "player" });

      const result = game.addPlayer({
        profileId: "1",
        displayName: "Player1",
        role: "player",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Player already in game");
    });

    it("should remove players successfully", () => {
      game.addPlayer({ profileId: "1", displayName: "Player1", role: "player" });

      const result = game.removePlayer("1");
      expect(result.success).toBe(true);
      expect(result.events).toContainEqual(expect.objectContaining({ type: "player_left" }));
    });
  });

  describe("game actions", () => {
    beforeEach(() => {
      // Setup game with players
      game.addPlayer({ profileId: "1", displayName: "Player1", role: "player" });
      game.addPlayer({ profileId: "2", displayName: "Player2", role: "player" });
      game.addPlayer({ profileId: "3", displayName: "Player3", role: "player" });
      game.start();
    });

    it("should validate start_voting action", () => {
      const isValid = game.validateAction({
        type: "start_voting",
        playerId: "1",
      });

      expect(isValid).toBe(true);
    });

    it("should process start_voting action", () => {
      const result = game.processAction({
        type: "start_voting",
        playerId: "1",
      });

      expect(result.success).toBe(true);
      expect(result.events).toContainEqual(expect.objectContaining({ type: "voting_started" }));
    });

    it("should validate cast_vote action", () => {
      // Start voting first
      game.processAction({ type: "start_voting", playerId: "1" });

      const isValid = game.validateAction({
        type: "cast_vote",
        playerId: "1",
        data: { targetId: "2" },
      });

      expect(isValid).toBe(true);
    });

    it("should process cast_vote action", () => {
      // Start voting first
      game.processAction({ type: "start_voting", playerId: "1" });

      const result = game.processAction({
        type: "cast_vote",
        playerId: "1",
        data: { targetId: "2" },
      });

      expect(result.success).toBe(true);
      expect(result.events).toContainEqual(expect.objectContaining({ type: "vote_cast" }));
    });
  });

  describe("player views", () => {
    beforeEach(() => {
      game.addPlayer({ profileId: "1", displayName: "Player1", role: "player" });
      game.addPlayer({ profileId: "2", displayName: "Player2", role: "player" });
      game.addPlayer({ profileId: "3", displayName: "Player3", role: "spectator" });
      game.start();
    });

    it("should provide different views for players and spectators", () => {
      const playerView = game.getPlayerView("1");
      const spectatorView = game.getPlayerView("3");

      expect(playerView).toBeDefined();
      expect(spectatorView).toBeDefined();

      // Spectators should see more information
      expect(spectatorView.imposterIds).toBeDefined();
      expect(spectatorView.imposterWord).toBeDefined();

      // Players should not see imposter information
      expect(playerView.imposterIds).toBeUndefined();
    });

    it("should return null for non-existent player", () => {
      const view = game.getPlayerView("non-existent");
      expect(view).toBeNull();
    });
  });
});
