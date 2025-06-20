// const express = require('express');
// const tourController = require('./../controllers/tourController');
// const authController = require('./../controllers/authContriller');
// const reviewRouter = require('./../routes/reviewRoutes');

// const router = express.Router();

// // Uncomment this line if you have a checkID function
// // router.param('id', tourController.checkID);

// router.use('/:slug/reviews', reviewRouter);

// router
//   .route('/top-5-cheap')
//   .get(tourController.aliasTopTours, tourController.getAllTours);

// router
//   .route('/tours-within/:distance/center/:latlng/unit/:unit')
//   .get(tourController.getToursWithin);

// router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// router.route('/tour-stats').get(tourController.getTourStats);
// router
//   .route('/monthly-plan/:year')
//   .get(
//     authController.protect,
//     authController.restrictTo('lead-guide', 'admin', 'guide'),
//     tourController.getMonthlyPlan
//   );

// router
//   .route('/')
//   .get(tourController.getAllTours)
//   .post(
//     authController.protect,
//     authController.restrictTo('lead-guide', 'admin'),
//     tourController.uploadTourImages,
//     tourController.resizeTourImages,
//     tourController.createTour
//   );

// router
//   .route('/:id')
//   .get(authController.protect, tourController.getTour)
//   .patch(
//     authController.protect,
//     authController.restrictTo('lead-guide', 'admin'),
//     tourController.uploadTourImages,
//     tourController.resizeTourImages,
//     tourController.updateTour
//   )
//   .delete(
//     authController.protect,
//     authController.restrictTo('admin', 'lead-guide'),
//     tourController.deleteTour
//   );

// module.exports = router;
