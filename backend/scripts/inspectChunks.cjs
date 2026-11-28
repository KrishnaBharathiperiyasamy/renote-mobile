async function inspect() {
  const res = await fetch('http://localhost:6001/pages/login');
  const text = await res.text();
  const regex = /_next\/static\/chunks\/[^"]+\.js/g;
  const matches = [...new Set(text.match(regex) || [])];
  console.log('Found chunks on live page:');
  for (const chunk of matches) {
    const chunkRes = await fetch('http://localhost:6001/' + chunk);
    const chunkText = await chunkRes.text();
    const hasLocalhostBackend = chunkText.includes('localhost:6003');
    const hasRenoteProd = chunkText.includes('renote.co.in');
    console.log('-', chunk, '| Has localhost:6003:', hasLocalhostBackend, '| Has renote.co.in:', hasRenoteProd);
  }
}
inspect().catch(console.error);
