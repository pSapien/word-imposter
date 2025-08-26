import { Card } from "@app/components";
import { LocalStorage, useLocalStorage } from "@app/hooks";
import { cn } from "@app/utils";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface WordCardProps {
  word: string;
  className?: string;
}

interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface WordData {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Definition[];
  }>;
}

export function WordCard({ word, className }: WordCardProps) {
  const [isVisible, setIsVisible] = useLocalStorage(new LocalStorage("$$visible_imposter_word$$", true));
  const [showDefinition, setShowDefinition] = useState(false);
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const fetchDefinition = async () => {
    if (!word) return;
    if (wordData) return setShowDefinition(true);

    setIsLoading(true);

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);

      if (!response.ok) {
        throw new Error("Definition not found");
      }

      const data = await response.json();
      setWordData(data[0]);
      setShowDefinition(true);
    } catch (err) {
      window.open(`https://www.google.com/search?q=define:${word}`, "_blank");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card
        variant="glass"
        className={cn(
          "p-4 text-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 relative",
          className
        )}
        onClick={handleToggleVisibility}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchDefinition();
          }}
          disabled={isLoading}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full transition-all duration-200",
            "hover:bg-black/10 active:bg-black/20 hover:scale-110 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isVisible ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-100 hover:opacity-100"
          )}
          aria-label={`Search meaning of ${word}`}
        >
          <Search className={cn("h-4 w-4 text-gray-600", isLoading && "animate-spin")} />
        </button>

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

      {showDefinition && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDefinition(false)}
        >
          <Card
            variant="glass"
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-800">{wordData?.word}</h2>
                </div>
                <button
                  onClick={() => setShowDefinition(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Close definition"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {wordData?.meanings.map((meaning, index) => {
                return (
                  <div key={index} className="mb-6 last:mb-0">
                    {meaning.definitions.slice(0, 3).map((def, defIndex) => {
                      console.log("def:", def);
                      return (
                        <div key={defIndex} className="mb-3 pl-4 border-l-2 border-gray-200">
                          <p className="text-gray-800 mb-1">
                            <span className="font-medium">{defIndex + 1}.</span> {def.definition}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
