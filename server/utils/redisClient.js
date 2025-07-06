const { createClient } = require('redis');

const client = createClient({
  url:
    'rediss://default:AS5pAAIjcDE2OTA4Y2U5NWFhMDQ0YWM0OWVjODZjMTY0OWU2ZDM5N3AxMA@musical-terrier-11881.upstash.io:6379',
  socket: {
    tls: true
  }
});

client.on('error', err => console.error('Redis Client Error:', err));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

module.exports = { connectRedis ,client};
