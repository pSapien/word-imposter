import { Card, CardHeader, CardContent } from "../../../components/ui/Card.tsx";
import { Input } from "../../../components/ui/Input.tsx";
import { WORD_CATEGORIES } from "../config.ts";
import { cn } from "../../../utils/index.ts";

export type GameSettingState = {
  wordCategories: string[];
  imposterCount: number;
};

interface Props {
  state: GameSettingState;
  onChange: React.Dispatch<React.SetStateAction<GameSettingState>>;
  isHost: boolean;
  playersCount: number;
}

export function GameSettingsSection({ playersCount, isHost, state, onChange }: Props) {
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
    <Card variant="glass">
      <CardHeader>
        <h3 className="text-xl font-bold text-gray-800 flex items-center">🎭 Game Settings</h3>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Word Categories</h4>
          <div className="grid grid-cols-2 gap-2">
            {WORD_CATEGORIES.slice(0, 8).map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                disabled={!isHost}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 text-sm",
                  "hover:scale-105 active:scale-95",
                  state.wordCategories.includes(category.id)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white/50 text-gray-700",
                  !isHost && "opacity-50 cursor-not-allowed"
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
            min={1}
            max={Math.max(1, Math.floor(playersCount / 3))}
            value={state.imposterCount}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                imposterCount: Math.max(1, Math.min(Number(e.target.value), Math.max(1, Math.floor(playersCount / 3)))),
              }))
            }
            disabled={!isHost}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">Recommended: 1 imposter per 3-4 players</div>
        </div>
      </CardContent>
    </Card>
  );
}
