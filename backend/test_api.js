async function test() {
  console.log("Probando...");
  const res = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test_' + Date.now() + '@test.com',
      password: 'Password123!',
      name: 'Tester',
      role: 'candidato'
    })
  });
  console.log("STATUS:", res.status);
  console.log("BODY:", await res.text());
}
test();
