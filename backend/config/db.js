import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat_and_play';

  try {
    // Try the configured database before starting the in-memory fallback.
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Could not connect to MongoDB at ${uri} (${err.message}).`);
    console.log('[Database] Starting built-in in-memory MongoDB fallback server...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');

      // Use the cached binary when available.
      const possibleBinaryPaths = [
        path.resolve(__dirname, '../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe'),
        path.resolve(process.cwd(), 'node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.6.exe'),
      ];

      const existingBinary = possibleBinaryPaths.find((p) => fs.existsSync(p));

      const serverOpts = {};
      if (existingBinary) {
        serverOpts.binary = { systemBinary: existingBinary };
      }

      mongodInstance = await MongoMemoryServer.create(serverOpts);
      const memoryUri = mongodInstance.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-memory MongoDB Connected successfully: ${memoryUri}`);

      const cleanup = async () => {
        if (mongodInstance) {
          await mongoose.disconnect();
          await mongodInstance.stop();
        }
        process.exit(0);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      return conn;
    } catch (memErr) {
      console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

export default connectDB;
