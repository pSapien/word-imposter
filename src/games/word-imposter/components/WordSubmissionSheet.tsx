import React, { useState, useEffect, useRef, useMemo } from "react";
import { Check, Send, Users } from "lucide-react";
import { Button, Input, ModalContainer } from "@app/components";
import toast from "react-hot-toast";
import { cn } from "@app/utils";

interface Player {
  id: string;
  name: string;
  hasSubmitted: boolean;
}

interface Props {
  players: Player[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (word: string) => void;
}

type Message = {
  id: string;
  playerId: string;
  playerName: string;
  type: "thinking" | "submitted";
};

export function WordSubmissionSheet({ players, isOpen, onClose, onSubmit }: Props) {
  const [word, setWord] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const submittedCount = players.filter((p) => p.hasSubmitted).length;
  const totalPlayers = players.length;
  const progress = (submittedCount / totalPlayers) * 100;

  const messages = useMemo(() => {
    const newMessages: Array<Message> = [];
    players.forEach((player) => {
      if (player.hasSubmitted) {
        newMessages.push({
          id: `submit-${player.id}`,
          playerId: player.id,
          playerName: player.name,
          type: "submitted",
        });
      } else {
        newMessages.push({
          id: `think-${player.id}`,
          playerId: player.id,
          playerName: player.name,
          type: "thinking",
        });
      }
    });
    return newMessages;
  }, [players]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = word.trim();
    if (trimmed.length === 0) return toast.error("Should be a word");
    if (trimmed.length >= 20) return toast.error("Should be less than 20 chars");

    const validWordRegex = /^[A-Za-z]+(?:[-'][A-Za-z]+)*$/;
    if (!validWordRegex.test(trimmed)) return toast.error("Only English letters are allowed");

    if (trimmed) {
      setIsAnimating(true);
      setTimeout(() => {
        onSubmit(trimmed);
        setWord("");
        setIsAnimating(false);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAnimating && word.trim()) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer title="Word Submissions" onClose={onClose}>
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4" />
          <span>Submission Progress</span>
        </div>
        <span className="font-semibold text-green-600">
          {submittedCount}/{totalPlayers}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-800">{message.playerName}</span>
              </div>

              <div
                className={cn(
                  "inline-block row px-3 py-2 rounded-2xl max-w-xs",
                  message.type === "submitted"
                    ? "bg-green-500 text-white"
                    : "bg-white border border-gray-200 text-gray-700"
                )}
              >
                <div className="flex items-center gap-2">
                  {message.type === "thinking" && (
                    <div className="flex gap-1">
                      <div
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  )}
                  {message.type === "submitted" && <Check className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray py-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              name="word"
              placeholder="Type your word here..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAnimating}
              className="pr-12"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!word.trim() || isAnimating}
            isLoading={isAnimating}
            size="md"
            className="h-full"
          >
            <Send className="h-full" color="white" />
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
}
