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
  const { format, groupName, userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide valid user IDs'
    });
  }

  const policies = await Life.find({ clientId: { $in: userIds } })
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name');

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for group: ${groupName}`
    });
  }

  // Calculate totals and collect client names
  let totalPremiumPaid = 0;
  let totalClaims = 0;
  const clientNames = new Set();

  const formattedPolicies = policies
    .map(policy => {
      // Track client names
      if (policy.clientId?.name) {
        clientNames.add(policy.clientId.name);
      }

      // Calculate total premium based on payment mode
      const startDate = new Date(policy.startPremiumDate);
      const endDate = new Date(policy.endPremiumDate);
      let duration = 0;
      let totalPremiumForPolicy = 0;

      if (policy.mode === 'Annual' || policy.mode === 'Yearly') {
        duration = endDate.getFullYear() - startDate.getFullYear();
        totalPremiumForPolicy = policy.premium * duration;
      } else if (policy.mode === 'Monthly') {
        const months =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth());
        duration = Math.ceil(months);
        totalPremiumForPolicy = policy.premium * duration;
      } else {
        duration = endDate.getFullYear() - startDate.getFullYear();
        totalPremiumForPolicy = policy.premium * duration;
      }

      // Calculate total claims from claim array
      const policyClaims =
        policy.claim?.reduce((sum, c) => sum + (c.claim || 0), 0) || 0;

      // Calculate policy-level growth percentage
      const policyGrowthPercentage = totalPremiumForPolicy > 0 
        ? (((policyClaims - totalPremiumForPolicy) / totalPremiumForPolicy) * 100).toFixed(2)
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
        nominee2Name: policy.nominee2ID?.name || null,
        nominee3Name: policy.nominee3ID?.name || null,
        startPremiumDate: startDate.toLocaleDateString('en-GB'),
        endPremiumDate: endDate.toLocaleDateString('en-GB'),
        maturityDate: policy.maturityDate?.toLocaleDateString('en-GB') || 'N/A',
        premium: policy.premium,
        mode: policy.mode || 'Annual',
        totalPremiumPaid: totalPremiumForPolicy.toFixed(2),
        totalClaims: policyClaims.toFixed(2),
        growthPercentage: `${policyGrowthPercentage}%`,
        __v: policy.__v
      };
    })
    // Sort policies by holderName (case-insensitive)
    .sort((a, b) => {
      const nameA = a.holderName?.toLowerCase() || '';
      const nameB = b.holderName?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
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
      groupName: groupName,
      totalClients: clientNames.size,
      clients: Array.from(clientNames).join(', '),
      totalPremiumPaid: totalPremiumPaid.toFixed(2),
      totalClaims: totalClaims.toFixed(2),
      growthPercentage: `${overallGrowthPercentage}%`,
      currency: '₹'
    },
    summaryMetrics: {
      totalPremiumPaid: totalPremiumPaid.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      totalClaims: totalClaims.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      growthPercentage: `${overallGrowthPercentage}%`
    }
  };

  const lifeInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'End Date', value: 'endPremiumDate' },
    { label: 'Premium Amount', value: 'premium' },
    { label: 'Payment Mode', value: 'mode' },
    { label: 'Total Premium Paid', value: 'totalPremiumPaid' },
    { label: 'Total Claims', value: 'totalClaims' },
    { label: 'Growth %', value: 'growthPercentage' },
    { label: 'Maturity Date', value: 'maturityDate' },
    { label: 'Nominee 1', value: 'nominee1Name' }
  ];

  if (format === 'pdf') {
    const pdfPath = path.join(__dirname, `${groupName}_life_Ins_report.pdf`);
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      `Life Insurance report for ${groupName}.pdf`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else if (format === 'excel') {
    const excelPath = path.join(__dirname, `${groupName}_life_Ins_report.xlsx`);
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      `Life Insurance report for ${groupName}.xlsx`,
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
        reportTitle: `Life Insurance report for ${groupName}`,
        generatedOn: extras.asOnDate,
        policies: formattedPolicies,
        summary: extras.investmentSummary,
        metrics: extras.summaryMetrics
      }
    });
  }
});

exports.getGeneralPolicyByGroup = CatchAsync(async (req, res) => {
  const { format, groupName, userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide valid user IDs'
    });
  }

  const policies = await General.find({ clientId: { $in: userIds } })
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name');

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for group: ${groupName}`
    });
  }

  // Calculate totals and collect client names
  let totalPremiumPaid = 0;
  let totalRequestedClaims = 0;
  let totalApprovedClaims = 0;
  const clientNames = new Set();

  const formattedPolicies = policies
    .map(policy => {
      // Track client names
      if (policy.clientId?.name) {
        clientNames.add(policy.clientId.name);
      }

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
    })
    .sort((a, b) => {
      const nameA = a.holderName?.toLowerCase() || '';
      const nameB = b.holderName?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
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
      groupName: groupName,
      totalClients: clientNames.size, // Added client count
      clients: Array.from(clientNames).join(', '), // Added client names
      totalPremiumPaid: totalPremiumPaid.toFixed(2),
      totalRequestedClaims: totalRequestedClaims.toFixed(2),
      totalApprovedClaims: totalApprovedClaims.toFixed(2),
      approvalRate: `${overallApprovalRate}%`,
      currency: '₹'
    },
    summaryMetrics: {
      totalPremium: totalPremiumPaid.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
      totalRequestedClaims: totalRequestedClaims.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
      totalApprovedClaims: totalApprovedClaims.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
      // clientCount: clientNames.size // Added to metrics
    }
  };

  // ... rest of the function remains the same ...
  const generalInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Company Name', value: 'companyName' },
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'Type', value: 'type' },
    { label: 'Vehicle No', value: 'vehicleID' },
    { label: 'Total Premium', value: 'totalPremium' },
    { label: 'Requested Claims', value: 'totalRequestedClaims' },
    { label: 'Approved Claims', value: 'totalApprovedClaims' },
    { label: 'Approval Rate', value: 'approvalRate' }
  ];

  if (format === 'pdf') {
    const pdfPath = path.join(__dirname, `${groupName}_General_Ins_report.pdf`);
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      generalInsuranceFields,
      `General Insurance report for ${groupName}.pdf`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else if (format === 'excel') {
    const excelPath = path.join(
      __dirname,
      `${groupName}_General_Ins_report.xlsx`
    );
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      generalInsuranceFields,
      `General Insurance report for ${groupName}.xlsx`,
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
        reportTitle: `General Insurance report for ${groupName}`,
        generatedOn: extras.asOnDate,
        policies: formattedPolicies,
        summary: extras.investmentSummary,
        metrics: extras.summaryMetrics
      }
    });
  }
});

