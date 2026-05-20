const http = require('http');

// Test 1: Register
console.log('Test 1: Registering user...');
const registerData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  role: 'CANDIDATO'
});

const registerOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

const registerReq = http.request(registerOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      const parsed = JSON.parse(data);
      console.log('\nTest 1 PASSED: User registered');
      console.log('User:', parsed.user);
      console.log('Token:', parsed.accessToken ? 'Present' : 'Missing');
      
      // Test 2: Login
      setTimeout(() => {
        console.log('\n\nTest 2: Logging in...');
        const loginData = JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        });
        
        const loginOptions = {
          hostname: 'localhost',
          port: 4000,
          path: '/api/auth/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
          }
        };
        
        const loginReq = http.request(loginOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Response:', data);
            
            if (res.statusCode === 200) {
              const parsed = JSON.parse(data);
              console.log('\nTest 2 PASSED: User logged in');
              console.log('User:', parsed.user);
              console.log('Token:', parsed.accessToken ? 'Present' : 'Missing');
            } else {
              console.log('\nTest 2 FAILED');
            }
          });
        });
        
        loginReq.on('error', (e) => console.error('Login error:', e.message));
        loginReq.write(loginData);
        loginReq.end();
      }, 1000);
    } else {
      console.log('\nTest 1 FAILED');
    }
  });
});

registerReq.on('error', (e) => console.error('Register error:', e.message));
registerReq.write(registerData);
registerReq.end();
