const http = require('http');

const data = JSON.stringify({
  email: 'test_final_error_' + Date.now() + '@test.com',
  password: 'Password123!',
  name: 'Test Final',
  role: 'candidato'
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', error => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
