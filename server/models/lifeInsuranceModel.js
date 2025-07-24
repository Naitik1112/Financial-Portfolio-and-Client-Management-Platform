const mongoose = require('mongoose');

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


liSchema.pre('save', function (next) {
  // 1. Set isHighValuePolicy
  this.isHighValuePolicy = this.premium > 500000;

  // 2. Set tax for each claim based on type and value
  if (this.claim && this.claim.length > 0) {
    this.claim = this.claim.map(cl => {
      let tax = 0;

      // Calculate tax based on ULIP or non-ULIP and sumAssured rules
      const isULIP = this.policyType === 'ULIP';
      const totalPremiumPaid = calculateTotalPremium(this.startPremiumDate, this.endPremiumDate, this.premium, this.mode);
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
  const years = (endDate.getFullYear() - startDate.getFullYear()) + 1;

  switch (mode.toLowerCase()) {
    case 'monthly': return premium * 12 * years;
    case 'quarterly': return premium * 4 * years;
    case 'half-yearly': return premium * 2 * years;
    case 'yearly': return premium * 1 * years;
    default: return premium * 1 * years;
  }
}

const LifeInsurance = mongoose.model('LifeInsurance', liSchema);
module.exports = LifeInsurance;
