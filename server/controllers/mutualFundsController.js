const MF = require('./../models/mutualFundsModel');
// const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('./../models/userModels');
const axios = require('axios');

const path = require('path');
const { exec } = require('child_process');
const { client } = require('../utils/redisClient');

const getMutualFundsFromPython = require('../utils/fetchFunds');

const findIdByName = async name => {
  const fund = await User.findOne({ name });
  if (!fund) {
    throw new Error(`No document found with the name: ${name}`);
  }
  return fund._id; // Assuming `_id` is the ID field in your Mutual Funds model
};

exports.convertNameToId = catchAsync(async (req, res, next) => {
  console.log('This is body', req.body);

  // Destructure variables from the request body
  const { holderId, nominee1Id, nominee2Id, nominee3Id } = req.body;
  console.log('holderId ', holderId);
  // Convert holder name to ID if not already an ID
  // if (holderId && holderId.trim() !== '') {
  //   req.body.holderId = await findIdByName(holderId);
  // }

  // Process nominees, removing them if their value is empty
  if (!nominee1Id || nominee1Id.trim() === '') {
    delete req.body.nominee1Id; // Remove nominee1Id if it's empty
  }
  if (!nominee2Id || nominee2Id.trim() === '') {
    delete req.body.nominee2Id; // Remove nominee2Id if it's empty
  }

  if (!nominee3Id || nominee3Id.trim() === '') {
    delete req.body.nominee3Id; // Remove nominee3Id if it's empty
  }

  next(); // Move to the next middleware or route handler
});

exports.getMutualFundByUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  console.log(userId);
  const mutualFunds = await MF.find({ holderId: userId });
  console.log(mutualFunds.length);
  if (!mutualFunds.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'No mutual funds found for the specified user.'
    });
  }
  console.log('success');
  res.status(200).json({
    status: 'success',
    results: mutualFunds.length,
    data: {
      mutualFunds
    }
  });
});

const calculateTax = (
  schemeName,
  category,
  purchaseDate,
  redeemDate,
  units,
  navAtRedemption,
  navAtPurchase
) => {
  const holdingPeriod = (redeemDate - purchaseDate) / (1000 * 3600 * 24); // in days
  const gain = (navAtRedemption - navAtPurchase) * units;
  const lowerName = schemeName.toLowerCase();
  const cat = category.toLowerCase();
  console.log(gain);
  console.log(lowerName);
  console.log(cat);
  let taxType = '';
  let tax = 0;

  if (
    lowerName.includes('equity') ||
    lowerName.includes('elss') ||
    lowerName.includes('hybrid') ||
    cat.includes('equity') ||
    cat.includes('elss') ||
    cat.includes('hybrid')
  ) {
    if (holdingPeriod > 365) {
      taxType = 'LTCG';
      const taxable = gain > 100000 ? gain - 100000 : 0;
      tax = taxable * 0.1;
    } else {
      taxType = 'STCG';
      tax = gain * 0.15;
    }
  } else if (lowerName.includes('debt') || cat.includes('debt')) {
    taxType = 'STCG'; // All gains post-April 2023 taxed as per slab
    tax = gain * 0.3; // Assuming highest slab
  } else {
    taxType = 'UNKNOWN';
    tax = 0;
  }
  console.log(tax);
  console.log(gain);
  return { type: taxType, tax, gain };
};

