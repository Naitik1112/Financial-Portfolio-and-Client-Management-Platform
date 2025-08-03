const axios = require('axios');
const BusinessSnapshot = require('../models/businessSnapshot');
const dayjs = require('dayjs');

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

  const aumData = aumResponse.data.data;
  const businessData = businessResponse.data.data;

  // Format: YYYY-MM-01 for monthly snapshot
  const firstDayOfMonthStr = dayjs().startOf('month').format('YYYY-MM-DD');
  const firstDay = new Date(`${firstDayOfMonthStr}T00:00:00.000Z`);
  const lastDay = new Date(dayjs().endOf('month').format('YYYY-MM-DD') + `T23:59:59.999Z`);

  const adminIds = Object.keys(aumData);

  const snapshots = [];

  for (const adminId of adminIds) {
    const snapshotData = {
      adminId,
      AUM: aumData[adminId].AUM,
      sipTotalBook: aumData[adminId].sipTotalBook,
      lumpsumTotal: aumData[adminId].lumpsumTotal,
      lifeInsuranceTotal: aumData[adminId].lifeInsuranceTotal,
      generalInsuranceTotal: aumData[adminId].generalInsuranceTotal,
      fdTotalAmount: aumData[adminId].fdTotalAmount,
      timestamp: new Date(),
      date: firstDay, // Save first day of the month
      todaySip: businessData[adminId].todaySip,
      todayLumpsum: businessData[adminId].todayLumpsum,
      todayRedemption: businessData[adminId].todayRedemption,
      todayGeneralInsurance: businessData[adminId].todayGeneralInsurance,
      todayLifeInsurance: businessData[adminId].todayLifeInsurance,
      todayDebt: businessData[adminId].todayDebt
    };

    const updatedSnapshot = await BusinessSnapshot.findOneAndUpdate(
      {
        adminId,
        date: { $gte: firstDay, $lte: lastDay }
      },
      snapshotData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    snapshots.push(updatedSnapshot);
  }

  return snapshots;
};

