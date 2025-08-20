import { useState, useMemo } from "react";

type CardColor = "red" | "blue" | "grey" | "black";

type Props = {
  word: string;
  color: CardColor;
};

// Sprites (vertical strips)
const fronts = "https://cdn2.codenames.game/cno/2023-12-19/theme/classic/card/fronts.png";
const backs = "https://cdn2.codenames.game/cno/2023-12-19/theme/classic/card/backs.png";
const redAgents = "https://cdn2.codenames.game/cno/2023-12-19/theme/classic/card/red.png";
const blueAgents = "https://cdn2.codenames.game/cno/2023-12-19/theme/classic/card/blue.png";
const greyAgents = "https://cdn2.codenames.game/cno/2023-12-19/theme/classic/card/gray.png";
const assasin = "https://cdn2.codenames.game/cno/2023-12-19/img/card/black-back.png";

// how many frames per strip (you can adjust based on actual sprite height)
const FRAMES_PER_STRIP = 9;

export function CodenamesCard({ word, color }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Pick a random index per card (stable for its lifetime)
  const frontIndex = 3;
  const backIndex = 1;

  const agentStrip = getAgentStrip(color);

  const frameHeight = 100 / FRAMES_PER_STRIP; // percentage per frame

  return (
    <div
      className="relative aspect-square w-full cursor-pointer transform-gpu transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-io"
      onClick={() => setIsFlipped((f) => !f)}
      tabIndex={0}
      role="button"
      aria-label={`Card: ${word}, ${color} team`}
      aria-pressed={isFlipped}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute w-full h-[86px] [backface-visibility:hidden] overflow-hidden shadow-lg">
          <div
            className="w-full h-full bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${fronts})`,
              backgroundPositionY: `25%`,
              // backgroundSize: `100% ${FRAMES_PER_STRIP * 100}%`,
            }}
          />
          <div
            className="absolute bottom-3 w-full text-black text-center truncate font-bold uppercase"
            style={{ fontSize: "clamp(0.8rem, 2.5vw, 1.2rem)" }}
          >
            {word}
          </div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden shadow-lg">
          <div
            className="w-full h-full bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${agentStrip})`,
              backgroundPositionY: `20%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
