const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  timestamp: { type: Date, default: Date.now },
  AUM: Number,
  sipTotalBook: Number,
  lumpsumTotal: Number,
  lifeInsuranceTotal: {
    type: Number,
    default: 0
  },
  generalInsuranceTotal: Number,
  fdTotalAmount: Number,
  date: Date,
  todaySip: Number,
  todayLumpsum: Number,
  todayRedemption: Number,
  todayGeneralInsurance: Number,
  todayLifeInsurance: {
    type: Number,
    default: 0  // Add this to ensure it's never undefined
  },
  todayDebt: Number
});

const BusinessSnapshot = mongoose.model('BusinessSnapshot', BusinessSchema);
module.exports = BusinessSnapshot;
