import { useState } from "react";
import { Settings, Play, Square, ChevronRight, X } from "lucide-react";
import type { ImposterBlitzGameState } from "../../../../shared/src/index.ts";

interface ButtonProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "ghost";
  [key: string]: any;
}

interface FloatingHostControlsProps {
  onStartGame: () => void;
  onEndVoting: () => void;
  onNextRound: () => void;
  gameState: ImposterBlitzGameState;
}

// Mock Button component for demonstration
const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  className = "",
  onClick,
  variant = "default",
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export const FloatingHostControls: React.FC<FloatingHostControlsProps> = ({
  onStartGame,
  onEndVoting,
  onNextRound,
  gameState,
}) => {
  const [open, setOpen] = useState(false);

  const getControlButtons = () => {
    const buttons = [];

    buttons.push(
      <Button
        key="start"
        size="sm"
        onClick={() => {
          setOpen(false);
          onStartGame();
        }}
        className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
      >
        <Play size={16} />
        Start Game
      </Button>
    );

    // Show end voting button during voting stage
    if (gameState?.stage === "voting") {
      buttons.push(
        <Button
          key="endVoting"
          size="sm"
          onClick={() => {
            setOpen(false);
            onEndVoting();
          }}
          className="w-full justify-start gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
        >
          <Square size={16} />
          End Vote
        </Button>
      );
    }

    // Show next round button during results stage when there's no winner
    if (gameState?.stage === "results" && gameState.summary?.winner === null) {
      buttons.push(
        <Button
          key="nextRound"
          size="sm"
          onClick={() => {
            setOpen(false);
            onNextRound();
          }}
          className="w-full justify-start gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        >
          <ChevronRight size={16} />
          Next Round
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="fixed bottom-32 right-0 z-50">
      <div
        className={`flex flex-col gap-3 mb-4 transition-all duration-300 ease-in-out ${
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <div className="space-y-2 min-w-[160px]">{getControlButtons()}</div>
      </div>

      <Button
        size="sm"
        className={`rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-all duration-300 ${
          open
            ? "bg-gray-600 hover:bg-gray-700 text-white rotate-180"
            : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-110"
        }`}
        onClick={() => setOpen(!open)}
      >
        <Settings size={20} className="transition-transform duration-300" />
      </Button>
    </div>
  );
};
