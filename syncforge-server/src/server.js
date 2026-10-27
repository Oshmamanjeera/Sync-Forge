import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const AI_MODELS = [

  'gemini-flash-lite-latest',   // alias, always works
  'gemini-3.8-flash',           // NEW flagship, free tier ✅ (from your error message)
  'gemini-3.5-flash-lite',      // NEW lite, free tier ✅ (from your error message)
  'gemini-flash-latest',        // alias, always works

  'gemini-3.6-flash'            // backup

];
const AI_RETRY_DELAYS_MS = [1000, 2000, 4000];

app.use(cors({ origin: CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(','), methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }));
app.use(express.json());

const io = new Server(server, { cors: { origin: CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(',') } });

const DEFAULT_CODE = {
  javascript: `// JavaScript Playground\nfunction greet(name) {\n  return \`Welcome to SyncForge, \${name}!\`;\n}\n\nconsole.log(greet("Developer"));\n`,
  python: `# Python Playground\ndef greet(name):\n    return f"Welcome to SyncForge, {name}!"\n\nprint(greet("Developer"))\n`,
  cpp: `// C++ Playground\n#include <iostream>\n\nint main() {\n    std::cout << "Welcome to SyncForge!" << std::endl;\n    return 0;\n}\n`,
  java: `// Java Playground\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Welcome to SyncForge!");\n    }\n}\n`,
  html: `<!DOCTYPE html>\n<html><body><h1>Welcome to SyncForge</h1></body></html>\n`
};

const rooms = new Map();
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { code: DEFAULT_CODE.javascript, language: 'javascript', users: [], hostUsername: null, chatHistory: [], videoCallActive: false });
  }
  return rooms.get(roomId);
}

// SOCKET.IO - FULL
io.on('connection', (socket) => {
  let currentRoomId = null; let currentUsername = null;
  socket.on('join-room', ({ roomId, username }) => {
    if (!roomId || !username) return;
    currentRoomId = roomId; currentUsername = username;
    socket.join(roomId);
    const room = getOrCreateRoom(roomId);
    const idx = room.users.findIndex(u => u.username === username);
    if (idx !== -1) room.users[idx].socketId = socket.id;
    else { room.users.push({ socketId: socket.id, username, joinedAt: Date.now() }); socket.to(roomId).emit('user-joined', { username }); }
    if (!room.hostUsername) room.hostUsername = username;
    socket.emit('current-code', { code: room.code, language: room.language });
    socket.emit('chat-history', room.chatHistory);
    if (room.videoCallActive) socket.emit('video-call-started');
    io.to(roomId).emit('user-list', { users: room.users.map(u => ({ username: u.username, isHost: u.username === room.hostUsername })), hostUsername: room.hostUsername });
  });
  socket.on('code-change', ({ roomId, code }) => { const r = rooms.get(roomId); if (r) { r.code = code; socket.to(roomId).emit('code-update', code); } });
  socket.on('language-change', ({ roomId, language }) => { const r = rooms.get(roomId); if (r) { r.language = language; r.code = DEFAULT_CODE[language] || r.code; io.to(roomId).emit('code-update', r.code); io.to(roomId).emit('language-update', language); } });
  socket.on('send-message', ({ roomId, message }) => { const r = rooms.get(roomId); if (r && message?.id && !r.chatHistory.some(m => m.id === message.id)) { r.chatHistory.push(message); io.to(roomId).emit('new-message', message); } });
  socket.on('start-video-call', ({ roomId }) => { const r = rooms.get(roomId); if (r) { r.videoCallActive = true; io.to(roomId).emit('video-call-started'); } });
  socket.on('disconnect', () => {
    if (!currentRoomId || !currentUsername) return;
    const room = rooms.get(currentRoomId); if (!room) return;
    const i = room.users.findIndex(u => u.username === currentUsername && u.socketId === socket.id);
    if (i !== -1) {
      room.users.splice(i, 1); socket.to(currentRoomId).emit('user-left', { username: currentUsername });
      if (room.users.length === 0) rooms.delete(currentRoomId);
      else { if (room.hostUsername === currentUsername) { room.hostUsername = room.users.slice().sort((a, b) => a.joinedAt - b.joinedAt)[0]?.username || null; } io.to(currentRoomId).emit('user-list', { users: room.users.map(u => ({ username: u.username, isHost: u.username === room.hostUsername })), hostUsername: room.hostUsername }); }
    }
  });
});

const JUDGE0_LANG_IDS = { javascript: 63, python: 71, cpp: 54, java: 62 };
app.post('/run-code', async (req, res) => {
  try {
    const { code, language } = req.body;
    const languageId = JUDGE0_LANG_IDS[language];
    if (!languageId) return res.json({ run: { output: 'HTML preview in client' } });
    const r = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_code: code, language_id: languageId }) });
    const data = await r.json();
    return res.json({ run: { output: data.stdout || data.stderr || data.compile_output || 'No output', time: data.time, memory: data.memory } });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/get-livekit-token', async (req, res) => {
  try {
    const { roomId, username } = req.body;
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: username, name: username });
    at.addGrant({ roomJoin: true, room: roomId, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    return res.json({ token });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// AI COPILOT - WORKING FOR FREE KEY
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
app.post('/ai-copilot', async (req, res) => {
  const { code, language, question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question required' });
  const api = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Language: ${language}\nCode:\n${code}\n\nQuestion: ${question}`;
  let lastErr = null;
  for (const model of AI_MODELS) {
    for (let attempt = 0; attempt <= AI_RETRY_DELAYS_MS.length; attempt++) {
      try {
        console.log(`[AI] Trying ${model} attempt ${attempt + 1}`);
        const result = await api.models.generateContent({ model, contents: prompt });
        return res.json({ answer: result.text });
      } catch (err) {
        lastErr = err;
        console.warn(`${model} failed: ${err.status} ${err.message}`);
        if ((err.status === 503 || err.status === 429) && attempt < AI_RETRY_DELAYS_MS.length) { await sleep(AI_RETRY_DELAYS_MS[attempt]); continue; }
        break;
      }
    }
  }
  return res.status(503).json({ error: 'AI busy, try again in 10s', details: lastErr?.message });
});

app.get('/health', (req, res) => res.json({ status: 'ok', activeRooms: rooms.size }));
server.listen(PORT, () => console.log(`SyncForge server running on port ${PORT}`));