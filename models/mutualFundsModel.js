const mongoose = require('mongoose');
const axios = require('axios');

const redemptionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now
    },
    units: Number,
    nav: Number
  },
  { _id: false }
);

const mfSchema = new mongoose.Schema({
  schemeName: {
    type: String,
    required: [true, 'A mutual fund must have a name'],
    trim: true
  },
  fundHouse: {
    type: String,
    required: [true, 'A mutual fund must have a fund house']
  },
  AMFI: {
    type: Number,
    required: [true, 'A mutual fund must have an AMFI number']
  },
  holderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A mutual fund must have a client ID']
  },
  nominee1Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [false]
  },
  nominee2Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [false]
  },
  nominee3Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [false]
  },
  investmentType: {
    type: String,
    enum: ['lumpsum', 'sip'],
    required: [true, 'Specify whether investment is lumpsum or SIP']
  },
  // Fields specific to lumpsum investments
  lumpsumAmount: {
    type: Number,
    required: function() {
      return this.investmentType === 'lumpsum';
    }
  },
  lumpsumDate: {
    type: Date,
    required: function() {
      return this.investmentType === 'lumpsum';
    }
  },
  lumpsumUnits: {
    type: Number
  },
  // Fields specific to SIP investments
  sipAmount: {
    type: Number,
    required: function() {
      return this.investmentType === 'sip';
    }
  },
  sipStartDate: {
    type: Date,
    required: function() {
      return this.investmentType === 'sip';
    }
  },
  sipEndDate: {
    type: Date
  },
  sipDay: {
    type: Number,
    min: 1,
    max: 31,
    required: function() {
      return this.investmentType === 'sip';
    }
  },
  sipStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },

  redeemedUnits: {
    type: Number,
    default: 0
  },

  redemptions: [redemptionSchema],

  // Add to each SIP transaction
  sipTransactions: [
    {
      date: Date,
      amount: Number,
      nav: Number,
      units: Number,
      redeemedUnits: {
        type: Number,
        default: 0
      },
      redemptions: [redemptionSchema]
    }
  ],
  // Common fields
  currentValue: {
    type: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Helper function to find closest NAV date
async function fetchNAV(AMFI, targetDate) {
  try {
    const url = `https://api.mfapi.in/mf/${AMFI}`;
    const response = await axios.get(url, {
      // Override headers to remove Authorization for this request
      headers: {
        Authorization: undefined
      }
    });

    if (!response.data?.data?.length) {
      throw new Error('No NAV data available for the given AMFI code');
    }

    // Parse and sort the NAV data
    const navData = response.data.data
      .map(record => ({
        date: new Date(
          record.date
            .split('-')
            .reverse()
            .join('-')
        ),
        nav: parseFloat(record.nav)
      }))
      .sort((a, b) => a.date - b.date);

    // Find the closest NAV date to our target date
    let closestNAV = null;
    let minDiff = Infinity;

    for (const record of navData) {
      const diff = Math.abs(record.date - targetDate);
      if (diff < minDiff) {
        minDiff = diff;
        closestNAV = record.nav;
      }
    }

    // Check if the closest date is within 50 days
    if (minDiff > 50 * 24 * 60 * 60 * 1000) {
      throw new Error(
        'No NAV data available within 50 days of the target date'
      );
    }

    return closestNAV;
  } catch (err) {
    throw new Error(`Failed to fetch NAV: ${err.message}`);
  }
}

// Calculate current NAV for valuation
async function getCurrentNAV(AMFI) {
  try {
    const url = `https://api.mfapi.in/mf/${AMFI}`;
    const response = await axios.get(url, {
      // Override headers to remove Authorization for this request
      headers: {
        Authorization: undefined
      }
    });

    if (!response.data?.data?.length) {
      throw new Error('No NAV data available');
    }

    // Get the most recent NAV (first record in the array)
    return parseFloat(response.data.data[0].nav);
  } catch (err) {
    throw new Error(`Failed to fetch current NAV: ${err.message}`);
  }
}

// Pre-save hook for lumpsum investments
async function calculateLumpsumUnits(next) {
  if (this._skipHooks) return next();
  if (this.investmentType !== 'lumpsum') return next();

  try {
    if (
      this.isModified('AMFI') ||
      this.isModified('lumpsumAmount') ||
      this.isModified('lumpsumDate')
    ) {
      const nav = await fetchNAV(this.AMFI, this.lumpsumDate);
      this.lumpsumUnits = this.lumpsumAmount / nav;
    }
    next();
  } catch (err) {
    next(err);
  }
}
// Enhanced pre-save hook for SIP investments
async function processSIPTransactions(next) {
  if (this._skipHooks) return next();
  if (this.investmentType !== 'sip') return next();

  try {
    // Check if we need to recalculate transactions (either new doc or relevant fields modified)
    const shouldRecalculate =
      this.isNew ||
      this.isModified('AMFI') ||
      this.isModified('sipAmount') ||
      this.isModified('sipStartDate') ||
      this.isModified('sipDay') ||
      this.isModified('sipStatus') ||
      (this.isModified('sipEndDate') && this.sipStatus === 'inactive');

    if (shouldRecalculate) {
      // Clear existing transactions
      this.sipTransactions = [];

      let currentDate = new Date(this.sipStartDate);
      const endDate =
        this.sipStatus === 'active' ? new Date() : this.sipEndDate;

      // Process each month's investment
      while (currentDate <= endDate) {
        // Set the day of month for SIP
        const sipDate = new Date(currentDate);
        sipDate.setDate(this.sipDay);

        // Adjust for months where the SIP day doesn't exist
        if (sipDate.getMonth() !== currentDate.getMonth()) {
          sipDate.setDate(0); // Last day of previous month
        }

        // Only add if within the valid date range
        if (sipDate >= this.sipStartDate && sipDate <= endDate) {
          try {
            const nav = await fetchNAV(this.AMFI, sipDate);
            this.sipTransactions.push({
              date: sipDate,
              amount: this.sipAmount,
              nav: nav,
              units: this.sipAmount / nav
            });
          } catch (err) {
            console.warn(
              `Skipping SIP for ${sipDate.toISOString().split('T')[0]}: ${
                err.message
              }`
            );
          }
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

async function calculateCurrentValue(next) {
  try {
    if (this._skipHooks) return next();
    const currentNAV = await getCurrentNAV(this.AMFI);

    if (this.investmentType === 'lumpsum') {
      this.currentValue = this.lumpsumUnits * currentNAV;
    } else if (this.investmentType === 'sip') {
      const totalUnits = this.sipTransactions.reduce(
        (sum, txn) => sum + txn.units,
        0
      );
      this.currentValue = totalUnits * currentNAV;
    }

    this.lastUpdated = new Date();
    next();
  } catch (err) {
    next(err);
  }
}

// Enhanced update middleware
// Enhanced update middleware
async function handleUpdates(next) {
  try {
    console.log(this._skipHooks);
    if (this._skipHooks) return next();
    console.log('In model');
    const update = this.getUpdate();
    const doc = await this.model.findOne(this.getQuery());

    // Check if we should compute new transactions
    const shouldComputeTransactions =
      (update.AMFI && update.AMFI !== doc.AMFI) ||
      (update.sipAmount && update.sipAmount !== doc.sipAmount) ||
      (update.sipStartDate &&
        new Date(update.sipStartDate).getTime() !==
          doc.sipStartDate.getTime()) ||
      (update.sipDay && update.sipDay !== doc.sipDay) ||
      (update.sipStatus && update.sipStatus !== doc.sipStatus) ||
      (update.sipEndDate &&
        new Date(update.sipEndDate).getTime() !==
          (doc.sipEndDate?.getTime() || 0));

    if (shouldComputeTransactions && doc.investmentType === 'sip') {
      // Use updated values or fall back to existing values
      const AMFI = update.AMFI || doc.AMFI;
      const sipAmount = update.sipAmount || doc.sipAmount;
      const sipStartDate = update.sipStartDate
        ? new Date(update.sipStartDate)
        : doc.sipStartDate;
      const sipDay = update.sipDay || doc.sipDay;
      const sipStatus = update.sipStatus || doc.sipStatus;
      const sipEndDate = update.sipEndDate
        ? new Date(update.sipEndDate)
        : sipStatus === 'inactive'
        ? new Date()
        : null;

      // Recalculate all transactions
      const transactions = [];
      let currentDate = new Date(sipStartDate);
      const endDate = sipStatus === 'active' ? new Date() : sipEndDate;

      while (currentDate <= endDate) {
        const sipDate = new Date(currentDate);
        sipDate.setDate(sipDay);

        // Handle months with fewer days than SIP day
        if (sipDate.getMonth() !== currentDate.getMonth()) {
          sipDate.setDate(0); // Last day of previous month
        }

        if (sipDate >= sipStartDate && sipDate <= endDate) {
          try {
            const nav = await fetchNAV(AMFI, sipDate);

            transactions.push({
              _id: new mongoose.Types.ObjectId().toHexString(),
              date: new Date(sipDate).toISOString(), // ensure ISO format
              amount: Math.round(Number(sipAmount)), // ensure integer
              nav: parseFloat(nav),
              units: parseFloat((sipAmount / nav).toFixed(8)) // round to 8 decimals
            });
          } catch (err) {
            console.warn(
              `Skipping SIP for ${sipDate.toISOString().split('T')[0]}: ${
                err.message
              }`
            );
          }
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      console.log('new transaction');
      console.log(transactions);
      // Force update transactions
      update.$set = update.$set || {};
      update.sipTransactions = transactions;
      update.lastUpdated = new Date();

      // Recalculate current value
      const currentNAV = await getCurrentNAV(AMFI);
      const totalUnits = transactions.reduce((sum, txn) => sum + txn.units, 0);
      update.$set.currentValue = totalUnits * currentNAV;
    } else if (doc.investmentType === 'lumpsum') {
      console.log('passed1');
      const hasLumpsumChanges =
        (update.AMFI && update.AMFI !== doc.AMFI) ||
        (update.lumpsumAmount && update.lumpsumAmount !== doc.lumpsumAmount) ||
        (update.lumpsumDate &&
          new Date(update.lumpsumDate).getTime() !== doc.lumpsumDate.getTime());

      if (hasLumpsumChanges) {
        const AMFI = update.AMFI || doc.AMFI;
        const lumpsumAmount = update.lumpsumAmount || doc.lumpsumAmount;
        const lumpsumDate = update.lumpsumDate
          ? new Date(update.lumpsumDate)
          : doc.lumpsumDate;

        try {
          console.log('passed2');
          const navOnLumpsumDate = await fetchNAV(AMFI, lumpsumDate);
          const units = parseFloat(
            (lumpsumAmount / navOnLumpsumDate).toFixed(8)
          );

          const currentNAV = await getCurrentNAV(AMFI);
          const currentValue = parseFloat((units * currentNAV).toFixed(2));
          console.log('new units : ', units);
          console.log(currentValue);
          update.$set = update.$set || {};
          update.lumpsumUnits = units;
          update.lastUpdated = new Date();
          update.$set.currentValue = currentValue;
          console.log('newest : ', update.lumpsumUnits);
        } catch (err) {
          console.warn(`Failed to update lumpsum details: ${err.message}`);
        }
      }
    }

    this.setUpdate(update);
    next();
  } catch (err) {
    next(err);
  }
}

// Add hooks
mfSchema.pre('save', calculateLumpsumUnits);
mfSchema.pre('save', processSIPTransactions);
mfSchema.pre('save', calculateCurrentValue);
mfSchema.pre('findOneAndUpdate', handleUpdates);

const MutualFund = mongoose.model('MutualFund', mfSchema);
module.exports = MutualFund;
