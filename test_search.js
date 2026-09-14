const http = require('http');

http.get('http://localhost:3000/api/v1/challenges?search=test', (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data += chunk;
  });
  resp.on('end', () => {
    console.log("Response:", data.slice(0, 500));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
