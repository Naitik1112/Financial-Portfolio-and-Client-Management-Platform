// utils/cronScheduler.js
const cron = require('node-cron');
const { fetchAndStoreSnapshot } = require('./snapshotUtils');
const logger = require('./logger');
const axios = require('axios');

// Configuration
const CRON_SCHEDULE = '40 22 * * *'; // Daily at 11:30 PM
const MAX_ATTEMPTS = 3;
const COLD_START_DELAY = 15000; // 15 seconds
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

class SnapshotScheduler {
  constructor() {
    this.isProcessing = false;
    this.keepAliveInterval = null;
  }

  async initialize() {
    this.startKeepAlive();
    this.scheduleSnapshotJob();
  }

  startKeepAlive() {
    if (process.env.NODE_ENV !== 'production') return;

    this.keepAliveInterval = setInterval(() => {
      this.pingOwnServer().catch(() => {});
    }, PING_INTERVAL);
  }

  async pingOwnServer() {
    try {
      await axios.get(`${process.env.BACKEND_URL}/health`, { timeout: 5000 });
    } catch (error) {
      logger.warn('Keep-alive ping failed (normal during cold start)');
    }
  }

  scheduleSnapshotJob() {
    cron.schedule(
      CRON_SCHEDULE,
      async () => {
        if (this.isProcessing) {
          logger.info('Snapshot job already running - skipping');
          return;
        }

        this.isProcessing = true;
        logger.info('Starting scheduled snapshot job...');

        try {
          // Initial delay to account for cold starts
          await new Promise(resolve => setTimeout(resolve, COLD_START_DELAY));

          let success = false;
          let attempts = 0;
          let lastError = null;

          while (!success && attempts < MAX_ATTEMPTS) {
            attempts++;
            try {
              await fetchAndStoreSnapshot();
              success = true;
              logger.info(
                `Snapshot completed successfully on attempt ${attempts}`
              );
            } catch (error) {
              lastError = error;
              logger.warn(`Attempt ${attempts} failed: ${error.message}`);

              if (attempts < MAX_ATTEMPTS) {
                const delay = COLD_START_DELAY * attempts;
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }

          if (!success) {
            throw lastError;
          }
        } catch (error) {
          logger.error(
            `Snapshot job failed after ${MAX_ATTEMPTS} attempts: ${error.message}`
          );
          // Add notification logic here (email, Slack, etc.)
        } finally {
          this.isProcessing = false;
        }
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata' // Adjust to your timezone
      }
    );

    logger.info(`Snapshot job scheduled: ${CRON_SCHEDULE}`);
  }
}

module.exports = new SnapshotScheduler();
