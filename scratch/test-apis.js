const http = require('http');

const req = http.request('http://localhost:3001/api/sessions', {
  method: 'GET',
  headers: { 'Accept': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('GET /api/sessions Status:', res.statusCode);
    console.log('Response:', data.slice(0, 500));
  });
});

req.end();
