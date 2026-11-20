# Chat & Play

Chat & Play is a real-time messaging app where users can talk, share images and voice messages, and play Tic-Tac-Toe together. It uses React for the frontend, Express and Socket.IO for the backend, and MongoDB to store accounts and conversations.

## Features

- Register, sign in, and update your profile.
- Find users, start private conversations, and create or join groups.
- Send messages and attachments with live presence and typing indicators.
- Invite a chat partner to a game of Tic-Tac-Toe.
- Block or report users and delete conversations.
- Chat with a built-in assistant and use Gemini-powered writing suggestions when an API key is configured.

## Getting started

You'll need Node.js 20.19 or a later 20.x release, or Node.js 22.12 or later, along with npm and a MongoDB database. The backend also tries to start an in-memory MongoDB instance if it cannot connect to the configured database. That fallback needs a compatible MongoDB binary and does not provide persistent storage.

1. Install the dependencies from the project root:

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

2. Create a `backend/.env` file with your settings. For example:

   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=mongodb://127.0.0.1:27017/chat_and_play
   JWT_SECRET=replace_with_a_strong_secret
   JWT_EXPIRE=30d
   ```

   Replace the secret and database address as needed. Add `GEMINI_API_KEY` if you want live AI responses. Keep this file private.

3. Start the backend and frontend in separate terminals, both from the project root:

   ```bash
   npm run server
   ```

   ```bash
   npm run client
   ```

4. Open [http://localhost:5173](http://localhost:5173) and create an account. The backend runs on port 5000 by default.

## Configuration

The backend supports these environment settings:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port; defaults to 5000. |
| `NODE_ENV` | Application environment. Use `production` to serve the built frontend from the backend. |
| `CLIENT_URL` | Frontend origin used for development CORS. |
| `MONGODB_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign authentication tokens. |
| `JWT_EXPIRE` | Token lifetime. |
| `GEMINI_API_KEY` | Optional key for Gemini responses and writing assistance. |
| `REPORT_ADMIN_USER_ID` | MongoDB ID of the account that receives user reports. |

### User reports

Reports appear in a separate, read-only **Reports from Chatbot** conversation; they are not emailed or included in Gemini prompts. To enable reports, register the administrator account as `admin@gmail.com`, verify that you control it, and set `REPORT_ADMIN_USER_ID` to that account's MongoDB `_id`. Registration does not verify email ownership, so the email address alone is not enough to identify the administrator. Restart the backend after setting the ID.

You can find the ID in a trusted MongoDB console:

```javascript
db.users.findOne({ email: 'admin@gmail.com' }, { _id: 1 })
```

Copy the ID without the `ObjectId(...)` wrapper. Reports remain unavailable until the ID and email match an existing non-bot account. Use a persistent database if reports need to survive a restart. If you change the administrator, remove or migrate the old report inbox according to your retention policy before enabling delivery to the new account.

For Render, set `REPORT_ADMIN_USER_ID` in the service's environment settings and use the database containing the administrator and chatbot accounts. The local `.env` file is not uploaded. Save the setting and restart the service.

## Tests

Run the test suites from the project root:

```bash
npm test
```

Individual suites are available as `npm run test:auth`, `test:chat`, `test:socket`, `test:game`, `test:ai`, and `test:e2e`. They start the backend and require a working MongoDB connection or a working in-memory fallback.

## Production

Build the frontend and install the dependencies with:

```bash
npm run build
```

Set the backend environment variables, including `NODE_ENV=production`, then start the app from the project root:

```bash
npm start
```

The backend serves the frontend build and API on the same port.

## Project structure

- `frontend/` contains the React app, components, contexts, and styles.
- `backend/` contains the API, database models, Socket.IO handlers, game logic, and tests.
- `ARCHITECTURE.md` contains additional details about the application's structure and events.
