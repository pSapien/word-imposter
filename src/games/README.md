# 🎮 Game Architecture

This directory contains the modular game system that allows easy addition of new games while maintaining a consistent interface.

## 📁 Directory Structure

```
src/games/
├── types.ts                 # Base interfaces for all games
├── registry.ts              # Game registration and discovery
├── index.ts                 # Main exports
├── word-imposter/           # Word Imposter game
│   ├── config.ts           # Game configuration
│   ├── types.ts            # Game-specific types
│   ├── components/         # Game-specific UI components
│   │   ├── WordCard.tsx
│   │   ├── GameSettings.tsx
│   │   └── GameUI.tsx
│   └── index.ts            # Game exports
├── hangman/                 # Hangman game
│   ├── config.ts
│   ├── types.ts
│   ├── components/
│   │   ├── HangmanDisplay.tsx
│   │   ├── WordDisplay.tsx
│   │   ├── LetterInput.tsx
│   │   ├── GameSettings.tsx
│   │   └── GameUI.tsx
│   └── index.ts
└── [future-games]/          # Additional games follow same pattern
```

## 🏗️ Architecture Principles

### 1. **Consistent Interface**
All games implement the same base interfaces:
- `BaseGameState` - Common game state structure
- `GameUIProps` - Props for game UI components
- `GameSettingsProps` - Props for game settings components

### 2. **Modular Components**
Each game provides:
- `GameUI` - Main game interface component
- `GameSettings` - Configuration component
- Game-specific components as needed

### 3. **Type Safety**
- Strong TypeScript typing throughout
- Game-specific state and action types
- Compile-time validation of game interfaces

### 4. **Registration System**
Games are registered in `registry.ts` for:
- Automatic discovery
- Validation
- Dynamic loading

## 🎯 Adding a New Game

### Step 1: Create Game Directory
```bash
mkdir src/games/my-new-game
```

### Step 2: Define Game Configuration
Create `src/games/my-new-game/config.ts`:
```typescript
import { GameConfig } from '../types';

export const MyNewGameConfig: GameConfig = {
  id: 'my-new-game',
  name: 'my-new-game',
  displayName: 'My New Game',
  description: 'An awesome new party game',
  icon: '🎲',
  minPlayers: 2,
  maxPlayers: 8,
  defaultSettings: {
    rounds: 5,
    timeLimit: 60,
  },
};
```

### Step 3: Define Game Types
Create `src/games/my-new-game/types.ts`:
```typescript
import { BaseGameState, GameSettings } from '../types';

export interface MyNewGameState extends BaseGameState {
  // Game-specific state properties
  currentRound: number;
  timeRemaining: number;
  // ... other properties
}

export interface MyNewGameSettings extends GameSettings {
  rounds: number;
  timeLimit: number;
}

export type MyNewGameAction = 
  | { type: 'make_move'; data: { move: string } }
  | { type: 'skip_turn' };
```

### Step 4: Create Game Components
Create `src/games/my-new-game/components/GameUI.tsx`:
```typescript
import { GameUIProps } from '../../types';
import { MyNewGameState } from '../types';

export function MyNewGameUI({ 
  gameState, 
  currentUserId, 
  isHost, 
  onGameAction 
}: GameUIProps) {
  const state = gameState as MyNewGameState;
  
  // Implement your game UI here
  return (
    <div>
      {/* Your game interface */}
    </div>
  );
}
```

Create `src/games/my-new-game/components/GameSettings.tsx`:
```typescript
import { GameSettingsProps } from '../../types';
import { MyNewGameSettings } from '../types';

export function MyNewGameSettings({ 
  config, 
  settings, 
  onSettingsChange, 
  playerCount, 
  isHost 
}: GameSettingsProps) {
  const gameSettings = settings as MyNewGameSettings;
  
  // Implement your settings UI here
  return (
    <div>
      {/* Your settings interface */}
    </div>
  );
}
```

### Step 5: Export Game Components
Create `src/games/my-new-game/index.ts`:
```typescript
export { MyNewGameConfig } from './config';
export { MyNewGameUI } from './components/GameUI';
export { MyNewGameSettings } from './components/GameSettings';
export type { MyNewGameState, MyNewGameSettings, MyNewGameAction } from './types';
```

### Step 6: Register the Game
Add to `src/games/registry.ts`:
```typescript
import { MyNewGameConfig } from './my-new-game/config';

export const GAME_REGISTRY: Record<string, GameConfig> = {
  'word-imposter': WordImposterConfig,
  'hangman': HangmanConfig,
  'my-new-game': MyNewGameConfig, // Add your game here
};
```

### Step 7: Add to Game Renderer
Add to `src/components/game/GameRenderer.tsx`:
```typescript
import { MyNewGameUI } from '../../games/my-new-game';

export function GameRenderer({ gameType, ...props }: GameRendererProps) {
  switch (gameType) {
    case 'word-imposter':
      return <WordImposterGameUI {...props} />;
    case 'hangman':
      return <HangmanGameUI {...props} />;
    case 'my-new-game':
      return <MyNewGameUI {...props} />; // Add your game here
    default:
      return <div>Game not supported</div>;
  }
}
```

### Step 8: Update Main Exports
Add to `src/games/index.ts`:
```typescript
export * from './my-new-game';
```

## 🎨 UI Guidelines

### Design Consistency
- Use the same UI components (`Card`, `Button`, `Input`)
- Follow the glassmorphism design pattern
- Maintain consistent spacing and typography
- Use the established color scheme

### Mobile Responsiveness
- Ensure touch targets are at least 44px
- Use responsive grid layouts
- Test on various screen sizes
- Optimize for portrait orientation

### Accessibility
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Use sufficient color contrast
- Include screen reader support

## 🔧 Backend Integration

### Game Actions
Games communicate with the backend through standardized actions:
```typescript
onGameAction({ 
  type: 'action_name', 
  data: { /* action data */ } 
});
```

### Game Events
The backend sends events that update the game state:
```typescript
// Handle in GameRoom component
case 'game_event':
  const { event, gameState } = message.payload;
  // Update UI based on event type
```

### State Management
- Game state is managed by the backend
- Frontend receives updates via WebSocket events
- UI components are stateless and reactive

## 🧪 Testing Games

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { MyNewGameUI } from '../components/GameUI';

test('renders game UI correctly', () => {
  const mockProps = {
    gameState: { /* mock state */ },
    currentUserId: 'user1',
    isHost: true,
    onGameAction: jest.fn(),
  };
  
  render(<MyNewGameUI {...mockProps} />);
  // Add your assertions
});
```

### Integration Testing
- Test game flow from start to finish
- Verify all actions work correctly
- Test edge cases and error handling

## 🚀 Future Games Ideas

### Planned Games
- **Codenames** - Team-based word association game
- **Mafia/Werewolf** - Social deduction with roles
- **20 Questions** - Guessing game with yes/no questions
- **Pictionary** - Drawing and guessing game
- **Trivia** - Question and answer game

### Game Categories
- **Party Games** - Social, fun, easy to learn
- **Strategy Games** - Thinking, planning, competition
- **Creative Games** - Drawing, writing, imagination
- **Trivia Games** - Knowledge, learning, facts

## 📚 Resources

- [React Component Patterns](https://reactpatterns.com/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mobile UI Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Ready to create your own game? Follow the steps above and join the fun! 🎉**