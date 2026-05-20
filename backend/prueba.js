const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', data));
});

req.write(JSON.stringify({
  email: 'funciona@test.com',
  password: 'Test123456',
  name: 'Juan Perez',
  role: 'candidato'
}));
req.end();
