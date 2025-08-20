import { GameEngine, GameAction } from "../../core/GameEngine.js";
import { CodenameGameConfig, CodenamesState, RoomMember } from "@imposter/shared";
import { randomArr, shuffle } from "src/utils";
import { WORD_LIST } from "./words.js";

interface GamePlayer {
  id: string;
  displayName: string;
  role: "spymaster" | "operative" | string;
}

const DefaultConfig: CodenameGameConfig = {
  assasinWordsCount: 1,
  totalWords: 25,
};

const RED_COUNT = 9;
const BLUE_COUNT = 8;

export class CodenamesGameEngine implements GameEngine<CodenamesState> {
  readonly gameId: string;
  readonly players: GamePlayer[] = [];
  readonly config: CodenameGameConfig;
  private state: CodenamesState;

  constructor(config: CodenameGameConfig) {
    this.config = Object.assign({}, DefaultConfig, config);
    this.gameId = `imposter-${Date.now()}`;

    this.state = {
      keyCards: [],
      revealedWords: [],
      summary: undefined,
    };
  }

  addPlayer = () => true;
  removePlayer = () => true;

  startGame(): boolean {
    const words = randomArr(WORD_LIST, this.config.totalWords);
    const keyCards: CodenamesState["keyCards"] = [];

    // Calculate word counts based on totalWords and assasinWordsCount
    const redWordsCount = RED_COUNT;
    const blueWordsCount = BLUE_COUNT;
    const neutralWordsCount = this.config.totalWords - (redWordsCount + blueWordsCount + this.config.assasinWordsCount);
    const assassinWordsCount = this.config.assasinWordsCount;

    // Assign words to teams
    const redWords = words.slice(0, redWordsCount);
    const blueWords = words.slice(redWordsCount, redWordsCount + blueWordsCount);
    const neutralWords = words.slice(
      redWordsCount + blueWordsCount,
      redWordsCount + blueWordsCount + neutralWordsCount
    );
    const assassinWords = words.slice(
      redWordsCount + blueWordsCount + neutralWordsCount,
      redWordsCount + blueWordsCount + neutralWordsCount + assassinWordsCount
    );

    // Populate keyCards with assignments
    redWords.forEach((word) => keyCards.push({ assignment: "red", word }));
    blueWords.forEach((word) => keyCards.push({ assignment: "blue", word }));
    neutralWords.forEach((word) => keyCards.push({ assignment: "neutral", word }));
    assassinWords.forEach((word) => keyCards.push({ assignment: "assasin", word }));

    // Shuffle keyCards to randomize positions
    shuffle(keyCards);

    this.state.keyCards = keyCards;
    this.state.revealedWords = [];

    return true;
  }

  validateGameAction(playerId: string, action: GameAction<any>) {
    return true;
  }

  processAction(playerId: string, action: GameAction<any>): void {
    const handlers: Record<string, (id: string, action: GameAction<any>) => void> = {
      cast_vote: this.handleCastVote.bind(this),
    };

    const handler = handlers[action.type];
    if (handler) handler(playerId, action);
    else console.warn("Unknow Action", action.type);
  }

  /** Return a personalized game state for a given member */
  getPlayerViewState(member: RoomMember): CodenamesState {
    /** spymaster sees everything */
    if (member.role === "spymaster") return this.state;

    return {
      ...this.state,
      keyCards: this.state.keyCards.map((keyCard) => {
        return {
          ...keyCard,
          assignment: this.state.revealedWords.includes(keyCard.word) ? keyCard.assignment : "hidden",
        };
      }),
    };
  }

  private handleCastVote(_: string, action: GameAction<any>) {
    this.state.revealedWords.push(action.payload.revealed);
    const winner = this.findWinner();
    if (winner) {
      this.state.summary = {
        winner,
      };
    }
  }

  /** Check if the game should end and determine winner */
  private findWinner() {
    const redCount = this.state.keyCards.filter(
      (card) => card.assignment === "red" && this.state.revealedWords.includes(card.word)
    ).length;
    const blueCount = this.state.keyCards.filter(
      (card) => card.assignment === "blue" && this.state.revealedWords.includes(card.word)
    ).length;
    const assassinCount = this.state.keyCards.filter(
      (card) => card.assignment === "assasin" && this.state.revealedWords.includes(card.word)
    ).length;

    if (assassinCount === this.config.assasinWordsCount) return "assasin";
    if (redCount === RED_COUNT) return "red";
    if (blueCount === BLUE_COUNT) return "blue";

    return null;
  }
}
