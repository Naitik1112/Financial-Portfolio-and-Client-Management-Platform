const MF = require('./../models/mutualFundsModel');
// const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('./../models/userModels');

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
  console.log(req.body);

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
  } else {
    req.body.nominee1Id = await findIdByName(nominee1Id);
  }

  if (!nominee2Id || nominee2Id.trim() === '') {
    delete req.body.nominee2Id; // Remove nominee2Id if it's empty
  } else {
    req.body.nominee2Id = await findIdByName(nominee2Id);
  }

  if (!nominee3Id || nominee3Id.trim() === '') {
    delete req.body.nominee3Id; // Remove nominee3Id if it's empty
  } else {
    req.body.nominee3Id = await findIdByName(nominee3Id);
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
  purchaseDate,
  redeemDate,
  units,
  navAtRedemption,
  navAtPurchase
) => {
  const holdingPeriod = (redeemDate - purchaseDate) / (1000 * 3600 * 24); // in days
  const gainPerUnit = navAtRedemption - navAtPurchase;
  const totalGain = gainPerUnit * units;

  if (holdingPeriod <= 365) {
    return { type: 'STCG', tax: 0.15 * totalGain };
  } else {
    return { type: 'LTCG', tax: 0.1 * totalGain };
  }
};

exports.redeemUnits = catchAsync(async (req, res, next) => {
  const redemptionMap = req.body; // { mfId1: "100", mfId2: "200" }
  const taxSummary = [];

  for (const mfId of Object.keys(redemptionMap)) {
    let unitsToRedeem = parseFloat(redemptionMap[mfId]);
    if (isNaN(unitsToRedeem) || unitsToRedeem <= 0) continue;

    const mf = await MF.findOne({ _id: mfId });

    if (!mf) {
      return res
        .status(404)
        .json({ message: `Mutual fund not found: ${mfId}` });
    }

    // Calculate current NAV
    const nav =
      mf.currentValue && mf.investmentType === 'lumpsum'
        ? mf.currentValue / mf.lumpsumUnits
        : mf.currentValue /
          mf.sipTransactions.reduce((sum, tx) => sum + (tx.units || 0), 0);

    if (!nav || isNaN(nav)) {
      return res
        .status(400)
        .json({ message: `Unable to get NAV for mutual fund ${mfId}` });
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
        new Date(mf.lumpsumDate),
        new Date(),
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
              date: new Date(),
              units: unitsToRedeem,
              nav
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
          new Date(tx.date),
          new Date(),
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
                  date: new Date(),
                  units: redeemNow,
                  nav
                }
              }
            }
          }
        });

        await MF.updateOne(
          { _id: mfId },
          { $set: { lastRedemptionDate: new Date() } }
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

exports.refreshAmfiSchemeCache = (req, res) => {
  const scriptPath = path.join(__dirname, './../python/fetch_amfi_data.py');
  const pythonPath = process.env.PYTHON_PATH || 'python';

  exec(
    `${pythonPath} "${scriptPath}"`,
    { maxBuffer: 1024 * 1024 * 5 },
    async (err, stdout, stderr) => {
      if (err)
        return res.status(500).json({ status: 'error', message: stderr });

      try {
        const schemeMap = JSON.parse(stdout); // { amfiCode: schemeName }
        const res1 = await client.set(
          'amfi_scheme_map',
          JSON.stringify(schemeMap),
          {
            EX: 86400
          }
        ); // expire after 1 day
        // console.log(' ', res1);
        // console.log('Response');
        res.status(200).json({
          status: 'success',
          message: 'Cache refreshed',
          count: Object.keys(schemeMap).length
        });
      } catch (e) {
        res
          .status(500)
          .json({ status: 'error', message: `JSON parse or Redis error ${e}` });
      }
    }
  );
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
