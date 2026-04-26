const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connected to WS');
  ws.send(JSON.stringify({
    setup: {
      model: 'models/gemini-2.0-flash-exp',
      systemInstruction: { parts: [{ text: "You are a transcriber." }] },
      generationConfig: { responseModalities: ['TEXT'] },
    }
  }));
});

ws.on('message', (data) => {
  console.log('Message:', data.toString());
  process.exit(0);
});

ws.on('close', (code, reason) => {
  console.log(`Closed: ${code} ${reason.toString()}`);
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('Error:', err);
});
