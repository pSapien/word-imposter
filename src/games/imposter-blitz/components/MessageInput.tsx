import React, { useState } from "react";
import { cn } from "@app/utils";
import { Button } from "@app/components";
import toast from "react-hot-toast";

type Props = {
  onSendMessage: (message: string) => void;
  placeholder: string;
  disabled?: boolean;
  isHighlighted?: boolean;
};

export function MessageInput({ onSendMessage, placeholder, disabled, isHighlighted }: Props) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const word = message.trim();

    if (word.length === 0) return toast.error("Should be a word");
    if (word.length >= 30) return toast.error("Should be less than 20 chars");

    const validWordRegex = /^[A-Za-z]+(?:[-'][A-Za-z]+)*(?: [A-Za-z]+(?:[-'][A-Za-z]+)*)*$/;
    if (!validWordRegex.test(word)) {
      return toast.error("Only English letters, spaces, hyphens, and apostrophes are allowed");
    }

    onSendMessage(word);
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
            isHighlighted && "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50"
          )}
        />
        <Button type="submit" disabled={disabled || !message.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
}
