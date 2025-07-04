const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  AUM: Number,
  sipTotalBook: Number,
  lumpsumTotal: Number,
  lifeInsuranceTotal: Number,
  generalInsuranceTotal: Number,
  fdTotalAmount: Number
});

module.exports = mongoose.model('BusinessSnapshot', BusinessSchema);
