const { createClient } = require('redis');

const client = createClient({
  url:
    'rediss://default:AS5pAAIjcDE2OTA4Y2U5NWFhMDQ0YWM0OWVjODZjMTY0OWU2ZDM5N3AxMA@musical-terrier-11881.upstash.io:6379',
  socket: {
    tls: true
  }
});

client.on('error', err => console.error('Redis Client Error:', err));

(async () => {
  try {
    await client.connect();
    console.log('Connected to Redis!');
    const pong = await client.ping();
    console.log('Ping response:', pong);
    await client.disconnect();
  } catch (err) {
    console.error('Connection failed:', err);
  }
})();
