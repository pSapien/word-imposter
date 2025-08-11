import { CheckboxButton } from "./CheckboxButton.tsx";

type FormState = {
  wordCategories: string[];
};

type SettingsModalProps = {
  state: FormState;
  onChange: (formState: FormState) => void;
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
];

export function SettingsModal({ onClose, state, onChange }: SettingsModalProps) {
  function handleChange(selectedCategory: string) {
    const categoriesSet = new Set<string>(state.wordCategories);
    if (categoriesSet.has(selectedCategory)) {
      categoriesSet.delete(selectedCategory);
    } else {
      categoriesSet.add(selectedCategory);
    }
    onChange({ wordCategories: Array.from(categoriesSet) });
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="settings-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <h2 id="settings-title" className="text-2xl font-bold mb-4 text-gray-900">
          Choose Category
        </h2>

        <ul className="flex flex-wrap gap-3 mb-6">
          {categories.map((cat) => {
            return (
              <CheckboxButton
                label={cat.label}
                key={cat.value}
                selected={state.wordCategories.includes(cat.value)}
                onClick={() => handleChange(cat.value)}
                disabled={false}
              />
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => onClose()}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ViewSettingsModal({ state, onClose }: Pick<SettingsModalProps, "state" | "onClose">) {
  console.log("what is state.wordCategories", state.wordCategories);
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="view-settings-title"
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <h2 id="view-settings-title" className="text-xl sm:text-2xl font-bold mb-5 text-gray-900 text-center">
          Selected Categories
        </h2>

        <ul className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((cat) => {
            const isSelected = state.wordCategories.includes(cat.value);
            return (
              <span
                key={cat.value}
                className={`px-4 py-2 rounded-full border text-sm font-medium
                  ${isSelected ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 text-gray-500 border-gray-300"}
                `}
              >
                {cat.label}
              </span>
            );
          })}
        </ul>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
