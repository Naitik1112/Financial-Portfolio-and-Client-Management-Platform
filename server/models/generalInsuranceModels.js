const mongoose = require('mongoose');
const BusinessSnapshot = require('./businessSnapshot');

const claimSchema = new mongoose.Schema({
  claimId: {
    type: String,
    required: true
  },
  requestDate: {
    type: Date,
    required: true
  },
  claim: {
    type: Number,
    required: true
  },
  approvalDate: {
    type: Date,
    required: true
  },
  approvalClaim: {
    type: Number,
    required: true
  }
});

const premiumSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  premium1: {
    type: Number,
    required: true
  }
});

const giSchema = new mongoose.Schema({
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
  premium: [premiumSchema],
  type: {
    type: String,
    required: true
  },
  vehicleID: {
    type: String
  },
  claims: [claimSchema]
});

async function calculateMonthlyGeneralInsuranceContributions(policy) {
  try {
    const results = {};
    const today = new Date();

    // Process premium payments
    if (policy.premium && policy.premium.length > 0) {
      for (const premium of policy.premium) {
        // Create a date for this premium (assuming year is the policy year)
        const premiumDate = new Date(policy.startPremiumDate);
        premiumDate.setFullYear(premiumDate.getFullYear() + (premium.year - 1));

        const monthKey = premiumDate.toISOString().slice(0, 7); // YYYY-MM format

        // Initialize month if not exists
        results[monthKey] = results[monthKey] || {
          generalInsurance: 0,
          todayGeneralInsurance: 0
        };

        // Add premium (ensure it's a valid number)
        const premiumValue = Number(premium.premium1) || 0;
        results[monthKey].generalInsurance += premiumValue;

        // Check if this is today's payment
        if (premiumDate.toDateString() === today.toDateString()) {
          results[monthKey].todayGeneralInsurance += premiumValue;
        }
      }
    }

    // Process claims (if they should reduce the value)
    if (policy.claims && policy.claims.length > 0) {
      for (const claim of policy.claims) {
        const claimDate = new Date(claim.approvalDate);
        const monthKey = claimDate.toISOString().slice(0, 7);

        results[monthKey] = results[monthKey] || {
          generalInsurance: 0,
          todayGeneralInsurance: 0
        };

        // Subtract claim amount (ensure it's a valid number)
        // const claimValue = Number(claim.approvalClaim) || 0;
        // results[monthKey].generalInsurance -= claimValue;

        // if (claimDate.toDateString() === today.toDateString()) {
        //   results[monthKey].todayGeneralInsurance -= claimValue;
        // }
      }
    }

    return results;
  } catch (err) {
    console.error(
      'Error in calculateMonthlyGeneralInsuranceContributions:',
      err
    );
    throw err;
  }
}

async function triggerSnapshot(adminId) {
  try {
    // Get all general insurance policies for this admin
    const allPolicies = await GeneralInsurance.find({ adminId });
    const monthlyAggregates = {}; // {YYYY-MM: {generalInsurance, todayGeneralInsurance}}

    // Aggregate all general insurance contributions
    for (const policy of allPolicies) {
      try {
        const contributions = await calculateMonthlyGeneralInsuranceContributions(
          policy
        );

        // Merge contributions into monthly aggregates
        for (const [monthKey, values] of Object.entries(contributions)) {
          monthlyAggregates[monthKey] = monthlyAggregates[monthKey] || {
            generalInsurance: 0,
            todayGeneralInsurance: 0
          };

          // Ensure values are numbers before adding
          monthlyAggregates[monthKey].generalInsurance +=
            Number(values.generalInsurance) || 0;
          monthlyAggregates[monthKey].todayGeneralInsurance +=
            Number(values.todayGeneralInsurance) || 0;
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
          // Update existing snapshot with validated numbers
          existingSnapshot.generalInsuranceTotal =
            Number(values.generalInsurance) || 0;
          existingSnapshot.todayGeneralInsurance =
            Number(values.todayGeneralInsurance) || 0;
          await existingSnapshot.save();
        } else {
          // Create new snapshot with validated numbers
          await BusinessSnapshot.create({
            adminId,
            date: monthStart,
            generalInsuranceTotal: Number(values.generalInsurance) || 0,
            todayGeneralInsurance: Number(values.todayGeneralInsurance) || 0,
            // Initialize other fields to 0
            lifeInsuranceTotal: 0,
            sipTotalBook: 0,
            lumpsumTotal: 0,
            todaySip: 0,
            todayLumpsum: 0,
            todayRedemption: 0,
            todayLifeInsurance: 0,
            AUM: 0,
            fdTotalAmount: 0,
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
      'General insurance snapshots updated successfully for admin:',
      adminId
    );
  } catch (err) {
    console.error('Failed to update general insurance snapshots:', err.message);
    throw err;
  }
}

// Add these hooks to your general insurance model
giSchema.post('save', async function(doc) {
  try {
    console.log('save');
    console.log(doc);
    await triggerSnapshot(doc.adminId);
  } catch (err) {
    console.error('Error in post-save hook:', err);
  }
});

giSchema.post('remove', async function(doc) {
  try {
    console.log('remove');
    console.log(doc);
    await triggerSnapshot(doc.adminId);
  } catch (err) {
    console.error('Error in post-remove hook:', err);
  }
});

giSchema.post('findOneAndUpdate', async function(doc) {
  try {
    console.log('findOne and Upde');
    console.log(doc);
    if (doc) {
      await triggerSnapshot(doc.adminId);
    }
  } catch (err) {
    console.error('Error in post-findOneAndUpdate hook:', err);
  }
});

const GeneralInsurance = mongoose.model('GeneralInsurance', giSchema);
module.exports = GeneralInsurance;
