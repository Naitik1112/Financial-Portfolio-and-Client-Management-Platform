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
const axios = require('axios');

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

exports.getSchemeByGroup = CatchAsync(async (req, res) => {
  // Find schemes for the user
  req.groupName = req.body.groupName;
  req.format = req.body.format;

  const usersInGroup = await User.find({ group: req.groupName }).select('_id'); // Step 1 & 2
  const userIds = usersInGroup.map(user => user._id); // Extract ID

  const schemes = await Mutual.find({ holderId: { $in: userIds } }) // Step 3
    .populate('holderId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name'); // Step 4

  if (!schemes.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No schemes found for group with the name: ${req.groupName}`
    });
  }

  const fetchNAV = async AMFI => {
    try {
      const response = await axios.get(
        `https://api.mfapi.in/mf/${AMFI}/latest`,
          {
            // Override headers to remove Authorization for this request
            headers: {
              Authorization: undefined
            }
          }
      );
      if (
        response.data?.status === 'SUCCESS' &&
        response.data?.data?.length > 0
      ) {
        return parseFloat(response.data.data[0].nav); // Convert NAV to a number
      }
    } catch (error) {
      console.error(`Error fetching NAV for AMFI ${AMFI}:`, error);
    }
    return null; // Return null if NAV couldn't be fetched
  };

  const formattedSchemes = await Promise.all(
    schemes.map(async scheme => {
      const nav = await fetchNAV(scheme.AMFI);
      const totalInvestment = nav ? (scheme.totalunits * nav).toFixed(2) : null;

      return {
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
        TotalInvestment: totalInvestment, // Added Total Investment
        __v: scheme.__v
      };
    })
  );

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
    { label: 'Total Investment', value: 'TotalInvestment' },
    { label: 'Client Name', value: 'holderName' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];

  // Generate the report based on the requested format
  if (req.format === 'pdf') {
    const pdfPath = path.join(
      __dirname,
      `${req.groupName}_Mutual_Funds_Report.pdf`
    );
    generatePDF(
      formattedSchemes,
      pdfPath,
      res,
      mutualFundFields,
      `Mutual Funds report of group ${req.groupName}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    const excelPath = path.join(
      __dirname,
      `${req.groupName}_Mutual_Funds_Report.xlsx`
    );
    generateExcel(
      formattedSchemes,
      excelPath,
      res,
      mutualFundFields,
      `Mutual Funds report of group ${req.groupName}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getPolicyByGroup = CatchAsync(async (req, res) => {
  // Step 3: Find policies using the user ID and populate client and nominees
  req.groupName = req.body.groupName;
  req.format = req.body.format;

  const usersInGroup = await User.find({ group: req.groupName }).select('_id'); // Step 1 & 2
  const userIds = usersInGroup.map(user => user._id); // Extract IDs

  const policies = await Life.find({ clientId: { $in: userIds } }) // Step 3
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name'); // Step 4

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${req.groupName}`
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
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];
  console.log(formattedPolicies);
  // Step 4: Generate PDF or Excel
  if (req.format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(
      __dirname,
      `${req.groupName}_life_Ins_report.pdf`
    );
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `Life Insurance report of group ${req.groupName}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(
      __dirname,
      `${req.groupName}_life_Ins_report.xlsx`
    );
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `Life Insurance report of group ${req.groupName}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getGeneralPolicyByGroup = CatchAsync(async (req, res) => {
  // Step 3: Find policies using the user ID and populate client and nominees
  req.groupName = req.body.groupName;
  req.format = req.body.format;

  const usersInGroup = await User.find({ group: req.groupName }).select('_id'); // Step 1 & 2
  const userIds = usersInGroup.map(user => user._id); // Extract IDs

  const policies = await General.find({ clientId: { $in: userIds } }) // Step 3
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name'); // Step 4

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${req.groupName}`
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
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];
  console.log(formattedPolicies);
  // Step 4: Generate PDF or Excel
  if (req.format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(
      __dirname,
      `${req.groupName}_General_Ins_report.pdf`
    );
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `General Insurance report of group ${req.groupName}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(
      __dirname,
      `${req.groupName}_General_Ins_report.xlsx`
    );
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `General Insurance report of group ${req.groupName}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getDebtsByGroup = CatchAsync(async (req, res) => {
  // Step 3: Find policies using the user ID and populate client and nominees
  req.groupName = req.body.groupName;
  req.format = req.body.format;

  const usersInGroup = await User.find({ group: req.groupName }).select('_id'); // Step 1 & 2
  const userIds = usersInGroup.map(user => user._id); // Extract IDs

  const policies = await Debt.find({ holderId: { $in: userIds } }) // Step 3
    .populate('holderId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name'); // Step 4

  console.log(policies);
  console.log(req.groupName);
  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${req.groupName}`
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
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];
  console.log(formattedPolicies);
  // Step 4: Generate PDF or Excel
  if (req.format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(
      __dirname,
      `${req.groupName}_General_Ins_report.pdf`
    );
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `Debt report of group ${req.groupName}`,
      'N/A'
    );
  } else if (req.format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(
      __dirname,
      `${req.groupName}_General_Ins_report.xlsx`
    );
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `Debt report of group ${req.groupName}`,
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});
