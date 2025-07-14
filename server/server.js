const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const path = require('path');
const { connectRedis, client } = require('./utils/redisClient'); // Make sure client is exported from redisClient
const axios = require('axios');

dotenv.config({ path: './config.env' });
const app = require('./app');

// Replace the whole refreshAmfiCache function:
async function refreshAmfiCache() {
  console.log('⏳ Running scheduled AMFI cache refresh...');

  try {
    const response = await axios.get('https://api.mfapi.in/mf', {
      headers: {
        Authorization: undefined
      }
    });
    const data = response.data;

    const schemeMap = {};
    for (const item of data) {
      schemeMap[item.schemeCode] = item.schemeName;
    }

    await client.set('amfi_scheme_map', JSON.stringify(schemeMap), {
      EX: 86400 // 24 hours
    });

    console.log(
      '✅ AMFI cache refreshed successfully. Items:',
      Object.keys(schemeMap).length
    );
  } catch (err) {
    console.error('❌ AMFI cache refresh failed:', err.message || err);
    throw err;
  }
}

// Initialize cache refresh schedule
function initializeCacheRefresh() {
  // Refresh immediately on startup
  refreshAmfiCache().catch(err => {
    console.error('Initial cache refresh failed:', err);
  });

  // Then refresh every hour
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(() => {
    refreshAmfiCache().catch(err => {
      console.error('Scheduled cache refresh failed:', err);
    });
  }, ONE_HOUR);

  console.log('🔄 AMFI cache refresh scheduled to run hourly');
}

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log('DB connection successful!');

    // Start cron scheduler
    // const scheduler = require('./utils/cronScheduler');
    // scheduler.initialize();

    require('./utils/sipscheduler').initialize();
    require('./utils/cronScheduler').initialize();
  })
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });

const port = process.env.PORT || 3000;

require('./scheduler/businessScheduler');

connectRedis()
  .then(() => {
    console.log('✅ Connected to Redis');

    // Initialize the cache refresh schedule after Redis connects
    initializeCacheRefresh();

    const server = app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });

    process.on('unhandledRejection', err => {
      console.error('Unhandled Rejection:', err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to Redis:', err);
    process.exit(1);
  });
