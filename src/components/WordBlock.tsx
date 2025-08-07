import { useState } from "react";

export function WordBlock({ word }: { word: string }) {
  const [shouldShowWord, setShouldShowWord] = useState(true);

  if (word === "") {
    return (
      <div className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 border border-gray-300 rounded-xl shadow-md px-4 py-6 text-center">
        <span className="text-2xl font-semibold font-mono tracking-wide break-words opacity-40">— — —</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShouldShowWord((prev) => !prev)}
      className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 border border-gray-300 rounded-xl shadow-md px-4 py-6 text-center"
    >
      <span
        className={`text-2xl font-semibold font-mono tracking-wide break-words transition-opacity duration-200 ${
          shouldShowWord ? "opacity-100" : "opacity-40"
        }`}
      >
        {shouldShowWord ? word : "— — —"}
      </span>
      <p className="mt-1 text-sm text-gray-500">{shouldShowWord ? "Tap to hide" : "Tap to reveal"}</p>
    </button>
  );
}
