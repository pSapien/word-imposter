import type { ImposterBlitzGameState, ImposterBlitzPlayer } from "../../../../shared";
import { SkipForward, ThumbsDown } from "lucide-react";

interface Message {
  author: string;
  content: string;
  isSelf: boolean;
  type: "join" | "vote" | "chat" | "turn";
}

type Props = {
  messages: Message[];
  stage: ImposterBlitzGameState["stage"];
  players: ImposterBlitzPlayer[];
  currentUserId: string;
  votedForPlayerId: string | null;
  onVote: (playerId: string) => void;
  onSkipVote: () => void;
};

export function ChatDisplay({ messages, stage, players, currentUserId, onVote, onSkipVote, votedForPlayerId }: Props) {
  const me = players.find((p) => p.id === currentUserId);

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-800 rounded-lg">
      <div className="space-y-4">
        {messages.map((msg, index) => {
          if (["join", "vote", "turn"].includes(msg.type.toLowerCase())) {
            return (
              <div className="flex justify-center">
                <div className="text-gray-400 text-sm italic bg-gray-700/50 px-3 py-1 rounded-full">{msg.content}</div>
              </div>
            );
          }

          const player = players.find((p) => p.displayName === msg.author);
          const canVoteFor =
            stage === "voting" && player && player.status === "alive" && player.id !== currentUserId && me;
          console.log("what just happened", stage, canVoteFor);

          const canSkip = stage === "voting" && msg.isSelf && me;

          const handleClick = () => {
            if (canVoteFor) onVote(player!.id);
            else if (canSkip) onSkipVote();
          };

          return (
            <div key={index} className={`flex items-center gap-2 ${msg.isSelf ? "justify-end" : "justify-start"}`}>
              <button
                onClick={handleClick}
                className={`cursor-pointer rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${
                  msg.isSelf ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
                }`}
              >
                <p className="font-bold">{msg.author}</p>
                <p className={msg.isSelf ? "text-right" : "text-left"}>{msg.content}</p>
              </button>

              {canVoteFor && (
                <button className="h-8 w-8" onClick={() => onVote(player.id)}>
                  <ThumbsDown className="h-5 w-5" color={player?.id === votedForPlayerId ? "red" : "green"} />
                </button>
              )}

              {canSkip && (
                <button className="h-8 w-8" onClick={onSkipVote}>
                  <SkipForward className="h-5 w-5" color={votedForPlayerId === "" ? "red" : "yellow"} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
