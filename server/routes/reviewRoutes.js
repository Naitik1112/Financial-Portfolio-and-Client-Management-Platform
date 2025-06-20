// const express = require('express');
// const reviewController = require('./../controllers/reviewController');
// const authController = require('./../controllers/authContriller');

// const router = express.Router({ mergeParams: true });

// router.use(authController.protect);

// router.route('/user').get(reviewController.user);

// router
//   .route('/')
//   .get(reviewController.getAllReviews)
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.setTourUserIds,
//     reviewController.createReview
//   );

// router
//   .route('/:id')
//   .get(reviewController.getReview)
//   .patch(
//     authController.restrictTo('user', 'admin'),
//     reviewController.updateReview
//   )
//   .delete(
//     authController.restrictTo('user', 'admin'),
//     reviewController.deleteReview
//   );

// module.exports = router;
