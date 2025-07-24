const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
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

debtSchema.pre('save', function (next) {
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

  const TAX_RATE = 0.10; // example 10%
  this.tax = interestEarned > 0 ? +(interestEarned * TAX_RATE).toFixed(2) : 0;

  next();
});

debtSchema.virtual('computedTax').get(function () {
  const P = this.amount;
  const R = this.intrestRate / 100;
  const n = 4;
  const timeInYears = (this.MaturityDate - this.startDate) / (1000 * 60 * 60 * 24 * 365.25);
  const A = P * Math.pow(1 + R / n, n * timeInYears);
  const interest = A - P;
  return interest > 0 ? +(interest * 0.10).toFixed(2) : 0;
});

debtSchema.virtual('computedMaturityAmount').get(function () {
  const P = this.amount;
  const R = this.intrestRate / 100;
  const n = 4;
  const timeInYears = (this.MaturityDate - this.startDate) / (1000 * 60 * 60 * 24 * 365.25);
  const A = P * Math.pow(1 + R / n, n * timeInYears);
  return +A.toFixed(2);
});

debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

const DebtFunds = mongoose.model('DebtFunds', debtSchema);
module.exports = DebtFunds;