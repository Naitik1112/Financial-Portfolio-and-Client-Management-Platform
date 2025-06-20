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
  const userId = req.userId; // Assuming `req.userId` contains the authenticated user's ID

  const generalClaimsRaw = await General.find({
    clientId: userId,
    claims: { $ne: [] }
  })
    .populate('clientId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name');

  // Transform data to extract required fields
  const generalClaims = generalClaimsRaw.flatMap(doc =>
    doc.claims.map(claim => ({
      claimId: claim.claimId,
      policyId: doc.policyNumber, // Assuming policyNumber is policyId
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
  console.log(userId);
  console.log(generalClaims);
  console.log(lifeClaims);
  const formattedLifeClaims = lifeClaims.map(lifeClaims => ({
    _id: lifeClaims._id,
    clientId: lifeClaims.clientId.name,
    policyNumber: lifeClaims.policyNumber,
    policyName: lifeClaims.policyName,
    companyName: lifeClaims.companyName,
    deathClaimDate: lifeClaims.deathClaimDate.toLocaleDateString('en-GB'),
    deathclaim: lifeClaims.deathClaim,
    __v: lifeClaims.__v
  }));

  const formattedGeneralClaims = generalClaims.map(generalClaims => ({
    _id: generalClaims._id,
    clientId: generalClaims.clientId,
    claimId: generalClaims.claimId.name,
    policyNumber: generalClaims.policyId,
    policyName: generalClaims.policyName,
    companyName: generalClaims.companyName,
    claim: generalClaims.claim,
    approvalClaim: generalClaims.approvalClaim,
    requestDate: generalClaims.requestDate.toLocaleDateString('en-GB'),
    approvalDate: generalClaims.approvalDate.toLocaleDateString('en-GB'),
    type: generalClaims.type,
    vehicleNo: generalClaims.vehicleNo,
    __v: generalClaims.__v
  }));

  const mergedPolicies = [
    ...formattedLifeClaims.map(policy => ({
      ...policy,
      claimId: 'N/A', // Not available in Life
      approvalClaim: 'N/A',
      requestDate: 'N/A',
      approvalDate: 'N/A',
      type: 'N/A',
      vehicleNo: 'N/A',
      policyType: 'Life' // New field to indicate policy type
    })),
    ...formattedGeneralClaims.map(policy => ({
      ...policy,
      deathClaimDate: 'N/A',
      deathclaim: 'N/A',
      policyType: 'General' // New field to indicate policy type
    }))
  ];
  // console.log(lifePolicies[0].clientId);
  // console.log(lifePolicies[0].clientId.name);
  // console.log(lifePolicies);
  // console.log(formattedLifePolicies);
  // console.log(mergedPolicies);

  const lifeInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Policy Type', value: 'policyType' },
    { label: 'Type', value: 'type' },
    { label: 'Claim Id', value: 'claimId' },
    { label: 'Request Date', value: 'requestDate' },
    { label: 'Request Claim', value: 'claim' },
    { label: 'Approval Date', value: 'approvalDate' },
    { label: 'Approval Claim', value: 'approvalClaim' },
    { label: 'Vehicle No', value: 'vehicleNo' },
    { label: 'Death Claim Date', value: 'deathClaimDate' },
    { label: 'Death claim', value: 'deathclaim' }
  ];

  // Generate the report based on the requested format
  if (req.format === 'pdf') {
    const pdfPath = path.join(
      __dirname,
      `${mergedPolicies[0].clientId}_Claims_Report.pdf`
    );
    generatePDF(
      mergedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `Claims report of ${mergedPolicies[0].clientId}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    const excelPath = path.join(
      __dirname,
      `${mergedPolicies[0].clientId}_Claims_Report.xlsx`
    );
    generateExcel(
      mergedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `Claims report of ${mergedPolicies[0].clientId}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
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

    // ✅ XIRR for SIPs
    const calculateSIPXIRR = (transactions, currentValue) => {
      try {
        const cashflows = transactions.map(txn => ({
          amount: -txn.amount,
          when: new Date(txn.date)
        }));

        // Add final value as inflow on today's date
        cashflows.push({
          amount: currentValue,
          when: new Date()
        });

        const rate = calculateXirr(cashflows);
        return rate * 100; // convert to %
      } catch (err) {
        console.error('XIRR Calculation Error:', err.message);
        return 0;
      }
    };

    const formattedSchemes = await Promise.all(
      schemes.map(async scheme => {
        const navRes = await fetch(
          `https://api.mfapi.in/mf/${scheme.AMFI}/latest`,
          {
            // Override headers to remove Authorization for this request
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
        const growth = currentValue - totalInvested;
        const growthPercentage =
          totalInvested > 0 ? (growth / totalInvested) * 100 : 0;

        const startDate =
          scheme.investmentType === 'lumpsum'
            ? scheme.lumpsumDate
            : scheme.sipStartDate;

        const cagr =
          scheme.investmentType === 'sip'
            ? calculateSIPXIRR(scheme.sipTransactions, currentValue)
            : calculateCAGR(totalInvested, currentValue, startDate);

        return {
          _id: scheme._id,
          investmentType: scheme.investmentType,
          schemeName: scheme.schemeName,
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
          lastUpdated: new Date(scheme.lastUpdated).toLocaleDateString('en-IN'),
          status: scheme.investmentType === 'sip' ? scheme.sipStatus : 'active',
          investmentDuration: calculateInvestmentDuration(startDate)
        };
      })
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

    const mutualFundFields = [
      { label: 'Scheme Name', value: 'schemeName' },
      { label: 'Fund House', value: 'fundHouse' },
      { label: 'Investment Type', value: 'investmentType' },
      { label: 'Status', value: 'status' },
      { label: 'AMFI Code', value: 'AMFI' },
      { label: 'Start Date', value: 'startDate' },
      { label: 'Duration', value: 'investmentDuration' },
      { label: 'Total Invested', value: 'totalInvested', format: 'currency' },
      { label: 'Current Value', value: 'currentValue', format: 'currency' },
      { label: 'Growth', value: 'growth', format: 'currency' },
      {
        label: 'Growth (in %)',
        value: 'growthPercentage',
        format: 'percentage'
      },
      { label: 'CAGR / XIRR', value: 'cagr', format: 'percentage' },
      { label: 'Total Units', value: 'totalUnits' }
    ];

    const portfolioSummary = {
      totalInvested: formattedSchemes
        .reduce((sum, scheme) => sum + parseFloat(scheme.totalInvested), 0)
        .toFixed(2),
      currentValue: formattedSchemes
        .reduce((sum, scheme) => sum + parseFloat(scheme.currentValue), 0)
        .toFixed(2),
      totalGrowth: formattedSchemes
        .reduce((sum, scheme) => sum + parseFloat(scheme.growth), 0)
        .toFixed(2),
      weightedCAGR: calculateWeightedCAGR(formattedSchemes)
    };

    function calculateWeightedCAGR(schemes) {
      let totalWeightedCAGR = 0;
      let totalInvestment = 0;

      schemes.forEach(scheme => {
        const investment = parseFloat(scheme.totalInvested);
        totalWeightedCAGR += investment * parseFloat(scheme.cagr);
        totalInvestment += investment;
      });

      return totalInvestment > 0
        ? (totalWeightedCAGR / totalInvestment).toFixed(2)
        : '0.00';
    }

    const clientName = formattedSchemes[0]?.holderName || 'Client';
    const reportTitle = `Mutual Funds Portfolio Report - ${clientName}`;
    const reportDate = new Date().toLocaleDateString('en-IN');

    if (req.format === 'pdf') {
      const pdfPath = path.join(__dirname, 'mutual_funds_report.pdf');
      await generatePDF(
        formattedSchemes,
        pdfPath,
        res,
        mutualFundFields,
        reportTitle,
        reportDate,
        'N/A'
      );
    } else if (req.format === 'excel') {
      const excelPath = path.join(__dirname, 'mutual_funds_report.xlsx');
      await generateExcel(
        formattedSchemes,
        excelPath,
        res,
        mutualFundFields,
        reportTitle,
        reportDate,
        'N/A'
      );
    } else {
      res.status(200).json({
        status: 'success',
        data: {
          clientName,
          reportDate,
          portfolioSummary,
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

    // ✅ Fetch all schemes with the same AMFI and holder
    const schemes = await Mutual.find({ AMFI: targetAMFI, holderId })
      .populate('holderId', 'name email')
      .lean();

    if (!schemes || schemes.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No matching schemes found for AMFI and holder'
      });
    }

    // ✅ Get NAV and date
    const navRes = await fetch(`https://api.mfapi.in/mf/${targetAMFI}/latest`);
    if (!navRes.ok)
      throw new Error(`Failed to fetch NAV: ${navRes.statusText}`);
    const navData = await navRes.json();

    const latestNAV = parseFloat(navData.data[0]?.nav || '0');
    const last_date = navData.data[0]?.date || 'N/A';
    const now = new Date();

    const calculateCAGR = (initialAmount, finalAmount, startDate) => {
      const years = (now - new Date(startDate)) / (1000 * 60 * 60 * 24 * 365);
      if (initialAmount <= 0 || years <= 0) return 0;
      return (Math.pow(finalAmount / initialAmount, 1 / years) - 1) * 100;
    };

    // ✅ Aggregate transactions from all schemes
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

    if (format === 'pdf') {
      const pdfPath = path.join(__dirname, 'transactions_report.pdf');
      await generatePDF(
        transactions,
        pdfPath,
        res,
        transactionFields,
        reportTitle,
        reportDate,
        clientName
      );
    } else if (format === 'excel') {
      const excelPath = path.join(__dirname, 'transactions_report.xlsx');
      await generateExcel(
        transactions,
        excelPath,
        res,
        transactionFields,
        reportTitle,
        reportDate,
        clientName
      );
    } else {
      return res.status(200).json({
        status: 'success',
        data: {
          reportDate,
          clientName,
          amfi: targetAMFI,
          schemeName: targetScheme.schemeName,
          fundHouse: targetScheme.fundHouse,
          transactions
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
  // Step 3: Find policies using the user ID and populate client and nominees
  const name = req.name;

  const policies = await Life.find({ clientId: req.userId })
    .populate('clientId', 'name') // Populate client name
    .populate('nominee1ID', 'name') // Populate nominee 1 name
    .populate('nominee2ID', 'name') // Populate nominee 2 name
    .populate('nominee3ID', 'name'); // Populate nominee 3 name

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${name}`
    });
  }

  console.log(policies);
  const formattedPolicies = policies.map(policies => ({
    _id: policies._id,
    policyNumber: policies.policyNumber,
    policyName: policies.policyName,
    companyName: policies.companyName,
    holderName: policies.clientId?.name || null,
    nominee1Name: policies.nominee1ID?.name || null,
    nominee2Name: policies.nominee2ID?.name || null,
    nominee3Name: policies.nominee3ID?.name || null,
    startPremiumDate: policies.startPremiumDate.toLocaleDateString('en-GB'),
    endPremiumDate: policies.endPremiumDate.toLocaleDateString('en-GB'),
    maturityDate: policies.maturityDate.toLocaleDateString('en-GB'),
    premium: policies.premium,
    __v: policies.__v
  }));

  const lifeInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Company Name', value: 'companyName' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'End Date', value: 'endPremiumDate' },
    { label: 'Premium', value: 'premium' },
    { label: 'Maturity Date', value: 'maturityDate' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];
  // console.log(formattedPolicies);
  // Step 4: Generate PDF or Excel
  if (req.format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(__dirname, `${name}_life_Ins_report.pdf`);
    console.log(pdfPath);
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `Life Insurance report of ${formattedPolicies[0].holderName}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(__dirname, `${name}_life_Ins_report.xlsx`);
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `Life Insurance report of ${formattedPolicies[0].holderName}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getGeneralPolicyByClient = CatchAsync(async (req, res) => {
  // Step 3: Find policies using the user ID and populate client and nominees
  const name = req.name;

  const policies = await General.find({ clientId: req.userId })
    .populate('clientId', 'name') // Populate client name
    .populate('nominee1ID', 'name') // Populate nominee 1 name
    .populate('nominee2ID', 'name') // Populate nominee 2 name
    .populate('nominee3ID', 'name'); // Populate nominee 3 name

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${name}`
    });
  }

  console.log(policies);
  const formattedPolicies = policies.map(policies => ({
    _id: policies._id,
    policyNumber: policies.policyNumber,
    policyName: policies.policyName,
    companyName: policies.companyName,
    holderName: policies.clientId?.name || null,
    nominee1Name: policies.nominee1ID?.name || null,
    nominee2Name: policies.nominee2ID?.name || null,
    nominee3Name: policies.nominee3ID?.name || null,
    startPremiumDate: policies.startPremiumDate.toLocaleDateString('en-GB'),
    type: policies.type,
    __v: policies.__v
  }));

  const lifeInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Company Name', value: 'companyName' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'Type', value: 'type' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];
  console.log(formattedPolicies);
  // Step 4: Generate PDF or Excel
  if (req.format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(__dirname, `${name}_General_Ins_report.pdf`);
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `General Insurance report of ${formattedPolicies[0].holderName}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(__dirname, `${name}_General_Ins_report.xlsx`);
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `General Insurance report of ${formattedPolicies[0].holderName}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getDebtsByClient = CatchAsync(async (req, res) => {
  // Step 3: Find policies using the user ID and populate client and nominees
  const name = req.name;

  const policies = await Debt.find({ holderId: req.userId })
    .populate('holderId', 'name') // Populate client name
    .populate('nominee1Id', 'name') // Populate nominee 1 name
    .populate('nominee2Id', 'name') // Populate nominee 2 name
    .populate('nominee3Id', 'name'); // Populate nominee 3 name

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${name}`
    });
  }

  console.log(policies);
  const formattedPolicies = policies.map(policies => {
    const startDate = new Date(policies.startDate);
    const maturityDate = new Date(policies.MaturityDate);
    const years = (maturityDate - startDate) / (1000 * 60 * 60 * 24 * 365); // Convert milliseconds to years
    const rate = policies.intrestRate / 100; // Convert percentage to decimal
    const amountReceived = policies.amount * Math.pow(1 + rate, years); // Compound Interest Formula

    return {
      _id: policies._id,
      AccountNumber: policies.AccountNumber,
      bankDetails: policies.bankDetails,
      startDate: startDate.toLocaleDateString('en-GB'),
      amount: policies.amount,
      intrestRate: policies.intrestRate,
      MaturityDate: maturityDate.toLocaleDateString('en-GB'),
      amountReceived: amountReceived.toFixed(2), // Rounded to 2 decimal places
      holderName: policies.holderId?.name || null,
      nominee1Name: policies.nominee1Id?.name || null,
      nominee2Name: policies.nominee2Id?.name || null,
      nominee3Name: policies.nominee3Id?.name || null,
      type: policies.type,
      __v: policies.__v
    };
  });

  const lifeInsuranceFields = [
    { label: 'Account Number', value: 'AccountNumber' },
    { label: 'Bank Details', value: 'bankDetails' },
    { label: 'Starting Date', value: 'startDate' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'Amount Invested', value: 'amount' },
    { label: 'Intrest Rate', value: 'intrestRate' },
    { label: 'Maturity Date', value: 'MaturityDate' },
    { label: 'Maturity Amount', value: 'amountReceived' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];
  console.log(formattedPolicies);
  // Step 4: Generate PDF or Excel
  if (req.format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(__dirname, `${name}_General_Ins_report.pdf`);
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `Debt report of ${formattedPolicies[0].holderName}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(__dirname, `${name}_General_Ins_report.xlsx`);
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `Debt report of ${formattedPolicies[0].holderName}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getCashFlowByClient = CatchAsync(async (req, res) => {
  const { format } = req.body;
  const clientId = req.userId;

  // Fetch all life insurance policies for the client
  const policies = await Life.find({ clientId }).lean();

  if (!policies.length) {
    return res
      .status(404)
      .json({ status: 'fail', message: 'No policies found for this client' });
  }

  // Fetch client and nominee details
  const client = await User.findById(clientId).select('name DOB');
  const nomineeIds = policies
    .flatMap(p => [p.nominee1ID, p.nominee2ID, p.nominee3ID])
    .filter(Boolean);
  const nominees = await User.find({ _id: { $in: nomineeIds } }).select(
    'name DOB'
  );

  const getAge = (DOB, year) =>
    DOB ? Math.max(0, year - new Date(DOB).getFullYear()) : null;

  // Extract all unique years
  const allYears = new Set();
  const companyNames = new Set();

  policies.forEach(policy => {
    let startYear = new Date(policy.startPremiumDate).getFullYear();
    let endYear = new Date(policy.endPremiumDate).getFullYear();
    companyNames.add(policy.companyName);

    for (let year = startYear; year <= endYear; year++) {
      allYears.add(year);
    }
    policy.claim.forEach(claim => allYears.add(claim.year));
  });

  const sortedYears = [...allYears].sort((a, b) => a - b);
  const companies = [...companyNames];

  // Generate cash flow data
  const cashFlowData = sortedYears.map(year => {
    let netInflow = 0,
      netOutflow = 0;
    let inflowByCompany = {},
      outflowByCompany = {};

    // Initialize inflow and outflow fields for all companies
    companies.forEach(company => {
      inflowByCompany[company] = 0;
      outflowByCompany[company] = 0;
    });

    policies.forEach(policy => {
      const company = policy.companyName;

      // Outflow (Premium Payments)
      const startYear = new Date(policy.startPremiumDate).getFullYear();
      const endYear = new Date(policy.endPremiumDate).getFullYear();
      if (year >= startYear && year <= endYear) {
        outflowByCompany[company] += policy.premium;
        netOutflow += policy.premium;
      }

      // Inflow (Claims)
      const claimsForYear = policy.claim.filter(c => c.year === year);
      claimsForYear.forEach(c => {
        inflowByCompany[company] += c.claim;
        netInflow += c.claim;
      });
    });

    return {
      year,
      clientId: clientId,
      clientName: client?.name,
      clientAge: getAge(client?.DOB, year),
      nominee1ID: nomineeIds[0] || null,
      nominee1Name: nominees.find(n => n._id.equals(nomineeIds[0]))?.name || '',
      nominee1Age: getAge(
        nominees.find(n => n._id.equals(nomineeIds[0]))?.DOB,
        year
      ),
      nominee2ID: nomineeIds[1] || null,
      nominee2Name: nominees.find(n => n._id.equals(nomineeIds[1]))?.name || '',
      nominee2Age: getAge(
        nominees.find(n => n._id.equals(nomineeIds[1]))?.DOB,
        year
      ),
      nominee3ID: nomineeIds[2] || null,
      nominee3Name: nominees.find(n => n._id.equals(nomineeIds[2]))?.name || '',
      nominee3Age: getAge(
        nominees.find(n => n._id.equals(nomineeIds[2]))?.DOB,
        year
      ),
      ...Object.fromEntries(
        companies.map(company => [
          `InFlow of ${company}`,
          inflowByCompany[company]
        ])
      ),
      NetInflow: netInflow,
      ...Object.fromEntries(
        companies.map(company => [
          `OutFlow of ${company}`,
          outflowByCompany[company]
        ])
      ),
      NetOutflow: netOutflow,
      NetCashFlow: netInflow - netOutflow
    };
  });
  cashFlowData[0]?.nominee1ID?.name;
  // Generate cashFlowLabels dynamically
  const cashFlowLabels = [
    { label: 'Year', value: 'year' },
    { label: `${client?.name}`, value: 'clientAge' },
    { label: `${cashFlowData[0]?.nominee1Name}`, value: 'nominee1Age' },
    { label: `${cashFlowData[0]?.nominee2Name}`, value: 'nominee2Age' },
    { label: `${cashFlowData[0]?.nominee3Name}`, value: 'nominee3Age' },
    ...companies.map(company => ({
      label: `InFlow of ${company}`,
      value: `InFlow of ${company}`
    })),
    { label: 'Net Inflow', value: 'NetInflow' },
    ...companies.map(company => ({
      label: `OutFlow of ${company}`,
      value: `OutFlow of ${company}`
    })),
    { label: 'Net Outflow', value: 'NetOutflow' },
    { label: 'Net Cash Flow', value: 'NetCashFlow' }
  ];

  // Generate PDF or Excel
  if (format === 'pdf') {
    const pdfPath = path.join(__dirname, `${client?.name}_Cash_Flow.pdf`);
    generatePDF(
      cashFlowData,
      pdfPath,
      res,
      cashFlowLabels,
      `Cash Flow Report of ${client.name}`,
      '0'
    );
  } else if (format === 'excel') {
    const excelPath = path.join(__dirname, `${client?.name}_Cash_Flow.xlsx`);
    generateExcel(
      cashFlowData,
      excelPath,
      res,
      cashFlowLabels,
      `Cash Flow Report of ${client.name}`,
      '0'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});
