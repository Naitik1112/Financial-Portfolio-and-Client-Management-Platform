// const express = require('express');
// const viewController = require('../controllers/viewController');
// const authController = require('../controllers/authContriller');
// const bookingController = require('../controllers/bookingController');
// const tourController = require('../controllers/tourController');

// const router = express.Router();

// router.get('/', authController.isLoggedIn, viewController.getOverview);

// router.get(
//   '/tour/:slug',
//   authController.isLoggedIn,
//   authController.protect,
//   tourController.isTourBooked,
//   viewController.getTour
// );

// router.get('/login', viewController.getLoginForm);

// router.get('/signup', viewController.getSignupForm);

// router.get('/forgotPassword', viewController.getForgotPasswordForm);

// router.get('/reviews', authController.protect, viewController.getReviews);

// router.get('/resetPassword/:token', viewController.getResetPasswordForm);

// router.get('/me', authController.protect, viewController.getAccount);

// router.get(
//   '/my-tours',
//   bookingController.createBookingCheckout,
//   authController.protect,
//   viewController.getMyTours
// );

// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewController.updateUserData
// );

// module.exports = router;
