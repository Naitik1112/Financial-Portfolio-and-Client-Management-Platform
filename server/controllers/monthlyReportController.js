const Life = require('./../models/lifeInsuranceModel');
const General = require('./../models/generalInsuranceModels');

const MutualFund = require('../models/mutualFundsModel');
const Debt = require('../models/debtModels');
const catchAsync = require('./../utils/catchAsync');
const generatePDF = require('./../utils/generatePDF');
const generateExcel = require('./../utils/generateExcel');
const mongoose = require('mongoose');

exports.getMonthlyPremiumData = catchAsync(async (req, res) => {
  const { startdate, enddate, format } = req.body;

  if (!startdate || !enddate) {
    return res.status(400).json({
      status: 'fail',
      message: 'Start date and End date are required'
    });
  }

  // Convert dd/mm format to a proper date for the current year
  const currentYear = new Date().getFullYear();

  const startParts = startdate.split('/');
  const endParts = enddate.split('/');

  if (startParts.length !== 2 || endParts.length !== 2) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'Invalid date format. Use dd/mm' });
  }

  const startDate = new Date(
    currentYear,
    parseInt(startParts[1], 10) - 1,
    parseInt(startParts[0], 10)
  );
  const endDate = new Date(
    currentYear,
    parseInt(endParts[1], 10) - 1,
    parseInt(endParts[0], 10)
  );

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'Invalid date values' });
  }

  const lifePolicies = await Life.find({
    startPremiumDate: { $gte: startDate, $lte: endDate }
  })
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name');

  const generalPolicies = await General.find({
    startPremiumDate: { $gte: startDate, $lte: endDate }
  })
    .populate('clientId', 'name')
    .populate('nominee1ID', 'name')
    .populate('nominee2ID', 'name')
    .populate('nominee3ID', 'name');

  const formattedLifePolicies = lifePolicies.map(lifePolicies => ({
    _id: lifePolicies._id,
    policyNumber: lifePolicies.policyNumber,
    policyName: lifePolicies.policyName,
    companyName: lifePolicies.companyName,
    holderName: lifePolicies.clientId?.name || null,
    nominee1Name: lifePolicies.nominee1ID?.name || null,
    nominee2Name: lifePolicies.nominee2ID?.name || null,
    nominee3Name: lifePolicies.nominee3ID?.name || null,
    startPremiumDate: lifePolicies.startPremiumDate.toLocaleDateString('en-GB'),
    endPremiumDate: lifePolicies.endPremiumDate.toLocaleDateString('en-GB'),
    maturityDate: lifePolicies.maturityDate.toLocaleDateString('en-GB'),
    premium: lifePolicies.premium,
    __v: lifePolicies.__v
  }));

  const formattedGeneralPolicies = generalPolicies.map(generalPolicies => ({
    _id: generalPolicies._id,
    policyNumber: generalPolicies.policyNumber,
    policyName: generalPolicies.policyName,
    companyName: generalPolicies.companyName,
    holderName: generalPolicies.clientId?.name || null,
    nominee1Name: generalPolicies.nominee1ID?.name || null,
    startPremiumDate: generalPolicies.startPremiumDate.toLocaleDateString(
      'en-GB'
    ),
    type: generalPolicies.type,
    __v: generalPolicies.__v
  }));

  const mergedPolicies = [
    ...formattedLifePolicies.map(policy => ({
      ...policy,
      type: '', // Not available in Life policies
      policyType: 'Life' // New field to indicate policy type
    })),
    ...formattedGeneralPolicies.map(policy => ({
      ...policy,
      endPremiumDate: '', // Not available in General policies
      maturityDate: '', // Not available in General policies
      premium: '', // Not available in General policies
      policyType: 'General' // New field to indicate policy type
    }))
  ];

  // Calculate investment summary
  const uniqueClientIds = new Set();

  // Add all client IDs from life policies
  lifePolicies.forEach(policy => {
    if (policy.clientId) {
      uniqueClientIds.add(policy.clientId._id.toString());
    }
  });

  // Add all client IDs from general policies
  generalPolicies.forEach(policy => {
    if (policy.clientId) {
      uniqueClientIds.add(policy.clientId._id.toString());
    }
  });

  const numberOfClients = uniqueClientIds.size;

  // Create extras with investment summary
  const extras = {
    investmentSummary: {
      numberOfClients: numberOfClients,
      totalLifePolicies: lifePolicies.length,
      totalGeneralPolicies: generalPolicies.length,
      totalPolicies: lifePolicies.length + generalPolicies.length
    }
  };

  const lifeInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'End Date', value: 'endPremiumDate' },
    { label: 'Maturity Date', value: 'maturityDate' },
    { label: 'Policy Type', value: 'policyType' },
    { label: 'Type', value: 'type' },
    { label: 'Premium', value: 'premium' },
    { label: 'Nominee 1', value: 'nominee1Name' }
  ];

  if (format == 'pdf') {
    // Create and send a PDF file
    const pdfPath = 'Monthly_Report';
    generatePDF(
      mergedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      'Renewal report',
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras // Pass extras to the PDF generator
    );
  } else if (format == 'excel') {
    // Create and send an Excel file
    const excelPath = 'Monthly_Report';
    generateExcel(
      mergedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      'Renewal report',
      'N/A',
      req.body.email,
      req.body.title,
      req.body.description,
      extras // Pass extras to the Excel generator
    );
  } else {
    // If format is not specified, return JSON with extras
    return res.status(200).json({
      status: 'success',
      data: mergedPolicies,
      extras: extras
    });
  }
});

