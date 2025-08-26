import type { WordImposterState } from "../../../../shared";
import { Button } from "@app/components";

type Props = {
  stage: WordImposterState["stage"] | "";
  isHost: boolean;
  noWinner: boolean;
  onStartGame: () => void;
  onSubmit: VoidFunction;
  onStartVoting: () => void;
  onEndVoting: () => void;
  onNextRound: () => void;
};

export function FooterSection(props: Props) {
  const { onStartGame, onStartVoting, onEndVoting, noWinner, stage, onNextRound, isHost, onSubmit } = props;

  return (
    <footer className="fixed bottom-0 w-full z-20 backdrop-blur-2xl border-t border-white/30">
      <div className="max-w-4xl mx-auto p-4 flex flex-wrap gap-3 justify-center">
        {stage === "discussion" && <Button onClick={onSubmit}>Open to submit</Button>}
        {stage === "discussion" && isHost && (
          <Button onClick={onStartVoting} variant="primary">
            Start Vote 🗳️
          </Button>
        )}

        {stage === "voting" && isHost && (
          <Button onClick={onEndVoting} variant="primary">
            End Vote 🛑
          </Button>
        )}

        {stage === "results" && noWinner && isHost && (
          <Button onClick={onNextRound} variant="primary">
            Next Round 🔄
          </Button>
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
