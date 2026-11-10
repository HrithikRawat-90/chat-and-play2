import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

// Import server (which calls startServer)
import { app } from './server.js';

async function waitForServer(baseURL, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${baseURL}/api/health`);
      if (res.ok) return true;
    } catch (e) {
      // Wait 500ms and retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('Server did not start in time');
}

async function runTests() {
  console.log('--- STARTING MODULE 1 AUTHENTICATION TESTS ---');

  const baseURL = 'http://localhost:5000';
  await waitForServer(baseURL);

  const testUser = {
    name: 'Alice Johnson',
    email: `alice_${Date.now()}@example.com`,
    password: 'password123',
    bio: 'Loving the dark purple vibes!',
  };

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
    // 1. Health check
    console.log('[Test 1] Health check endpoint...');
    const health = await makeRequest('/api/health');
    console.assert(health.status === 200, `Health check failed with ${health.status}`);
    console.log('✓ Health check passed:', health.body.status);

    // 2. Register new user
    console.log('[Test 2] User Registration...');
    const regRes = await makeRequest('/api/auth/register', 'POST', testUser);
    console.assert(regRes.status === 201, `Register failed with ${regRes.status}: ${JSON.stringify(regRes.body)}`);
    console.assert(regRes.body.token, 'Token not received on register');
    console.assert(regRes.body.user.email === testUser.email.toLowerCase(), 'Email mismatch');
    console.log('✓ Registration passed. User ID:', regRes.body.user._id);

    const authToken = regRes.body.token;

    // 3. Register duplicate email
    console.log('[Test 3] Duplicate Email Rejection...');
    const dupRes = await makeRequest('/api/auth/register', 'POST', testUser);
    console.assert(dupRes.status === 400, `Duplicate register should return 400, got ${dupRes.status}`);
    console.log('✓ Duplicate registration rejected as expected (400)');

    // 4. Login with correct password
    console.log('[Test 4] User Login with correct credentials...');
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      email: testUser.email,
      password: testUser.password,
    });
    console.assert(loginRes.status === 200, `Login failed with ${loginRes.status}`);
    console.assert(loginRes.body.token, 'Token missing in login response');
    console.log('✓ Login successful. Welcome', loginRes.body.user.name);

    // 5. Login with wrong password
    console.log('[Test 5] User Login with incorrect credentials...');
    const wrongLogin = await makeRequest('/api/auth/login', 'POST', {
      email: testUser.email,
      password: 'wrongpassword',
    });
    console.assert(wrongLogin.status === 401, `Wrong login should return 401, got ${wrongLogin.status}`);
    console.log('✓ Incorrect login rejected as expected (401)');

    // 6. Access protected route with valid token
    console.log('[Test 6] Access /api/auth/me with valid Bearer token...');
    const meRes = await makeRequest('/api/auth/me', 'GET', null, authToken);
    console.assert(meRes.status === 200, `/me failed with ${meRes.status}`);
    console.assert(meRes.body.user.name === testUser.name, 'User data mismatch');
    console.log('✓ Protected route accessed successfully:', meRes.body.user.name);

    // 7. Access protected route without token
    console.log('[Test 7] Access /api/auth/me without token...');
    const noAuth = await makeRequest('/api/auth/me', 'GET');
    console.assert(noAuth.status === 401, `No auth should return 401, got ${noAuth.status}`);
    console.log('✓ Unauthorized access blocked as expected (401)');

    // 8. Logout
    console.log('[Test 8] User Logout...');
    const logoutRes = await makeRequest('/api/auth/logout', 'POST', null, authToken);
    console.assert(logoutRes.status === 200, `Logout failed with ${logoutRes.status}`);
    console.log('✓ Logout endpoint successful');

    console.log('\n--- ALL MODULE 1 BACKEND AUTHENTICATION TESTS PASSED! ---');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();