exports.getTaxation = catchAsync(async (req, res) => {
  console.log(req.body);
  const { year, name } = req.body;

  // Validate input
  if (!year || !name) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide year and name'
    });
  }

  // Fetch all financial data for the user in the given year
  const [
    mutualFunds,
    lifeInsurances,
    generalInsurances,
    fixedDeposits
  ] = await Promise.all([
    MutualFund.find({ holderId: name }),
    Life.find({ clientId: name }),
    General.find({ clientId: name }),
    Debt.find({ holderId: name })
  ]);

  const formatDate = dateStr => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // 1. Mutual Funds Details
  const mutualFundDetails1 = mutualFunds.flatMap(mf => {
    const scheme = mf.schemeName.split('-')[0].trim();

    // Lump sum redemptions
    const lumpSumRedemptions = mf.redemptions
      .filter(r => new Date(r.date).getFullYear() == year)
      .map(r => ({
        key: `${scheme}-${year}`,
        investmentType: 'Mutual Fund',
        name: scheme,
        amount: parseFloat((r.units * r.nav).toFixed(2)),
        date: formatDate(r.date),
        taxType: r.taxtype,
        tax: parseFloat(Number(r.tax || 0).toFixed(2))
      }));

    // SIP redemptions
    const sipRedemptions = (mf.sipTransactions || []).flatMap(sip =>
      (sip.redemptions || [])
        .filter(r => new Date(r.date).getFullYear() == year)
        .map(r => ({
          key: `${scheme}-${year}`,
          investmentType: 'Mutual Fund (SIP)',
          name: scheme + ' (SIP)',
          amount: parseFloat(r.amount),
          date: formatDate(r.date),
          taxType: r.taxtype,
          tax: parseFloat(Number(r.tax || 0).toFixed(2))
        }))
    );

    return [...lumpSumRedemptions, ...sipRedemptions];
  });

  // Grouping by scheme name and year
  const mutualFundDetails = Object.values(
    mutualFundDetails1.reduce((acc, entry) => {
      if (!acc[entry.key]) {
        acc[entry.key] = {
          name: entry.name,
          investmentType: entry.investmentType,
          taxType: entry.taxType,
          amount: 0,
          tax: 0,
          entries: []
        };
      }

      acc[entry.key].amount += entry.amount;
      acc[entry.key].tax += entry.tax;
      acc[entry.key].entries.push({
        date: entry.date,
        amount: entry.amount,
        tax: entry.tax
      });

      return acc;
    }, {})
  ).filter(item => item.tax > 0); // ✅ Only include if tax > 0

  // 2. Life Insurance Details
  const lifeInsuranceDetails = lifeInsurances
    .filter(policy => {
      const startYear = new Date(policy.startPremiumDate).getFullYear();
      const endYear = new Date(policy.endPremiumDate).getFullYear();
      return year >= startYear && year <= endYear;
    })
    .map(policy => ({
      investmentType: 'Life Insurance',
      name: policy.policyName,
      amount: policy.premium,
      date: formatDate(policy.startPremiumDate),
      taxType: '80C Deduction',
      tax: policy.premium * -1
    }));

  // 3. General Insurance Details (Health)
  const generalInsuranceDetails = generalInsurances
    .filter(policy => policy.type === 'Health Insurance')
    .flatMap(policy =>
      (policy.premium || [])
        .filter(p => p.year == year)
        .map(p => ({
          investmentType: 'Health Insurance',
          name: policy.policyName,
          amount: p.premium1,
          date: formatDate(policy.startPremiumDate),
          taxType: '80D Deduction',
          tax: p.premium1 * -1
        }))
    );

  // 4. Fixed Deposits Details
  const fixedDepositDetails = fixedDeposits
    .filter(fd => {
      const startYear = new Date(fd.startDate).getFullYear();
      const maturityYear = new Date(fd.MaturityDate).getFullYear();
      return year >= startYear && year <= maturityYear;
    })
    .map(fd => ({
      investmentType: 'Fixed Deposit',
      name: 'Fixed Deposit',
      amount: fd.maturityAmount, // Interest amount
      date: fd.MaturityDate,
      taxType: 'Interest Income',
      tax: fd.tax || 0
    }));

  // Calculate ELSS deductions separately
  const groupedElssMap = new Map();

  const elssDetailsRaw = mutualFunds
    .filter(mf => mf.schemeName.toLowerCase().includes('elss'))
    .flatMap(mf => {
      const baseName = mf.schemeName.split('-')[0].trim();
      const lumpsum =
        mf.investmentType === 'lumpsum' &&
        new Date(mf.lumpsumDate).getFullYear() == year
          ? [
              {
                investmentType: 'ELSS Mutual Fund',
                name: baseName,
                amount: mf.lumpsumAmount,
                date: formatDate(mf.lumpsumDate),
                taxType: '80C (ELSS Deduction)',
                tax: mf.lumpsumAmount * -1,
                year
              }
            ]
          : [];

      const sips = (mf.sipTransactions || [])
        .filter(sip => new Date(sip.date).getFullYear() == year)
        .map(sip => ({
          investmentType: 'ELSS Mutual Fund (SIP)',
          name: `${baseName} (SIP)`,
          amount: sip.amount,
          date: formatDate(sip.date),
          taxType: '80C (ELSS Deduction)',
          tax: sip.amount * -1,
          year
        }));

      return [...lumpsum, ...sips];
    });

  // Group by base name and year
  for (const entry of elssDetailsRaw) {
    const groupKey = `${entry.name}-${entry.year}`;
    if (!groupedElssMap.has(groupKey)) {
      groupedElssMap.set(groupKey, { ...entry });
    } else {
      const existing = groupedElssMap.get(groupKey);
      groupedElssMap.set(groupKey, {
        ...existing,
        amount: existing.amount + entry.amount,
        tax: existing.tax + entry.tax,
        // Keep earliest date
        date:
          new Date(
            entry.date
              .split('/')
              .reverse()
              .join('-')
          ) <
          new Date(
            existing.date
              .split('/')
              .reverse()
              .join('-')
          )
            ? entry.date
            : existing.date
      });
    }
  }

  // Final grouped array
  const elssDetails = Array.from(groupedElssMap.values());

  // Calculate tax and deductions
  const capitalGains = calculateMutualFundTax(mutualFunds, year);
  const cap_total = capitalGains.total;

  const deductions = {
    section80C: calculate80CDeductions(
      lifeInsurances,
      mutualFunds,
      fixedDeposits,
      year
    ),
    section80D: calculate80DDeductions(lifeInsurances, generalInsurances, year),
    sectionELSS: elssDetails.reduce((sum, elss) => sum + elss.amount, 0)
  };

  const elssTotals = elssDetails.reduce(
    (acc, elss) => {
      acc.totalAmount += Number(elss.amount || 0);
      acc.totalTax += Number(elss.tax || 0);
      return acc;
    },
    { totalAmount: 0, totalTax: 0 }
  );

  const totalDeductions =
    deductions.section80C + deductions.section80D + elssTotals.totalAmount;

  const allInvestments1 = [...mutualFundDetails, ...fixedDepositDetails];

  // Calculate totals
  const totals = allInvestments1.reduce(
    (acc, entry) => {
      acc.totalAmount += Number(entry.amount);
      acc.totalTax += Number(entry.tax);
      return acc;
    },
    { totalAmount: 0, totalTax: 0 }
  );

  // Calculate tax liability
  const grossIncome = totals.totalTax.toFixed(2); // Should come from user's income data
  console.log(grossIncome, totalDeductions);
  const netAmount = grossIncome - totalDeductions.toFixed(2);
  const net = Math.max(0, netAmount);

  // let taxableIncome =
  //   regime === 'old' ? grossIncome - totalDeductions : grossIncome;
  // let taxLiability =
  //   regime === 'old'
  //     ? calculateOldRegimeTax(taxableIncome)
  //     : calculateNewRegimeTax(taxableIncome);

  // Prepare consolidated investment details
  const allInvestments = [
    ...mutualFundDetails,
    ...lifeInsuranceDetails,
    ...generalInsuranceDetails,
    ...fixedDepositDetails,
    ...elssDetails
  ];

  const reportDate = new Date().toLocaleDateString('en-IN');

  // Prepare response data
  const taxationData = {
    asOnDate: reportDate,
    year,
    investmentDetails: allInvestments,
    grandTotal: {
      deductionSection80C: deductions.section80C,
      deductionSection80D: deductions.section80D,
      deductionELSS: deductions.sectionELSS,
      totalTax: grossIncome,
      totalDeductions,
      netTaxPaid: Number(net || 0).toFixed(2)
    }
  };

  const pdfPath = `Taxation_Report_${year}`;

  // Define fields for PDF table columns
  const pdfTableFields = [
    { label: 'Investment Type', value: 'investmentType' },
    { label: 'Name', value: 'name' },
    { label: 'Amount (₹)', value: 'amount', format: 'currency' },
    { label: 'Tax Type', value: 'taxType' },
    { label: 'Tax (₹)', value: 'tax', format: 'currency' }
  ];

  // Define fields for summary section
  const summaryFields = [
    { label: 'Year', value: 'year' },
    { label: 'Tax Regime', value: 'regime' },
    {
      label: 'Total 80C Deductions',
      value: 'grandTotal.deductionSection80C',
      format: 'currency'
    },
    {
      label: 'Total 80D Deductions',
      value: 'grandTotal.deductionSection80D',
      format: 'currency'
    },
    {
      label: 'ELSS Deductions',
      value: 'grandTotal.deductionELSS',
      format: 'currency'
    },
    {
      label: 'Total Deductions',
      value: 'grandTotal.totalDeductions',
      format: 'currency'
    },
    {
      label: 'Net Tax Paid',
      value: 'grandTotal.netTaxPaid',
      format: 'currency'
    }
  ];

  // Generate output based on format
  if (req.body.format == 'pdf') {
    const pdfPath = `Taxation_Report_${year}`;
    generatePDF(
      taxationData.investmentDetails,
      pdfPath,
      res,
      pdfTableFields, // Fields for investment details table
      `Taxation Report of ${req.body.name_label} for ${year}`,
      '0',
      req.body.email,
      req.body.title,
      req.body.description,
      taxationData
    );
  } else if (req.body.format == 'excel') {
    const excelPath = `Taxation_Report_${year}`;
    generateExcel(
      taxationData.investmentDetails,
      excelPath,
      res,
      pdfTableFields, // Fields not needed as we're using custom structure
      `Taxation Report of ${req.body.name_label} for ${year}`,
      year,
      req.body.email,
      req.body.title,
      req.body.description,
      taxationData
    );
  } else {
    res.status(200).json({
      status: 'success',
      data: taxationData
    });
  }
});

