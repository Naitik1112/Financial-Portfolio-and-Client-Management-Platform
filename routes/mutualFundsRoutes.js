const express = require('express');
const mutualFundsController = require('./../controllers/mutualFundsController');
const authController = require('./../controllers/authContriller');
const { getMutualFunds } = require('./../controllers/mutualFundsController');

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

router.get('/all', mutualFundsController.getAllMutualFunds);

router.get('/autocomplete', mutualFundsController.getSchemesCaching);

router.get('/refresh-cache', mutualFundsController.refreshAmfiSchemeCache);

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
