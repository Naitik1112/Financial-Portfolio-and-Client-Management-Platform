// utils/snapshotUtils.js
const axios = require('axios');
const BusinessSnapshot = require('../models/businessSnapshot');
const dayjs = require('dayjs'); // Ensure dayjs is installed

exports.fetchAndStoreSnapshot = async () => {
  const [aumResponse, businessResponse] = await Promise.all([
    axios.get(`${process.env.BACKEND_URL}/api/v1/dashboard/getAUM`, {
      timeout: 30000,
      headers: { 'Internal-Cron': 'true' }
    }),
    axios.get(`${process.env.BACKEND_URL}/api/v1/dashboard/getTodayBusiness`, {
      timeout: 30000,
      headers: { 'Internal-Cron': 'true' }
    })
  ]);

  if (!aumResponse.data?.data || !businessResponse.data?.data) {
    throw new Error('Invalid response structure from API');
  }

  const { data: aumData } = aumResponse.data;
  const { data: businessData } = businessResponse.data;

  const todayDateStr = dayjs().format('YYYY-MM-DD');

  const snapshotData = {
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
  };

  const updatedSnapshot = await BusinessSnapshot.findOneAndUpdate(
    {
      date: {
        $gte: new Date(`${todayDateStr}T00:00:00.000Z`),
        $lte: new Date(`${todayDateStr}T23:59:59.999Z`)
      }
    },
    snapshotData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return updatedSnapshot;
};

