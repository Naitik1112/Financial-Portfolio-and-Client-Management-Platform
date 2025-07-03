const PDFDocument = require('pdfkit');
// const XLSX = require('xlsx-style');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const Life = require('./../models/lifeInsuranceModel');
const General = require('./../models/generalInsuranceModels');
const Debt = require('./../models/debtModels');
const User = require('./../models/userModels');
const Mutual = require('./../models/mutualFundsModel');
const CatchAsync = require('./../utils/catchAsync');
const generatePDF = require('./../utils/generatePDF');
const generateExcel = require('./../utils/generateExcel');

const dayjs = require('dayjs');

// @ts-ignore
const { calculateXirr } = require('./../utils/xirr');

// const { xirr } = require('xirr');

exports.getUserId = CatchAsync(async (req, res, next) => {
  // const { name, format } = req.body; // Expect 'format' to specify pdf or excel

  // // Step 1: Validate input
  // if (!name) {
  //   return res.status(400).json({
  //     status: 'fail',
  //     message: 'Client name is required'
  //   });
  // }

  // // Step 2: Find the user by name
  // const user = await User.findOne({ name });
  // if (!user) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: `No user found with the name: ${name}`
  //   });
  // }

  req.userId = req.body.name; // Extract the user's ID
  req.format = req.body.format;
  req.name = req.body.name_label;
  next();
});

