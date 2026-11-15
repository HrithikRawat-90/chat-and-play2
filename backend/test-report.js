import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import { reportUser } from './controllers/userController.js';
import { login } from './controllers/authController.js';

const reporterId = new mongoose.Types.ObjectId();
const reportedId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();
const botId = new mongoose.Types.ObjectId();
const conversationId = new mongoose.Types.ObjectId();
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });

test('reports require a trusted admin and are delivered only to the admin inbox', async (t) => {
  const originalEnv = process.env.REPORT_ADMIN_USER_ID;
  t.after(() => { if (originalEnv === undefined) delete process.env.REPORT_ADMIN_USER_ID; else process.env.REPORT_ADMIN_USER_ID = originalEnv; });
  t.mock.method(User, 'findById', async () => ({ _id: reportedId, name: 'Reported User' }));
  const req = { user: { _id: reporterId, name: 'Reporter' }, body: { reportedUserId: reportedId.toString(), reason: 'Spam', details: 'Repeated messages' } };
  delete process.env.REPORT_ADMIN_USER_ID;
  let res = response();
  await reportUser(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.success, false);

  process.env.REPORT_ADMIN_USER_ID = adminId.toString();
  t.mock.method(User, 'findOne', async (query) => query.email === 'admin@gmail.com' ? { _id: adminId } : { _id: botId });
  const inbox = { _id: conversationId, participants: [adminId, botId], save: async () => {}, updatedAt: new Date() };
  t.mock.method(Conversation, 'findOneAndUpdate', async (query, update) => {
    assert.equal(query.isModerationInbox, true);
    assert.deepEqual(update.$setOnInsert.participants, [adminId, botId]);
    return inbox;
  });
  let written;
  t.mock.method(Message, 'create', async (data) => { written = data; return { _id: new mongoose.Types.ObjectId(), createdAt: new Date() }; });
  t.mock.method(Message, 'findById', () => ({ populate: async () => ({ text: written.text }) }));
  const events = [];
  req.io = { to: (room) => ({ emit: (event, payload) => events.push({ room, event, payload }) }) };
  res = response();
  await reportUser(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(written.senderId.toString(), botId.toString());
  assert.match(written.text, /Reason: Spam/);
  assert.equal(events.length, 2);
  assert.ok(events.every((event) => event.room === `user:${adminId}`));
});

test('the system chatbot cannot log in', async (t) => {
  t.mock.method(User, 'findOne', () => ({ select: async () => ({ isBot: true, matchPassword: async () => true }) }));
  const res = response();
  await login({ body: { email: 'chatbot@chatplay.ai', password: 'password' } }, res);
  assert.equal(res.statusCode, 401);
});
