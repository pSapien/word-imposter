# 🎮 Junior Developer Guide - Party Games Platform

## 🎯 Project Overview

This is a multi-game party platform where users can play different games like Word Imposter and CodeWords. The architecture is designed to be **junior-developer-friendly** with clear patterns and separation of concerns.

## 🏗️ Architecture Overview

### 📁 Folder Structure

```
src/
├── pages/
│   └── GameSelectionPage.tsx     # Main game selection screen
├── games/
│   ├── game-registry.ts          # Central registry of all games
│   ├── word-imposter/            # Word Imposter game
│   │   ├── services/
│   │   │   └── WordImposterGameService.ts
│   │   ├── pages/
│   │   │   ├── WordImposterSetupPage.tsx
│   │   │   └── WordImposterRoom.tsx
│   │   └── components/           # Game-specific components
│   └── codewords/                # CodeWords game
│       ├── services/
│       │   └── CodeWordsGameService.ts
│       ├── pages/
│       │   ├── CodeWordsSetupPage.tsx
│       │   └── CodeWordsRoom.tsx (to be created)
│       └── components/           # Game-specific components
├── services/
│   └── RoomService.ts            # Shared room management
└── components/
    └── ui/                       # Shared UI components
```

### 🔄 User Flow

```
1. GameSelectionPage → User picks a game
2. GameSetupPage → User enters name, creates/joins room
3. GameRoom → Actual gameplay
```

## 🎮 How to Add a New Game

### Step 1: Add Game to Registry

Edit `src/games/game-registry.ts`:

```typescript
export const AVAILABLE_GAMES: GameInfo[] = [
  // ... existing games
  {
    id: 'my-new-game',
    name: 'My New Game',
    description: 'An awesome new party game',
    icon: '🎲',
    color: 'from-green-500 to-blue-500',
    minPlayers: 2,
    maxPlayers: 8,
    estimatedTime: '10-15 min',
  },
];
```

### Step 2: Create Game Folder Structure

```bash
mkdir -p src/games/my-new-game/{services,pages,components}
```

### Step 3: Create Game Service

Create `src/games/my-new-game/services/MyNewGameService.ts`:

```typescript
import ReconnectingWebSocket from 'reconnecting-websocket';

export interface MyNewGameState {
  gameId: string;
  status: 'active' | 'paused' | 'finished';
  // Add your game-specific state here
}

export interface MyNewGameEvent {
  type: 'game_state_updated';
  payload: MyNewGameState;
}

export class MyNewGameService {
  private ws: ReconnectingWebSocket | null = null;
  private handlers = new Set<(event: MyNewGameEvent) => void>();

  constructor(private endpoint: string) {}

  // Follow the same pattern as WordImposterGameService
  connect(): Promise<void> { /* ... */ }
  disconnect() { /* ... */ }
  addHandler(handler: (event: MyNewGameEvent) => void) { /* ... */ }
  
  // Add your game-specific methods
  makeMove(move: string) {
    this.send({ type: 'make_move', payload: { move } });
  }
}
```

### Step 4: Create Setup Page

Create `src/games/my-new-game/pages/MyNewGameSetupPage.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomService } from '../../../services/RoomService';
import { getGameInfo } from '../../game-registry';

export function MyNewGameSetupPage() {
  const navigate = useNavigate();
  const [roomService] = useState(() => new RoomService(ENDPOINT));
  const gameInfo = getGameInfo('my-new-game')!;

  // Follow the same pattern as WordImposterSetupPage
  // Handle authentication, room creation/joining
  
  return (
    <div className={`bg-gradient-to-br ${gameInfo.color}`}>
      {/* Your setup UI here */}
    </div>
  );
}
```

### Step 5: Create Game Room

Create `src/games/my-new-game/pages/MyNewGameRoom.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { MyNewGameService } from '../services/MyNewGameService';

export function MyNewGameRoom() {
  const [gameService] = useState(() => new MyNewGameService(ENDPOINT));
  const [gameState, setGameState] = useState(null);

  // Follow the same pattern as WordImposterRoom
  // Handle game events, UI updates, user actions
  
  return (
    <div>
      {/* Your game UI here */}
    </div>
  );
}
```

### Step 6: Add Routes

Edit `src/App.tsx`:

```typescript
import { MyNewGameSetupPage } from "./games/my-new-game/pages/MyNewGameSetupPage";
import { MyNewGameRoom } from "./games/my-new-game/pages/MyNewGameRoom";

// Add these routes:
<Route path="/game/my-new-game/setup" element={<MyNewGameSetupPage />} />
<Route path="/game/my-new-game/room/:roomCode" element={<MyNewGameRoom />} />
```

