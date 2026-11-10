import dotenv from 'dotenv';
dotenv.config();

import { app } from './server.js';
import { ensureChatbotUser, GEMINI_FALLBACK_MODELS } from './services/geminiService.js';
import User from './models/User.js';

async function waitForServer(baseURL, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${baseURL}/api/health`);
      if (res.ok) return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('Server did not start in time');
}

async function runAiTests() {
  console.log('--- STARTING GEMINI AI & CHATBOT INTEGRATION TESTS ---');
  const baseURL = 'http://localhost:5000';
  await waitForServer(baseURL);

  const makeRequest = async (path, method = 'GET', data = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    const json = await res.json();
    return { status: res.status, body: json };
  };

  try {
    const ts = Date.now();

    // 1. Register a test human user
    console.log('[Test 1] Registering human test user...');
    const userRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Human Tester',
      email: `human_${ts}@test.com`,
      password: 'password123',
    });
    console.assert(userRes.status === 201, 'User registration failed');
    const token = userRes.body.token;
    console.log('✓ Human user registered');

    // 2. Ensure Chatbot system user exists
    console.log('[Test 2] Verifying Chatbot user creation...');
    const bot = await ensureChatbotUser();
    console.assert(bot && bot.isBot === true, 'Chatbot user must exist with isBot: true');
    console.assert(bot.name === 'Chatbot', 'Chatbot name mismatch');
    console.log('✓ Chatbot user verified. ID:', bot._id.toString());

    // 3. User lists users and sees Chatbot
    console.log('[Test 3] User searches for Chatbot in directory...');
    const searchRes = await makeRequest('/api/users?search=Chatbot', 'GET', null, token);
    console.assert(searchRes.status === 200, 'Search failed');
    console.assert(searchRes.body.users.some((u) => u.isBot === true), 'Chatbot must appear in user list');
    console.log('✓ Chatbot found in user search');

    // 4. Test AI status endpoint
    console.log('[Test 4] Testing GET /api/ai/status...');
    const statusRes = await makeRequest('/api/ai/status', 'GET', null, token);
    console.assert(statusRes.status === 200, 'Status check failed');
    console.assert(statusRes.body.activeModel === 'gemini-3.8-flash', 'Active model should be gemini-3.8-flash');
    console.assert(Array.isArray(statusRes.body.models), 'Models list must be an array');
    console.log('✓ AI Status verified. Fallback models:', statusRes.body.models.join(' -> '));

    // 5. Test AI Suggestion with empty draft
    console.log('[Test 5] Testing AI Smart Reply Suggestion (empty draft)...');
    const suggestRes = await makeRequest('/api/ai/suggest', 'POST', {
      draft: '',
      context: [
        { senderId: { name: 'Alice' }, text: 'Are you free for coffee this afternoon?' },
      ],
    }, token);
    console.assert(suggestRes.status === 200, 'Suggest failed');
    console.assert(Array.isArray(suggestRes.body.suggestions) && suggestRes.body.suggestions.length > 0, 'Suggestions missing');
    console.log('✓ AI Suggestions generated:', suggestRes.body.suggestions);

    // 6. Test AI Suggestion with user draft (polish/improve)
    console.log('[Test 6] Testing AI Draft Polishing (with user text)...');
    const polishRes = await makeRequest('/api/ai/suggest', 'POST', {
      draft: 'hey let do it',
      context: [],
    }, token);
    console.assert(polishRes.status === 200, 'Polish failed');
    console.assert(polishRes.body.suggestedText, 'Suggested text missing');
    console.log('✓ AI Draft Polished to:', polishRes.body.suggestedText);

    // 7. Start 1-on-1 Conversation with Chatbot
    console.log('[Test 7] Starting 1-on-1 Conversation with Chatbot...');
    const convRes = await makeRequest('/api/conversations', 'POST', {
      recipientId: bot._id.toString(),
    }, token);
    console.assert(convRes.status === 200, 'Conversation creation with bot failed');
    const conversationId = convRes.body.conversation._id;
    console.log('✓ Chatbot Conversation created. ID:', conversationId);

    console.log('\n--- ALL GEMINI AI & CHATBOT TESTS PASSED! ---');
    process.exit(0);
  } catch (err) {
    console.error('AI Test error:', err);
    process.exit(1);
  }
}

runAiTests();
