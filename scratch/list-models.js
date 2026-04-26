const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

https.get(`https://generativelanguage.googleapis.com/v1alpha/models?key=${apiKey}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data).models;
    models.forEach(m => {
      console.log(m.name, m.supportedGenerationMethods);
    });
  });
});
