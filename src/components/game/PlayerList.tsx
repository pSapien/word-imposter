import { Button, Card, CardContent, CardHeader } from "@app/components";
import { cn } from "@app/utils";
import type { WordImposterState } from "../../../shared";

interface Player {
  id: string;
  displayName: string;
  isEliminated: boolean;
  isHost: boolean;
  isCurrentUser: boolean;
  hasVoted: boolean;
  imposterWord: string;
}

interface PlayerListProps {
  players: Player[];
  spectators: Player[];
  currentUserId: string;
  isHost: boolean;
  stage: WordImposterState["stage"] | "";
  onKickPlayer: (playerId: string) => void;
  onVotePlayer: (playerId: string) => void;
  className?: string;
  role: string;
}

export function PlayerList({
  players,
  spectators = [],
  isHost,
  stage,
  role,
  onKickPlayer,
  onVotePlayer,
  className,
}: PlayerListProps) {
  const renderPlayer = (player: Player, isSpectator = false) => (
    <div
      key={player.id}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg transition-all duration-200",
        "hover:bg-white/30",
        player.isEliminated && "opacity-50",
        player.isCurrentUser && "bg-blue-50/50 border border-blue-200"
      )}
    >
      <div className="flex items-center space-x-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
            player.isEliminated ? "bg-gray-400" : "bg-gradient-to-r from-blue-500 to-purple-600"
          )}
        >
          {player.displayName.charAt(0).toUpperCase()}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className={cn("font-medium", player.isEliminated ? "text-gray-500 line-through" : "text-gray-800")}>
              {player.displayName} {player.isEliminated && "💀"}
            </span>

            {player.isHost && (
              <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">👑 HOST</span>
            )}

            {player.isCurrentUser && (
              <span className="px-2 py-1 bg-blue-500/90 text-white text-xs font-bold rounded-full">🫵 YOU</span>
            )}

            {isSpectator && (
              <span className="px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded-full">👁️ SPECTATOR</span>
            )}
          </div>

          {player.hasVoted && <div className="text-xs text-green-600 font-medium"> ✅ Voted</div>}

          {player.imposterWord && (
            <span className="px-2 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">
              😈 {player.imposterWord}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {stage === "voting" &&
          !player.isEliminated &&
          !isSpectator &&
          !player.isCurrentUser &&
          role !== "spectator" && (
            <Button size="sm" variant="danger" onClick={() => onVotePlayer(player.id)}>
              Vote Out
            </Button>
          )}

        {isHost && !player.isCurrentUser && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onKickPlayer?.(player.id)}
            className="text-red-500 hover:text-red-700"
          >
            ⛔
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <Card variant="glass">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            👥 Players
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{players.length}</span>
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {players.map((player) => renderPlayer(player))}
            {players.length === 0 && (
              <div className="text-center py-8 text-gray-500">No players yet. Invite friends to join!</div>
            )}
          </div>
        </CardContent>
      </Card>

      {spectators.length > 0 && (
        <Card variant="glass">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              👁️ Spectators
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">{spectators.length}</span>
            </h3>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">{spectators.map((spectator) => renderPlayer(spectator, true))}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
