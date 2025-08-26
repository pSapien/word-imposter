import { Button, Card, CardContent, CardHeader } from "@app/components";
import { cn } from "@app/utils";
import type { WordImposterState } from "../../../../shared";

type PlayerListPlayer = {
  id: string;
  displayName: string;
  isCurrentUser: boolean;
  isHost: boolean;
  isEliminated: boolean;
  imposterWord: string;
  hasVoted: boolean;
  hasSubmitted: boolean;
  submittedWord: string;
};

interface Props {
  stage: WordImposterState["stage"] | "";
  players: PlayerListPlayer[];
  currentUserId: string;
  currentUserIsHost: boolean;
  onKickPlayer: (playerId: string) => void;
  onVotePlayer: (playerId: string) => void;
}

interface SpectatorListProps {
  spectators: Array<{ id: string; displayName: string }>;
  currentUserId: string;
}

export function PlayerList(props: Props) {
  const { players, stage, currentUserIsHost, onVotePlayer, onKickPlayer } = props;

  return (
    <Card variant="glass" className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
      <CardHeader className="pb-4 px-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          👥 Players
          <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full font-medium">
            {players.length}
          </span>
        </h3>
      </CardHeader>
      <CardContent className="pt-0 px-6">
        {players.map((player) => {
          const isCurrentUser = player.isCurrentUser;
          const isEliminated = player.isEliminated;
          const isHost = player.isHost;

          return (
            <div
              key={player.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-xl transition-all duration-200",
                "hover:bg-white/20",
                isEliminated && "opacity-60 bg-gray-500/10",
                isCurrentUser && "bg-blue-500/10 border border-blue-300/50"
              )}
            >
              <div className="flex items-center space-x-4 min-w-0">
                {/* <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg",
                    isEliminated ? "bg-gray-600" : "bg-gradient-to-r from-blue-600 to-purple-700"
                  )}
                >
                  {player.displayName.charAt(0).toUpperCase()}
                </div> */}

                {/* placeholder for the avatar frame */}
                <div className="h-12" />

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={cn(
                        "font-medium text-white truncate max-w-[150px] md:max-w-[200px]",
                        isEliminated && "text-gray-400 line-through"
                      )}
                      title={player.displayName} // Tooltip for long names
                    >
                      {player.displayName}
                    </span>

                    {isHost && (
                      <span className="px-2 py-0.5 bg-yellow-500/90 text-white text-xs font-semibold rounded-full">
                        Host
                      </span>
                    )}
                  </div>

                  {stage === "discussion" && player.hasSubmitted && (
                    <div className="text-xs text-green-400 font-medium flex items-center mt-1">✅ Submitted</div>
                  )}
                  {stage === "voting" && player.submittedWord && (
                    <div className="text-sm text-gray-300 italic mt-1">“{player.submittedWord}”</div>
                  )}
                  {player.hasVoted && (
                    <div className="text-xs text-green-400 font-medium flex items-center mt-1">✅ Voted</div>
                  )}
                  {player.imposterWord && (
                    <span className="px-2 py-0.5 bg-red-500/90 text-white text-xs font-semibold rounded-full mt-1 inline-block">
                      😈 {player.imposterWord}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {stage === "voting" && !isEliminated && !isCurrentUser && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onVotePlayer(player.id)}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-full"
                  >
                    Vote
                  </Button>
                )}

                {stage === "voting" && !isEliminated && isCurrentUser && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onVotePlayer("")}
                    className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-full"
                  >
                    Skip
                  </Button>
                )}

                {currentUserIsHost && !isCurrentUser && stage !== "voting" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onKickPlayer?.(player.id)}
                    className="text-red-400 hover:text-red-500 hover:bg-white/10 rounded-full p-2"
                  >
                    ⛔
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function SpectatorList({ spectators }: SpectatorListProps) {
  if (!spectators.length) return null;
  return (
    <Card variant="glass" className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
      <CardHeader className="pb-4 px-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          👁️ Spectators
          <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-sm rounded-full font-medium">
            {spectators.length}
          </span>
        </h3>
      </CardHeader>
      <CardContent className="pt-0 px-6 space-y-3">
        {spectators.map((spectator) => (
          <div
            key={spectator.id}
            className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/20 transition-all duration-200 min-w-0"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-600 text-white font-bold text-lg">
              {spectator.displayName.charAt(0).toUpperCase()}
            </div>
            <span
              className="text-white font-medium truncate max-w-[150px] md:max-w-[200px]"
              title={spectator.displayName}
            >
              {spectator.displayName}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
