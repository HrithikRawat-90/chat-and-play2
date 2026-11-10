# Chat & Play — MERN Real-Time Chat & Multiplayer Gaming Application

**Chat & Play** is a full-stack real-time messaging application featuring an integrated multiplayer Tic-Tac-Toe gaming experience directly inside conversation rooms. Built with the MERN stack (MongoDB, Express, React 19, Node.js), Tailwind CSS v4, and Socket.IO.

Designed with a sleek, dark-purple aesthetic inspired by modern messaging applications, Chat & Play enables two authenticated users to chat in real time, see typing indicators, share text and images, and challenge each other to a game of Tic-Tac-Toe without ever leaving their chat.

---

## 📸 User Interface Design

The application faithfully follows a dark-purple three-panel interface:
- **Left Sidebar**: Current user avatar with green online badge, search conversations, recent chats with timestamps and unread counters, Chats/Groups tabs, and a user discovery modal (`+`).
- **Center Chat Panel**: Contact info header, online status, audio/video call placeholders, collapsible info toggle, the standout **🎮 Play Together** button, scrollable message bubbles with timestamps, animated typing indicators, and message input with emoji picker & image sharing.
- **Right Sidebar (Collapsible)**: Large contact profile picture, bio status, "Media, Links and Files" photo grid, "Groups in common", notifications toggle, and safety controls (Block, Report, Delete Chat).

---

## 🚀 Key Features

1. **Authentication & Security**:
   - Secure registration and login with bcrypt password hashing (10 salt rounds).
   - JWT token authentication for REST APIs and Socket.IO handshakes.
   - Protected client routes with smooth session validation.

2. **Real-Time Communication (Socket.IO)**:
   - Instant messaging with conversation room isolation.
   - Live presence indicator (green dot updates instantly when users connect/disconnect).
   - Typing indicators with auto-clearing debouncing.
   - Real-time read receipt confirmations.
   - Message persistence in MongoDB with full history retrieval.

3. **Flagship Feature: Play Together (Tic-Tac-Toe)**:
   - Challenge chat partner directly via the **Play Together** button.
   - Real-time challenge notifications with Accept & Decline controls.
   - Interactive 3x3 game board overlay with Player X and Player O profile cards.
   - Live turn banners ("Your Turn (X)" with glowing pulsing ring).
   - Server-validated game logic: prevents playing out of turn, prevents overwriting cells, and prevents moves on finished games.
   - Automatic victory detection (rows, columns, diagonals) with winning line highlight.
   - Draw detection and score tracking across rematches.
   - "Play Again" rematch button and clean match exit.

4. **Zero-Setup Database Architecture**:
   - Seamless connection to local MongoDB (`mongodb://127.0.0.1:27017/chat_and_play`) or remote MongoDB Atlas.
   - Automatic built-in embedded in-memory MongoDB fallback with cached binary execution—enabling anyone to clone and run the application immediately without installing or configuring a MongoDB daemon.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19
  - Vite
  - Tailwind CSS v4
  - React Router DOM
  - Axios
  - Socket.IO Client
  - Lucide React icons
- **Backend**:
  - Node.js & Express.js
  - MongoDB & Mongoose
  - Socket.IO
  - JSON Web Tokens (JWT)
  - bcryptjs
  - cookie-parser & cors

---

## 📂 Project Structure

```text
ChattingApplication/
├── backend/
│   ├── config/
│   │   ├── db.js                 # Mongoose connection with embedded fallback
│   │   └── cleanDefaultUsers.js  # Cleans lingering mock accounts from DB
│   ├── controllers/
│   │   ├── authController.js     # Register, login, getMe, logout
│   │   ├── userController.js     # User search, block/unblock, report
│   │   └── chatController.js     # Conversations, messages & chat deletion
│   ├── games/
│   │   ├── ticTacToe.js          # Pure game engine & validation logic
│   │   └── gameManager.js        # In-memory multiplayer match manager
│   ├── middleware/
│   │   └── auth.js               # JWT Bearer token verification
│   ├── models/
│   │   ├── User.js               # User schema with bcrypt & blockedUsers
│   │   ├── Conversation.js       # 1-on-1 chat room schema
│   │   └── Message.js            # Persistent text & image messages
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── userRoutes.js         # /api/users routes (search, block, report)
│   │   └── chatRoutes.js         # /api/conversations & /api/messages routes
│   ├── socket/
│   │   └── socketHandler.js      # Socket.IO auth, rooms, messaging & gameplay
│   ├── server.js                 # HTTP server & static frontend serving
│   ├── test-auth.js              # Module 1 auth test suite (8 tests)
│   ├── test-chat.js              # Module 2 chat & actions test suite (12 tests)
│   ├── test-socket.js            # Module 3 Socket.IO test suite (11 tests)
│   ├── test-game.js              # Module 4 Tic-Tac-Toe test suite (8 tests)
│   └── test-e2e.js               # Module 5 Complete E2E integration test
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/         # 3-panel chat components (Sidebar, Feed, Input, ContactInfo)
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication state & session persistence
│   │   │   ├── ChatContext.jsx   # Active chat, search & message state
│   │   │   └── SocketContext.jsx # Socket.IO lifecycle & live presence
│   │   ├── games/
│   │   │   ├── GameContext.jsx   # Real-time multiplayer game state
│   │   │   ├── TicTacToeModal.jsx# 3x3 interactive board & scoreboard
│   │   │   └── GameInviteBanner.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ChatDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js        # Axios instance with Bearer interceptor
│   │   ├── socket/
│   │   │   └── socket.js     # Socket.IO client factory
│   │   ├── App.jsx           # Root application router
│   │   └── index.css         # Dark purple theme styling & scrollbars
│   ├── vite.config.js
│   └── index.html
├── PROJECT_PROGRESS.md       # Permanent project handover & progress tracker
├── ARCHITECTURE.md           # Database schemas, APIs, & Socket events
├── render.yaml               # Cloud deployment configuration
├── package.json              # Unified root scripts
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)
- *(Optional)* MongoDB locally or via MongoDB Atlas. If no MongoDB daemon is detected, the built-in embedded fallback launches automatically.

### 2. Installation

Clone or open the workspace and install all dependencies:

```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 3. Run Development Servers

