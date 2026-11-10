# Chat & Play — System Architecture & Documentation

## 1. High-Level Architecture

Chat & Play uses a decoupled client-server architecture built on the MERN stack:

```text
┌─────────────────────────────────┐
│     React 19 Frontend (Vite)     │
│  - Tailwind CSS dark-purple UI  │
│  - React Router DOM             │
│  - Axios (REST History)         │
│  - Socket.IO Client (Real-time) │
│  - Tic-Tac-Toe Multiplayer Board│
└──────────────┬──────────────────┘
               │  REST API (/api/...)
               │  WebSocket (Socket.IO)
┌──────────────▼──────────────────┐
│      Express.js Backend         │
│  - Node.js runtime              │
│  - JWT Bearer Authentication    │
│  - Socket.IO Server             │
│  - In-memory Game Engine        │
└──────────────┬──────────────────┘
               │  Mongoose ODM
┌──────────────▼──────────────────┐
│          MongoDB                │
│  - Users Collection             │
│  - Conversations Collection     │
│  - Messages Collection          │
│  (Or MongoMemoryServer fallback)│
└─────────────────────────────────┘
```

---

## 2. Database Schema Design

### 2.1 User Collection (`backend/models/User.js`)
Stores account credentials, profile details, and presence state.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `name` | String | User's full display name (required, max 50 chars) |
| `email` | String | Unique email address (indexed, lowercase, trim) |
| `password` | String | Salted bcrypt hash (hidden by default via `select: false`) |
| `profilePicture`| String | URL to user's profile image / DiceBear avatar |
| `bio` | String | User status message (max 150 chars) |
| `isOnline` | Boolean | Presence status flag (default `false`) |
| `lastSeen` | Date | Timestamp of last activity |
| `createdAt` / `updatedAt` | Date | Automatic Mongoose timestamps |

### 2.2 Conversation Collection (`backend/models/Conversation.js`)
Stores 1-on-1 private messaging channels between participants.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `participants` | `[ObjectId]` | References to `User` model IDs |
| `lastMessage` | Object | `{ text: String, sender: ObjectId, createdAt: Date }` |
| `unreadCounts` | Map | Stores unread message count mapped per user ID |
| `createdAt` / `updatedAt` | Date | Automatic Mongoose timestamps |

### 2.3 Message Collection (`backend/models/Message.js`)
Stores persistent text and image chat messages.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `conversationId` | ObjectId | Reference to `Conversation` (indexed) |
| `senderId` | ObjectId | Reference to `User` |
| `text` | String | Text content of the message |
| `imageUrl` | String | Optional URL to attached image |
| `replyTo` | Object | `{ text: String, senderName: String }` |
| `isRead` | Boolean | Read receipt status |
| `createdAt` / `updatedAt` | Date | Automatic Mongoose timestamps |

---

## 3. REST API Specification

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Registers a user, returns JWT and user payload |
| `POST` | `/api/auth/login` | Public | Verifies credentials, returns JWT and user payload |
| `GET` | `/api/auth/me` | Protected | Returns the authenticated user's profile |
| `POST` | `/api/auth/logout` | Protected | Sets `isOnline: false` and clears session |

### User Management Routes (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Protected | Search users (`?search=query`), excluding caller |
| `GET` | `/api/users/:id` | Protected | Get public user profile |

### Chat & Conversation Routes (`/api`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/conversations` | Protected | List all conversations for authenticated user |
| `POST` | `/api/conversations` | Protected | Find or create 1-on-1 conversation with `recipientId` |
| `GET` | `/api/messages/:conversationId` | Protected | Fetch chronological messages with membership verification |
| `POST` | `/api/messages` | Protected | Post message (`conversationId`, `text`, `imageUrl`, `replyTo`) |

---

## 4. In-Memory Multiplayer Game Engine (`backend/games/`)

Per the specification, game state is managed in server memory with low latency and clean disconnection cleanup:

```javascript
{
  gameId: 'ttt_6af2ab..._179428...',
  conversationId: '6af2ab...',
  players: {
    X: { id: 'user1_id', name: 'Gamer One', profilePicture: '...' },
    O: { id: 'user2_id', name: 'Gamer Two', profilePicture: '...' }
  },
  scores: { X: 1, O: 0, draws: 0 },
  board: [null, null, null, null, null, null, null, null, null],
  turn: 'X',
  status: 'in_progress', // 'in_progress' | 'completed'
  winner: null,          // null | 'X' | 'O' | 'draw'
  winningLine: null,     // null | [0, 1, 2]
  movesCount: 0
}
```

### Game Rules Enforced:
1. Only the player whose turn it is can make a move.
2. Occupied cells cannot be overwritten.
3. Completed matches reject subsequent moves.
4. All 8 winning lines (horizontal, vertical, diagonal) are calculated on the backend.
5. Ties are declared when 9 moves elapse without a winner.
6. Rematch resets the board to 9 nulls while retaining scores.

---

## 5. Socket.IO Real-Time Architecture

### Active Events:
- **Presence**:
  - `user:online`: Broadcast when a user connects (`{ userId, isOnline: true }`)
  - `user:offline`: Broadcast when all user sockets disconnect (`{ userId, isOnline: false, lastSeen }`)
  - `users:online:list`: Initial list of online user IDs sent to connected socket
- **Rooms**:
  - `join:conversation`: Join private conversation room (`{ conversationId }`) with membership check
  - `leave:conversation`: Leave private conversation room (`{ conversationId }`)
- **Messaging**:
  - `message:send`: Client sends message (`{ conversationId, text, imageUrl, replyTo }`)
  - `message:receive`: Server broadcasts populated message to room and writes to MongoDB
  - `conversation:updated`: Server notifies participants' personal user rooms to update sidebar preview
- **Typing Indicator**:
  - `typing:start`: Broadcasts typing state to room partners (`{ conversationId, userId, userName }`)
  - `typing:stop`: Broadcasts typing cessation to room partners (`{ conversationId, userId }`)
- **Read Receipts**:
  - `message:read`: Broadcasts read confirmation to room partners (`{ conversationId, messageId }`)
- **Multiplayer Game (Tic-Tac-Toe)**:
  - `game:invite`: Initiator invites conversation partner to Tic-Tac-Toe
  - `game:invite:received`: Delivers challenge to recipient
  - `game:accept`: Starts game session, assigns 'X' and 'O', and emits initial state
  - `game:reject`: Declines invitation and notifies initiator
  - `game:move`: Player submits cell index (0–8); server validates and broadcasts updated board
  - `game:updated`: Broadcasts board state, active turn, winner, or draw
  - `game:rematch`: Resets board with score retention
  - `game:exit`: Terminates session and notifies both players
