const Mutual = require('./../models/mutualFundsModel');
const FD = require('./../models/debtModels');
const GeneralInsurance = require('../models/generalInsuranceModels');
const LifeInsurance = require('../models/lifeInsuranceModel');
const CatchAsync = require('./../utils/catchAsync');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const axios = require('axios');
const mongoose = require('mongoose');

dayjs.extend(utc);
dayjs.extend(timezone);

exports.getTodayBusiness = CatchAsync(async (req, res) => {
  const now = new Date();
  const todayStr = dayjs(now).format('YYYY-MM-DD');
  const formatDate = d => new Date(d).toISOString().split('T')[0];

  // Get all adminIds from any collection (assuming all collections have adminId)
  const adminIds = await Mutual.distinct('adminId');

  const result = {};

  for (const adminId of adminIds) {
    // 1. SIP + LUMPSUM + REDEMPTION
    const mutualData = await Mutual.find({ adminId });
    let totalSip = 0;
    let totalLumpsum = 0;
    let totalRedemption = 0;
    const todayDay = now.getDate();

    for (const item of mutualData) {
      if (item.investmentType === 'sip') {
        if (item.sipDay === todayDay) {
          totalSip += item.sipAmount || 0;
        }
        for (const txn of item.sipTransactions || []) {
          for (const red of txn.redemptions || []) {
            const redDate = formatDate(red.date);
            if (redDate === todayStr) {
              totalRedemption += (red.units || 0) * (red.nav || 0);
            }
          }
        }
      }

      if (item.investmentType === 'lumpsum') {
        if (formatDate(item.lumpsumDate) === todayStr) {
          totalLumpsum += item.lumpsumAmount || 0;
        }
        for (const txn of item.redemptions || []) {
          const redDate = formatDate(txn.date);
          if (redDate === todayStr) {
            totalRedemption += (txn.units || 0) * (txn.nav || 0);
          }
        }
      }
    }

    // 2. General Insurance
    const generalData = await GeneralInsurance.find({ adminId });
    let totalGeneral = 0;
    const currentYear = new Date().getFullYear();

    for (const item of generalData) {
      const startDate = formatDate(item.startPremiumDate);
      if (startDate === todayStr) {
        for (const prem of item.premium || []) {
          if (prem.year === currentYear) {
            totalGeneral += prem.premium1 || 0;
          }
        }
      }
    }

    // 3. Life Insurance
    const lifeData = await LifeInsurance.find({ adminId });
    let totalLife = 0;

    for (const item of lifeData) {
      const startDate = formatDate(item.startPremiumDate);
      if (startDate === todayStr) {
        totalLife += item.premium || 0;
      }
    }

    // 4. Debt
    const fdData = await FD.find({ adminId });
    let totalDebt = 0;

    for (const item of fdData) {
      const startDate = formatDate(item.startDate);
      if (startDate === todayStr) {
        totalDebt += item.amount || 0;
      }
    }

    result[adminId] = {
      date: todayStr,
      todaySip: totalSip,
      todayLumpsum: totalLumpsum,
      todayRedemption: totalRedemption,
      todayGeneralInsurance: totalGeneral,
      todayLifeInsurance: totalLife,
      todayDebt: totalDebt
    };
  }

  res.status(200).json({
    status: 'success',
    data: result
  });
});

