const http = require('http');

const data = JSON.stringify({
  email: 'nonexistent@test.com',
  contact: '1234567890'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/request-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(data);
req.end();
