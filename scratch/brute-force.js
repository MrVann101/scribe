const WebSocket = require('ws');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data).models;
    const modelNames = models.map(m => m.name.replace('models/', ''));
    
    let currentIdx = 0;

    function testNext() {
      if (currentIdx >= modelNames.length) {
        console.log("Finished all models. No success.");
        process.exit(0);
      }

      const model = modelNames[currentIdx];
      currentIdx++;

      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      const ws = new WebSocket(url);

      ws.on('open', () => {
        ws.send(JSON.stringify({
          setup: {
            model: `models/${model}`,
            system_instruction: { parts: [{ text: "You are a transcriber." }] },
            generation_config: { response_modalities: ['TEXT'] },
          }
        }));
      });

      ws.on('message', (data) => {
        console.log(`[${model}] SUCCESS! Message received: ${data.toString()}`);
        process.exit(0);
      });

      ws.on('close', (code, reason) => {
        if (code === 1008) {
          // console.log(`[${model}] Failed 1008`);
          testNext();
        } else {
          console.log(`[${model}] Closed with code ${code}: ${reason}`);
          testNext();
        }
      });

      ws.on('error', (err) => {
        console.error(`[${model}] Error:`, err);
        testNext();
      });
    }

    testNext();
  });
});