exports.getAUMBreakdown = CatchAsync(async (req, res) => {
  const adminIds = await Mutual.distinct('adminId');
  const result = {};

  const getNav = async schemeCode => {
    const { data } = await axios.get(
      `https://api.mfapi.in/mf/${schemeCode}/latest`,
      {
        headers: {
          Authorization: undefined
        }
      }
    );
    if (data.status !== 'SUCCESS')
      throw new Error(`Failed to fetch NAV for ${schemeCode}`);
    return parseFloat(data.data[0].nav);
  };

  for (const adminId of adminIds) {
    const mutualFunds = await Mutual.find({ adminId });
    const lifePolicies = await LifeInsurance.find({ adminId });
    const generalPolicies = await GeneralInsurance.find({ adminId });
    const fds = await FD.find({ adminId });

    let totalAUM = 0;
    let sipTotalBook = 0;
    let lumpsumTotal = 0;
    const breakdown = [];

    // Mutual Fund processing
    for (const fund of mutualFunds) {
      const schemeCode = fund.AMFI;
      const nav = await getNav(schemeCode);

      let totalUnits = 0;

      if (fund.investmentType === 'sip') {
        totalUnits = fund.sipTransactions.reduce(
          (sum, tx) => sum + (tx.units ?? 0),
          0
        );
      } else {
        totalUnits = fund.lumpsumUnits ?? 0;
      }

      totalUnits -= fund.redeemedUnits ?? 0;
      totalUnits = Math.max(totalUnits, 0);

      const currentVal = totalUnits * nav;
      totalAUM += currentVal;

      if (fund.investmentType === 'sip') {
        sipTotalBook += currentVal;
      } else {
        lumpsumTotal += currentVal;
      }

      breakdown.push({
        schemeName: fund.schemeName,
        investmentType: fund.investmentType,
        units: totalUnits,
        nav,
        value: currentVal
      });
    }

    // Life Insurance
    let lifeInsuranceTotal = 0;
    for (const policy of lifePolicies) {
      lifeInsuranceTotal += policy.premium ?? 0;
    }

    // General Insurance
    let generalInsuranceTotal = 0;
    for (const policy of generalPolicies) {
      const premiums = policy.premium ?? [];
      generalInsuranceTotal += premiums.reduce(
        (sum, p) => sum + (p.premium1 ?? 0),
        0
      );
    }

    // FDs
    let fdTotalAmount = 0;
    for (const fd of fds) {
      fdTotalAmount += fd.amount ?? 0;
    }

    result[adminId] = {
      AUM: totalAUM,
      sipTotalBook: sipTotalBook,
      lumpsumTotal: lumpsumTotal,
      lifeInsuranceTotal: lifeInsuranceTotal,
      generalInsuranceTotal: generalInsuranceTotal,
      fdTotalAmount: fdTotalAmount
    };
  }

  res.status(200).json({
    status: 'success',
    data: result
  });
});

exports.getTodayBusinessByAdmin = CatchAsync(async (req, res) => {
  const now = new Date();
  const adminId = mongoose.Types.ObjectId(req.admin.id);
  console.log('now:', now);

  // ✅ Get today's date in IST (local time)
  const todayStr = dayjs(now).format('YYYY-MM-DD');
  console.log('todayStr:', todayStr);

  // ✅ Format any date to local YYYY-MM-DD
  // const formatDate = d => dayjs(d).format('YYYY-MM-DD');
  const formatDate = d => new Date(d).toISOString().split('T')[0];

  // 1. SIP + LUMPSUM + REDEMPTION
  const mutualData = await Mutual.find(adminId);

  let totalSip = 0;
  let totalLumpsum = 0;
  let totalRedemption = 0;

  const today = new Date();
  const todayDay = today.getDate();

  for (const item of mutualData) {
    if (item.investmentType === 'sip') {
      // console.log(item.sipStartDate, todayStr, item.sipDay, todayDay, today);
      if (item.sipDay === todayDay) {
        totalSip += item.sipAmount || 0;
      }
      for (const txn of item.sipTransactions || []) {
        for (const red of txn.redemptions || []) {
          // const r = red.date;
          const redDate = formatDate(red.date);
          // console.log("stored date : ",r,", formatted date : ",redDate, todayStr, red.units , red.nav);
          if (redDate === todayStr) {
            totalRedemption += (red.units || 0) * (red.nav || 0);
          }
        }
      }
    }

    if (item.investmentType === 'lumpsum') {
      if (formatDate(item.lumpsumDate) === todayStr) {
        totalLumpsum += item.lumpsumAmount || 0;
      }
      for (const txn of item.redemptions || []) {
        const redDate = formatDate(txn.date);
        if (redDate === todayStr) {
          totalRedemption += (txn.units || 0) * (txn.nav || 0);
        }
      }
    }
  }

  // 2. General Insurance
  const generalData = await GeneralInsurance.find(adminId);
  let totalGeneral = 0;

  for (const item of generalData) {
    const startDate = formatDate(item.startPremiumDate);
    // console.log(item.startPremiumDate, '→', startDate, 'vs', todayStr);
    if (startDate === todayStr) {
      const currentYear = new Date().getFullYear();
      for (const prem of item.premium || []) {
        if (prem.year === currentYear) {
          totalGeneral += prem.premium1 || 0;
        }
      }
    }
  }

  // 3. Life Insurance
  const lifeData = await LifeInsurance.find(adminId);
  let totalLife = 0;

  for (const item of lifeData) {
    const startDate = formatDate(item.startPremiumDate);
    if (startDate === todayStr) {
      totalLife += item.premium || 0;
    }
  }

  // 4. Debt
  const fdData = await FD.find(adminId);
  let totalDebt = 0;

  for (const item of fdData) {
    const startDate = formatDate(item.startDate);
    if (startDate === todayStr) {
      totalDebt += item.amount || 0;
    }
  }

  // Final response
  res.status(200).json({
    status: 'success',
    data: {
      date: todayStr,
      todaySip: totalSip,
      todayLumpsum: totalLumpsum,
      todayRedemption: totalRedemption,
      todayGeneralInsurance: totalGeneral,
      todayLifeInsurance: totalLife,
      todayDebt: totalDebt
    }
  });
});

