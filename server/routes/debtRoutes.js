const express = require('express');
const DebtController = require('../controllers/debtController');
const authController = require('./../controllers/authContriller');

const router = express.Router();

// router.use(authController.protect);
// router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(DebtController.getAllLifePolicy)
  .post(DebtController.convertNameToId, DebtController.createLifePolicy);

router.route('/user/:id').get(DebtController.getDebtByUser);

router
  .route('/:id')
  .get(DebtController.getLifePolicy)
  .patch(DebtController.convertNameToId, DebtController.updateLifePolicy)
  .delete(DebtController.deleteLifePolicy);

module.exports = router;