exports.redeemUnits = catchAsync(async (req, res, next) => {
  function toISTISOString(date) {
    // IST offset is +5:30 = 330 minutes
    const offsetMinutes = 330;

    // get UTC time in ms
    const utc = date.getTime();

    // add offset in ms
    const istTime = new Date(utc + offsetMinutes * 60000);

    // extract date parts
    const yyyy = istTime.getFullYear();
    const mm = String(istTime.getMonth() + 1).padStart(2, '0');
    const dd = String(istTime.getDate()).padStart(2, '0');
    const hh = String(istTime.getHours()).padStart(2, '0');
    const min = String(istTime.getMinutes()).padStart(2, '0');
    const sec = String(istTime.getSeconds()).padStart(2, '0');
    const ms = String(istTime.getMilliseconds()).padStart(3, '0');

    // Construct ISO string with offset +05:30
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}.${ms}+05:30`;
  }

  const first = new Date();
  const now = toISTISOString(first);
  const istString = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  console.log('IST time:', istString, ', UTC : ', now);
  const redemptionMap = req.body; // { mfId1: "100", mfId2: "200" }
  const taxSummary = [];

  for (const mfId of Object.keys(redemptionMap)) {
    let unitsToRedeem = parseFloat(redemptionMap[mfId]);
    if (isNaN(unitsToRedeem)) {
      continue;
    }

    const mf = await MF.findOne({ _id: mfId });

    if (!mf) {
      return res
        .status(404)
        .json({ message: `Mutual fund not found: ${mfId}` });
    }

    // Fetch latest NAV from API
    console.log(mf);
    let nav;
    let name;
    let cat;
    try {
      console.log(mf.AMFI);
      console.log(`https://api.mfapi.in/mf/${mf.AMFI}/latest`);
      const response = await axios.get(
        `https://api.mfapi.in/mf/${mf.AMFI}/latest`,
        { headers: { Authorization: undefined } }
      );
      if (
        response.data.status === 'SUCCESS' &&
        response.data.data &&
        response.data.data[0]
      ) {
        nav = parseFloat(response.data.data[0].nav);
        name = response.data.meta.scheme_name;
        cat = response.data.meta.scheme_category;
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error(`Failed to fetch NAV for AMFI code ${mf.AMFI}:`, error);
      return res.status(500).json({
        message: `Failed to fetch NAV for ${mf.schemeName}`
      });
    }

    if (isNaN(nav)) {
      return res
        .status(400)
        .json({ message: `Invalid NAV received for mutual fund ${mfId}` });
    }

    let taxForThisFund = 0;

    // 🟠 Lumpsum Redemption
    if (mf.investmentType === 'lumpsum') {
      const alreadyRedeemed = mf.redeemedUnits || 0;
      const availableUnits = mf.lumpsumUnits - alreadyRedeemed;

      if (unitsToRedeem > availableUnits) {
        return res.status(400).json({
          message: `Not enough units in lumpsum for ${mf.schemeName}`
        });
      }

      const purchaseNAV = mf.lumpsumAmount / mf.lumpsumUnits;
      const tax = calculateTax(
        name,
        cat,
        new Date(mf.lumpsumDate),
        new Date(now),
        unitsToRedeem,
        nav,
        purchaseNAV
      );
      taxForThisFund += tax.tax;

      await MF.updateOne(
        { _id: mfId },
        {
          $inc: { redeemedUnits: unitsToRedeem },
          $set: { lastRedemptionDate: now },
          $push: {
            redemptions: {
              date: now,
              units: unitsToRedeem,
              nav,
              taxtype: tax.type,
              tax: tax.tax
            }
          }
        }
      );
    }

    // 🔁 SIP Redemption
    if (mf.investmentType === 'sip') {
      const transactions = mf.sipTransactions || [];
      transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

      const bulkOps = [];

      for (const tx of transactions) {
        if (unitsToRedeem <= 0) break;

        const alreadyRedeemed = tx.redeemedUnits || 0;
        const available = tx.units - alreadyRedeemed;
        if (available <= 0) continue;

        const redeemNow = Math.min(unitsToRedeem, available);
        const tax = calculateTax(
          name,
          cat,
          new Date(tx.date),
          new Date(now),
          redeemNow,
          nav,
          tx.nav
        );
        taxForThisFund += tax.tax;

        bulkOps.push({
          updateOne: {
            filter: {
              _id: mfId,
              'sipTransactions._id': tx._id
            },
            update: {
              $inc: { 'sipTransactions.$.redeemedUnits': redeemNow },
              $push: {
                'sipTransactions.$.redemptions': {
                  date: now,
                  units: redeemNow,
                  nav,
                  taxtype: tax.type,
                  tax: tax.tax
                }
              }
            }
          }
        });

        await MF.updateOne(
          { _id: mfId },
          { $set: { lastRedemptionDate: now } }
        );

        unitsToRedeem -= redeemNow;
      }

      if (unitsToRedeem > 0) {
        return res.status(400).json({
          message: `Not enough units to redeem in SIP for ${mf.schemeName}`
        });
      }

      await MF.bulkWrite(bulkOps);
    }

    taxSummary.push({
      mutualFundId: mfId,
      schemeName: mf.schemeName,
      estimatedTax: taxForThisFund.toFixed(2)
    });
  }

  res.status(200).json({
    message: 'Redemption completed successfully',
    taxSummary
  });
});

exports.getAllLifePolicy = factory.getAll(MF);
exports.getLifePolicy = factory.getOne(MF, {
  path: 'holderId nominee1Id nominee2Id nominee3Id'
});
exports.updateLifePolicy = factory.updateOne(MF);
exports.deleteLifePolicy = factory.deleteOne(MF);
exports.createLifePolicy = factory.createOne(MF);

exports.getAllMutualFunds = async (req, res) => {
  try {
    const data = await getMutualFundsFromPython();
    // Convert { amfiCode: schemeName } → [{ amfiCode, schemeName }]
    const formatted = Object.entries(data).map(([amfiCode, schemeName]) => ({
      amfiCode,
      schemeName
    }));

    res.status(200).json({ status: 'success', data1: data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err });
  }
};

exports.refreshAmfiSchemeCache = async (req, res) => {
  try {
    const response = await axios.get('https://api.mfapi.in/mf', {
      headers: {
        Authorization: undefined
      }
    });
    const data = response.data;

    const schemeMap = {};
    for (const item of data) {
      schemeMap[item.schemeCode] = item.schemeName;
    }

    await client.set('amfi_scheme_map', JSON.stringify(schemeMap), {
      EX: 86400
    });

    res.status(200).json({
      status: 'success',
      message: 'Cache refreshed',
      count: Object.keys(schemeMap).length
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to refresh AMFI scheme cache',
      error: err.message || err
    });
  }
};

exports.getSchemesCaching = async (req, res) => {
  try {
    const cached = await client.get('amfi_scheme_map');
    if (!cached)
      return res
        .status(404)
        .json({ status: 'error', message: 'Scheme list not cached.' });

    const schemeMap = JSON.parse(cached);
    const result = Object.entries(schemeMap).map(([amfiCode, schemeName]) => ({
      amfiCode,
      schemeName
    }));
    res
      .status(200)
      .json({ status: 'success', length: result.length, data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
