import { WORD_CATEGORIES } from "../config.ts";
import { Input, Card, CardHeader, CardContent, Button } from "@app/components";
import { Constants } from "@app/constants";
import { cn } from "@app/utils";
import { useLocalStorage } from "@uidotdev/usehooks";

export type GameSettingState = {
  wordCategories: string[];
  imposterCount: number;
};

interface Props {
  playersCount: number;
  hide: () => void;
}

export function usePersistGameSettings() {
  return useLocalStorage<GameSettingState>(Constants.StorageKeys.GameSettings, {
    wordCategories: ["legacy"],
    imposterCount: 1,
  });
}

export function GameSettingsSection({ playersCount, hide }: Props) {
  const [state, onChange] = usePersistGameSettings();

  function handleCategoryChange(selectedCategory: string) {
    const categoriesSet = new Set<string>(state.wordCategories);
    if (categoriesSet.has(selectedCategory)) {
      categoriesSet.delete(selectedCategory);
    } else {
      categoriesSet.add(selectedCategory);
    }
    onChange((prev) => ({ ...prev, wordCategories: Array.from(categoriesSet) }));
  }

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto  items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="max-w-md w-full">
        <Card variant="glass" className="max-h-[85vh] overflow-y-auto">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">🎭 Game Settings</h3>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-200/30" onClick={hide}>
              ✕
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Word Categories</h4>
              <div className="grid grid-cols-2 gap-2">
                {WORD_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200 text-sm",
                      "hover:scale-105 active:scale-95",
                      state.wordCategories.includes(category.id)
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white/50 text-gray-700"
                    )}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Number of Imposters</label>
              <Input
                type="number"
                name="imposterCount"
                min={1}
                max={Math.max(1, Math.floor(playersCount / 3))}
                value={state.imposterCount}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    imposterCount: Math.max(
                      1,
                      Math.min(Number(e.target.value), Math.max(1, Math.floor(playersCount / 3)))
                    ),
                  }))
                }
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">Recommended: 1 imposter per 3-4 players</div>
            </div>

            <Button onClick={hide} className="w-full mt-2">
              Save & Close
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
