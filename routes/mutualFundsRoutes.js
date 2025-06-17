const express = require('express');
const mutualFundsController = require('./../controllers/mutualFundsController');
const authController = require('./../controllers/authContriller');

const router = express.Router();

router
  .route('/')
  .get(authController.protect)
  .get(authController.restrictTo('admin'))
  .get(mutualFundsController.getAllLifePolicy)
  .post(
    mutualFundsController.convertNameToId,
    mutualFundsController.createLifePolicy
  );

router.route('/user/:id').get(mutualFundsController.getMutualFundByUser);

router.route('/redeemUnits').patch(mutualFundsController.redeemUnits);

router
  .route('/:id')
  .get(mutualFundsController.getLifePolicy)
  .patch(
    mutualFundsController.convertNameToId,
    mutualFundsController.updateLifePolicy
  )
  .delete(mutualFundsController.deleteLifePolicy);

module.exports = router;
