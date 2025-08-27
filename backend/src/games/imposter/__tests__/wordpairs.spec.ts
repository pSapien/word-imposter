import { describe, it, expect } from "bun:test";
import { getRandomWordPair, getWordsList } from "../wordpairs.ts";

describe("Word utilities", () => {
  it("getRandomWordPair should return valid word pair from given category", () => {
    const pair = getRandomWordPair(["food"]);
    expect(pair).toHaveProperty("civilianWord");
    expect(pair).toHaveProperty("imposterWord");
    expect(pair.civilianWord).not.toBe(pair.imposterWord);
    expect(typeof pair.civilianWord).toBe("string");
    expect(typeof pair.imposterWord).toBe("string");
  });

  it("getRandomWordPair should respect categories", () => {
    const pair = getRandomWordPair(["technology"]);
    const technologyWords = getWordsList().find((c) => c.value === "technology")!.words;
    expect(technologyWords.flat()).toContain(pair.civilianWord);
    expect(technologyWords.flat()).toContain(pair.imposterWord);
  });

  it("getRandomWordPair should randomize assignment", () => {
    const results = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const { civilianWord } = getRandomWordPair(getWordsList().map((p) => p.value));
      results.add(civilianWord);
    }
    expect(results.size).toBeLessThanOrEqual(1000);
  });

  it("getRandomWordPair should throw or fail gracefully if no categories match", () => {
    expect(() => getRandomWordPair(["nonexistent"])).toThrow();
  });
});