exports.getAUMBreakdownByAdmin = CatchAsync(async (req, res) => {
  const adminId = req.admin.id;
  const mutualFunds = await Mutual.find({ adminId });
  const lifePolicies = await LifeInsurance.find({ adminId });
  const generalPolicies = await GeneralInsurance.find({ adminId });
  const fds = await FD.find({ adminId });

  const getNav = async schemeCode => {
    const { data } = await axios.get(
      `https://api.mfapi.in/mf/${schemeCode}/latest`,
      {
        headers: {
          Authorization: undefined
        }
      }
    );
    if (data.status !== 'SUCCESS')
      throw new Error(`Failed to fetch NAV for ${schemeCode}`);
    return parseFloat(data.data[0].nav);
  };

  let totalAUM = 0;
  let sipTotalBook = 0;
  let lumpsumTotal = 0;
  const breakdown = [];

  // Mutual Fund processing
  for (const fund of mutualFunds) {
    const schemeCode = fund.AMFI;
    const nav = await getNav(schemeCode);

    let totalUnits = 0;

    if (fund.investmentType === 'sip') {
      totalUnits = fund.sipTransactions.reduce(
        (sum, tx) => sum + (tx.units ?? 0),
        0
      );
    } else {
      totalUnits = fund.lumpsumUnits ?? 0;
    }

    totalUnits -= fund.redeemedUnits ?? 0;
    totalUnits = Math.max(totalUnits, 0);

    const currentVal = totalUnits * nav;
    totalAUM += currentVal;

    if (fund.investmentType === 'sip') {
      sipTotalBook += currentVal;
    } else {
      lumpsumTotal += currentVal;
    }

    breakdown.push({
      schemeName: fund.schemeName,
      investmentType: fund.investmentType,
      units: totalUnits,
      nav,
      value: currentVal
    });
  }

  // Life Insurance - Sum of premiums
  // ✅ Correct logic
  let lifeInsuranceTotal = 0;
  for (const policy of lifePolicies) {
    lifeInsuranceTotal += policy.premium ?? 0;
  }

  // General Insurance - Sum of all premium1 values in array
  let generalInsuranceTotal = 0;
  for (const policy of generalPolicies) {
    const premiums = policy.premium ?? [];
    generalInsuranceTotal += premiums.reduce(
      (sum, p) => sum + (p.premium1 ?? 0),
      0
    );
  }

  // FDs - Total amount invested
  let fdTotalAmount = 0;
  for (const fd of fds) {
    fdTotalAmount += fd.amount ?? 0;
  }

  res.status(200).json({
    status: 'success',
    data: {
      AUM: totalAUM,
      sipTotalBook,
      lumpsumTotal,
      lifeInsuranceTotal,
      generalInsuranceTotal,
      fdTotalAmount
      // breakdown
    }
  });
});

