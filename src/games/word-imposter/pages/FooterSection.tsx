import type { WordImposterState } from "../../../../shared";
import { Button } from "@app/components";

type Props = {
  stage: WordImposterState["stage"] | "";
  isHost: boolean;
  noWinner: boolean;
  onStartGame: () => void;
  onStartVoting: () => void;
  onEndVoting: () => void;
  onNextRound: () => void;
};

export function FooterSection(props: Props) {
  const { isHost, onStartGame, onStartVoting, onEndVoting, noWinner, stage, onNextRound } = props;

  return (
    <footer className="sticky bottom-0 z-20 bg-white/20 backdrop-blur-lg border-t border-white/30">
      <div className="max-w-4xl mx-auto p-4 flex flex-wrap gap-3 justify-center">
        {isHost && stage === "discussion" && (
          <Button onClick={onStartVoting} variant="primary">
            Start Voting 🗳️
          </Button>
        )}

        {isHost && stage === "voting" && (
          <Button onClick={onEndVoting} variant="primary">
            End Voting 🛑
          </Button>
        )}

        {isHost && stage === "results" && noWinner && (
          <Button onClick={onNextRound} variant="primary">
            Next Round 🔄
          </Button>
        )}

        {stage === "" && !isHost && (
          <span className="text-gray-700 text-sm font-medium bg-white/60 px-3 py-2 rounded-lg shadow-sm">
            Waiting for host to start the game…
          </span>
        )}

        {isHost && (
          <Button onClick={onStartGame} variant="danger">
            New Game 🎮
          </Button>
        )}
      </div>
    </footer>
  );
}
