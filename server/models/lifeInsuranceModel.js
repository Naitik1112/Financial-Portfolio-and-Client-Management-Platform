const mongoose = require('mongoose');
const BusinessSnapshot = require('./businessSnapshot');

const claimSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  claim: {
    type: Number,
    required: true
  },
  tax: {
    type: Number
  }
});

const liSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  policyName: {
    type: String,
    required: [true, 'A policy must have a name'],
    trim: true
  },
  policyType: {
    type: String,
    enum: ['ULIP', 'Endowment', 'MoneyBack', 'Term'],
    required: true
  },
  companyName: {
    type: String
  },
  policyNumber: {
    type: Number,
    required: [true, 'A policy must have a number']
  },
  clientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Reference to the User model
    required: [true, 'A policy must have a client ID']
  },
  nominee1ID: {
    type: mongoose.Schema.ObjectId,
    ref: 'User' // Reference to the User model
  },
  nominee2ID: {
    type: mongoose.Schema.ObjectId,
    ref: 'User' // Reference to the User model
  },
  nominee3ID: {
    type: mongoose.Schema.ObjectId,
    ref: 'User' // Reference to the User model
  },
  startPremiumDate: {
    type: Date,
    required: [true, 'A policy must have a Start Premium Date']
  },
  endPremiumDate: {
    type: Date,
    required: [true, 'A policy must have an End Premium Date']
  },
  premium: {
    type: Number,
    required: true
  },
  sumAssured: {
    type: Number,
    required: true
  },
  isHighValuePolicy: {
    type: Boolean,
    default: false // Can be set based on premium > ₹5L for HVP
  },
  mode: {
    type: String,
    required: true
  },
  claim: [claimSchema],
  maturityDate: {
    type: Date,
    required: true
  },
  deathClaimDate: {
    type: Date
  },
  deathClaim: {
    type: Number
  }
});

liSchema.pre('save', function(next) {
  // 1. Set isHighValuePolicy
  this.isHighValuePolicy = this.premium > 500000;

  // 2. Set tax for each claim based on type and value
  if (this.claim && this.claim.length > 0) {
    this.claim = this.claim.map(cl => {
      let tax = 0;

      // Calculate tax based on ULIP or non-ULIP and sumAssured rules
      const isULIP = this.policyType === 'ULIP';
      const totalPremiumPaid = calculateTotalPremium(
        this.startPremiumDate,
        this.endPremiumDate,
        this.premium,
        this.mode
      );
      const isSumAssuredEligible = this.sumAssured >= 10 * totalPremiumPaid;

      if (isULIP) {
        if (this.premium > 250000) tax = cl.claim * 0.05; // 5% for ULIP > ₹2.5L
      } else {
        if (!isSumAssuredEligible) tax = cl.claim * 0.05; // 5% if sumAssured not 10x
      }

      return { ...cl, tax };
    });
  }

  next();
});

// Utility function to compute total premium paid over years
function calculateTotalPremium(start, end, premium, mode) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const years = endDate.getFullYear() - startDate.getFullYear() + 1;

  switch (mode.toLowerCase()) {
    case 'monthly':
      return premium * 12 * years;
    case 'quarterly':
      return premium * 4 * years;
    case 'half-yearly':
      return premium * 2 * years;
    case 'yearly':
      return premium * 1 * years;
    default:
      return premium * 1 * years;
  }
}

async function calculateMonthlyLifeInsuranceContributions(policy) {
  try {
    const results = {};
    const today = new Date();
    const startDate = new Date(policy.startPremiumDate);
    const endDate = new Date(policy.endPremiumDate);
    
    // Ensure premium is a valid number
    const premium = Number(policy.premium) || 0;
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= today && currentDate <= endDate) {
      const monthKey = currentDate.toISOString().slice(0, 7);
      
      // Initialize with 0 if undefined
      results[monthKey] = results[monthKey] || {
        lifeInsurance: 0,
        todayLifeInsurance: 0
      };
      
      // Add premium with null checks
      results[monthKey].lifeInsurance = (results[monthKey].lifeInsurance || 0) + premium;
      
      // Check if today's payment
      if (currentDate.toDateString() === today.toDateString()) {
        results[monthKey].todayLifeInsurance = (results[monthKey].todayLifeInsurance || 0) + premium;
      }

      // Move to next payment date based on mode
      switch (policy.mode.toLowerCase()) {
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'half-yearly':
          currentDate.setMonth(currentDate.getMonth() + 6);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }

    return results;
  } catch (err) {
    console.error('Error in calculateMonthlyLifeInsuranceContributions:', err);
    throw err;
  }
}

async function triggerSnapshot(adminId) {
  try {
    // Get all life insurance policies for this admin
    const allPolicies = await LifeInsurance.find({ adminId });
    const monthlyAggregates = {}; // {YYYY-MM: {lifeInsurance, todayLifeInsurance}}

    // Aggregate all life insurance contributions
    for (const policy of allPolicies) {
      try {
        const contributions = await calculateMonthlyLifeInsuranceContributions(
          policy
        );

        // Merge contributions into monthly aggregates
        for (const [monthKey, values] of Object.entries(contributions)) {
          if (!monthlyAggregates[monthKey]) {
            monthlyAggregates[monthKey] = { lifeInsurance: 0, todayLifeInsurance: 0 };
          }

          monthlyAggregates[monthKey].lifeInsurance += Number(values.lifeInsurance) || 0;
          monthlyAggregates[monthKey].todayLifeInsurance += Number(values.todayLifeInsurance) || 0;
        }
        
      } catch (err) {
        console.error(`Error processing policy ${policy._id}: ${err.message}`);
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
          // Update existing snapshot

          existingSnapshot.lifeInsuranceTotal = Number(values.lifeInsurance) || 0;
          existingSnapshot.todayLifeInsurance = (Number(existingSnapshot.todayLifeInsurance) + Number(values.todayLifeInsurance)) || 0;
          await existingSnapshot.save();
        } else {
          // Create new snapshot
          await BusinessSnapshot.create({
            adminId,
            date: monthStart,
            lifeInsuranceTotal: Number(values.lifeInsurance) || 0,
            todayLifeInsurance: Number(values.todayLifeInsurance) || 0,
            // Initialize other fields to 0
            sipTotalBook: 0,
            lumpsumTotal: 0,
            todaySip: 0,
            todayLumpsum: 0,
            todayRedemption: 0,
            AUM: values.lifeInsurance, // Or adjust as needed
            generalInsuranceTotal: 0,
            fdTotalAmount: 0,
            todayGeneralInsurance: 0,
            todayDebt: 0
          });
        }
      } catch (err) {
        console.error(
          `Failed to update snapshot for ${monthKey}:`,
          err.message
        );
      }
    }

    console.log(
      'Life insurance snapshots updated successfully for admin:',
      adminId
    );
  } catch (err) {
    console.error('Failed to update life insurance snapshots:', err.message);
    throw err;
  }
}

// Add these hooks to your life insurance model
liSchema.post('save', async function(doc) {
  try {
    await triggerSnapshot(doc.adminId);
  } catch (err) {
    console.error('Error in post-save hook:', err);
  }
});

liSchema.post('remove', async function(doc) {
  try {
    await triggerSnapshot(doc.adminId);
  } catch (err) {
    console.error('Error in post-remove hook:', err);
  }
});

liSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (doc) {
      await triggerSnapshot(doc.adminId);
    }
  } catch (err) {
    console.error('Error in post-findOneAndUpdate hook:', err);
  }
});

const LifeInsurance = mongoose.model('LifeInsurance', liSchema);
module.exports = LifeInsurance;
