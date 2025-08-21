
## Overview

The backend is a real-time WebSocket server built with Bun. It is responsible for managing user sessions, game rooms, and game logic. The architecture is designed to be modular and extensible, allowing for the addition of new games and features in the future.

## Project Structure

The backend code is organized into the following directories:

-   `src/`: This directory contains all the source code for the backend application.
    -   `api/`: This directory contains the API layer of the application, which is responsible for handling incoming messages from clients.
        -   `handlers/`: This directory contains the message handlers, which contain the logic for handling specific message types.
        -   `routes/`: This directory contains the message router, which maps incoming messages to the appropriate handlers.
    -   `core/`: This directory contains the core components of the application, such as the WebSocket manager, session service, and room service.
        -   `middleware/`: This directory contains the authentication middleware, which is used to protect routes that require authentication.
        -   `services/`: This directory contains the core services of the application, such as the session service and room service.
    -   `games/`: This directory contains the game logic for the different games supported by the application.
        -   `imposter/`: This directory contains the game logic for the "Word Imposter" game.
    -   `utils/`: This directory contains utility functions that are used throughout the application.
-   `server.ts`: This is the entry point for the backend application. It is responsible for creating the WebSocket server and setting up the application.

## Core Components

The core components of the application are located in the `src/core` directory. These components provide the essential services that are required by the application.

### `WebSocketManager`

The `WebSocketManager` is responsible for managing all the WebSocket connections. It has the following responsibilities:

-   Adding and removing connections.
-   Sending messages to clients.
-   Broadcasting messages to multiple clients.
-   Cleaning up stale connections.

### `SessionService`

The `SessionService` is responsible for managing user sessions. It has the following responsibilities:

-   Creating guest sessions.
-   Getting sessions by ID, connection ID, or profile ID.
-   Updating session information.
-   Cleaning up inactive sessions.

### `RoomService`

The `RoomService` is responsible for managing game rooms. It has the following responsibilities:

-   Creating, joining, and leaving rooms.
-   Kicking members from rooms.
-   Handling disconnections and reconnections.
-   Cleaning up stale rooms.
-   Associating a game engine with a room.

## API Layer

The API layer is responsible for handling incoming messages from clients. It is located in the `src/api` directory.

### `MessageRouter`

The `MessageRouter` is responsible for routing incoming WebSocket messages to the appropriate handlers. It uses a `Map` to store the routes, where the key is the message type and the value is the handler function. It also uses the `AuthMiddleware` to protect routes that require authentication.

### Handlers

The handlers contain the logic for handling specific message types. They are located in the `src/api/handlers` directory. There are two main handlers:

-   `AuthHandlers`: This handler is responsible for handling authentication-related messages, such as login and reconnection.
-   `RoomHandlers`: This handler is responsible for handling all room-related and game-related messages, such as creating, joining, and leaving rooms, starting a game, handling game actions, and getting the game state.

## Game Logic

The game logic is located in the `src/games` directory. Each game has its own subdirectory that contains the game engine and other game-specific files.

### `GameEngine`

The `GameEngine` is an interface that defines the basic methods that a game engine should have.

These methods are:

-   `startGame`: Starts the game.
-   `processAction`: Processes a game action.
-   `validateGameAction`: Validates a game action.
-   `getPlayerViewState`: Gets the game state for a specific player.

### `WordImposterGameEngine`

The `WordImposterGameEngine` is the game engine for the "Word Imposter" game. It implements the `GameEngine` interface. It is responsible for managing the game state, including the stage of the game, the players, the words, and the votes.

## Data Flow

The following is a high-level overview of the data flow in the application:

1.  A client sends a message to the WebSocket server.
2.  The `server.ts` file receives the message and passes it to the `MessageRouter`.
3.  The `MessageRouter` routes the message to the appropriate handler based on the message type.
4.  The handler processes the message and interacts with the core services (e.g., `SessionService`, `RoomService`) as needed.
5.  The handler uses the `WebSocketManager` to send a response back to the client.

Client Request -> Bun Server (server.ts) -> Router (MessageRouter) -> Handlers

Each handler is marked by `handle` keyword as the prefix.
For example: 
    - login (event) -> handleLogin (handler) 