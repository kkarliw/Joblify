async function run() {
  try {
    console.log("Haciendo request...");
    const res = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_node_' + Date.now() + '@test.com',
        password: 'Password123!',
        name: 'Test Node',
        role: 'candidato'
      })
    });
    console.log("STATUS:", res.status);
    console.log("BODY:", await res.text());
  } catch(e) {
    console.log("ERROR:", e);
  }
}
run();
