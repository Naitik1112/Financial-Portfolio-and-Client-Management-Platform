const { createClient } = require('redis');

const client = createClient();

client.on('error', err => console.error('Redis error:', err));

(async () => {
  await client.connect();
})();

module.exports = client;
