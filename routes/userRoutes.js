const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authContriller');

const router = express.Router();

router.route('/signup').post(authController.signup);

router.route('/login').post(authController.login);

router.route('/logout').get(authController.logout);

router.route('/forgotPassword').post(authController.forgotPassword);

router.route('/resetPassword/:token').patch(authController.resetPassword);

//PROTECT ALL ROUTES
router.use(authController.protect);

router.route('/getme').get(userController.getme, userController.getUser);

router.route('/deleteMe').patch(userController.deleteMe);

router
  .route('/updateMe')
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
  );

router.route('/updateMyPassword').patch(authController.updatePassword);

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.route('/addUser').post(userController.createOne);

module.exports = router;