// Helper functions for tax calculations
function calculateMutualFundTax(mutualFunds, year) {
  let stcg = 0; // Short-term capital gains
  let ltcg = 0; // Long-term capital gains

  mutualFunds.forEach(mf => {
    // Check redemptions in the given year
    mf.redemptions.forEach(redemption => {
      const redemptionYear = new Date(redemption.date).getFullYear();
      if (redemptionYear == year) {
        if (redemption.taxtype == 'STCG') {
          stcg += redemption.tax || 0;
        } else {
          ltcg += redemption.tax || 0;
        }
      }
    });

    // Check SIP redemptions in the given year
    mf.sipTransactions?.forEach(sip => {
      sip.redemptions?.forEach(redemption => {
        const redemptionYear = new Date(redemption.date).getFullYear();
        if (redemptionYear == year) {
          if (redemption.taxtype == 'STCG') {
            stcg += redemption.tax || 0;
          } else {
            ltcg += redemption.tax || 0;
          }
        }
      });
    });
  });
  return {
    stcg,
    ltcg,
    total: stcg + ltcg
  };
}

function calculateInsuranceBenefits(lifeInsurances, generalInsurances, year) {
  let lifeInsurancePremium = 0;
  let healthInsurancePremium = 0;

  // Life insurance premiums (eligible for 80C)
  lifeInsurances.forEach(policy => {
    // Check if policy was active in the given year
    const startYear = new Date(policy.startPremiumDate).getFullYear();
    const endYear = new Date(policy.endPremiumDate).getFullYear();

    if (year >= startYear && year <= endYear) {
      lifeInsurancePremium += policy.premium || 0;
    }
  });

  // Health insurance premiums (eligible for 80D)
  generalInsurances.forEach(policy => {
    console.log(policy.type);
    if (policy.type == 'Health Insurance') {
      policy.premium.forEach(premium => {
        if (premium.year == year) {
          healthInsurancePremium += premium.premium1 || 0;
        }
      });
    }
  });

  return {
    lifeInsurancePremium,
    healthInsurancePremium
  };
}

