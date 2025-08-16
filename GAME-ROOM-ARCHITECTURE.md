# 🎮 Game Room Architecture

## 🏗️ New Architecture Overview

Each game now has its own dedicated room implementation, providing complete isolation and customization for different game types.

## 📁 Directory Structure

```
src/
├── pages/
│   ├── HomePage.tsx           # Landing page with auth
│   └── RoomLobby.tsx         # Game selection lobby
├── games/
│   ├── word-imposter/
│   │   ├── pages/
│   │   │   └── WordImposterRoom.tsx  # Dedicated Word Imposter room
│   │   ├── components/       # Game-specific components
│   │   └── ...
│   ├── hangman/
│   │   ├── pages/
│   │   │   └── HangmanRoom.tsx       # Dedicated Hangman room
│   │   ├── components/       # Game-specific components
│   │   └── ...
│   └── [future-games]/
│       ├── pages/
│       │   └── GameRoom.tsx          # Each game gets its own room
│       └── ...
└── components/
    └── game/
        ├── PlayerList.tsx    # Shared component
        └── GameSelector.tsx  # Used in lobby only
```

## 🎯 Routing Structure

```
/ → HomePage (Authentication & Room Creation/Joining)
/room/:roomCode → RoomLobby (Game Selection)
/game/word-imposter/:roomCode → WordImposterRoom
/game/hangman/:roomCode → HangmanRoom
/game/codenames/:roomCode → CodenamesRoom (future)
/game/mafia/:roomCode → MafiaRoom (future)
```

## 🔄 User Flow

1. **Home Page** → User authenticates and creates/joins room
2. **Room Lobby** → Host selects game type and settings
3. **Game Room** → Dedicated room for the specific game

## 🎮 Benefits of Game-Specific Rooms

### 1. **Complete Customization**
- Each game can have its own unique UI/UX
- Game-specific layouts and interactions
- Custom backgrounds, colors, and themes
- Tailored mobile optimizations

### 2. **Isolated Logic**
- No shared state between different games
- Game-specific event handling
- Independent error handling
- Cleaner code organization

### 3. **Performance**
- Only load code needed for the current game
- Smaller bundle sizes per game
- Better memory management
- Optimized for specific game requirements

### 4. **Scalability**
- Easy to add new games without affecting existing ones
- Independent development and testing
- Game-specific feature flags
- Separate deployment if needed

## 🛠️ Implementation Details

### Game Room Template

Each game room follows this structure:

```typescript
// src/games/my-game/pages/MyGameRoom.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameService } from '../../../hooks/useGameService';
import { MyGameState } from '../types';

export function MyGameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { gameService, isConnected, addHandler } = useGameService();
  
  const [gameState, setGameState] = useState<MyGameState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (!gameService || !isConnected) return;

    const removeHandler = addHandler((message) => {
      switch (message.type) {
        case 'game_state':
          setGameState(message.payload as MyGameState);
          break;
        
        case 'game_event':
          // Handle game-specific events
          handleGameEvent(message.payload);
          break;
        
        case 'error':
          handleError(message.payload);
          break;
      }
    });

    return removeHandler;
  }, [gameService, isConnected]);

  // Game-specific UI and logic
  return (
    <div className="game-specific-layout">
      {/* Custom game interface */}
    </div>
  );
}
```

### Shared Components

Some components are still shared across games:

- **PlayerList** - Common player management UI
- **Button, Card, Input** - Base UI components
- **GameService** - WebSocket communication layer

### Game-Specific Features

Each game room can implement:

- **Custom Layouts** - Unique UI arrangements
- **Game Controls** - Specific interaction patterns
- **Visual Themes** - Different color schemes and backgrounds
- **Mobile Optimizations** - Game-specific responsive design
- **Animations** - Custom transitions and effects

## 🎨 Design Consistency

While each game has its own room, we maintain consistency through:

### Shared Design System
- Common UI components (Button, Card, Input)
- Consistent color palette and typography
- Standardized spacing and layout patterns
- Mobile-first responsive design

### Navigation Patterns
- Consistent header with room code and connection status
- Standard "Leave Room" functionality
- Similar loading and error states

### User Experience
- Familiar authentication flow
- Consistent toast notifications
- Standard player management interface

## 🚀 Adding New Game Rooms

### Step 1: Create Game Room Component
```bash
mkdir src/games/my-new-game/pages
touch src/games/my-new-game/pages/MyNewGameRoom.tsx
```

### Step 2: Implement Game Room
```typescript
// Follow the template above
export function MyNewGameRoom() {
  // Game-specific implementation
}
```

### Step 3: Add Route
```typescript
// src/App.tsx
<Route path="/game/my-new-game/:roomCode" element={<MyNewGameRoom />} />
```

### Step 4: Export from Game Module
```typescript
// src/games/my-new-game/index.ts
export { MyNewGameRoom } from './pages/MyNewGameRoom';
```

## 🎯 Game Room Features

### Word Imposter Room
- **Unique Features**: Word cards, voting interface, imposter detection
- **Theme**: Purple/pink gradient with glassmorphism
- **Layout**: Sticky word card, voting controls, results display

### Hangman Room  
- **Unique Features**: Hangman drawing, letter input, word display
- **Theme**: Orange/red gradient with playful design
- **Layout**: Word display, hangman visual, alphabet grid

### Future Game Rooms

#### Codenames Room (Planned)
- **Features**: Team boards, clue giving, word grids
- **Theme**: Blue/teal professional look
- **Layout**: Split team view, clue interface

#### Mafia Room (Planned)
- **Features**: Role cards, day/night phases, voting
- **Theme**: Dark mysterious theme
- **Layout**: Role-based UI, phase indicators

## 🧪 Testing Game Rooms

### Unit Testing
```typescript
// Test game-specific logic
import { render, screen } from '@testing-library/react';
import { MyGameRoom } from '../pages/MyGameRoom';

test('renders game room correctly', () => {
  render(<MyGameRoom />);
  expect(screen.getByText('Game Title')).toBeInTheDocument();
});
```

### Integration Testing
- Test complete game flows
- Verify WebSocket communication
- Test error handling and edge cases

## 📱 Mobile Optimizations

Each game room can implement mobile-specific features:

- **Touch Gestures** - Swipe, tap, long press
- **Responsive Layouts** - Game-specific breakpoints
- **Performance** - Optimized for mobile hardware
- **Accessibility** - Touch targets, screen readers

## 🔧 Development Workflow

### Local Development
```bash
# Start backend
cd backend && bun run start:new

# Start frontend
npm run dev

# Navigate to specific game
# http://localhost:5173/#/game/word-imposter/ABC123
```

### Adding New Games
1. Create game directory structure
2. Implement game room component
3. Add route to App.tsx
4. Test game-specific functionality
5. Update documentation

## 🎉 Benefits Summary

✅ **Isolation** - Each game is completely independent
✅ **Customization** - Unique UI/UX for each game
✅ **Performance** - Optimized bundles and loading
✅ **Scalability** - Easy to add new games
✅ **Maintainability** - Clear separation of concerns
✅ **Testing** - Independent test suites
✅ **Mobile** - Game-specific optimizations

This architecture provides the perfect foundation for building a multi-game platform that can scale to dozens of different games while maintaining code quality and user experience! 🚀