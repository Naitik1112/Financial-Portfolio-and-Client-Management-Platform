// utils/snapshotUtils.js
const axios = require('axios');
const BusinessSnapshot = require('../models/businessSnapshot');

exports.fetchAndStoreSnapshot = async () => {
  // Use Promise.all for parallel requests
  const [aumResponse, businessResponse] = await Promise.all([
    axios.get(`${process.env.BACKEND_URL}/api/v1/dashboard/getAUM`, { 
      timeout: 30000,
      headers: { 'Internal-Cron': 'true' } // For security
    }),
    axios.get(`${process.env.BACKEND_URL}/api/v1/dashboard/getTodayBusiness`, {
      timeout: 30000,
      headers: { 'Internal-Cron': 'true' }
    })
  ]);

  // Validate responses
  if (!aumResponse.data?.data || !businessResponse.data?.data) {
    throw new Error('Invalid response structure from API');
  }

  const { data: aumData } = aumResponse.data;
  const { data: businessData } = businessResponse.data;

  const snapshot = new BusinessSnapshot({
    AUM: aumData.AUM,
    sipTotalBook: aumData.sipTotalBook,
    lumpsumTotal: aumData.lumpsumTotal,
    lifeInsuranceTotal: aumData.lifeInsuranceTotal,
    generalInsuranceTotal: aumData.generalInsuranceTotal,
    fdTotalAmount: aumData.fdTotalAmount,
    timestamp: new Date(),
    date: businessData.date,
    todaySip: businessData.todaySip,
    todayLumpsum: businessData.todayLumpsum,
    todayRedemption: businessData.todayRedemption,
    todayGeneralInsurance: businessData.todayGeneralInsurance,
    todayLifeInsurance: businessData.todayLifeInsurance,
    todayDebt: businessData.todayDebt
  });

  await snapshot.save();
  return snapshot;
};