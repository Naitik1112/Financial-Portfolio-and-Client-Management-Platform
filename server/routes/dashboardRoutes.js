const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const authController = require('./../controllers/authContriller');

const router = express.Router();

router.route('/getAUM').get(DashboardController.getAUMBreakdown);

router.route('/getTodayBusiness').get(DashboardController.getTodayBusiness);

router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.route('/getFDMaturing').get(DashboardController.getFDsMaturingThisMonth);

router.route('/getRecentMFS').get(DashboardController.getRecentInvestments);

router.route('/getRecentClaims').get(DashboardController.getRecentClaims);

router
  .route('/getRecentRedemptions')
  .get(DashboardController.getRecentlyRedeemedFunds);

module.exports = router;
