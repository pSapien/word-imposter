import { describe, it, expect, beforeEach, mock } from "bun:test";
import { WordImposterGameEngine } from "../WordImposterGame";
import type { GameEnginePlayer } from "@server/core";

mock.module("../wordpairs.js", () => {
  return {
    getRandomWordPair: () => {
      return Object.freeze({
        civilianWord: "apple",
        imposterWord: "orange",
      });
    },
  };
});

mock.module("../logic/randomImposters.js", () => {
  return {
    randomImposters: () => {
      return ["p1"];
    },
  };
});

describe("WordImposterGameEngine", () => {
  let engine: WordImposterGameEngine;
  let players: GameEnginePlayer[];

  beforeEach(() => {
    players = [
      { id: "host", displayName: "Host", role: "host" },
      { id: "p1", displayName: "Player1", role: "player" },
      { id: "p2", displayName: "Player2", role: "player" },
      { id: "spec", displayName: "Spec", role: "spectator" },
    ];
    engine = new WordImposterGameEngine({ wordCategories: ["food"], imposterCount: 1, maxPlayers: 20, minPlayers: 2 });
  });

  it("should start the game with words and imposters", () => {
    const started = engine.startGame(players);
    expect(started).toBe(true);

    const state = engine.getPlayerViewState("host");
    expect(state.stage).toBe("discussion");
    expect(state.civilianWord).toBe("apple");
    expect(state.imposterWord).toBe("");
    expect(state.imposterIds.length).toBe(1);
    expect(state.players).toHaveLength(4);
  });

  it("(civilians:win): should process voting flow and eliminate player", () => {
    engine.startGame(players);

    // @ts-ignore: since the imposter are choosen at random on create game, we assign imposters for testing
    engine.state.imposterIds = ["p2"];
    engine.processAction("host", { type: "start_voting", payload: {} });
    expect((engine as any).state.stage).toBe("voting");
    engine.processAction("host", { type: "cast_vote", payload: { voteeId: "p2" } });
    engine.processAction("p2", { type: "cast_vote", payload: { voteeId: "p2" } });
    engine.processAction("host", { type: "end_voting", payload: {} });

    const state = engine.getPlayerViewState("host");
    expect(state.stage).toBe("results");
    expect(state.summary).toBeDefined();
    expect(state.summary?.type).toBe("civilians-win");
    expect(state.summary?.winner).toBe("civilians");
  });

  it("(imposter:win) should process voting flow and eliminate player", () => {
    engine.startGame(players);

    // @ts-ignore: since the imposter are choosen at random on create game, we assign imposters for testing
    engine.state.imposterIds = ["p1"];
    engine.processAction("host", { type: "start_voting", payload: {} });
    expect((engine as any).state.stage).toBe("voting");
    engine.processAction("host", { type: "cast_vote", payload: { voteeId: "p2" } });
    engine.processAction("p2", { type: "cast_vote", payload: { voteeId: "p2" } });
    engine.processAction("host", { type: "end_voting", payload: {} });

    const state = engine.getPlayerViewState("host");
    expect(state.stage).toBe("results");
    expect(state.summary).toBeDefined();
    expect(state.summary?.type).toBe("imposters-win");
    expect(state.summary?.winner).toBe("imposters");
  });

  it("should start next round and reset votes/submissions", () => {
    engine.startGame(players);
    engine.processAction("host", { type: "start_next_round", payload: {} });

    const state = (engine as any).state;
    expect(state.stage).toBe("discussion");
    expect(state.votes).toEqual({});
    expect(state.round).toBe(2);
  });
});
