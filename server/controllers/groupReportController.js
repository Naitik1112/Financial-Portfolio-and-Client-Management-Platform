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
const { calculateXirr } = require('./../utils/xirr');

exports.getSchemeByGroup = CatchAsync(async (req, res) => {
  const { format, groupName, userIds } = req.body;

  // Validate input
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide valid user IDs'
    });
  }

  // Find schemes only for the specified users
  const schemes = await Mutual.find({ holderId: { $in: userIds } }).populate(
    'holderId',
    'name'
  );

  if (!schemes.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No schemes found for group: ${groupName}`
    });
  }

  const fetchNAV = async AMFI => {
    try {
      const response = await axios.get(
        `https://api.mfapi.in/mf/${AMFI}/latest`,
        { headers: { Authorization: undefined } }
      );
      if (
        response.data?.status === 'SUCCESS' &&
        response.data?.data?.length > 0
      ) {
        return parseFloat(response.data.data[0].nav);
      }
    } catch (error) {
      console.error(`Error fetching NAV for AMFI ${AMFI}:`, error);
    }
    return null;
  };

  const calculateCAGR = (initialAmount, finalAmount, startDate) => {
    const now = new Date();
    const years = (now - new Date(startDate)) / (1000 * 60 * 60 * 24 * 365);
    if (initialAmount <= 0 || years <= 0) return 0;
    return (Math.pow(finalAmount / initialAmount, 1 / years) - 1) * 100;
  };

  const calculateSIPXIRR = (transactions, currentValue) => {
    try {
      const cashflows = transactions.map(txn => ({
        amount: -txn.amount,
        when: new Date(txn.date)
      }));
      cashflows.push({
        amount: currentValue,
        when: new Date()
      });
      const rate = calculateXirr(cashflows);
      return rate * 100;
    } catch (err) {
      console.error('XIRR Calculation Error:', err.message);
      return 0;
    }
  };

  const formattedSchemes = await Promise.all(
    schemes.map(async scheme => {
      const nav = await fetchNAV(scheme.AMFI);

      // Calculate investment details based on type
      let totalInvestment,
        totalUnits,
        startDate,
        endDate,
        returnRate,
        duration,
        currentInvestment;

      if (scheme.investmentType === 'sip') {
        // SIP calculations
        totalInvestment = scheme.sipTransactions.reduce(
          (sum, txn) => sum + txn.amount,
          0
        );
        totalUnits =
          scheme.sipTransactions.reduce((sum, txn) => sum + txn.units, 0) -
          (scheme.redeemedUnits || 0);
        startDate = scheme.sipStartDate;
        endDate = scheme.sipEndDate || 'N/A';
        currentInvestment = nav ? nav * totalUnits : null;
        returnRate = calculateSIPXIRR(
          scheme.sipTransactions,
          currentInvestment || 0
        );
      } else {
        // Lumpsum calculations
        totalInvestment = scheme.lumpsumAmount;
        totalUnits = scheme.lumpsumUnits - (scheme.redeemedUnits || 0);
        startDate = scheme.lumpsumDate;
        endDate = 'N/A';
        currentInvestment = nav ? nav * totalUnits : null;
        returnRate = calculateCAGR(
          totalInvestment,
          currentInvestment || 0,
          startDate
        );
      }

      // Calculate duration in years
      if (startDate) {
        const start = new Date(startDate);
        const now = new Date();
        duration = (now - start) / (1000 * 60 * 60 * 24 * 365);
        duration = duration.toFixed(2) + ' years';
      } else {
        duration = 'N/A';
      }

      return {
        holderName: scheme.holderId.name,
        name: scheme.schemeName.split(' - ')[0],
        startDate: startDate ? new Date(startDate).toLocaleDateString() : 'N/A',
        investmenttype: scheme.investmentType,
        endDate:
          endDate === 'N/A' ? endDate : new Date(endDate).toLocaleDateString(),
        totalInvestment: totalInvestment?.toFixed(2) || 'N/A',
        // totalUnits: totalUnits?.toFixed(4) || 'N/A',
        currentNav: nav?.toFixed(4) || 'N/A',
        currentInvestment: currentInvestment?.toFixed(2) || 'N/A',
        returnRate: returnRate?.toFixed(2) + '%' || 'N/A',
        duration
      };
    })
  );

  // Define fields for mutual fund data
  const mutualFundFields = [
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Scheme Name', value: 'name' },
    { label: 'Type', value: 'investmenttype' },
    { label: 'Start Date', value: 'startDate' },
    { label: 'End Date', value: 'endDate' },
    { label: 'Total Investment', value: 'totalInvestment' },
    // { label: 'Total Units', value: 'totalUnits' },
    { label: 'Current NAV', value: 'currentNav' },
    { label: 'Current Investment', value: 'currentInvestment' },
    { label: 'XIRR', value: 'returnRate' },
    { label: 'Duration', value: 'duration' }
  ];

  // Generate the report
  if (format === 'pdf') {
    const pdfPath = path.join(
      __dirname,
      `${groupName}_Mutual_Funds_Report.pdf`
    );
    if (req.body.email) {
      generatePDF(
        formattedSchemes,
        pdfPath,
        res,
        mutualFundFields,
        `Mutual Funds report of group ${groupName}.pdf`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description
      );
    } else {
      generatePDF(
        formattedSchemes,
        pdfPath,
        res,
        mutualFundFields,
        `Mutual Funds report of group ${groupName}.pdf`,
        'N/A'
      );
    }
  } else if (format === 'excel') {
    const excelPath = path.join(
      __dirname,
      `${groupName}_Mutual_Funds_Report.xlsx`
    );
    if (req.body.email) {
      generateExcel(
        formattedSchemes,
        excelPath,
        res,
        mutualFundFields,
        `Mutual Funds report of group ${groupName}.xlsx`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description
      );
    } else {
      generateExcel(
        formattedSchemes,
        excelPath,
        res,
        mutualFundFields,
        `Mutual Funds report of group ${groupName}.xlsx`,
        'N/A'
      );
    }
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getPolicyByGroup = CatchAsync(async (req, res) => {
  // Step 3: Find policies using the user ID and populate client and nominees
  const { format, groupName, userIds } = req.body; // Get userIds directly from request

  // Validate input
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide valid user IDs'
    });
  }

  const policies = await Life.find({ clientId: { $in: userIds } }) // Step 3
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name'); // Step 4

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${groupName}`
    });
  }
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
  console.log(formattedPolicies);
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
  // Step 4: Generate PDF or Excel
  if (format === 'pdf') {
    // Create and send a PDF file
    if (req.body.email) {
      const pdfPath = path.join(__dirname, `${groupName}_life_Ins_report.pdf`);
      generatePDF(
        formattedPolicies,
        pdfPath,
        res,
        lifeInsuranceFields,
        `Life Insurance report of group ${groupName}.pdf`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description
      );
    } else {
      const pdfPath = path.join(__dirname, `${groupName}_life_Ins_report.pdf`);
      generatePDF(
        formattedPolicies,
        pdfPath,
        res,
        lifeInsuranceFields,
        `Life Insurance report of group ${groupName}.pdf`,
        'N/A'
      );
    }
  } else if (format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(__dirname, `${groupName}_life_Ins_report.xlsx`);
    if (req.body.email) {
      generateExcel(
        formattedPolicies,
        excelPath,
        res,
        lifeInsuranceFields,
        `Life Insurance report of group ${groupName}.xlsx`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description
      );
    } else {
      generateExcel(
        formattedPolicies,
        excelPath,
        res,
        lifeInsuranceFields,
        `Life Insurance report of group ${groupName}.xlsx`,
        'N/A'
      );
    }
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getGeneralPolicyByGroup = CatchAsync(async (req, res) => {
  // Step 3: Find policies using the user ID and populate client and nominees
  const { format, groupName, userIds } = req.body; // Get userIds directly from request

  // Validate input
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide valid user IDs'
    });
  }

  const policies = await General.find({ clientId: { $in: userIds } }) // Step 3
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name'); // Step 4

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${groupName}`
    });
  }

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
  // Step 4: Generate PDF or Excel
  if (format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(__dirname, `${groupName}_General_Ins_report.pdf`);
    if (req.body.email) {
      generatePDF(
        formattedPolicies,
        pdfPath,
        res,
        lifeInsuranceFields,
        `General Insurance report of group ${groupName}.pdf`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description
      );
    } else {
      generatePDF(
        formattedPolicies,
        pdfPath,
        res,
        lifeInsuranceFields,
        `General Insurance report of group ${groupName}.pdf`,
        'N/A'
      );
    }
  } else if (format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(
      __dirname,
      `${groupName}_General_Ins_report.xlsx`
    );
    if (req.body.email) {
      generateExcel(
        formattedPolicies,
        excelPath,
        res,
        lifeInsuranceFields,
        `General Insurance report of group ${groupName}.xlsx`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description
      );
    } else {
      generateExcel(
        formattedPolicies,
        excelPath,
        res,
        lifeInsuranceFields,
        `General Insurance report of group ${groupName}.xlsx`,
        'N/A'
      );
    }
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});

