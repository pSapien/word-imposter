import { Button } from "@app/components";
import type { ImposterBlitzGameState, ImposterBlitzPlayer } from "../../../../shared";
import { SkipForward, ThumbsDown, ThumbsUp } from "lucide-react";

interface Message {
  author: string;
  content: string;
  isSelf: boolean;
}

type Props = {
  messages: Message[];
  stage: ImposterBlitzGameState["stage"];
  players: ImposterBlitzPlayer[];
  currentUserId: string;
  onVote: (playerId: string) => void;
  onSkipVote: () => void;
};

export function ChatDisplay({ messages, stage, players, currentUserId, onVote, onSkipVote }: Props) {
  const me = players.find((p) => p.id === currentUserId);

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-800 rounded-lg">
      <div className="space-y-2">
        {messages
          .filter((msg) => msg.author.toLowerCase() === "system")
          .map((msg, index) => {
            return (
              <div key={index} className="flex justify-center">
                <div className="text-gray-400 text-sm italic bg-gray-700/50 px-3 py-1 rounded-full">{msg.content}</div>
              </div>
            );
          })}
      </div>
      <div className="space-y-4">
        {messages.map((msg, index) => {
          if (msg.author.toLowerCase() === "system") return null;

          const player = players.find((p) => p.displayName === msg.author);
          const canVoteFor =
            stage === "voting" && player && player.status !== "eliminated" && player.id !== currentUserId && me;

          const canSkip = stage === "voting" && msg.isSelf && me;

          return (
            <div key={index} className={`flex items-center gap-2 ${msg.isSelf ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${
                  msg.isSelf ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
                }`}
              >
                <p className="font-bold">{msg.author}</p>
                <p>{msg.content}</p>
              </div>

              {canVoteFor && (
                <button className="h-8 w-8 text-green-400 hover:text-green-500" onClick={() => onVote(player.id)}>
                  <ThumbsDown className="h-5 w-5" />
                </button>
              )}

              {canSkip && (
                <button className="h-8 w-8 text-yellow-400 hover:text-yellow-500" onClick={onSkipVote}>
                  <SkipForward className="h-5 w-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
