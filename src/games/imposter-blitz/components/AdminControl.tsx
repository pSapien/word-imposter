import { UserX, Play, SkipForward, CheckCircle, AppWindowMacIcon } from "lucide-react";
import { ModalContainer, useModal } from "@app/components";

type Player = {
  id: string;
  displayName: string;
};

type Props = {
  players: Player[];
  currentUserId: string;
  onKickPlayer: (playerId: string) => void;
  onStartGame: () => void;
  onNextRound: () => void;
  onEndVoting: () => void;
};

export function AdminControlIcon(props: Props) {
  const modal = useModal(AdminControl);

  const handleOpen = () => {
    modal.show({
      ...props,
    });
  };

  return (
    <button className={`rounded-full items-center transition-all duration-300`} onClick={handleOpen}>
      <AppWindowMacIcon size={24} className="transition-transform duration-300" color="white" />
    </button>
  );
}

function AdminControl({
  players,
  currentUserId,
  onKickPlayer,
  onStartGame,
  onNextRound,
  onEndVoting,
  hide,
}: Props & { hide: () => void }) {
  return (
    <ModalContainer onClose={hide} title="Admin Control">
      <div className="flex flex-col items-center gap-4">
        <h4 className="font-semibold text-gray-300">Game Actions</h4>
        <div className="flex flex-col items-center gap-4">
          <button
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
            onClick={() => {
              if (window.confirm("Did you wanna start the game?")) {
                onStartGame();
                hide();
              }
            }}
          >
            <Play size={20} />
            <span>Start Game</span>
          </button>
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
            onClick={() => {
              if (window.confirm("Did you wanna start next round?")) {
                onNextRound();
                hide();
              }
            }}
          >
            <SkipForward size={20} />
            <span>Next Round</span>
          </button>
          <button
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
            onClick={() => {
              if (window.confirm("Did you wanna end voting?")) {
                onEndVoting();
                hide();
              }
            }}
          >
            <CheckCircle size={20} />
            <span>End Voting</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-gray-300">Players</h4>
        <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
          {players
            .filter((p) => p.id !== currentUserId)
            .map((player) => (
              <div key={player.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                <p className="text-white truncate">{player.displayName}</p>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to kick ${player.displayName}?`)) onKickPlayer(player.id);
                  }}
                  className="text-red-500 hover:text-red-400 transition-colors"
                  title="Kick Player"
                >
                  <UserX size={20} />
                </button>
              </div>
            ))}
        </div>
      </div>
    </ModalContainer>
  );
}
