import type { IWordPairManager, WordPair } from "./types.js";

export class WordPairManager implements IWordPairManager {
  private wordPairs: WordPair[];

  constructor(wordPairs: WordPair[]) {
    this.wordPairs = wordPairs;
  }

  getRandomWordPair() {
    const randomIndex = Math.floor(Math.random() * this.wordPairs.length);
    const randomAssignment = Math.floor(Math.random() * 2);
    const wordPair = this.wordPairs[randomIndex];
    const civilianWord = wordPair[randomAssignment];
    const imposterWord = wordPair[1 - randomAssignment];

    return {
      civilianWord,
      imposterWord,
    };
  }
}
