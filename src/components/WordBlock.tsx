import { useState } from "react";

type WordBlockProps = {
  word: string;
  shouldHighlight?: boolean;
};

export function WordBlock({ word, shouldHighlight = false }: WordBlockProps) {
  const [shouldShowWord, setShouldShowWord] = useState(true);

  const isHighlighted = shouldHighlight && shouldShowWord;

  if (word === "") {
    return (
      <div className="w-full bg-white/60 backdrop-blur-md border border-gray-300 rounded-xl shadow-lg px-4 py-6 text-center transition-colors duration-200 hover:bg-white/70">
        <span className="text-2xl font-semibold font-mono tracking-wide break-words opacity-40">— — —</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShouldShowWord((prev) => !prev)}
      className={`
        w-full rounded-xl px-4 py-6 text-center font-mono font-semibold text-2xl tracking-wide
        transition-all duration-200 transform shadow-lg border
        ${isHighlighted ? "bg-green-200 border-green-500 shadow-green-300/50" : "bg-white/60 border-gray-300"}
        hover:scale-105 active:scale-95
        backdrop-blur-md
      `}
    >
      <span
        className={`
          block transition-opacity duration-200 break-words
          ${shouldShowWord ? "opacity-100" : "opacity-40"}
        `}
      >
        {shouldShowWord ? word : "— — —"}
      </span>
      <p className="mt-1 text-sm text-gray-500 font-normal">{shouldShowWord ? "Tap to hide" : "Tap to reveal"}</p>
    </button>
  );
}
