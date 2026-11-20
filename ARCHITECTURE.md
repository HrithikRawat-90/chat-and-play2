# Architecture

Chat & Play has a React client and an Express backend. The client uses REST endpoints for account and conversation operations and Socket.IO for real-time updates. MongoDB stores users, conversations, and messages. In production, Express also serves the built frontend.

## Application structure

- `frontend/src/pages` contains the login, registration, and chat screens.
- `frontend/src/context` manages authentication, conversations, sockets, and themes. The game context lives in `frontend/src/games`.
- `backend/routes` maps HTTP endpoints to controllers, while `backend/middleware/auth.js` checks authentication.
- `backend/models` defines the MongoDB collections. `backend/socket/socketHandler.js` handles real-time events, and `backend/games` manages Tic-Tac-Toe state.
- `backend/services/geminiService.js` provides chatbot responses and writing suggestions.

The backend first connects to the configured MongoDB instance. If that fails, it attempts to start an in-memory MongoDB instance. Data in the fallback database is not persistent.

## Data

The Mongoose schemas are the source of truth for fields and validation:

- **User** (`backend/models/User.js`): account credentials, profile, presence, bot status, and blocked users. Passwords are hashed before saving and omitted from ordinary queries.
- **Conversation** (`backend/models/Conversation.js`): participants, group details when applicable, the latest message, unread counts, and the moderation inbox flag.
- **Message** (`backend/models/Message.js`): conversation and sender references, text, image and audio URLs, reply details, and read status.

## HTTP routes

All routes below require authentication except registration, login, and the health check.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check backend availability |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Get the current user |
| `POST` | `/api/auth/logout` | Log out |
| `GET` | `/api/users` | Search users |
| `GET` | `/api/users/:id` | Get a user's profile |
| `PUT` | `/api/users/profile` | Update the current profile |
| `GET` | `/api/users/me/blocked` | List blocked users |
| `POST` | `/api/users/block/:id` | Block or unblock a user |
| `POST` | `/api/users/report` | Submit a user report |
| `GET` | `/api/conversations` | List conversations |
| `POST` | `/api/conversations` | Find or create a private conversation |
| `POST` | `/api/conversations/group` | Create a group |
| `POST` | `/api/conversations/join-group` | Join a group by code |
| `DELETE` | `/api/conversations/:id` | Delete a conversation |
| `GET` | `/api/messages/:conversationId` | Get conversation messages |
| `POST` | `/api/messages` | Send a message over HTTP |
| `POST` | `/api/ai/suggest` | Request a writing suggestion |
| `GET` | `/api/ai/status` | Check AI service configuration |

## Real-time events

Socket.IO authenticates connections and uses conversation rooms and personal user rooms to deliver updates. The main events are:

- Presence: `users:online:list`, `user:online`, and `user:offline`.
- Rooms: `join:conversation` and `leave:conversation`.
- Messages: `message:send`, `message:receive`, and `conversation:updated`.
- Activity: `typing:start`, `typing:stop`, and `message:read`.
- Games: `game:invite`, `game:invite:received`, `game:accept`, `game:reject`, `game:rejected`, `game:started`, `game:move`, `game:updated`, `game:rematch`, `game:exit`, and `game:ended`.

## Tic-Tac-Toe

Active games and invitations are stored in server memory. The game engine tracks the board, players, turn, result, and scores. It checks moves for turn order, valid cells, and completed games; a rematch resets the board while retaining the score. In-memory game state is lost when the server restarts.

## Reports

Reports are delivered to a dedicated, read-only chatbot conversation for the configured administrator. The inbox is kept separate from Gemini conversation prompts. See the README for setup details.
