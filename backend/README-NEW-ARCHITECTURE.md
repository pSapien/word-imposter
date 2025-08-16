# New Backend Architecture

## Overview

The new architecture should supports multiple games and can easily be extended.

## Architecture Principles

### 1. **Separation of Concerns**
- **Core**: Business logic (auth, rooms, games)
- **Infrastructure**: External concerns (WebSocket, storage)
- **API**: Request handling and routing
- **Games**: Individual game implementations

### 2. **Dependency Injection**
- Services are injected into handlers
- Easy to mock for testing
- Clear dependencies between components

### 3. **Event-Driven Design**
- Games emit events that get broadcasted
- Loose coupling between game logic and communication
- Easy to add new event types

### 4. **Extensible Game System**
- Abstract base game class
- Game factory for creating different game types
- Standardized game actions and events

## Key Components

### Core Services

#### AuthService
- Manages guest sessions (no passwords needed)
- Session-based authentication
- Socket attachment/detachment
- Automatic cleanup of inactive sessions

#### RoomService  
- Room creation and management
- Member management (host, players, spectators)
- Room codes for easy joining
- Automatic host transfer when host leaves

#### GameEngine (BaseGame)
- Abstract base class for all games
- Standardized game lifecycle (waiting → active → finished)
- Player management within games
- Action validation and processing

### Infrastructure

#### WebSocketManager
- Connection management
- Message broadcasting
- Connection cleanup
- Ping/pong handling

### API Layer

#### Handlers
- **AuthHandlers**: Authentication requests
- **RoomHandlers**: Room management
- **GameHandlers**: Game actions and state

#### Middleware
- **AuthMiddleware**: Ensures authenticated requests
- Request validation
- Error handling

#### MessageRouter
- Routes incoming messages to appropriate handlers
- Centralized message handling
- Type-safe routing

### Games

#### WordImposterGame
- Complete rewrite of the original game
- Proper state management
- Event-driven updates
- Player-specific views


#### GameFactory
- Creates games based on type
- Validates game settings
- Provides available game types

## Running the New Server

```bash
# Development with hot reload
bun run dev

# Production
bun run start:new

# Run tests
bun test

# Run tests with watch mode
bun test:watch
```

## Adding New Games

1. Create game class extending `BaseGame`
2. Implement required methods:
   - `validateAction()`
   - `processAction()`
   - `getPlayerView()`
   - `canStart()`

3. Add to `GameFactory`
4. Add game type configuration

Example:
```typescript
export class MyNewGame extends BaseGame {
  constructor(config: MyGameConfig) {
    super('my-new-game', config);
  }
  
  // Implement required methods...
}
```

## Testing

The new architecture includes comprehensive tests:

```bash
# Run all tests
bun test

# Run specific test file
bun test src/__tests__/core/auth/AuthService.test.ts

# Run with coverage
bun test --coverage
```

## Error Handling

Standardized error responses:
```typescript
{
  type: 'error',
  payload: {
    code: 'auth.required',
    message: 'Authentication required'
  }
}
```

Error codes follow the pattern: `category.specific_error`