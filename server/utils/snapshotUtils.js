// utils/snapshotUtils.js
const axios = require('axios');
const BusinessSnapshot = require('../models/businessSnapshot');

exports.fetchAndStoreSnapshot = async () => {
  const response = await axios.get(
    `${process.env.Backend_URL}/api/v1/dashboard/getAUM`
  );
  const data = response.data.data;

  const snapshot = new BusinessSnapshot({
    AUM: data.AUM,
    sipTotalBook: data.sipTotalBook,
    lumpsumTotal: data.lumpsumTotal,
    lifeInsuranceTotal: data.lifeInsuranceTotal,
    generalInsuranceTotal: data.generalInsuranceTotal,
    fdTotalAmount: data.fdTotalAmount,
    timestamp: new Date()
  });

  await snapshot.save();
  return snapshot;
};
