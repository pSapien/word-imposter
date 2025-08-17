import type { WordImposterState } from "../../../../shared/src/index.ts";
import { Button } from "@app/components";

type Props = {
  stage: WordImposterState["stage"] | "";
  onStartGame: () => void;
  onStartVoting: () => void;
  isHost: boolean;
};

export function FooterSection(props: Props) {
  const { isHost, onStartGame, onStartVoting, stage } = props;

  return (
    <footer className="sticky bottom-0 z-20 bg-white/20 backdrop-blur-lg border-t border-white/30">
      <div className="max-w-4xl mx-auto p-4 flex flex-wrap gap-3 justify-center">
        {/* Discussion phase (only host can start voting) */}
        {isHost && stage === "discussion" && (
          <Button onClick={onStartVoting} variant="primary">
            Start Voting 🗳️
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
