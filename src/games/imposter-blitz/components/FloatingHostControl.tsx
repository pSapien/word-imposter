import { useState } from "react";
import { Play, Square, ChevronRight, AppWindowMacIcon } from "lucide-react";
import { Button } from "@app/components";

interface Props {
  onStartGame: () => void;
  onEndVoting: () => void;
  onNextRound: () => void;
}

export function FloatingHostControls({ onStartGame, onEndVoting, onNextRound }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-8 right-18 z-50 flex flex-col items-end">
      <button
        className={`rounded-full items-center transition-all duration-300 ${
          open ? " text-white rotate-180" : " hover:scale-110"
        }`}
        onClick={() => setOpen(!open)}
      >
        <AppWindowMacIcon size={24} className="transition-transform duration-300" color="white" />
      </button>

      <div
        className={`flex flex-col gap-2 mt-2 transition-all duration-300 ease-in-out ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <Button
          key="start"
          size="sm"
          onClick={() => {
            setOpen(false);
            if (window.confirm("Did you wanna start the game?")) onStartGame();
          }}
          className="w-32 justify-start gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
        >
          <Play size={16} />
          Start Game
        </Button>

        <Button
          key="endVoting"
          size="sm"
          onClick={() => {
            setOpen(false);
            if (window.confirm("Do you want to end voting?")) onEndVoting();
          }}
          className="w-32 justify-start gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
        >
          <Square size={16} />
          End Vote
        </Button>

        <Button
          key="nextRound"
          size="sm"
          onClick={() => {
            setOpen(false);
            if (window.confirm("Do you want to start next round?")) onNextRound();
          }}
          className="w-32 justify-start gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        >
          <ChevronRight size={16} />
          Next Round
        </Button>
      </div>
    </div>
  );
}
