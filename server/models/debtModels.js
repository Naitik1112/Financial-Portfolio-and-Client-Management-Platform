const mongoose = require('mongoose');
const BusinessSnapshot = require('./businessSnapshot');

const debtSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  bankDetails: {
    type: String,
    required: [true, 'A FD must have a Bank Detail'],
    trim: true
  },
  AccountNumber: {
    type: String,
    required: [true, 'A FD must have an Account Number']
  },
  MaturityDate: {
    type: Date,
    required: [true, 'A FD must have a Maturity Date']
  },
  holderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A policy must have a client ID']
  },
  nominee1Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  nominee2Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  nominee3Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  startDate: {
    type: Date,
    required: [true, 'A FD must have a Start Date']
  },
  intrestRate: {
    type: Number,
    required: [true, 'A FD must have an Interest Rate']
  },
  amount: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  maturityAmount: {
    type: Number,
    default: 0
  }
});

async function calculateMonthlyDebtContributions(debt) {
  try {
    const results = {};
    const today = new Date();
    const startDate = new Date(debt.startDate);
    const maturityDate = new Date(debt.MaturityDate);

    // Calculate monthly interest accrual
    let currentDate = new Date(startDate);
    const monthlyInterestRate = debt.intrestRate / 100 / 12;

    while (currentDate <= today && currentDate <= maturityDate) {
      const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM format

      // Initialize month if not exists
      results[monthKey] = results[monthKey] || {
        debt: 0,
        todayDebt: 0
      };

      // Calculate interest for this month
      const monthlyInterest = debt.amount;

      // Add to totals
      results[monthKey].debt += monthlyInterest;

      // Mark if this is today's month
      if (
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      ) {
        results[monthKey].todayDebt += monthlyInterest;
      }

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return results;
  } catch (err) {
    console.error('Error in calculateMonthlyDebtContributions:', err);
    throw err;
  }
}

async function triggerSnapshot(adminId) {
  try {
    // Get all debt funds for this admin
    const allDebts = await DebtFunds.find({ adminId });
    const monthlyAggregates = {}; // {YYYY-MM: {debt, todayDebt}}

    // Aggregate all debt contributions
    for (const debt of allDebts) {
      try {
        const contributions = await calculateMonthlyDebtContributions(debt);
        console.log(contributions);
        // Merge contributions into monthly aggregates
        for (const [monthKey, values] of Object.entries(contributions)) {
          monthlyAggregates[monthKey] = monthlyAggregates[monthKey] || {
            debt: 0,
            todayDebt: 0
          };

          // Ensure values are numbers before adding
          monthlyAggregates[monthKey].debt += Number(values.debt) || 0;
          monthlyAggregates[monthKey].todayDebt +=
            Number(values.todayDebt) || 0;
        }
      } catch (err) {
        console.error(`Error processing debt ${debt._id}: ${err.message}`);
      }
    }

    // Update all affected months in BusinessSnapshot
    for (const [monthKey, values] of Object.entries(monthlyAggregates)) {
      const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);

      try {
        const existingSnapshot = await BusinessSnapshot.findOne({
          date: {
            $gte: monthStart,
            $lt: new Date(
              monthStart.getFullYear(),
              monthStart.getMonth() + 1,
              1
            )
          },
          adminId
        });

        if (existingSnapshot) {
          // Update existing snapshot with validated numbers
          existingSnapshot.fdTotalAmount = Number(values.debt) || 0;
          existingSnapshot.todayDebt = Number(values.todayDebt) || 0;
          await existingSnapshot.save();
        } else {
          // Create new snapshot with validated numbers
          await BusinessSnapshot.create({
            adminId,
            date: monthStart,
            fdTotalAmount: Number(values.debt) || 0,
            todayDebt: Number(values.todayDebt) || 0,
            // Initialize other fields to 0
            lifeInsuranceTotal: 0,
            generalInsuranceTotal: 0,
            sipTotalBook: 0,
            lumpsumTotal: 0,
            todaySip: 0,
            todayLumpsum: 0,
            todayRedemption: 0,
            todayLifeInsurance: 0,
            todayGeneralInsurance: 0,
            AUM: 0
          });
        }
      } catch (err) {
        console.error(
          `Failed to update snapshot for ${monthKey}:`,
          err.message
        );
      }
    }

    console.log('Debt fund snapshots updated successfully for admin:', adminId);
  } catch (err) {
    console.error('Failed to update debt fund snapshots:', err.message);
    throw err;
  }
}

debtSchema.pre('save', function(next) {
  const P = this.amount;
  const R = this.intrestRate / 100;
  const n = 4; // quarterly compounding
  const start = this.startDate;
  const maturity = this.MaturityDate;

  if (!start || !maturity || !P || !R) {
    this.tax = 0;
    this.maturityAmount = 0;
    return next();
  }

  const timeInYears = (maturity - start) / (1000 * 60 * 60 * 24 * 365.25);
  const A = P * Math.pow(1 + R / n, n * timeInYears);

  this.maturityAmount = +A.toFixed(2);

  const interestEarned = A - P;

  const TAX_RATE = 0.1; // example 10%
  this.tax = interestEarned > 0 ? +(interestEarned * TAX_RATE).toFixed(2) : 0;

  next();
});

debtSchema.virtual('computedTax').get(function() {
  const P = this.amount;
  const R = this.intrestRate / 100;
  const n = 4;
  const timeInYears =
    (this.MaturityDate - this.startDate) / (1000 * 60 * 60 * 24 * 365.25);
  const A = P * Math.pow(1 + R / n, n * timeInYears);
  const interest = A - P;
  return interest > 0 ? +(interest * 0.1).toFixed(2) : 0;
});

debtSchema.virtual('computedMaturityAmount').get(function() {
  const P = this.amount;
  const R = this.intrestRate / 100;
  const n = 4;
  const timeInYears =
    (this.MaturityDate - this.startDate) / (1000 * 60 * 60 * 24 * 365.25);
  const A = P * Math.pow(1 + R / n, n * timeInYears);
  return +A.toFixed(2);
});

// Add these hooks to your debt funds model
debtSchema.post('save', async function(doc) {
  try {
    await triggerSnapshot(doc.adminId);
  } catch (err) {
    console.error('Error in post-save hook:', err);
  }
});

debtSchema.post('remove', async function(doc) {
  try {
    await triggerSnapshot(doc.adminId);
  } catch (err) {
    console.error('Error in post-remove hook:', err);
  }
});

debtSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (doc) {
      await triggerSnapshot(doc.adminId);
    }
  } catch (err) {
    console.error('Error in post-findOneAndUpdate hook:', err);
  }
});

debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

const DebtFunds = mongoose.model('DebtFunds', debtSchema);
module.exports = DebtFunds;