## 🎨 Design Guidelines

### Colors and Themes
Each game has its own color scheme defined in the registry:
- Word Imposter: `from-purple-500 to-pink-500`
- CodeWords: `from-blue-500 to-teal-500`
- Your game: Choose your own gradient!

### UI Components
Use the shared UI components from `src/components/ui/`:
- `Button` - For all buttons
- `Card` - For containers
- `Input` - For form inputs

### Mobile-First Design
- Always design for mobile first
- Use responsive classes (`md:`, `lg:`)
- Ensure touch targets are at least 44px
- Test on different screen sizes

## 🔧 Services Architecture

### RoomService (Shared)
Handles common room operations:
- Authentication
- Room creation/joining
- Player management
- Room events

### GameService (Game-Specific)
Each game has its own service for:
- Game-specific events
- Game actions
- Game state management

### Why Separate Services?
- **Isolation**: Each game's logic is separate
- **Maintainability**: Easy to modify one game without affecting others
- **Scalability**: Can handle different WebSocket endpoints per game
- **Testing**: Can test each game service independently

## 🧪 Testing Your Game

### Manual Testing Checklist
- [ ] Game appears on selection screen
- [ ] Setup page loads with correct theme
- [ ] Can create and join rooms
- [ ] Game room loads correctly
- [ ] All game actions work
- [ ] Mobile responsive design
- [ ] Error handling works

### Code Quality Checklist
- [ ] Follow existing naming conventions
- [ ] Add TypeScript types for all data
- [ ] Handle loading and error states
- [ ] Add proper console logging
- [ ] Clean up WebSocket connections

## 🚀 Development Workflow

### 1. Local Development
```bash
# Start backend
cd backend && bun run start:new

# Start frontend
npm run dev

# Your game will be available at:
# http://localhost:5173/#/game/my-new-game/setup
```

### 2. Adding Features
1. Start with the game registry entry
2. Create the service layer
3. Build the setup page
4. Implement the game room
5. Add routes to App.tsx
6. Test thoroughly

### 3. Code Review
- Follow the existing patterns
- Keep components small and focused
- Use TypeScript properly
- Add comments for complex logic

## 📚 Learning Resources

### React Patterns Used
- **Hooks**: `useState`, `useEffect`, `useNavigate`
- **Context**: Not used (services handle state)
- **Components**: Functional components only
- **Props**: TypeScript interfaces for all props

### WebSocket Patterns
- **Connection Management**: Services handle connections
- **Event Handling**: Observer pattern with handlers
- **Reconnection**: Automatic with ReconnectingWebSocket
- **Error Handling**: Try-catch with user feedback

### State Management
- **Local State**: `useState` for component state
- **Game State**: Managed by game services
- **Room State**: Managed by room service
- **No Global State**: Each game is isolated

## 🎯 Best Practices

### Do's ✅
- Follow the existing folder structure
- Use TypeScript for everything
- Handle loading and error states
- Make it mobile-friendly
- Add proper logging
- Clean up resources in useEffect

### Don'ts ❌
- Don't mix game logic between games
- Don't skip error handling
- Don't forget mobile responsiveness
- Don't hardcode values (use constants)
- Don't skip TypeScript types

## 🤝 Contributing

### For Junior Developers
1. Pick a game from the backlog
2. Follow this guide step by step
3. Ask questions in code reviews
4. Test your changes thoroughly
5. Update documentation if needed

### Getting Help
- Check existing games for patterns
- Look at the shared components
- Ask senior developers for code review
- Test on different devices

## 🎮 Game Ideas for Practice

### Easy Games (Good for beginners)
- **Rock Paper Scissors** - Simple turn-based game
- **Tic Tac Toe** - Grid-based game
- **20 Questions** - Question/answer game

### Medium Games
- **Trivia** - Question database, scoring
- **Pictionary** - Drawing and guessing
- **Charades** - Timer-based acting game

### Advanced Games
- **Mafia/Werewolf** - Complex role-based game
- **Codenames** - Team-based strategy
- **Avalon** - Social deduction with roles

## 🎉 Success Metrics

Your game is successful when:
- [ ] It appears on the game selection screen
- [ ] Players can create and join rooms
- [ ] The game is fun and engaging
- [ ] It works well on mobile devices
- [ ] Other developers can understand your code
- [ ] It follows the established patterns

---

**Ready to build your first game? Start with the game registry and work your way through each step! 🚀**