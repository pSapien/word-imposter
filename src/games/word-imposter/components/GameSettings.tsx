import type { GameSettingsProps } from "../../types";
import type { WordImposterSettings } from "../types";
import { WORD_CATEGORIES } from "../config";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { cn } from "../../../utils/cn";

export function WordImposterGameSettings({
  config,
  settings,
  onSettingsChange,
  playerCount,
  isHost,
}: GameSettingsProps) {
  const wordImposterSettings = settings as WordImposterSettings;

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = wordImposterSettings.wordCategories.includes(categoryId)
      ? wordImposterSettings.wordCategories.filter((id) => id !== categoryId)
      : [...wordImposterSettings.wordCategories, categoryId];

    onSettingsChange({
      ...wordImposterSettings,
      wordCategories: newCategories,
    });
  };

  const handleImposterCountChange = (count: number) => {
    onSettingsChange({
      ...wordImposterSettings,
      imposterCount: Math.max(1, Math.min(count, Math.floor(playerCount / 2))),
    });
  };

  const canStart = playerCount >= config.minPlayers && wordImposterSettings.wordCategories.length > 0;

  return (
    <Card variant="glass">
      <CardHeader>
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          {config.icon} {config.displayName} Settings
        </h3>
        <p className="text-sm text-gray-600">{config.description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Word Categories */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Word Categories</h4>
          <div className="grid grid-cols-2 gap-2">
            {WORD_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                disabled={!isHost}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 text-sm",
                  "hover:scale-105 active:scale-95",
                  wordImposterSettings.wordCategories.includes(category.id)
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

        {/* Imposter Count */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">Number of Imposters</label>
          <Input
            type="number"
            min={1}
            max={Math.floor(playerCount / 2)}
            value={wordImposterSettings.imposterCount}
            onChange={(e) => handleImposterCountChange(Number(e.target.value))}
            disabled={!isHost}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum: {Math.floor(playerCount / 2)} (based on {playerCount} players)
          </p>
        </div>

        {/* Player Count Info */}
        <div className="bg-blue-50/50 rounded-lg p-3">
          <div className="text-sm text-blue-700">
            <strong>Current Players:</strong> {playerCount}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            <strong>Required:</strong> {config.minPlayers}-{config.maxPlayers} players
          </div>
        </div>

        {/* Validation Messages */}
        {!canStart && (
          <div className="text-center py-4">
            {playerCount < config.minPlayers && (
              <p className="text-red-600 text-sm">Need {config.minPlayers - playerCount} more players to start</p>
            )}
            {wordImposterSettings.wordCategories.length === 0 && (
              <p className="text-red-600 text-sm">Select at least one word category</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