function calculateFixedDepositInterest(fixedDeposits, year) {
  let interest = 0;

  fixedDeposits.forEach(fd => {
    const startYear = new Date(fd.startDate).getFullYear();
    const maturityYear = new Date(fd.MaturityDate).getFullYear();

    if (year >= startYear && year <= maturityYear) {
      interest += (fd.amount * fd.intrestRate) / 100 || 0;
    }
  });

  return interest;
}

function calculate80CDeductions(
  lifeInsurances,
  mutualFunds,
  fixedDeposits,
  year
) {
  const insuranceBenefits = calculateInsuranceBenefits(
    lifeInsurances,
    [],
    year
  );
  let deduction = insuranceBenefits.lifeInsurancePremium;

  // ELSS mutual funds (part of 80C)
  mutualFunds.forEach(mf => {
    if (mf.schemeName.includes('ELSS')) {
      // Assuming investments made in this year count towards 80C
      if (
        mf.investmentType == 'lumpsum' &&
        new Date(mf.lumpsumDate).getFullYear() == year
      ) {
        deduction += mf.lumpsumAmount || 0;
      } else if (mf.investmentType == 'sip') {
        mf.sipTransactions.forEach(sip => {
          if (new Date(sip.date).getFullYear() == year) {
            deduction += sip.amount || 0;
          }
        });
      }
    }
  });

  // Fixed deposits (5-year tax saving FDs)
  fixedDeposits.forEach(fd => {
    if (
      new Date(fd.MaturityDate).getFullYear() -
        new Date(fd.startDate).getFullYear() >=
      5
    ) {
      if (new Date(fd.startDate).getFullYear() == year) {
        deduction += fd.amount || 0;
      }
    }
  });

  // Cap at ₹1.5 lakh
  return Math.min(deduction, 150000);
}

