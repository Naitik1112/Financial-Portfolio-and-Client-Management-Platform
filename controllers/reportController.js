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

exports.getUserId = CatchAsync(async (req, res, next) => {
  const { name, format } = req.body; // Expect 'format' to specify pdf or excel

  // Step 1: Validate input
  if (!name) {
    return res.status(400).json({
      status: 'fail',
      message: 'Client name is required'
    });
  }

  // Step 2: Find the user by name
  const user = await User.findOne({ name });
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: `No user found with the name: ${name}`
    });
  }

  req.userId = user._id; // Extract the user's ID
  req.format = format;
  req.name = name;
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
  // Find schemes for the user
  console.log(req.body, req.userId);
  const name = req.name;
  const schemes = await Mutual.find({ holderId: req.userId })
    .populate('holderId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name');
  if (!schemes.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No schemes found for user with the name: ${name}`
    });
  }

  const formattedSchemes = schemes.map(scheme => ({
    _id: scheme._id,
    schemeName: scheme.schemeName,
    fundHouse: scheme.fundHouse,
    AMFI: scheme.AMFI,
    holderName: scheme.holderId?.name || null,
    nominee1Name: scheme.nominee1Id?.name || null,
    nominee2Name: scheme.nominee2Id?.name || null,
    nominee3Name: scheme.nominee3Id?.name || null,
    mode: scheme.mode,
    startDate: scheme.startDate,
    amount: scheme.amount,
    totalunits: scheme.totalunits,
    __v: scheme.__v
  }));

  console.log(formattedSchemes);
  // Define fields for mutual fund data
  const mutualFundFields = [
    { label: 'Scheme Name', value: 'schemeName' },
    { label: 'Fund House', value: 'fundHouse' },
    { label: 'AMFI', value: 'AMFI' },
    { label: 'Mode', value: 'mode' },
    { label: 'Start Date', value: 'startDate' },
    { label: 'Amount', value: 'amount' },
    { label: 'Total Units', value: 'totalunits' },
    { label: 'Client Name', value: 'holderName' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];

  // Generate the report based on the requested format
  if (req.format === 'pdf') {
    const pdfPath = path.join(__dirname, `${name}_Mutual_Funds_Report.pdf`);
    generatePDF(
      formattedSchemes,
      pdfPath,
      res,
      mutualFundFields,
      `Mutual Funds report of ${formattedSchemes[0].holderName}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    const excelPath = path.join(__dirname, `${name}_Mutual_Funds_Report.xlsx`);
    generateExcel(
      formattedSchemes,
      excelPath,
      res,
      mutualFundFields,
      `Mutual Funds report of ${formattedSchemes[0].holderName}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
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
  console.log(formattedPolicies);
  // Step 4: Generate PDF or Excel
  if (req.format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(__dirname, `${name}_life_Ins_report.pdf`);
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
