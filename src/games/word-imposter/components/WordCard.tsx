import { Card } from "@app/components";
import { LocalStorage, useLocalStorage } from "@app/hooks";
import { cn } from "@app/utils";

interface WordCardProps {
  word: string;
  className?: string;
}

export function WordCard({ word, className }: WordCardProps) {
  const [isVisible, setIsVisible] = useLocalStorage(new LocalStorage("$$visible_imposter_word$$", true));

  if (!word) {
    return (
      <Card variant="glass" className={cn("p-8 text-center", className)}>
        <div className="text-5xl font-extrabold text-gray-400 mb-2 animate-pulse">❓❓❓</div>
        <p className="text-sm text-gray-500">Waiting for game to start...</p>
      </Card>
    );
  }

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <Card
      variant="glass"
      className={cn(
        "p-4 text-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95",
        className
      )}
      onClick={handleToggleVisibility}
    >
      {/* Fixed height container prevents layout shift */}
      <div className="h-[2rem] flex items-center justify-center mb-4">
        <span
          className={cn(
            "text-2xl font-bold transition-all duration-200 tracking-wide",
            isVisible ? "text-black" : "text-gray-400 font-mono"
          )}
        >
          {isVisible ? word : "•••"}
        </span>
      </div>

      <p
        className={cn(
          "text-sm font-medium transition-colors duration-200",
          isVisible ? "text-gray-800" : "text-gray-500"
        )}
      >
        {isVisible ? "👀 Tap to hide" : "✨ Tap to reveal"}
      </p>
    </Card>
  );
}