exports.getDebtsByGroup = CatchAsync(async (req, res) => {
  const { format, groupName, userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide valid user IDs'
    });
  }

  const policies = await Debt.find({ holderId: { $in: userIds } })
    .populate('holderId', 'name')
    .populate('nominee1Id', 'name')
    .populate('nominee2Id', 'name')
    .populate('nominee3Id', 'name');

  if (!policies.length) {
    return res.status(404).json({
      status: 'fail',
      message: `No policies found for group: ${groupName}`
    });
  }

  // Calculate totals and collect client names
  let totalInvested = 0;
  let totalMaturityAmount = 0;
  const clientNames = new Set();

  const formattedPolicies = policies
    .map(policy => {
      const startDate = new Date(policy.startDate);
      const maturityDate = new Date(policy.MaturityDate);
      const years = (maturityDate - startDate) / (1000 * 60 * 60 * 24 * 365);
      const rate = policy.intrestRate / 100;
      const amountReceived = policy.amount * Math.pow(1 + rate, years);

      // Track client names
      if (policy.holderId?.name) {
        clientNames.add(policy.holderId.name);
      }

      // Update totals
      totalInvested += policy.amount;
      totalMaturityAmount += amountReceived;

      return {
        _id: policy._id,
        AccountNumber: policy.AccountNumber,
        bankDetails: policy.bankDetails,
        startDate: startDate.toLocaleDateString('en-GB'),
        amount: policy.amount,
        intrestRate: policy.intrestRate,
        MaturityDate: maturityDate.toLocaleDateString('en-GB'),
        amountReceived: amountReceived.toFixed(2),
        holderName: policy.holderId?.name || null,
        nominee1Name: policy.nominee1Id?.name || null,
        __v: policy.__v
      };
    })
    // Sort policies by holderName (case-insensitive)
    .sort((a, b) => {
      const nameA = a.holderName?.toLowerCase() || '';
      const nameB = b.holderName?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

  // Calculate growth percentage
  const growthPercentage =
    totalInvested > 0
      ? (((totalMaturityAmount - totalInvested) / totalInvested) * 100).toFixed(
          2
        )
      : '0.00';

  // Prepare extras for summary
  const extras = {
    asOnDate: new Date().toLocaleDateString('en-IN'),
    investmentSummary: {
      groupName: groupName,
      totalClients: clientNames.size,
      clients: Array.from(clientNames).join(', '),
      totalInvested: totalInvested.toFixed(2),
      totalMaturityAmount: totalMaturityAmount.toFixed(2),
      currency: '₹'
    },
    summaryMetrics: {
      amount: totalInvested.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
      amountReceived: totalMaturityAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    }
  };

  const debtInsuranceFields = [
    { label: 'Account Number', value: 'AccountNumber' },
    { label: 'Bank Details', value: 'bankDetails' },
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Start Date', value: 'startDate' },
    { label: 'Amount Invested', value: 'amount' },
    { label: 'Interest Rate', value: 'intrestRate' },
    { label: 'Maturity Date', value: 'MaturityDate' },
    { label: 'Maturity Amount', value: 'amountReceived' },
    { label: 'Nominee 1', value: 'nominee1Name' }
  ];

  if (format === 'pdf') {
    const pdfPath = path.join(__dirname, `${groupName}_Debt_report.pdf`);
    generatePDF(
      formattedPolicies,
      pdfPath,
      res,
      debtInsuranceFields,
      `Debt report for ${groupName}.pdf`,
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras
    );
  } else if (format === 'excel') {
    const excelPath = path.join(__dirname, `${groupName}_Debt_report.xlsx`);
    generateExcel(
      formattedPolicies,
      excelPath,
      res,
      debtInsuranceFields,
      `Debt report for ${groupName}.xlsx`,
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
        reportTitle: `Debt report for ${groupName}`,
        generatedOn: extras.asOnDate,
        policies: formattedPolicies,
        summary: extras.investmentSummary,
        metrics: extras.summaryMetrics
      }
    });
  }
});