exports.getFDsMaturingThisMonth = CatchAsync(async (req, res, next) => {
  const now = new Date();

  const adminId = req.admin.id;

  // First day of the current month
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  );

  // Last day of the current month
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );

  const maturingFDs = await FD.find({
    MaturityDate: {
      $gte: monthStart,
      $lte: monthEnd
    },
    adminId
  });

  res.status(200).json({
    status: 'success',
    results: maturingFDs.length,
    data: {
      maturingFDs
    }
  });
});

exports.getRecentInvestments = CatchAsync(async (req, res, next) => {
  const investmentsRaw = await Mutual.find({
    investmentType: { $in: ['sip', 'lumpsum'] }
  })
    .populate('holderId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  const investments = investmentsRaw.map(inv => {
    const amount =
      inv.investmentType === 'sip'
        ? inv.sipTransactions?.[0]?.amount ?? 0
        : inv.lumpsumAmount ?? 0;

    return {
      id: inv._id,
      name: inv.schemeName?.split(' - ')[0] ?? inv.schemeName,
      amfi: inv.AMFI,
      investmentType: inv.investmentType,
      holderId: inv.holderId?._id,
      holderName: inv.holderId?.name ?? 'Unknown',
      amount,
      createdAt: inv.createdAt
    };
  });

  res.status(200).json({
    status: 'success',
    results: investments.length,
    data: investments
  });
});

exports.getRecentlyRedeemedFunds = CatchAsync(async (req, res, next) => {
  const mutualFunds = await Mutual.find({
    lastRedemptionDate: { $exists: true }
  })
    .populate('holderId', 'name')
    .sort({ lastRedemptionDate: -1 })
    .limit(10);

  const result = mutualFunds.map(fund => ({
    id: fund._id,
    name: fund.schemeName?.split(' - ')[0] ?? fund.schemeName,
    amfi: fund.AMFI,
    investmentType: fund.investmentType,
    holderId: fund.holderId?._id,
    holderName: fund.holderId?.name ?? 'Unknown',
    lastRedemptionDate: fund.lastRedemptionDate
  }));

  res.status(200).json({
    status: 'success',
    results: result.length,
    data: result
  });
});

exports.getRecentClaims = CatchAsync(async (req, res, next) => {
  const adminId = req.admin.id; // Changed from req.admin.id to req.admin._id

  const recentClaims = await GeneralInsurance.aggregate([
    // First match documents for this admin
    { $match: { adminId: mongoose.Types.ObjectId(adminId) } },

    // Unwind the claims array
    { $unwind: '$claims' },

    // Sort claims by requestDate (descending) before limiting
    { $sort: { 'claims.requestDate': -1 } },

    // Limit to 10 most recent claims
    { $limit: 10 },

    // Project the fields we want
    {
      $project: {
        _id: 0, // Exclude the default _id
        generalInsuranceId: '$_id',
        policyName: 1,
        companyName: 1,
        policyNumber: 1,
        clientId: 1,
        claimId: '$claims.claimId',
        requestDate: '$claims.requestDate',
        claim: '$claims.claim',
        approvalDate: '$claims.approvalDate',
        approvalClaim: '$claims.approvalClaim',
        adminId: 1 // Include if needed
      }
    },

    // Lookup client data
    {
      $lookup: {
        from: 'users',
        localField: 'clientId',
        foreignField: '_id',
        as: 'clientData'
      }
    },

    // Unwind the clientData array (assuming one-to-one relationship)
    { $unwind: '$clientData' },

    // Add client name field
    {
      $addFields: {
        clientName: '$clientData.name'
      }
    },

    // Remove the full clientData object
    {
      $project: {
        clientData: 0
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: recentClaims.length,
    data: {
      recentClaims
    }
  });
});
