const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  claim: {
    type: Number,
    required: true
  }
});

const liSchema = new mongoose.Schema({
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
  endPremiumDate: {
    type: Date,
    required: [true, 'A policy must have an End Premium Date']
  },
  premium: {
    type: Number,
    required: true
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

const LifeInsurance = mongoose.model('LifeInsurance', liSchema);
module.exports = LifeInsurance;
