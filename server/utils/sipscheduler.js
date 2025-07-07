const cron = require('node-cron');
const axios = require('axios');
const MutualFund = require('../models/mutualFundsModel'); // Adjust path as needed
const logger = require('./logger');

class SipTransactionScheduler {
  constructor() {
    this.isProcessing = false;
  }

  initialize() {
    // Schedule to run every day at 10:00 AM IST
    cron.schedule(
      '56 13 * * *',
      () => {
        this.processSipTransactions();
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );
    logger.info(
      'SIP Transaction Scheduler initialized - runs daily at 10:00 AM IST'
    );
  }

  async processSipTransactions() {
    if (this.isProcessing) {
      logger.warn('SIP transaction processing already in progress');
      return;
    }

    this.isProcessing = true;
    logger.cron.jobStart('sip-transaction-processing');

    try {
      // Get yesterday's date (previous day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dayOfMonth = yesterday.getDate();

      // Step 1: Find all eligible SIPs
      const eligibleSips = await MutualFund.find({
        sipStatus: 'active',
        investmentType: 'sip',
        sipDay: dayOfMonth
      });

      logger.info(`Found ${eligibleSips.length} eligible SIPs for processing`);

      // Step 2: Process each SIP
      for (const sip of eligibleSips) {
        try {
          await this.processSingleSip(sip, yesterday);
        } catch (error) {
          logger.error(
            `Failed to process SIP for holder ${sip.holderId}: ${error.message}`
          );
          // Continue with next SIP even if one fails
        }
      }

      logger.cron.jobSuccess('sip-transaction-processing', {
        processedCount: eligibleSips.length
      });
    } catch (error) {
      logger.cron.jobFailure('sip-transaction-processing', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processSingleSip(sip, transactionDate) {
    const MAX_RETRIES = 3;
    let attempts = 0;
    let lastError = null;

    while (attempts < MAX_RETRIES) {
      try {
        // ... existing API call and processing logic ...
        // Step 3: Get latest NAV from API
        const apiResponse = await axios.get(
          `https://api.mfapi.in/mf/${sip.AMFI}/latest`,
          { headers: { Authorization: undefined } }
        );

        if (
          apiResponse.data.status !== 'SUCCESS' ||
          !apiResponse.data.data?.[0]?.nav
        ) {
          throw new Error(`Failed to fetch NAV for AMFI code ${sip.AMFI}`);
        }

        const latestNav = parseFloat(apiResponse.data.data[0].nav);
        const units = sip.sipAmount / latestNav;

        // Create new SIP transaction
        const newTransaction = {
          date: transactionDate,
          amount: sip.sipAmount,
          nav: latestNav,
          units: units
        };

        // Update the mutual fund document
        await MutualFund.findByIdAndUpdate(sip._id, {
          $push: { sipTransactions: newTransaction },
          $set: { lastUpdated: new Date() }
        });

        logger.info(
          `Added SIP transaction for ${sip.schemeName} (NAV: ${latestNav}, Units: ${units})`
        );
        return; // Success - exit the function
      } catch (error) {
        attempts++;
        lastError = error;
        if (attempts < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }
        throw lastError;
      }
    }
  }
}

// Singleton instance
module.exports = new SipTransactionScheduler();
