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

const BusinessSnapshot = mongoose.model('BusinessSnapshot', BusinessSchema);
module.exports = BusinessSnapshot;