exports.getClaimsByClient = CatchAsync(async (req, res) => {
  const userId = req.userId;

  // Fetch general claims
  const generalClaimsRaw = await General.find({
    clientId: userId,
    claims: { $ne: [] }
  })
    .populate('clientId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name');

  // Transform general claims data
  const generalClaims = generalClaimsRaw.flatMap(doc =>
    doc.claims.map(claim => ({
      claimId: claim.claimId,
      policyId: doc.policyNumber,
      policyName: doc.policyName,
      companyName: doc.companyName,
      claim: claim.claim,
      approvalClaim: claim.approvalClaim,
      requestDate: claim.requestDate,
      approvalDate: claim.approvalDate,
      type: doc.type,
      vehicleNo: doc.vehicleID,
      clientId: doc.clientId.name
    }))
  );

  // Fetch life claims
  const lifeClaims = await Life.find({
    clientId: userId,
    deathClaim: { $ne: 0, $exists: true }
  })
    .populate('clientId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name');

  // Calculate totals for summary metrics
  let totalRequestedAmount = 0;
  let totalApprovedAmount = 0;
  let totalDeathClaims = 0;

  const formattedLifeClaims = lifeClaims.map(claim => {
    totalDeathClaims += claim.deathClaim || 0;
    return {
      _id: claim._id,
      clientId: claim.clientId.name,
      policyNumber: claim.policyNumber,
      policyName: claim.policyName,
      companyName: claim.companyName,
      deathClaimDate:
        claim.deathClaimDate?.toLocaleDateString('en-GB') || 'N/A',
      deathclaim: claim.deathClaim,
      claimSettledPercentage: '100%', // Death claims are typically fully settled
      __v: claim.__v
    };
  });

  const formattedGeneralClaims = generalClaims.map(claim => {
    const requestedAmount = parseFloat(claim.claim) || 0;
    const approvedAmount = parseFloat(claim.approvalClaim) || 0;
    const settledPercentage =
      requestedAmount > 0
        ? `${((approvedAmount / requestedAmount) * 100).toFixed(2)}%`
        : '0%';

    totalRequestedAmount += requestedAmount;
    totalApprovedAmount += approvedAmount;

    return {
      _id: claim._id,
      clientId: claim.clientId,
      claimId: claim.claimId.name,
      policyNumber: claim.policyId,
      policyName: claim.policyName,
      companyName: claim.companyName,
      claim: requestedAmount,
      approvalClaim: approvedAmount,
      requestDate: claim.requestDate?.toLocaleDateString('en-GB') || 'N/A',
      approvalDate: claim.approvalDate?.toLocaleDateString('en-GB') || 'N/A',
      type: claim.type,
      vehicleNo: claim.vehicleNo,
      claimSettledPercentage: settledPercentage,
      __v: claim.__v
    };
  });

  // Merge policies
  const mergedPolicies = [
    ...formattedLifeClaims.map(policy => ({
      ...policy,
      claimId: 'N/A',
      approvalClaim: 'N/A',
      requestDate: 'N/A',
      approvalDate: 'N/A',
      type: 'N/A',
      vehicleNo: 'N/A',
      policyType: 'Life'
    })),
    ...formattedGeneralClaims.map(policy => ({
      ...policy,
      deathClaimDate: 'N/A',
      deathclaim: 'N/A',
      policyType: 'General'
    }))
  ];

  // Prepare fields for table
  const lifeInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Policy Type', value: 'policyType' },
    { label: 'Type', value: 'type' },
    { label: 'Claim Id', value: 'claimId' },
    { label: 'Request Date', value: 'requestDate' },
    { label: 'Request Amount', value: 'claim' },
    { label: 'Approval Date', value: 'approvalDate' },
    { label: 'Approved Amount', value: 'approvalClaim' },
    { label: '% Settled', value: 'claimSettledPercentage' },
    { label: 'Vehicle No', value: 'vehicleNo' },
    { label: 'Death Claim Date', value: 'deathClaimDate' },
    { label: 'Death Claim Amount', value: 'deathclaim' }
  ];

  // Prepare extras for summary
  const extras = {
    asOnDate: new Date().toLocaleDateString('en-IN'),
    investmentSummary: {
      investor: mergedPolicies[0]?.clientId || 'Client',
      totalRequestedAmount: totalRequestedAmount.toFixed(2),
      totalApprovedAmount: totalApprovedAmount.toFixed(2),
      totalDeathClaims: totalDeathClaims.toFixed(2),
      currency: ''
    },
    summaryMetrics: {
      claim: totalRequestedAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      approvalClaim: totalApprovedAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      deathclaim: totalDeathClaims.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      overallSettlementPercentage:
        totalRequestedAmount > 0
          ? `${(
              ((totalApprovedAmount + totalDeathClaims) /
                (totalRequestedAmount + totalDeathClaims)) *
              100
            ).toFixed(2)}%`
          : '0%'
    }
  };

  // Generate report based on format
  if (req.format === 'pdf') {
    const pdfPath = path.join(
      __dirname,
      `${mergedPolicies[0]?.clientId || 'Client'}_Claims_Report.pdf`
    );
    generatePDF(
      mergedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `Claims report of ${mergedPolicies[0]?.clientId || 'Client'}.pdf`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else if (req.format === 'excel') {
    const excelPath = path.join(
      __dirname,
      `${mergedPolicies[0]?.clientId || 'Client'}_Claims_Report.xlsx`
    );
    generateExcel(
      mergedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `Claims report of ${mergedPolicies[0]?.clientId || 'Client'}.xlsx`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else {
    return res.status(200).json({
      status: 'success',
      data: {
        reportTitle: `Claims report of ${mergedPolicies[0]?.clientId ||
          'Client'}`,
        generatedOn: extras.asOnDate,
        claims: mergedPolicies,
        summary: extras.investmentSummary,
        metrics: extras.summaryMetrics
      }
    });
  }
});

exports.getSchemeByClient = CatchAsync(async (req, res) => {
  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    if (!req.userId) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID is required'
      });
    }

    const schemes = await Mutual.find({ holderId: req.userId })
      .populate('holderId', 'name email')
      .populate('nominee1Id', 'name relation')
      .populate('nominee2Id', 'name relation')
      .populate('nominee3Id', 'name relation')
      .lean();

    if (!schemes || schemes.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: `No mutual fund schemes found for this user`
      });
    }

    // CAGR calculator
    const calculateCAGR = (
      startValue,
      endValue,
      startDate,
      endDate = new Date()
    ) => {
      if (!startValue || startValue <= 0) return 0;
      const years =
        (endDate - new Date(startDate)) / (1000 * 60 * 60 * 24 * 365);
      if (years <= 0) return 0;
      const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
      return cagr;
    };

    // Calculate total portfolio value first
    let totalPortfolioValue = 0;
    const schemesWithValues = await Promise.all(
      schemes.map(async scheme => {
        const navRes = await fetch(
          `https://api.mfapi.in/mf/${scheme.AMFI}/latest`,
          {
            headers: {
              Authorization: undefined
            }
          }
        );
        if (!navRes.ok)
          throw new Error(`Failed to fetch NAV: ${navRes.statusText}`);
        const navData = await navRes.json();
        const currNAV = parseFloat(navData.data[0]?.nav || '0');

        const totalInvested =
          scheme.investmentType === 'lumpsum'
            ? scheme.lumpsumAmount
            : scheme.sipTransactions.reduce((sum, txn) => sum + txn.amount, 0);

        const Units =
          scheme.investmentType === 'lumpsum'
            ? scheme.lumpsumUnits
            : scheme.sipTransactions.reduce((sum, txn) => sum + txn.units, 0);

        const redeemedUnits =
          scheme.investmentType === 'sip'
            ? scheme.sipTransactions.reduce(
                (sum, txn) => sum + (txn.redeemedUnits || 0),
                0
              )
            : parseFloat(scheme.redeemedUnits || 0);

        const totalUnits = Units - redeemedUnits;
        const currentValue = currNAV * totalUnits || 0;
        totalPortfolioValue += currentValue;

        return {
          scheme,
          totalInvested,
          totalUnits,
          currentValue
        };
      })
    );

    // Now calculate percentage holding and other metrics
    const formattedSchemes = await Promise.all(
      schemesWithValues.map(
        async ({ scheme, totalInvested, totalUnits, currentValue }) => {
          const growth = currentValue - totalInvested;
          const growthPercentage =
            totalInvested > 0 ? (growth / totalInvested) * 100 : 0;
          const holdingPercentage =
            totalPortfolioValue > 0
              ? (currentValue / totalPortfolioValue) * 100
              : 0;

          const startDate =
            scheme.investmentType === 'lumpsum'
              ? scheme.lumpsumDate
              : scheme.sipStartDate;

          const cagr = calculateCAGR(totalInvested, currentValue, startDate);

          return {
            _id: scheme._id,
            investmentType: scheme.investmentType,
            schemeName: scheme.schemeName.split(' - ')[0],
            fundHouse: scheme.fundHouse,
            AMFI: scheme.AMFI,
            holderName: scheme.holderId?.name || 'N/A',
            holderEmail: scheme.holderId?.email || 'N/A',
            nominee1: scheme.nominee1Id
              ? `${scheme.nominee1Id.name} (${scheme.nominee1Id.relation ||
                  'N/A'})`
              : 'N/A',
            nominee2: scheme.nominee2Id
              ? `${scheme.nominee2Id.name} (${scheme.nominee2Id.relation ||
                  'N/A'})`
              : 'N/A',
            nominee3: scheme.nominee3Id
              ? `${scheme.nominee3Id.name} (${scheme.nominee3Id.relation ||
                  'N/A'})`
              : 'N/A',
            startDate: new Date(startDate).toLocaleDateString('en-IN'),
            totalInvested: totalInvested.toFixed(1),
            currentValue: currentValue.toFixed(1),
            growth: growth.toFixed(1),
            growthPercentage: growthPercentage.toFixed(1),
            cagr: cagr.toFixed(2),
            totalUnits: totalUnits.toFixed(1),
            holdingPercentage: holdingPercentage.toFixed(2),
            lastUpdated: new Date(scheme.lastUpdated).toLocaleDateString(
              'en-IN'
            ),
            status:
              scheme.investmentType === 'sip' ? scheme.sipStatus : 'active',
            investmentDuration: calculateInvestmentDuration(startDate)
          };
        }
      )
    );

    function calculateInvestmentDuration(startDate) {
      const start = new Date(startDate);
      const now = new Date();

      let months = (now.getFullYear() - start.getFullYear()) * 12;
      months -= start.getMonth();
      months += now.getMonth();

      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;

      return `${years} years ${remainingMonths} months`;
    }

    // Calculate metrics for the extras object
    const totalInvested = formattedSchemes.reduce(
      (sum, scheme) => sum + parseFloat(scheme.totalInvested),
      0
    );
    const totalCurrentValue = formattedSchemes.reduce(
      (sum, scheme) => sum + parseFloat(scheme.currentValue),
      0
    );
    const totalGrowth = totalCurrentValue - totalInvested;
    const totalGrowthPercentage =
      totalInvested > 0 ? (totalGrowth / totalInvested) * 100 : 0;

    // Calculate weighted average CAGR
    let totalWeightedCAGR = 0;
    formattedSchemes.forEach(scheme => {
      const investment = parseFloat(scheme.totalInvested);
      totalWeightedCAGR += investment * parseFloat(scheme.cagr);
    });
    const weightedAverageCAGR =
      totalInvested > 0 ? totalWeightedCAGR / totalInvested : 0;

    // Prepare the extras object for PDF generation
    const extras = {
      asOnDate: new Date().toLocaleDateString('en-IN'),
      investmentSummary: {
        currency: '',
        investor: formattedSchemes[0]?.holderName || 'Client',
        investmentAmount: totalInvested.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        currentValue: totalCurrentValue.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        unrealisedGainLoss: totalGrowth.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      },
      summaryMetrics: {
        totalUnits: formattedSchemes
          .reduce((sum, scheme) => sum + parseFloat(scheme.totalUnits || 0), 0)
          .toFixed(2),

        totalInvested: totalInvested.toFixed(2),
        currentValue: totalCurrentValue.toFixed(2)
      },
      weightedAverage: weightedAverageCAGR.toFixed(2),
      grandTotal: {
        weightedAverageAnnualReturn: `${weightedAverageCAGR.toFixed(2)} %`,
        weightedAverageAbsoluteluteReturn: `${totalGrowthPercentage.toFixed(2)} %`,
        unrealisedGainLoss: totalGrowth.toFixed(2),
        currentValue: totalCurrentValue.toFixed(2),
        currency: ''
      }
    };

    const clientName = formattedSchemes[0]?.holderName || 'Client';
    const reportTitle = `Mutual Funds Portfolio Report - ${clientName}`;

    const fields = [
      { label: 'Scheme Name', value: 'schemeName' },
      { label: 'Start Date', value: 'startDate' },
      { label: 'Duration', value: 'investmentDuration' },
      { label: 'Investment Type', value: 'investmentType' },
      { label: 'Units', value: 'totalUnits' },
      { label: 'Total Invested', value: 'totalInvested' },
      { label: 'Current Value', value: 'currentValue' },
      { label: 'Gain/Loss', value: 'growth' },
      { label: 'Gain/Loss (%)', value: 'growthPercentage' },
      { label: 'XIRR/CAGR (%)', value: 'cagr' },
      { label: '% Holding', value: 'holdingPercentage' }
    ];

    if (req.format === 'pdf') {
      const pdfPath = path.join(__dirname, 'mutual_funds_report.pdf');
      if (req.body.email) {
        await generatePDF(
          formattedSchemes,
          pdfPath,
          res,
          fields,
          reportTitle + '.pdf',
          'N/A',
          req.body.email,
          req.body.title,
          req.body.description,
          extras
        );
      } else {
        await generatePDF(
          formattedSchemes,
          pdfPath,
          res,
          fields,
          reportTitle + '.pdf',
          'N/A',
          null,
          null,
          null,
          extras
        );
      }
      console.log(extras);
    } else if (req.format === 'excel') {
      const excelPath = path.join(__dirname, 'transactions_report.xlsx');
      await generateExcel(
        formattedSchemes,
        excelPath,
        res,
        fields,
        reportTitle + '.xlsx',
        // reportDate,
        clientName,
        req.body.email,
        req.body.title,
        req.body.description,
        extras
      );
    } else {
      res.status(200).json({
        status: 'success',
        data: {
          clientName,
          reportDate: extras.asOnDate,
          portfolioSummary: {
            totalInvested: extras.investmentSummary.investmentAmount,
            currentValue: extras.investmentSummary.currentValue,
            unrealisedGainLoss: extras.investmentSummary.unrealisedGainLoss,
            weightedAverageCAGR: extras.weightedAverage
          },
          schemes: formattedSchemes
        }
      });
    }
  } catch (error) {
    console.error('Error generating mutual fund report:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating the report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

exports.getSchemeValuationByClient = CatchAsync(async (req, res) => {
  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));
    const { calculateXirr } = require('./../utils/xirr');

    const { name: holderId, schemeId, format, name_label } = req.body;

    if (!holderId || !schemeId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Holder ID and Scheme ID are required'
      });
    }

    // Get the target scheme to extract its AMFI code
    const targetScheme = await Mutual.findOne({
      _id: schemeId,
      holderId
    }).lean();
    if (!targetScheme) {
      return res.status(404).json({
        status: 'fail',
        message: 'Scheme not found for the provided holder'
      });
    }

    const targetAMFI = targetScheme.AMFI;

    // Fetch all schemes with the same AMFI and holder
    const schemes = await Mutual.find({ AMFI: targetAMFI, holderId })
      .populate('holderId', 'name email')
      .lean();

    if (!schemes || schemes.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No matching schemes found for AMFI and holder'
      });
    }

    // Get NAV and date
    const navRes = await fetch(`https://api.mfapi.in/mf/${targetAMFI}/latest`);
    if (!navRes.ok)
      throw new Error(`Failed to fetch NAV: ${navRes.statusText}`);
    const navData = await navRes.json();

    const latestNAV = parseFloat(navData.data[0]?.nav || '0');
    const last_date = navData.data[0]?.date || 'N/A';
    const now = new Date();

    // Calculate totals
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalUnits = 0;
    let xirrTransactions = [];

    const calculateCAGR = (initialAmount, finalAmount, startDate) => {
      const years = (now - new Date(startDate)) / (1000 * 60 * 60 * 24 * 365);
      if (initialAmount <= 0 || years <= 0) return 0;
      return (Math.pow(finalAmount / initialAmount, 1 / years) - 1) * 100;
    };

    // Aggregate transactions from all schemes
    const transactions = [];

    for (const scheme of schemes) {
      if (scheme.investmentType === 'sip') {
        for (const txn of scheme.sipTransactions || []) {
          const date = new Date(txn.date);
          const amount = txn.amount;
          const nav = txn.nav;
          const units = txn.units;
          const currentAmount = units * latestNAV;
          const duration = ((now - date) / (1000 * 60 * 60 * 24 * 365)).toFixed(
            2
          );
          const cagr = calculateCAGR(amount, currentAmount, date);

          totalInvested += amount;
          totalCurrentValue += currentAmount;
          totalUnits += units;
          xirrTransactions.push({ amount: -amount, date });

          transactions.push({
            date: dayjs(date).format('YYYY-MM-DD'),
            amountInvested: amount.toFixed(2),
            navAtDate: nav.toFixed(4),
            units: units.toFixed(4),
            currentAmount: currentAmount.toFixed(2),
            latestNAV: latestNAV.toFixed(4),
            duration: `${duration} yrs`,
            cagr: `${cagr.toFixed(2)}%`
          });
        }
      } else if (scheme.investmentType === 'lumpsum') {
        const date = new Date(scheme.lumpsumDate);
        const amount = scheme.lumpsumAmount;
        const units = scheme.lumpsumUnits;
        const nav = amount / units;
        const currentAmount = units * latestNAV;
        const duration = ((now - date) / (1000 * 60 * 60 * 24 * 365)).toFixed(
          2
        );
        const cagr = calculateCAGR(amount, currentAmount, date);

        totalInvested += amount;
        totalCurrentValue += currentAmount;
        totalUnits += units;
        xirrTransactions.push({ amount: -amount, date });

        transactions.push({
          date: dayjs(date).format('YYYY-MM-DD'),
          amountInvested: amount.toFixed(2),
          navAtDate: nav.toFixed(4),
          units: units.toFixed(4),
          currentAmount: currentAmount.toFixed(2),
          latestNAV: latestNAV.toFixed(4),
          duration: `${duration} yrs`,
          cagr: `${cagr.toFixed(2)}%`
        });
      }
    }

    // Add current value as final transaction for XIRR calculation
    xirrTransactions = [];

    for (const scheme of schemes) {
      if (scheme.investmentType === 'sip') {
        for (const txn of scheme.sipTransactions || []) {
          xirrTransactions.push({
            amount: -txn.amount, // Negative for investments
            when: new Date(txn.date)
          });
        }
      } else if (scheme.investmentType === 'lumpsum') {
        xirrTransactions.push({
          amount: -scheme.lumpsumAmount, // Negative for investments
          when: new Date(scheme.lumpsumDate)
        });
      }
    }

    // Add current value as positive cash flow (redemption)
    xirrTransactions.push({
      amount: totalCurrentValue, // Positive for final value
      when: new Date() // Current date
    });

    // 2. Calculate XIRR with proper error handling
    let xirr = 0;
    try {
      const rawXirr = calculateXirr(xirrTransactions);
      // Handle NaN cases
      if (isNaN(rawXirr)) {
        console.warn('XIRR calculation returned NaN, using 0');
        xirr = 0;
      } else {
        xirr = rawXirr * 100; // Convert to percentage
      }
    } catch (error) {
      console.error('XIRR calculation failed:', error);
      xirr = 0; // Fallback value
    }
    // console.log(xirrTransactions);
    // console.log('xirr', xirr);
    const totalGrowth = totalCurrentValue - totalInvested;

    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    const transactionFields = [
      { label: 'Date', value: 'date' },
      { label: 'Amount Invested', value: 'amountInvested', format: 'currency' },
      { label: 'NAV at Date', value: 'navAtDate' },
      { label: 'Units Bought', value: 'units' },
      { label: 'Current Amount', value: 'currentAmount', format: 'currency' },
      { label: `Latest NAV (${last_date})`, value: 'latestNAV' },
      { label: 'Duration', value: 'duration' },
      { label: 'CAGR', value: 'cagr', format: 'percentage' }
    ];

    const reportTitle = `Valuation Report of ${name_label} - ${targetScheme.schemeName}`;
    const reportDate = new Date().toLocaleDateString('en-IN');
    const clientName = schemes[0]?.holderId?.name || 'Client';

    // Complete extras object
    const extras = {
      asOnDate: reportDate,
      investmentSummary: {
        currency: '',
        investor: clientName,
        investmentAmount: totalInvested.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        currentValue: totalCurrentValue.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        unrealisedGainLoss: totalGrowth.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        xirr: xirr.toFixed(2)
      },
      summaryMetrics: {
        units: totalUnits.toFixed(2),
        amountInvested: totalInvested.toFixed(2),
        currentAmount: totalCurrentValue.toFixed(2)
      },
      grandTotal: {
        weightedAverageAnnualReturn: xirr.toFixed(2),
        weightedAverageAbsoluteReturn: (
          (totalCurrentValue / totalInvested - 1) *
          100
        ).toFixed(2),
        unrealisedGainLoss: totalGrowth.toFixed(2),
        currentValue: totalCurrentValue.toFixed(2),
        currency: ''
      }
    };

    if (format === 'pdf') {
      const pdfPath = path.join(__dirname, 'transactions_report.pdf');
      if (req.body.email) {
        await generatePDF(
          transactions,
          pdfPath,
          res,
          transactionFields,
          reportTitle + '.pdf',
          'N/A', // space parameter
          req.body.email,
          req.body.title,
          req.body.description,
          extras // passing the complete extras object
        );
      } else {
        await generatePDF(
          transactions,
          pdfPath,
          res,
          transactionFields,
          reportTitle + '.pdf',
          'N/A', // space parameter
          null, // email
          null, // subject
          null, // description
          extras // passing the complete extras object
        );
      }
    } else if (format === 'excel') {
      const excelPath = path.join(__dirname, 'transactions_report.xlsx');
      if (req.body.email) {
        await generateExcel(
          transactions,
          excelPath,
          res,
          transactionFields,
          reportTitle + '.xlsx',
          'N/A', // space parameter
          req.body.email,
          req.body.title,
          req.body.description,
          extras // passing the complete extras object
        );
      } else {
        await generateExcel(
          transactions,
          excelPath,
          res,
          transactionFields,
          reportTitle + '.xlsx',
          'N/A', // space parameter
          null, // email
          null, // subject
          null, // description
          extras // passing the complete extras object
        );
      }
    } else {
      return res.status(200).json({
        status: 'success',
        data: {
          reportDate,
          clientName,
          amfi: targetAMFI,
          schemeName: targetScheme.schemeName,
          fundHouse: targetScheme.fundHouse,
          transactions,
          extras // including extras in JSON response
        }
      });
    }
  } catch (error) {
    console.error('Error generating scheme valuation report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error generating report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

exports.getPolicyByClient = CatchAsync(async (req, res) => {
  const name = req.name;
  const policies = await Life.find({ clientId: req.userId })
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name');

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${name}`
    });
  }

  // Calculate totals for summary metrics
  let totalPremiumPaid = 0;
  let totalClaims = 0;

  const formattedPolicies = policies.map(policy => {
    // Calculate premium duration based on mode
    const startDate = new Date(policy.startPremiumDate);
    const endDate = new Date(policy.endPremiumDate);
    let duration = 0;
    let totalPremiumForPolicy = 0;

    if (policy.mode === 'Annual' || policy.mode === 'Yearly') {
      duration = endDate.getFullYear() - startDate.getFullYear();
      totalPremiumForPolicy = policy.premium * duration;
    } else if (policy.mode === 'Quarterly') {
      const totalMonths =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      duration = Math.ceil(totalMonths / 3); // 3 months per quarter
      totalPremiumForPolicy = policy.premium * duration;
    } else if (policy.mode === 'Half-Yearly') {
      const totalMonths =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      duration = Math.ceil(totalMonths / 6); // 6 months per half-year
      totalPremiumForPolicy = policy.premium * duration;
    } else if (policy.mode === 'Monthly') {
      const totalMonths =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      duration = Math.ceil(totalMonths);
      totalPremiumForPolicy = policy.premium * duration;
    }

    // Calculate total claims
    const policyClaims =
      policy.claim?.reduce((sum, c) => sum + (c.claim || 0), 0) || 0;

    // Calculate growth percentage
    const growthPercentage =
      totalPremiumForPolicy > 0
        ? (
            ((policyClaims - totalPremiumForPolicy) / totalPremiumForPolicy) *
            100
          ).toFixed(2)
        : '0.00';

    // Update totals
    totalPremiumPaid += totalPremiumForPolicy;
    totalClaims += policyClaims;

    return {
      _id: policy._id,
      policyNumber: policy.policyNumber,
      policyName: policy.policyName,
      companyName: policy.companyName,
      holderName: policy.clientId?.name || null,
      nominee1Name: policy.nominee1ID?.name || null,
      startPremiumDate: startDate.toLocaleDateString('en-GB'),
      endPremiumDate: endDate.toLocaleDateString('en-GB'),
      maturityDate: policy.maturityDate?.toLocaleDateString('en-GB') || 'N/A',
      premium: policy.premium,
      premiumMode: policy.mode || 'Annual',
      totalPremiumPaid: totalPremiumForPolicy.toFixed(2),
      totalClaims: policyClaims.toFixed(2),
      growthPercentage: `${growthPercentage}%`,
      __v: policy.__v
    };
  });

  // Calculate overall growth percentage
  const overallGrowthPercentage =
    totalPremiumPaid > 0
      ? (((totalClaims - totalPremiumPaid) / totalPremiumPaid) * 100).toFixed(2)
      : '0.00';

  // Prepare extras for summary
  const extras = {
    asOnDate: new Date().toLocaleDateString('en-IN'),
    investmentSummary: {
      investor: formattedPolicies[0]?.holderName || 'Client',
      totalPremiumPaid: totalPremiumPaid.toFixed(2),
      totalClaims: totalClaims.toFixed(2),
      growthPercentage: `${overallGrowthPercentage}%`,
      currency: '₹'
    },
    summaryMetrics: {
      totalPremiumPaid: totalPremiumPaid.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
      totalClaims: totalClaims.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    }
  };

  const lifeInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Company Name', value: 'companyName' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'End Date', value: 'endPremiumDate' },
    { label: 'Premium Amount', value: 'premium' },
    { label: 'Premium Mode', value: 'premiumMode' },
    { label: 'Total Premium Paid', value: 'totalPremiumPaid' },
    { label: 'Maturity Date', value: 'maturityDate' },
    { label: 'Total Claim', value: 'totalClaims' },
    { label: 'Growth %', value: 'growthPercentage' },
    { label: 'Nominee 1', value: 'nominee1Name' }
  ];

  if (req.format === 'pdf') {
    const pdfPath = path.join(__dirname, `${name}_life_Ins_report.pdf`);
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `Life Insurance report of ${formattedPolicies[0]?.holderName ||
        'Client'}.pdf`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else if (req.format === 'excel') {
    const excelPath = path.join(__dirname, `${name}_life_Ins_report.xlsx`);
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `Life Insurance report of ${formattedPolicies[0]?.holderName ||
        'Client'}.xlsx`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else {
    return res.status(200).json({
      status: 'success',
      data: {
        reportTitle: `Life Insurance report of ${formattedPolicies[0]
          ?.holderName || 'Client'}`,
        generatedOn: extras.asOnDate,
        policies: formattedPolicies,
        summary: extras.investmentSummary,
        metrics: extras.summaryMetrics
      }
    });
  }
});

exports.getGeneralPolicyByClient = CatchAsync(async (req, res) => {
  const name = req.name;

  const policies = await General.find({ clientId: req.userId })
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name');

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${name}`
    });
  }

  // Calculate totals for summary metrics
  let totalPremiumPaid = 0;
  let totalRequestedClaims = 0;
  let totalApprovedClaims = 0;

  const formattedPolicies = policies.map(policy => {
    // Calculate total premium from premium array
    const policyPremium =
      policy.premium?.reduce((sum, p) => sum + (p.premium1 || 0), 0) || 0;

    // Calculate claim metrics
    let policyRequestedClaims = 0;
    let policyApprovedClaims = 0;

    policy.claims?.forEach(claim => {
      policyRequestedClaims += claim.claim || 0;
      policyApprovedClaims += claim.approvalClaim || 0;
    });

    const approvalRate =
      policyRequestedClaims > 0
        ? ((policyApprovedClaims / policyRequestedClaims) * 100).toFixed(2)
        : '0.00';

    // Update totals
    totalPremiumPaid += policyPremium;
    totalRequestedClaims += policyRequestedClaims;
    totalApprovedClaims += policyApprovedClaims;

    return {
      _id: policy._id,
      policyNumber: policy.policyNumber,
      policyName: policy.policyName,
      companyName: policy.companyName,
      holderName: policy.clientId?.name || null,
      startPremiumDate:
        policy.startPremiumDate?.toLocaleDateString('en-GB') || 'N/A',
      type: policy.type,
      vehicleID: policy.vehicleID || 'N/A',
      totalPremium: policyPremium.toFixed(2),
      totalRequestedClaims: policyRequestedClaims.toFixed(2),
      totalApprovedClaims: policyApprovedClaims.toFixed(2),
      approvalRate: `${approvalRate}%`,
      __v: policy.__v
    };
  });

  // Calculate overall metrics
  const overallApprovalRate =
    totalRequestedClaims > 0
      ? ((totalApprovedClaims / totalRequestedClaims) * 100).toFixed(2)
      : '0.00';

  const growthPercentage =
    totalPremiumPaid > 0
      ? (
          ((totalApprovedClaims - totalPremiumPaid) / totalPremiumPaid) *
          100
        ).toFixed(2)
      : '0.00';

  // Prepare extras for summary
  const extras = {
    asOnDate: new Date().toLocaleDateString('en-IN'),
    investmentSummary: {
      investor: formattedPolicies[0]?.holderName || 'Client',
      totalPremiumPaid: totalPremiumPaid.toFixed(2),
      totalRequestedClaims: totalRequestedClaims.toFixed(2),
      totalApprovedClaims: totalApprovedClaims.toFixed(2),
      approvalRate: `${overallApprovalRate}%`,
      currency: '₹'
    },
    summaryMetrics: {
      totalPremium: totalPremiumPaid.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      totalRequestedClaims: totalRequestedClaims.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      totalApprovedClaims: totalApprovedClaims.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      overallApprovalRate: `${overallApprovalRate}%`,
      growthPercentage: `${growthPercentage}%`
    }
  };

  const generalInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Company Name', value: 'companyName' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'Type', value: 'type' },
    { label: 'Vehicle No', value: 'vehicleID' },
    { label: 'Total Premium', value: 'totalPremium' },
    { label: 'Requested Claims', value: 'totalRequestedClaims' },
    { label: 'Approved Claims', value: 'totalApprovedClaims' },
    { label: 'Approval Rate', value: 'approvalRate' }
  ];

  if (req.format === 'pdf') {
    const pdfPath = path.join(__dirname, `${name}_General_Ins_report.pdf`);
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      generalInsuranceFields,
      `General Insurance report of ${formattedPolicies[0]?.holderName ||
        'Client'}.pdf`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else if (req.format === 'excel') {
    const excelPath = path.join(__dirname, `${name}_General_Ins_report.xlsx`);
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      generalInsuranceFields,
      `General Insurance report of ${formattedPolicies[0]?.holderName ||
        'Client'}.xlsx`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else {
    return res.status(200).json({
      status: 'success',
      data: {
        reportTitle: `General Insurance report of ${formattedPolicies[0]
          ?.holderName || 'Client'}`,
        generatedOn: extras.asOnDate,
        policies: formattedPolicies,
        summary: extras.investmentSummary,
        metrics: extras.summaryMetrics
      }
    });
  }
});

