// utils/snapshotUtils.js
const axios = require('axios');
const BusinessSnapshot = require('../models/businessSnapshot');

exports.fetchAndStoreSnapshot = async () => {
  const response = await axios.get(
    `${process.env.Backend_URL}/api/v1/dashboard/getAUM`
  );
  const response1 = await axios.get(
    `${process.env.Backend_URL}/api/v1/dashboard/getTodayBusiness`
  );
  const data = response.data.data;
  const data1 = response1.data.data

  const snapshot = new BusinessSnapshot({
    AUM: data.AUM,
    sipTotalBook: data.sipTotalBook,
    lumpsumTotal: data.lumpsumTotal,
    lifeInsuranceTotal: data.lifeInsuranceTotal,
    generalInsuranceTotal: data.generalInsuranceTotal,
    fdTotalAmount: data.fdTotalAmount,
    timestamp: new Date(),
    date: data1.date,
    todaySip: data1.todaySip,
    todayLumpsum: data1.todayLumpsum,
    todayRedemption: data1.todayRedemption,
    todayGeneralInsurance: data1.todayGeneralInsurance,
    todayLifeInsurance: data1.todayLifeInsurance,
    todayDebt: data1.todayDebt
  });

  await snapshot.save();
  return snapshot;
};
