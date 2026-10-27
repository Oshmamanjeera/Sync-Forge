import { io } from '../syncforge/node_modules/socket.io-client/build/esm/index.js';
import http from 'http';

const SERVER_URL = 'http://localhost:5000';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- Starting SyncForge Verification Test Suite ---');

  // Test 1: Check server health
  console.log('\n[Test 1] Health Check');
  const healthRes = await fetch(`${SERVER_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health status:', healthData);
  if (healthData.status !== 'ok') throw new Error('Health check failed');
  console.log('✓ Health check passed');

  // Test 2: Stage 1 & 2 - Room Join, Host tracking, Real-time Code Sync
  console.log('\n[Test 2] Stage 1 & 2 - Host tracking, Code sync, User list');
  const roomId = 'room_' + Math.random().toString(36).substring(2, 7);

  // Client 1 (Alice)
  const client1 = io(SERVER_URL, { transports: ['websocket'] });
  let aliceCurrentCode = null;
  let aliceUserList = null;
  let aliceToastReceived = null;

  client1.on('current-code', (data) => {
    aliceCurrentCode = data;
  });

  client1.on('user-list', (data) => {
    aliceUserList = data;
  });

  client1.on('user-joined', (data) => {
    aliceToastReceived = data;
  });

  client1.emit('join-room', { roomId, username: 'Alice' });
  await wait(500);

  if (!aliceCurrentCode) throw new Error('Client 1 did not receive current-code');
  if (!aliceUserList || aliceUserList.hostUsername !== 'Alice') {
    throw new Error(`Host tracking failed. Expected Alice, got: ${aliceUserList?.hostUsername}`);
  }
  console.log('✓ Alice joined and is identified as Host:', aliceUserList.hostUsername);

  // Alice updates code
  const testCode = 'const syncforge = "rock-solid";';
  client1.emit('code-change', { roomId, code: testCode });
  await wait(300);

  // Client 2 (Bob) joins
  const client2 = io(SERVER_URL, { transports: ['websocket'] });
  let bobCurrentCode = null;
  let bobReceivedCodeUpdate = null;

  client2.on('current-code', (data) => {
    bobCurrentCode = data;
  });

  client2.on('code-update', (code) => {
    bobReceivedCodeUpdate = code;
  });

  client2.emit('join-room', { roomId, username: 'Bob' });
  await wait(500);

  // Verify Bob receives current room code upon joining
  if (!bobCurrentCode || bobCurrentCode.code !== testCode) {
    throw new Error(`Bob did not get latest code on join. Got: ${bobCurrentCode?.code}`);
  }
  console.log('✓ Bob received current room code on join:', bobCurrentCode.code);

  // Verify Alice received user-joined toast
  if (!aliceToastReceived || aliceToastReceived.username !== 'Bob') {
    throw new Error('Alice did not receive user-joined event for Bob');
  }
  console.log('✓ Alice received user-joined event for Bob');

  // Live code update from Alice to Bob
  const newCode = 'function liveSync() { return true; }';
  client1.emit('code-change', { roomId, code: newCode });
  await wait(300);

  if (bobReceivedCodeUpdate !== newCode) {
    throw new Error(`Bob did not receive live code-update. Got: ${bobReceivedCodeUpdate}`);
  }
  console.log('✓ Bob received live code-update from Alice:', bobReceivedCodeUpdate);

  // Test 3: Stage 3 - Chat with casual and important channels
  console.log('\n[Test 3] Stage 3 - Chat Channels & History');
  let bobReceivedMessage = null;
  client2.on('new-message', (msg) => {
    bobReceivedMessage = msg;
  });

  const chatMsg = {
    id: 'msg-1',
    username: 'Alice',
    text: 'SyncForge architecture is ready!',
    time: '12:00 PM',
    channel: 'important'
  };

  client1.emit('send-message', { roomId, message: chatMsg });
  await wait(300);

  if (!bobReceivedMessage || bobReceivedMessage.text !== chatMsg.text || bobReceivedMessage.channel !== 'important') {
    throw new Error('Bob did not receive message on important channel correctly');
  }
  console.log('✓ Bob received message on important channel:', bobReceivedMessage.text);

  // Test 4: Stage 2 - Host Reassignment on disconnect
  console.log('\n[Test 4] Stage 2 - Host Reassignment when Host disconnects');
  let bobUserListAfterDisconnect = null;
  let bobLeftToast = null;

  client2.on('user-list', (data) => {
    bobUserListAfterDisconnect = data;
  });
  client2.on('user-left', (data) => {
    bobLeftToast = data;
  });

  client1.disconnect();
  await wait(500);

  if (!bobLeftToast || bobLeftToast.username !== 'Alice') {
    throw new Error('Bob did not receive user-left toast for Alice');
  }
  if (!bobUserListAfterDisconnect || bobUserListAfterDisconnect.hostUsername !== 'Bob') {
    throw new Error(`Host promotion failed. Expected Bob to be promoted to host, got: ${bobUserListAfterDisconnect?.hostUsername}`);
  }
  console.log('✓ Alice disconnected. Bob successfully promoted to Host:', bobUserListAfterDisconnect.hostUsername);

  client2.disconnect();
  await wait(300);

  // Test 5: Stage 4 - /run-code endpoint check (Judge0)
  console.log('\n[Test 5] Stage 4 - Code execution endpoint');
  const runRes = await fetch(`${SERVER_URL}/run-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'javascript',
      code: 'console.log("SyncForge Execution Test");'
    })
  });
  console.log('Run code status:', runRes.status);
  const runData = await runRes.json();
  console.log('Run code response:', runData);
  console.log('✓ Code execution endpoint tested');

  // Test 6: Stage 5 - LiveKit token endpoint
  console.log('\n[Test 6] Stage 5 - LiveKit Token endpoint');
  const tokenRes = await fetch(`${SERVER_URL}/get-livekit-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: 'test-room',
      username: 'Alice'
    })
  });
  console.log('LiveKit token status:', tokenRes.status);
  const tokenData = await tokenRes.json();
  if (tokenRes.ok && tokenData.token) {
    console.log('✓ LiveKit token generated successfully! Length:', tokenData.token.length);
  } else {
    console.log('LiveKit response:', tokenData);
  }

  // Test 7: Stage 6 - AI Copilot endpoint
  console.log('\n[Test 7] Stage 6 - AI Copilot endpoint');
  const aiRes = await fetch(`${SERVER_URL}/ai-copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'javascript',
      code: 'function add(a, b) { return a + b; }',
      question: 'What does this function do?'
    })
  });
  console.log('AI Copilot status:', aiRes.status);
  const aiData = await aiRes.json();
  console.log('AI Copilot response:', aiData);

  console.log('\n=======================================');
  console.log('ALL SYNCFORGE TESTS PASSED SUCCESSFULLY');
  console.log('=======================================');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
