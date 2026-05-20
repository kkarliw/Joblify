const http = require('http');

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('🧪 Iniciando pruebas...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Health Check...');
    const health = await makeRequest('GET', '/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data)}\n`);

    // Test 2: Registro
    console.log('2️⃣ Registro de Candidato...');
    const register = await makeRequest('POST', '/api/auth/register', {
      email: 'test@example.com',
      password: 'Test123456',
      name: 'Test User',
      role: 'candidato',
      headline: 'Desarrollador',
      location: 'Bogotá',
      profileData: {
        experienceYears: 3,
        availability: 'fulltime',
        expectedSalary: 50000,
        modalityPref: 'remote'
      }
    });
    console.log(`   Status: ${register.status}`);
    console.log(`   Response: ${JSON.stringify(register.data, null, 2)}\n`);

    if (register.status === 201) {
      console.log('✅ Registro exitoso');
      console.log(`   Email: ${register.data.user.email}`);
      console.log(`   Role: ${register.data.user.role}`);
      console.log(`   Mensaje: ${register.data.message}\n`);
    } else {
      console.log('❌ Error en registro');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  process.exit(0);
}

test();
