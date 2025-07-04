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

const mfSchema = new mongoose.Schema(
  {
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

    lastRedemptionDate: {
      type: Date
    },

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
  },
  {
    timestamps: true // <-- this adds createdAt and updatedAt
  }
);

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

mfSchema.pre('save', function(next) {
  let dates = [];

  if (Array.isArray(this.redemptions)) {
    dates = dates.concat(this.redemptions.map(r => r.date));
  }

  if (Array.isArray(this.sipTransactions)) {
    for (const txn of this.sipTransactions) {
      if (Array.isArray(txn.redemptions)) {
        dates = dates.concat(txn.redemptions.map(r => r.date));
      }
    }
  }

  this.lastRedemptionDate = dates.length
    ? new Date(Math.max(...dates.map(d => new Date(d))))
    : undefined;

  next();
});

// Enhanced update middleware
// Enhanced update middleware
// async function handleUpdates(next) {
//   try {
//     // Skip if this is a new document or if hooks are skipped
//     if (this.isNew || this._skipHooks) {
//       return next();
//     }

//     // Get the update operation and document being updated
//     const update = this.getUpdate ? this.getUpdate() : {};
//     const doc = await this.model.findOne(
//       this.getQuery ? this.getQuery() : this._conditions
//     );

//     console.log('Model update runned');
//     console.log('Update object:', update);
//     // console.log('Existing doc:', doc);

//     // Skip if no document found or no meaningful update
//     if (!doc || (!update.$set && !update.$setOnInsert)) {
//       return next();
//     }

//     // Process redemptions dates
//     let dates = [];
//     if (Array.isArray(doc.redemptions)) {
//       dates = dates.concat(doc.redemptions.map(r => r.date));
//     }

//     if (Array.isArray(doc.sipTransactions)) {
//       for (const txn of doc.sipTransactions) {
//         if (Array.isArray(txn.redemptions)) {
//           dates = dates.concat(txn.redemptions.map(r => r.date));
//         }
//       }
//     }

//     // Update lastRedemptionDate
//     if (dates.length > 0) {
//       update.$set = update.$set || {};
//       update.$set.lastRedemptionDate = new Date(
//         Math.max(...dates.map(d => new Date(d)))
//       );
//     }

//     // Check if we should compute new transactions
//     const updateFields = update || {};
//     console.log('update fields', updateFields);
//     const shouldComputeTransactions =
//       // SIP conditions
//       (updateFields.AMFI && updateFields.AMFI !== doc.AMFI) ||
//       (updateFields.sipAmount && updateFields.sipAmount !== doc.sipAmount) ||
//       (updateFields.sipStartDate &&
//         new Date(updateFields.sipStartDate).getTime() !==
//           doc.sipStartDate.getTime()) ||
//       (updateFields.sipDay && updateFields.sipDay !== doc.sipDay) ||
//       (updateFields.sipStatus && updateFields.sipStatus !== doc.sipStatus) ||
//       (updateFields.sipEndDate &&
//         new Date(updateFields.sipEndDate).getTime() !==
//           (doc.sipEndDate?.getTime() || 0)) ||
//       // Lumpsum conditions
//       (updateFields.lumpsumAmount &&
//         updateFields.lumpsumAmount !== doc.lumpsumAmount) ||
//       (updateFields.lumpsumDate &&
//         new Date(updateFields.lumpsumDate).getTime() !==
//           doc.lumpsumDate.getTime());

//     console.log('Should compute transactions:', shouldComputeTransactions);

//     if (shouldComputeTransactions && doc.investmentType === 'sip') {
//       console.log('SIP transaction update started');

//       // Use updated values or fall back to existing values
//       const AMFI = updateFields.AMFI || doc.AMFI;
//       const sipAmount = updateFields.sipAmount || doc.sipAmount;
//       const sipStartDate = updateFields.sipStartDate
//         ? new Date(updateFields.sipStartDate)
//         : doc.sipStartDate;
//       const sipDay = updateFields.sipDay || doc.sipDay;
//       const sipStatus = updateFields.sipStatus || doc.sipStatus;
//       const sipEndDate = updateFields.sipEndDate
//         ? new Date(updateFields.sipEndDate)
//         : sipStatus === 'inactive'
//         ? new Date()
//         : null;

//       // Recalculate all transactions
//       const transactions = [];
//       let currentDate = new Date(sipStartDate);
//       const endDate = sipStatus === 'active' ? new Date() : sipEndDate;

//       while (currentDate <= endDate) {
//         const sipDate = new Date(currentDate);
//         sipDate.setDate(sipDay);

//         // Handle months with fewer days than SIP day
//         if (sipDate.getMonth() !== currentDate.getMonth()) {
//           sipDate.setDate(0); // Last day of previous month
//         }

//         if (sipDate >= sipStartDate && sipDate <= endDate) {
//           try {
//             const nav = await fetchNAV(AMFI, sipDate);

