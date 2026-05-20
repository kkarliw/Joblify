async function testHealth() {
  console.log("Probando health...");
  const res = await fetch('http://localhost:4000/health');
  console.log("STATUS:", res.status);
  console.log("BODY:", await res.text());
}
testHealth();
