const express = require('express');
const GeneralInsuranceController = require('./../controllers/generalInsuranceController');
const authController = require('./../controllers/authContriller');

const router = express.Router();

router
  .route('/')
  .get(authController.protect)
  .get(authController.restrictTo('admin'))
  .get(GeneralInsuranceController.getAllGeneralPolicy)
  .post(
    GeneralInsuranceController.convertNameToId,
    GeneralInsuranceController.createGeneralPolicy
  );

router.route('/user/:id').get(GeneralInsuranceController.getGeneralInsByUser);

router
  .route('/:id')
  .get(GeneralInsuranceController.getGeneralPolicy)
  .patch(
    GeneralInsuranceController.convertNameToId,
    GeneralInsuranceController.updateGeneralPolicy
  )
  .delete(GeneralInsuranceController.deleteGeneralPolicy);

module.exports = router;
