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

  const playerMessages: Record<string, string> = {
    "": "⏳ Waiting for the host to kick things off…",
    discussion: "💬 Chat with your teammates! Discussion Phase",
    voting: "🗳️ Cast your votes wisely!",
    results: "🏆 See who survived… Results Time!",
  };

  return (
    <footer className="fixed bottom-0 w-full z-20 backdrop-blur-2xl border-t border-white/30">
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

        {!isHost && playerMessages[stage] && (
          <span className="text-gray-50 text-sm font-medium bg-white/20 px-3 py-2 rounded-lg shadow-sm">
            {playerMessages[stage]}
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
