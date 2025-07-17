// utils/sipScheduler.js
const cron = require('node-cron');
const axios = require('axios');
const MutualFund = require('../models/mutualFundsModel');
const logger = require('./logger');

// Configuration
const CRON_SCHEDULE = '59 12 * * *'; // Run daily at 10:59 AM
const MAX_ATTEMPTS = 3;
const COLD_START_DELAY = 15000; // 15 seconds
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

class SipTransactionScheduler {
  constructor() {
    this.isProcessing = false;
    this.keepAliveInterval = null;
  }

  async initialize() {
    this.startKeepAlive();
    this.scheduleSipJob();
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

  scheduleSipJob() {
    cron.schedule(
      CRON_SCHEDULE,
      async () => {
        if (this.isProcessing) {
          logger.info('SIP job already running - skipping');
          return;
        }

        this.isProcessing = true;
        logger.info('Starting scheduled SIP transaction job...');

        try {
          await new Promise(resolve => setTimeout(resolve, COLD_START_DELAY));

          let success = false;
          let attempts = 0;
          let lastError = null;

          while (!success && attempts < MAX_ATTEMPTS) {
            attempts++;
            try {
              await this.processSipTransactions();
              success = true;
              logger.info(`SIP job completed on attempt ${attempts}`);
            } catch (error) {
              lastError = error;
              logger.warn(`SIP attempt ${attempts} failed: ${error.message}`);
              if (attempts < MAX_ATTEMPTS) {
                const delay = COLD_START_DELAY * attempts;
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }

          if (!success) throw lastError;
        } catch (error) {
          logger.error(
            `SIP job failed after ${MAX_ATTEMPTS} attempts: ${error.message}`
          );
          // Optional: Notify via email/slack
        } finally {
          this.isProcessing = false;
        }
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );

    logger.info(`SIP job scheduled: ${CRON_SCHEDULE}`);
  }

  async processSipTransactions() {
    logger.cron.jobStart('sip-transaction-processing');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayOfMonth = yesterday.getDate();

    const eligibleSips = await MutualFund.find({
      sipStatus: 'active',
      investmentType: 'sip',
      sipDay: dayOfMonth
    });

    logger.info(`Found ${eligibleSips.length} eligible SIPs`);

    for (const sip of eligibleSips) {
      try {
        await this.processSingleSip(sip, yesterday);
      } catch (error) {
        logger.error(
          `Failed to process SIP for holder ${sip.holderId}: ${error.message}`
        );
      }
    }

    logger.cron.jobSuccess('sip-transaction-processing', {
      processedCount: eligibleSips.length
    });
  }

  async processSingleSip(sip, transactionDate) {
    const MAX_RETRIES = 3;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      try {
        const res = await axios.get(
          `https://api.mfapi.in/mf/${sip.AMFI}/latest`,
          { headers: { Authorization: undefined } }
        );

        if (res.data.status !== 'SUCCESS' || !res.data.data?.[0]?.nav) {
          throw new Error(`NAV fetch failed for AMFI ${sip.AMFI}`);
        }

        const latestNav = parseFloat(res.data.data[0].nav);
        const units = sip.sipAmount / latestNav;

        await MutualFund.findByIdAndUpdate(sip._id, {
          $push: {
            sipTransactions: {
              date: transactionDate,
              amount: sip.sipAmount,
              nav: latestNav,
              units
            }
          },
          $set: { lastUpdated: new Date() }
        });

        logger.info(
          `SIP recorded: ${sip.schemeName} NAV: ${latestNav}, Units: ${units}`
        );
        return;
      } catch (error) {
        attempts++;
        if (attempts < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        } else {
          throw error;
        }
      }
    }
  }
}

module.exports = new SipTransactionScheduler();
