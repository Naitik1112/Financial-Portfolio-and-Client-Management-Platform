const express = require('express');
const authController = require('./../controllers/authContriller');
const reportController = require('./../controllers/reportController');
const generalReportController = require('./../controllers/groupReportController');
const monthlyReportController = require('./../controllers/monthlyReportController');

const router = express.Router();

router
  .route('/policyByClient')
  .post(reportController.getUserId, reportController.getPolicyByClient);

router.route('/policyByGroup').post(generalReportController.getPolicyByGroup);

router
  .route('/generalPolicyByClient')
  .post(reportController.getUserId, reportController.getGeneralPolicyByClient);

router
  .route('/generalPolicyByGroup')
  .post(generalReportController.getGeneralPolicyByGroup);

router
  .route('/debtsByClient')
  .post(reportController.getUserId, reportController.getDebtsByClient);

router.route('/debtsByGroup').post(generalReportController.getDebtsByGroup);

router
  .route('/schemeByClient')
  .post(reportController.getUserId, reportController.getSchemeByClient);

router
  .route('/schemeValuation')
  .post(reportController.getSchemeValuationByClient);

router.route('/schemeByGroup').post(generalReportController.getSchemeByGroup);

router
  .route('/cashFlowReport')
  .post(reportController.getUserId, reportController.getCashFlowByClient);

router
  .route('/claimsByClient')
  .post(reportController.getUserId, reportController.getClaimsByClient);

router
  .route('/monthlyReport')
  .post(monthlyReportController.getMonthlyPremiumData);


router
  .route('/taxReport')
  .post(monthlyReportController.getTaxation);

module.exports = router;
