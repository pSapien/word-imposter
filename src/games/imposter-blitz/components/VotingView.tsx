import type { ImposterBlitzPlayer } from "../../../../shared";
import { Button } from "@app/components";

type Props = {
  players: ImposterBlitzPlayer[];
  onVote: (playerId: string) => void;
  disabled: boolean;
};

export function VotingView({ disabled, onVote, players }: Props) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-center mb-4">Vote to eliminate a player</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {players.map((player) => (
          <Button
            key={player.id}
            onClick={() => onVote(player.id)}
            disabled={disabled || player.status === "eliminated"}
            className="flex flex-col h-24 justify-center items-center"
          >
            <span className="text-lg font-bold">{player.displayName}</span>
            {player.status === "eliminated" && <span className="text-sm">(Eliminated)</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}
