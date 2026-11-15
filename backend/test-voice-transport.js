import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as clientIo } from 'socket.io-client';
import { sendMessageWithAck } from '../frontend/src/socket/sendMessage.js';

test('voice data survives a real Socket.IO send and acknowledgement', async (t) => {
  const http = createServer();
  const io = new Server(http, { maxHttpBufferSize: 10 * 1024 * 1024 });
  await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve));
  const socket = clientIo(`http://127.0.0.1:${http.address().port}`, { transports: ['websocket'] });
  t.after(() => { socket.disconnect(); io.close(); });
  const audioUrl = `data:audio/webm;base64,${'A'.repeat(1_200_000)}`;
  io.on('connection', (peer) => peer.on('message:send', (message, acknowledge) => {
    acknowledge({ success: true, message });
  }));
  await new Promise((resolve, reject) => { socket.on('connect', resolve); socket.on('connect_error', reject); });
  const result = await new Promise((resolve) => sendMessageWithAck(socket, { conversationId: 'sample', text: '', audioUrl }, resolve));
  assert.equal(result.success, true);
  assert.equal(result.message.audioUrl, audioUrl);
});

test('a disconnected socket reports failure', () => {
  sendMessageWithAck({ connected: false }, { audioUrl: 'sample' }, (response) => {
    assert.equal(response.success, false);
  });
});
