const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connected to WS');
  ws.send(JSON.stringify({
    setup: {
      model: 'models/gemini-2.5-flash',
      system_instruction: { parts: [{ text: "You are a transcriber." }] },
      generation_config: { response_modalities: ['TEXT'] },
    }
  }));
});

ws.on('message', (data) => {
  console.log('Message:', data.toString());
});

ws.on('close', (code, reason) => {
  console.log(`Closed: ${code} ${reason.toString()}`);
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('Error:', err);
});
