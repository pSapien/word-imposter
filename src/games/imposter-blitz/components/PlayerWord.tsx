import { useState } from "react";
import { cn } from "@app/utils";

type Props = {
  word: string;
};

export function PlayerWord({ word }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <button className="w-full text-center cursor-pointer" onClick={handleToggleVisibility}>
      <p className={cn("text-2xl font-bold", !isVisible && "blur-sm")}>{isVisible ? word : "••••••••"}</p>
      <p className="text-xs text-gray-500 mt-2">{isVisible ? "Tap to hide" : "Tap to reveal"}</p>
    </button>
  );
}
