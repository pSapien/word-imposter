import type {
  ImposterBlitzGameState,
  ImposterBlitzPlayer,
  ImposterBlitzSubmissionEvent,
  ImposterBlitzVoteEvent,
  ImposterBlizRoundEndEvent,
  Room,
} from "../../../../shared";
import { SkipForward, ThumbsDown } from "lucide-react";

interface Message {
  author: string;
  content: string;
  isSelf: boolean;
  type: "join" | "vote" | "chat" | "turn" | "round-end";
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

          if (msg.type.toLowerCase() === "round-end") {
            return (
              <div key={index} className="flex justify-center">
                <div className="bg-yellow-500/20 text-yellow-200 text-center px-4 py-2 rounded-xl border border-yellow-400 font-semibold">
                  ⚡ {msg.content} ⚡
                </div>
              </div>
            );
          }

          const player = players.find((p) => p.displayName === msg.author);
          const canVoteFor =
            stage === "voting" && player && player.status === "alive" && player.id !== currentUserId && me;

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

export function transformStateToMessage(
  gameState: ImposterBlitzGameState | null,
  room: Room | null,
  currentUserId: string
) {
  if (!room) return [];

  const joinEvents = room.members.map((mem) => {
    return {
      author: "System",
      content: `${mem.displayName} has entered the room!`,
      isSelf: currentUserId === mem.id,
      type: "join" as const,
    };
  });

  if (!gameState) return joinEvents;

  const gameEvents = gameState?.events
    .map((ev) => {
      if (ev.type === "submission") {
        const subEvent = ev as ImposterBlitzSubmissionEvent;
        const player = gameState.players.find((p) => p.id === subEvent.playerId);
        return {
          author: player?.displayName || "",
          content: subEvent.content,
          isSelf: subEvent.playerId === currentUserId,
          type: "chat" as const,
        };
      } else if (ev.type === "vote") {
        const voteEvent = ev as ImposterBlitzVoteEvent;
        const voter = gameState.players.find((p) => p.id === voteEvent.voterId);
        const votee = gameState.players.find((p) => p.id === voteEvent.voteeId);

        const content =
          voteEvent.voteeId === ""
            ? `${voter?.displayName} skipped`
            : `${voter?.displayName} voted for ${votee?.displayName}!`;

        return {
          author: "System",
          content,
          isSelf: false,
          type: "vote" as const,
        };
      }

      const roundEndEvent = ev as ImposterBlizRoundEndEvent;
      if (roundEndEvent.type === "civilian-found") {
        const imposter = gameState.players.find((p) => p.id === roundEndEvent.eliminatedPlayerId);
        return {
          author: "System",
          content: `${imposter?.displayName} was eliminated`,
          isSelf: false,
          type: "round-end" as const,
        };
      } else if (roundEndEvent.type === "votes-tied") {
        return {
          author: "System",
          content: `⚖️ Votes tied!`,
          isSelf: false,
          type: "round-end" as const,
        };
      }

      return null;
    })
    .filter((p) => p !== null);

  const playerTurns = gameState.turnOrder
    .map((turnOrder) => gameState.players.find((p) => p.id === turnOrder))
    .filter((p) => p !== undefined);

  if (!playerTurns.length) return [...joinEvents, ...gameEvents];

  const turnEvents = {
    author: "System",
    content: `🎲 ${playerTurns.map((p) => p.displayName).join(" → ")}`,
    isSelf: false,
    type: "turn" as const,
  };

  return [...joinEvents, ...gameEvents, turnEvents];
}
