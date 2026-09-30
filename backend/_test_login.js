fetch('http://127.0.0.1:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'naik', password: 'naik123' })
}).then(async r => {
  const body = await r.json();
  console.log('HTTP Status:', r.status);
  console.log('Body:', JSON.stringify(body, null, 2));
}).catch(e => console.error('Fetch error:', e.message));