exports.getDebtsByGroup = CatchAsync(async (req, res) => {
  // Step 3: Find policies using the user ID and populate client and nominees
  const { format, groupName, userIds } = req.body; // Get userIds directly from request

  // Validate input
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide valid user IDs'
    });
  }

  const policies = await Debt.find({ holderId: { $in: userIds } }) // Step 3
    .populate('holderId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name'); // Step 4

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for user with the name: ${groupName}`
    });
  }

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

  // Step 4: Generate PDF or Excel
  if (format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = path.join(__dirname, `${groupName}_General_Ins_report.pdf`);
    if (req.body.email) {
      generatePDF(
        formattedPolicies,
        pdfPath,
        res,
        lifeInsuranceFields,
        `Debt report of group ${groupName}.pdf`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description
      );
    } else {
      generatePDF(
        formattedPolicies,
        pdfPath,
        res,
        lifeInsuranceFields,
        `Debt report of group ${groupName}.pdf`,
        'N/A'
      );
    }
  } else if (format === 'excel') {
    // Create and send an Excel file
    const excelPath = path.join(
      __dirname,
      `${groupName}_General_Ins_report.xlsx`
    );
    if (req.body.email) {
      generateExcel(
        formattedPolicies,
        excelPath,
        res,
        lifeInsuranceFields,
        `Debt report of group ${groupName}.xlsx`,
        'N/A',
        req.body.email,
        req.body.title,
        req.body.description
      );
    } else {
      generateExcel(
        formattedPolicies,
        excelPath,
        res,
        lifeInsuranceFields,
        `Debt report of group ${groupName}.xlsx`,
        'N/A'
      );
    }
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});
