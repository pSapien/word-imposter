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