Open two terminals (or run root commands):

**Terminal 1 — Backend Server:**
```bash
npm run server
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend Client:**
```bash
npm run client
# Runs on http://localhost:5173
```

Visit **http://localhost:5173** in your browser.

---

## 🧪 Automated Test Suites

You can execute all automated test suites covering all 5 modules with a single command from the root directory:

```bash
npm test
```

Or run individual module test suites:

```bash
# Module 1: Auth & User Model Tests (8 tests)
npm run test:auth

# Module 2: User Search & Chat History Tests (9 tests)
npm run test:chat

# Module 3: Socket.IO Real-Time Messaging & Presence Tests (11 tests)
npm run test:socket

# Module 4: Tic-Tac-Toe Pure Engine & Multiplayer Flow Tests (8 tests)
npm run test:game

# Module 5: Complete End-to-End User Lifecycle Test (10 checkpoints)
npm run test:e2e
```

---

## 🎓 College Demonstration Walkthrough

Follow these steps to demonstrate the application to professors or evaluators:

1. **Open Two Browser Windows**:
   - Open Browser 1 (e.g. Chrome) at `http://localhost:5173`.
   - Open Browser 2 (e.g. Chrome Incognito or Firefox) at `http://localhost:5173`.

2. **Log In or Register**:
   - Use the pre-seeded demo accounts or create your own:
     - **User 1**: `talan@chatplay.com` / `password123` (*Talan Septimus*)
     - **User 2**: `aubrey@chatplay.com` / `password123` (*Aubrey Webb*)

3. **Demonstrate Real-Time Chat**:
   - In Browser 1, select Aubrey from the chat list (or click `+` to search for Aubrey).
   - In Browser 2, select Talan.
   - Observe the **green online dot** indicator next to both names.
   - Type a message in Browser 1: notice the **animated typing indicator** appear in real-time in Browser 2!
   - Send the message: notice it appears instantly without page refresh in Browser 2.
   - Share a photo attachment using the image icon.

4. **Demonstrate the Flagship Feature: Play Together (Tic-Tac-Toe)**:
   - In Browser 1, click the **🎮 Play Together** button in the chat header.
   - In Browser 2, an **animated challenge banner** immediately appears: *"Talan Septimus challenged you to a real-time game of Tic-Tac-Toe"*.
   - In Browser 2, click **Accept & Play**.
   - Both browser windows instantly open the **shared multiplayer 3x3 game board**!
   - Make alternating moves:
     - Browser 1 places an `X` in the center. Both screens synchronize immediately.
     - Try clicking an occupied cell or moving out of turn: notice the move is strictly rejected by the backend server.
     - Complete a 3-in-a-row diagonal or row: notice the **winning line highlights in neon emerald**, the celebration banner appears, and the match score updates.
   - Click **Play Again**: the board clears for a rematch while preserving the scores!
   - Click **Leave Game**: the session closes smoothly for both participants.

---

## 🌐 Production Deployment

The backend server is configured to serve the built Vite frontend statically in production mode:

```bash
# 1. Build the frontend
npm run build

# 2. Start unified production server
npm start
```
The entire application runs on `http://localhost:5000`.

A ready-to-deploy [render.yaml](file:///e:/Projects/ChattingApplication/render.yaml) is included for 1-click cloud deployment on Render.
#   c h a t - a n d - p l a y  
 