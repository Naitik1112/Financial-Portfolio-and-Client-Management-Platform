const mongoose = require('mongoose');

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

const GeneralInsurance = mongoose.model('GeneralInsurance', giSchema);
module.exports = GeneralInsurance;