//             transactions.push({
//               _id: new mongoose.Types.ObjectId().toHexString(),
//               date: new Date(sipDate),
//               amount: Math.round(Number(sipAmount)),
//               nav: parseFloat(nav),
//               units: parseFloat((sipAmount / nav).toFixed(8)),
//               redeemedUnits: 0, // Initialize to 0
//               redemptions: [] // Initialize empty array
//             });
//           } catch (err) {
//             console.warn(
//               `Skipping SIP for ${sipDate.toISOString().split('T')[0]}: ${
//                 err.message
//               }`
//             );
//           }
//         }

//         // Move to next month
//         currentDate.setMonth(currentDate.getMonth() + 1);
//       }

//       // Update transactions and current value
//       update.$set = update.$set || {};
//       update.sipTransactions = transactions;
//       update.$set.lastUpdated = new Date();

//       // Recalculate current value
//       const currentNAV = await getCurrentNAV(AMFI);
//       const totalUnits = transactions.reduce((sum, txn) => sum + txn.units, 0);
//       update.$set.currentValue = totalUnits * currentNAV;
//     } else if (shouldComputeTransactions && doc.investmentType === 'lumpsum') {
//       console.log('Lumpsum update started');

//       const hasLumpsumChanges =
//         (updateFields.AMFI && updateFields.AMFI !== doc.AMFI) ||
//         (updateFields.lumpsumAmount &&
//           updateFields.lumpsumAmount !== doc.lumpsumAmount) ||
//         (updateFields.lumpsumDate &&
//           new Date(updateFields.lumpsumDate).getTime() !==
//             doc.lumpsumDate.getTime());

//       if (hasLumpsumChanges) {
//         const AMFI = updateFields.AMFI || doc.AMFI;
//         const lumpsumAmount = updateFields.lumpsumAmount || doc.lumpsumAmount;
//         const lumpsumDate = updateFields.lumpsumDate
//           ? new Date(updateFields.lumpsumDate)
//           : doc.lumpsumDate;

//         try {
//           update.redemptions = [];
//           update.$set.redeemedUnits = 0;
//           const navOnLumpsumDate = await fetchNAV(AMFI, lumpsumDate);
//           const units = parseFloat(
//             (lumpsumAmount / navOnLumpsumDate).toFixed(8)
//           );

//           const currentNAV = await getCurrentNAV(AMFI);
//           const currentValue = parseFloat((units * currentNAV).toFixed(2));

//           update.$set = update.$set || {};
//           update.$set.lumpsumUnits = units;
//           update.$set.lastUpdated = new Date();
//           update.$set.currentValue = currentValue;
//         } catch (err) {
//           console.warn(`Failed to update lumpsum details: ${err.message}`);
//         }
//       }
//     }

//     // Apply the updates
//     if (Object.keys(update.$set || {}).length > 0) {
//       this.setUpdate(update);
//     }

//     next();
//   } catch (err) {
//     console.error('Error in handleUpdates:', err);
//     next(err);
//   }
// }

async function handleUpdates(next) {
  try {
    if (this.isNew || this._skipHooks) return next();

    const update = this.getUpdate ? this.getUpdate() : {};
    const doc = await this.model.findOne(this.getQuery ? this.getQuery() : this._conditions);
    if (!doc) return next();

    // Allowed keys
    const allowedTopLevelKeys = ['sipStatus'];
    const allowedSetKeys = ['updatedAt', 'sipEndDate', 'lastUpdated'];

    // Validate top-level keys (excluding $set, $setOnInsert)
    const topLevelKeys = Object.keys(update).filter(k => !k.startsWith('$'));
    const hasInvalidTopKeys = topLevelKeys.some(k => !allowedTopLevelKeys.includes(k));
    if (hasInvalidTopKeys) {
      return next(new Error('Only "sipStatus" field is allowed to be updated.'));
    }

    // Validate $set keys if exists
    const setKeys = Object.keys(update.$set || {});
    const hasInvalidSetKeys = setKeys.some(k => !allowedSetKeys.includes(k));
    if (hasInvalidSetKeys) {
      return next(new Error('Only "sipStatus" and internal timestamp fields can be updated.'));
    }

    // Prevent status flip from inactive → active
    const oldStatus = doc.sipStatus;
    const newStatus = update.sipStatus;
    if (oldStatus === 'inactive' && newStatus === 'active') {
      return next(new Error('Cannot change SIP status from "inactive" to "active".'));
    }

    // Add sipEndDate and lastUpdated if status changed to inactive
    if (oldStatus === 'active' && newStatus === 'inactive') {
      update.$set = update.$set || {};
      update.$set.sipEndDate = new Date();
      update.$set.lastUpdated = new Date();
    }

    // Apply update
    this.setUpdate(update);
    next();
  } catch (err) {
    console.error('Error in handleUpdates:', err);
    next(err);
  }
}



// Add hooks
mfSchema.pre('save', calculateLumpsumUnits);
mfSchema.pre('save', processSIPTransactions);
mfSchema.pre('save', calculateCurrentValue);
mfSchema.pre('updateOne', handleUpdates);
mfSchema.pre('findOneAndUpdate', handleUpdates);

const MutualFund = mongoose.model('MutualFund', mfSchema);
module.exports = MutualFund;
