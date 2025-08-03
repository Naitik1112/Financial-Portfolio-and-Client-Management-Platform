const express = require('express');
const lifeInsuranceController = require('./../controllers/lifeInsuranceController');
const authController = require('./../controllers/authContriller');

const router = express.Router();

router.use(authController.protect)

router
  .route('/')
  .get(lifeInsuranceController.getAllLifePolicy)
  .post(
    lifeInsuranceController.convertNameToId,
    lifeInsuranceController.createLifePolicy
  );

router.route('/user/:id').get(lifeInsuranceController.getLifeInsByUser);

router
  .route('/:id')
  .get(lifeInsuranceController.getLifePolicy)
  .patch(
    lifeInsuranceController.convertNameToId,
    lifeInsuranceController.updateLifePolicy
  )
  .delete(lifeInsuranceController.deleteLifePolicy);

module.exports = router;
