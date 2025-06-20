const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  bankDetails: {
    type: String,
    required: [true, 'A FD must have a Bank Detail'],
    trim: true
  },
  AccountNumber: {
    type: String,
    required: [true, 'A FD must have a Acc n.o']
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
    required: [true, 'A FD must have a Start Premium Date']
  },
  intrestRate: {
    type: Number,
    required: [true, 'A FD must have a Interest Rate']
  },
  amount: {
    type: Number,
    required: true
  }
});

const DebtFunds = mongoose.model('DebtFunds', debtSchema);
module.exports = DebtFunds;