exports.getDebtsByClient = CatchAsync(async (req, res) => {
  const name = req.name;

  const policies = await Debt.find({ holderId: req.userId })
    .populate('holderId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name');

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${name}`
    });
  }

  // Calculate totals and growth metrics
  let totalInvested = 0;
  let totalMaturity = 0;
  let totalGrowthAmount = 0;
  let totalInterestRate = 0;

  const formattedPolicies = policies.map(policy => {
    const startDate = new Date(policy.startDate);
    const maturityDate = new Date(policy.MaturityDate);
    const years = (maturityDate - startDate) / (1000 * 60 * 60 * 24 * 365);
    const rate = policy.intrestRate / 100;
    const amountReceived = policy.amount * Math.pow(1 + rate, years);
    const growthAmount = amountReceived - policy.amount;
    const growthPercentage = (growthAmount / policy.amount) * 100;

    // Accumulate totals
    totalInvested += policy.amount;
    totalMaturity += amountReceived;
    totalGrowthAmount += growthAmount;
    totalInterestRate += policy.intrestRate;

    return {
      _id: policy._id,
      AccountNumber: policy.AccountNumber,
      bankDetails: policy.bankDetails,
      startDate: startDate.toLocaleDateString('en-GB'),
      amount: policy.amount,
      intrestRate: policy.intrestRate,
      MaturityDate: maturityDate.toLocaleDateString('en-GB'),
      amountReceived: amountReceived.toFixed(2),
      growthAmount: growthAmount.toFixed(2),
      growthPercentage: growthPercentage.toFixed(2),
      holderName: policy.holderId?.name || null,
      nominee1Name: policy.nominee1Id?.name || null,
      type: policy.type,
      __v: policy.__v
    };
  });

  // Calculate averages
  const AverageInterestRate = (totalInterestRate / policies.length).toFixed(2);
  const AverageGrowthPercentage = (
    ((totalMaturity - totalInvested) / totalInvested) *
    100
  ).toFixed(2);

  const lifeInsuranceFields = [
    { label: 'Account Number', value: 'AccountNumber' },
    { label: 'Bank Details', value: 'bankDetails' },
    { label: 'Starting Date', value: 'startDate' },
    { label: 'Amount Invested', value: 'amount' },
    { label: 'Interest Rate (%)', value: 'intrestRate' },
    { label: 'Maturity Date', value: 'MaturityDate' },
    { label: 'Maturity Amount', value: 'amountReceived' },
    { label: 'Growth Amount', value: 'growthAmount' },
    { label: 'Growth (%)', value: 'growthPercentage' },
    { label: 'Nominee 1', value: 'nominee1Name' }
  ];

  // Prepare extras for PDF/Excel generation
  let weightedInterestSum = 0;
  let weightedGrowthSum = 0;

  policies.forEach(policy => {
    weightedInterestSum += policy.amount * policy.intrestRate;
    const maturityAmount =
      policy.amount *
      Math.pow(
        1 + policy.intrestRate / 100,
        (new Date(policy.MaturityDate) - new Date(policy.startDate)) /
          (1000 * 60 * 60 * 24 * 365)
      );
    weightedGrowthSum +=
      policy.amount *
      (((maturityAmount - policy.amount) / policy.amount) * 100);
  });

  const weightedAverageInterestRate = (weightedInterestSum / totalInvested).toFixed(
    2
  );
  const weightedAverageGrowthPercentage = (
    weightedGrowthSum / totalInvested
  ).toFixed(2);

  // Then update the extras object to use these weighted averages:
  const extras = {
    asOnDate: new Date().toLocaleDateString('en-IN'),
    investmentSummary: {
      investor: formattedPolicies[0]?.holderName || 'Client',
      totalInvested: totalInvested.toFixed(2),
      totalMaturity: totalMaturity.toFixed(2),
      totalGrowth: totalGrowthAmount.toFixed(2),
      weightedAverageInterestRate, // Changed from AverageInterestRate
      weightedAverageGrowthPercentage // Changed from AverageGrowthPercentage
    },
    summaryMetrics: {
      amount: totalInvested.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      amountReceived: totalMaturity.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      growthAmount: totalGrowthAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      weightedAverageInterestRate: `${weightedAverageInterestRate}%`, // Changed
      weightedAverageGrowthPercentage: `${weightedAverageGrowthPercentage}%` // Changed
    }
  };

  if (req.format === 'pdf') {
    const pdfPath = path.join(__dirname, `${name}_Debt_report.pdf`);
    if (req.body.email) {
      generatePDF(
        formattedPolicies,
        pdfPath,
        res,
        lifeInsuranceFields,
        `Debt report of ${formattedPolicies[0].holderName}.pdf`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description,
        extras
      );
    } else {
      generatePDF(
        formattedPolicies,
        pdfPath,
        res,
        lifeInsuranceFields,
        `Debt report of ${formattedPolicies[0].holderName}.pdf`,
        'N/A',
        null,
        null,
        null,
        extras
      );
    }
  } else if (req.format === 'excel') {
    const excelPath = path.join(__dirname, `${name}_Debt_report.xlsx`);
    if (req.body.email) {
      generateExcel(
        formattedPolicies,
        excelPath,
        res,
        lifeInsuranceFields,
        `Debt report of ${formattedPolicies[0].holderName}.xlsx`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description,
        extras
      );
    } else {
      generateExcel(
        formattedPolicies,
        excelPath,
        res,
        lifeInsuranceFields,
        `Debt report of ${formattedPolicies[0].holderName}.xlsx`,
        'N/A',
        null,
        null,
        null,
        extras
      );
    }
  } else {
    return res.status(200).json({
      status: 'success',
      data: {
        reportTitle: `Debt report of ${formattedPolicies[0]?.holderName}`,
        generatedOn: extras.asOnDate,
        policies: formattedPolicies,
        summary: extras.investmentSummary,
        metrics: extras.summaryMetrics
      }
    });
  }
});

exports.getCashFlowByClient = CatchAsync(async (req, res) => {
  try {
    const { format } = req.body;
    const clientId = req.userId;

    // 1. Fetch all policies for the client
    const policies = await Life.find({ clientId }).lean();
    if (!policies.length) {
      return res.status(404).json({
        status: 'fail',
        message: 'No policies found for this client'
      });
    }

    // 2. Fetch client and nominee details
    const client = await User.findById(clientId).select('name DOB');
    const nomineeIds = policies
      .flatMap(p => [p.nominee1ID, p.nominee2ID, p.nominee3ID])
      .filter(Boolean);
    const nominees = await User.find({ _id: { $in: nomineeIds } }).select(
      'name DOB'
    );

    // Helper function to calculate age
    const getAge = (DOB, year) =>
      DOB ? Math.max(0, year - new Date(DOB).getFullYear()) : null;

    // 3. Extract all unique years and company names
    const allYears = new Set();
    const companyNames = new Set();

    policies.forEach(policy => {
      const startYear = new Date(policy.startPremiumDate).getFullYear();
      const endYear = new Date(policy.endPremiumDate).getFullYear();
      companyNames.add(policy.companyName);

      // Add premium payment years
      for (let year = startYear; year <= endYear; year++) {
        allYears.add(year);
      }

      // Add claim years
      policy.claim.forEach(claim => allYears.add(claim.year));
    });

    const sortedYears = [...allYears].sort((a, b) => a - b);
    const companies = [...companyNames];

    // 4. Generate cash flow data and calculate metrics
    let lastPremiumYear = null;
    let premiumFreeYear = null;
    let totalNetInflow = 0;
    let totalNetOutflow = 0;
    let totalNetCashFlow = 0;

    // First pass to collect all years data
    const yearlyData = sortedYears.map(year => {
      let netInflow = 0;
      let netOutflow = 0;
      const inflowByCompany = {};
      const outflowByCompany = {};

      // Initialize company totals
      companies.forEach(company => {
        inflowByCompany[company] = 0;
        outflowByCompany[company] = 0;
      });

      // Calculate flows for each policy
      policies.forEach(policy => {
        const company = policy.companyName;

        // Premium payments (outflow)
        const startYear = new Date(policy.startPremiumDate).getFullYear();
        const endYear = new Date(policy.endPremiumDate).getFullYear();
        if (year >= startYear && year <= endYear) {
          const premium = policy.premium || 0;
          outflowByCompany[company] += premium;
          netOutflow += premium;
        }

        // Claims (inflow)
        policy.claim
          .filter(c => c.year === year)
          .forEach(c => {
            const claimAmount = c.claim || 0;
            inflowByCompany[company] += claimAmount;
            netInflow += claimAmount;
          });
      });

      // Track last premium year
      if (netOutflow > 0) {
        lastPremiumYear = year;
      }

      // Update totals
      totalNetInflow += netInflow;
      totalNetOutflow += netOutflow;
      totalNetCashFlow += netInflow - netOutflow;

      return {
        year,
        netInflow,
        netOutflow,
        companies,
        inflowByCompany,
        outflowByCompany
      };
    });

    // Second pass to find premiumFreeYear
    for (let i = 0; i < yearlyData.length; i++) {
      const { year, netInflow, netOutflow } = yearlyData[i];

      if (netInflow > 0 && netOutflow === 0) {
        // Check if all future years have no outflow
        const allFutureOutflowsZero = yearlyData
          .slice(i + 1)
          .every(data => data.netOutflow === 0);

        if (allFutureOutflowsZero) {
          premiumFreeYear = year;
          break; // We found the first qualifying year
        }
      }
    }

    // Prepare final cashFlowData with all required fields
    const cashFlowData = yearlyData.map(data => ({
      year: data.year,
      clientName: client?.name || 'Client',
      clientAge: getAge(client?.DOB, data.year),
      ...Object.fromEntries(
        data.companies.map(company => [
          `InFlow_${company}`,
          data.inflowByCompany[company]
        ])
      ),
      NetInflow: data.netInflow,
      ...Object.fromEntries(
        data.companies.map(company => [
          `OutFlow_${company}`,
          data.outflowByCompany[company]
        ])
      ),
      NetOutflow: data.netOutflow,
      NetCashFlow: data.netInflow - data.netOutflow
    }));

    // 5. Prepare the investment summary
    const investmentSummary = {
      investor: client?.name || 'Client',
      currency: '₹'
    };

    // Add last premium details if exists
    if (lastPremiumYear) {
      investmentSummary.lastPremiumYear = lastPremiumYear;
      investmentSummary.lastPremiumAge = getAge(client?.DOB, lastPremiumYear);
    }

    // Add premium free with inflow details if exists and different from last premium year
    if (premiumFreeYear && premiumFreeYear - 1 !== lastPremiumYear) {
      investmentSummary.premiumFreeYear = premiumFreeYear;
      investmentSummary.premiumFreeAndInflowAge = getAge(
        client?.DOB,
        premiumFreeYear
      );
    }

    // Prepare the extras object
    const extras = {
      asOnDate: new Date().toLocaleDateString('en-IN'),
      investmentSummary: investmentSummary,
      summaryMetrics: {
        NetInflow: totalNetInflow.toLocaleString('en-IN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }),
        NetOutflow: totalNetOutflow.toLocaleString('en-IN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }),
        NetCashFlow: totalNetCashFlow.toLocaleString('en-IN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
      }
    };

    // 6. Generate report labels
    const cashFlowLabels = [
      { label: 'Year', value: 'year' },
      { label: 'Client Age', value: 'clientAge' },
      ...companies.map(company => ({
        label: `${company} Inflow`,
        value: `InFlow_${company}`
      })),
      { label: 'Total Inflow', value: 'NetInflow' },
      ...companies.map(company => ({
        label: `${company} Outflow`,
        value: `OutFlow_${company}`
      })),
      { label: 'Total Outflow', value: 'NetOutflow' },
      { label: 'Net Cash Flow', value: 'NetCashFlow' }
    ];

    // 7. Generate the requested output format
    if (format === 'pdf') {
      const pdfPath = path.join(__dirname, `${client?.name}_CashFlow.pdf`);
      await generatePDF(
        cashFlowData,
        pdfPath,
        res,
        cashFlowLabels,
        `Cash Flow Report - ${client?.name}.pdf`,
        '-',
        req.body.email,
        req.body.title || 'Cash Flow Report',
        req.body.description || `Cash flow analysis for ${client?.name}`,
        extras
      );
    } else if (format === 'excel') {
      const excelPath = path.join(__dirname, `${client?.name}_CashFlow.xlsx`);
      await generateExcel(
        cashFlowData,
        excelPath,
        res,
        cashFlowLabels,
        `Cash Flow Report - ${client?.name}.xlsx`,
        '-',
        req.body.email,
        req.body.title || 'Cash Flow Report',
        req.body.description || `Cash flow analysis for ${client?.name}`,
        extras
      );
    } else {
      // Return JSON response
      return res.status(200).json({
        status: 'success',
        data: {
          reportTitle: `Cash Flow Report - ${client?.name}`,
          generatedOn: extras.asOnDate,
          cashFlowData,
          extras
        }
      });
    }
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating the report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