function calculate80DDeductions(lifeInsurances, generalInsurances, year) {
  const insuranceBenefits = calculateInsuranceBenefits(
    lifeInsurances,
    generalInsurances,
    year
  );
  let deduction = insuranceBenefits.healthInsurancePremium;

  // Cap based on individual/senior citizen status
  // For simplicity, we'll use standard limit of ₹25,000
  // In real app, you'd check user's age
  return Math.min(deduction, 25000);
}

function calculateOldRegimeTax(income) {
  // Simplified tax calculation for old regime
  if (income <= 250000) return 0;
  if (income <= 500000) return (income - 250000) * 0.05;
  if (income <= 1000000) return 12500 + (income - 500000) * 0.2;
  return 112500 + (income - 1000000) * 0.3;
}

function calculateNewRegimeTax(income) {
  // Simplified tax calculation for new regime
  if (income <= 250000) return 0;
  if (income <= 500000) return (income - 250000) * 0.05;
  if (income <= 750000) return 12500 + (income - 500000) * 0.1;
  if (income <= 1000000) return 37500 + (income - 750000) * 0.15;
  if (income <= 1250000) return 75000 + (income - 1000000) * 0.2;
  if (income <= 1500000) return 125000 + (income - 1250000) * 0.25;
  return 187500 + (income - 1500000) * 0.3;
}
