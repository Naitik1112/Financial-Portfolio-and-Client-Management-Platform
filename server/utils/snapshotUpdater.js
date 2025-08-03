// utils/snapshotUpdater.js
const BusinessSnapshot = require('../models/businessSnapshot');
const dayjs = require('dayjs');
const axios = require('axios');

// Helper to get month-year key (format: YYYY-MM)
const getMonthKey = date => dayjs(date).format('YYYY-MM');

// Get historical NAV for a scheme
async function getHistoricalNav(schemeCode, date) {
  try {
    const response = await axios.get(`https://api.mfapi.in/mf/${schemeCode}`,
        {
        headers: {
          Authorization: undefined
        }
      }
    );
    if (response.data.status !== 'SUCCESS') return null;
    
    const targetDate = dayjs(date).format('DD-MM-YYYY');
    const navData = response.data.data.find(d => d.date === targetDate);
    return navData ? parseFloat(navData.nav) : null;
  } catch (err) {
    console.error(`Error fetching NAV for ${schemeCode}:`, err.message);
    return null;
  }
}

// Update business snapshot for a mutual fund transaction
async function updateSnapshotForMFTransaction(mfDoc, transaction) {
  const { adminId, AMFI, schemeName } = mfDoc;
  const transactionDate = new Date(transaction.date);
  const transactionMonth = getMonthKey(transactionDate);
  const currentMonth = getMonthKey(new Date());

  // Get NAV history for this scheme
  const navResponse = await axios.get(`https://api.mfapi.in/mf/${AMFI}`,
        {
        headers: {
          Authorization: undefined
        }
    }
    );
  if (navResponse.data.status !== 'SUCCESS') {
    throw new Error(`Failed to fetch NAV history for ${AMFI}`);
  }

  // Process each month from transaction date to current month
  const updates = [];
  let currentDate = new Date(transactionDate);
  
  while (getMonthKey(currentDate) <= currentMonth) {
    const monthKey = getMonthKey(currentDate);
    const monthStart = dayjs(currentDate).startOf('month').toDate();
    const monthEnd = dayjs(currentDate).endOf('month').toDate();

    // Find NAV for this month (use the latest available NAV in the month)
    const monthNavData = navResponse.data.data
      .filter(d => {
        const [day, month, year] = d.date.split('-');
        const navDate = new Date(`${year}-${month}-${day}`);
        return navDate >= monthStart && navDate <= monthEnd;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!monthNavData) {
      console.warn(`No NAV found for ${schemeName} in ${monthKey}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
      continue;
    }

    const nav = parseFloat(monthNavData.nav);
    const valueChange = transaction.units * nav;

    updates.push({
      updateOne: {
        filter: {
          adminId,
          date: {
            $gte: monthStart,
            $lte: monthEnd
          }
        },
        update: {
          $inc: {
            AUM: valueChange,
            ...(mfDoc.investmentType === 'sip' 
              ? { sipTotalBook: valueChange }
              : { lumpsumTotal: valueChange }
            )
          },
          $setOnInsert: {
            date: monthStart,
            adminId,
            timestamp: new Date()
          }
        },
        upsert: true
      }
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  if (updates.length > 0) {
    await BusinessSnapshot.bulkWrite(updates);
  }
}

// Update business snapshot for a redemption
async function updateSnapshotForRedemption(mfDoc, redemption, isSipRedemption = false) {
  const { adminId, AMFI } = mfDoc;
  const redemptionDate = new Date(redemption.date);
  const redemptionMonth = getMonthKey(redemptionDate);
  const monthStart = dayjs(redemptionDate).startOf('month').toDate();
  const monthEnd = dayjs(redemptionDate).endOf('month').toDate();

  // Get NAV for redemption month
  const nav = redemption.nav || await getHistoricalNav(AMFI, redemptionDate);
  if (!nav) {
    throw new Error(`Could not determine NAV for redemption on ${redemptionDate}`);
  }

  const valueChange = redemption.units * nav;

  await BusinessSnapshot.findOneAndUpdate(
    {
      adminId,
      date: {
        $gte: monthStart,
        $lte: monthEnd
      }
    },
    {
      $inc: {
        AUM: -valueChange,
        todayRedemption: valueChange,
        ...(isSipRedemption 
          ? { sipTotalBook: -valueChange }
          : { lumpsumTotal: -valueChange }
        )
      },
      $setOnInsert: {
        date: monthStart,
        adminId,
        timestamp: new Date()
      }
    },
    { upsert: true, new: true }
  );
}

module.exports = {
  updateSnapshotForMFTransaction,
  updateSnapshotForRedemption
};