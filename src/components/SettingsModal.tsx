import type { GameSettings } from "../../shared";
import { CheckboxButton } from "./CheckboxButton.tsx";

type FormState = GameSettings;

type SettingsModalProps = {
  state: FormState;
  onChange: React.Dispatch<React.SetStateAction<GameSettings>>;
  onClose: () => void;
};

const categories = [
  { label: "Abstract", value: "abstract" },
  { label: "Fantasy", value: "fantasy" },
  { label: "Food", value: "food" },
  { label: "General", value: "general" },
  { label: "Geography", value: "geography" },
  { label: "Hobbies", value: "hobbies" },
  { label: "Legacy", value: "legacy" },
  { label: "Pop Culture", value: "pop" },
  { label: "Science", value: "science" },
  { label: "Synonyms", value: "synonms" },
  { label: "Animal", value: "animal" },
  { label: "Culinary", value: "culinary" },
  { label: "History", value: "history" },
  { label: "Music", value: "music" },
  { label: "People", value: "people" },
  { label: "Nature", value: "nature" },
  { label: "Profession", value: "profession" },
  { label: "Sports", value: "sports" },
  { label: "Technology", value: "technology" },
  { label: "Vehicle", value: "vehicle" },
];

export function SettingsModal({ onClose, state, onChange }: SettingsModalProps) {
  function handleCategoryChange(selectedCategory: string) {
    const categoriesSet = new Set<string>(state.wordCategories);
    if (categoriesSet.has(selectedCategory)) {
      categoriesSet.delete(selectedCategory);
    } else {
      categoriesSet.add(selectedCategory);
    }
    onChange((prev) => ({ ...prev, wordCategories: Array.from(categoriesSet) }));
  }

  function handleImposterCount(imposterCount: number) {
    onChange((prev) => ({ ...prev, imposterCount }));
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="settings-title"
    >
      <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
        <h2 id="settings-title" className="font-heading text-2xl sm:text-3xl mb-4 text-gray-900 text-center">
          Choose Categories
        </h2>

        <ul className="flex flex-wrap gap-3 mb-6 justify-center">
          {categories.map((cat) => (
            <CheckboxButton
              key={cat.value}
              label={cat.label}
              selected={state.wordCategories.includes(cat.value)}
              onClick={() => handleCategoryChange(cat.value)}
              disabled={false}
            />
          ))}
        </ul>

        <div className="mb-6">
          <label htmlFor="imposter-count" className="block text-sm font-medium text-gray-700 mb-2">
            Imposter Count
          </label>
          <select
            id="imposter-count"
            value={state.imposterCount}
            onChange={(e) => handleImposterCount(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-xl p-2 focus:ring-4 focus:ring-blue-300 focus:outline-none transition"
          >
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold text-lg"
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ViewSettingsModal({ state, onClose }: Pick<SettingsModalProps, "state" | "onClose">) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="view-settings-title"
    >
      <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-fade-in">
        <h2
          id="view-settings-title"
          className="text-xl sm:text-2xl font-heading font-bold mb-5 text-gray-900 text-center"
        >
          Selected Settings
        </h2>

        <ul className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((cat) => {
            const isSelected = state.wordCategories.includes(cat.value);
            return (
              <span
                key={cat.value}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium border shadow-md
                  ${
                    isSelected
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white/60 backdrop-blur-md text-gray-500 border-gray-300"
                  }
                  transition-all
                `}
              >
                {cat.label}
              </span>
            );
          })}
        </ul>

        <div className="mb-8 text-center">
          <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium border border-yellow-300">
            Imposter Count: {state.imposterCount}
          </span>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
