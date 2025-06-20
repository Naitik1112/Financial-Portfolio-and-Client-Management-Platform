const Life = require('./../models/lifeInsuranceModel');
const General = require('./../models/generalInsuranceModels');
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
    nominee2Name: generalPolicies.nominee2ID?.name || null,
    nominee3Name: generalPolicies.nominee3ID?.name || null,
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
  // console.log(lifePolicies[0].clientId);
  // console.log(lifePolicies[0].clientId.name);
  // console.log(lifePolicies);
  // console.log(formattedLifePolicies);
  // console.log(mergedPolicies);

  const lifeInsuranceFields = [
    { label: 'Policy Number', value: 'policyNumber' },
    { label: 'Policy Name', value: 'policyName' },
    { label: 'Company Name', value: 'companyName' },
    { label: 'Start Date', value: 'startPremiumDate' },
    { label: 'End Date', value: 'endPremiumDate' },
    { label: 'Maturity Date', value: 'maturityDate' },
    { label: 'Policy Type', value: 'policyType' },
    { label: 'Type', value: 'type' },
    { label: 'Premium', value: 'premium' },
    { label: 'Holder Name', value: 'holderName' },
    { label: 'Nominee 1', value: 'nominee1Name' },
    { label: 'Nominee 2', value: 'nominee2Name' },
    { label: 'Nominee 3', value: 'nominee3Name' }
  ];

  if (format === 'pdf') {
    // Create and send a PDF file
    const pdfPath = 'Monthly_Report';
    generatePDF(
      mergedPolicies,
      pdfPath,
      res,
      lifeInsuranceFields,
      'Renewal report',
      'N/A'
    );
  } else if (format === 'excel') {
    // Create and send an Excel file
    const excelPath = 'Monthly_Report';
    generateExcel(
      mergedPolicies,
      excelPath,
      res,
      lifeInsuranceFields,
      'Renewal report',
      'N/A'
    );
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid format. Specify "pdf" or "excel".'
    });
  }
});
