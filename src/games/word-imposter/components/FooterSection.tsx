import type { WordImposterState } from "../../../../shared";
import { Button } from "@app/components";

type Props = {
  stage: WordImposterState["stage"] | "";
  noWinner: boolean;
  onStartGame: () => void;
  onStartVoting: () => void;
  onEndVoting: () => void;
  onNextRound: () => void;
};

export function FooterSection(props: Props) {
  const { onStartGame, onStartVoting, onEndVoting, noWinner, stage, onNextRound } = props;

  return (
    <footer className="fixed bottom-0 w-full z-20 backdrop-blur-2xl border-t border-white/30">
      <div className="max-w-4xl mx-auto p-4 flex flex-wrap gap-3 justify-center">
        {stage === "discussion" && (
          <Button onClick={onStartVoting} variant="primary">
            Start Voting 🗳️
          </Button>
        )}

        {stage === "voting" && (
          <Button onClick={onEndVoting} variant="primary">
            End Voting 🛑
          </Button>
        )}

        {stage === "results" && noWinner && (
          <Button onClick={onNextRound} variant="primary">
            Next Round 🔄
          </Button>
        )}

        <Button onClick={onStartGame} variant="danger">
          New Game 🎮
        </Button>
      </div>
    </footer>
  );
}
