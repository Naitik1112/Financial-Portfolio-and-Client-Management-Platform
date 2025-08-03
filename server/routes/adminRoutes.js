const express = require('express');
const adminController = require('./../controllers/adminController');
const adminAuthController = require('./../controllers/adminAuthController');
const authController = require('./../controllers/authContriller');

const router = express.Router();

router.route('/signup').post(adminAuthController.signup);

router.route('/login').post(adminAuthController.login);

router.route('/logout').get(adminAuthController.logout);

router.route('/forgotPassword').post(adminAuthController.forgotPassword);

router.route('/resetPassword/:token').patch(adminAuthController.resetPassword);

//PROTECT ALL ROUTES
router.use(authController.protect);

// Move this block ABOVE `/:id`
router.route('/getUsersOfAdmin').get(adminController.getUserOfAdmin);

router.route('/getme').get(adminController.getme, adminController.getAdmin);

router.route('/numberOfClients').get(adminController.getNumberOfClient);

router.route('/getRecentlyAdded').get(adminController.getRecentClients);

router.route('/deleteMe').patch(adminController.deleteMe);

router
  .route('/updateMe')
  .patch(
    adminController.uploadAdminPhoto,
    adminController.resizeAdminPhoto,
    adminController.updateMe
  );

router.route('/updateMyPassword').patch(adminAuthController.updatePassword);

router.route('/').get(adminController.getAllAdmins);

router
  .route('/:id')
  .get(adminController.getAdmin)
  .patch(adminController.updateAdmin)
  .delete(adminController.deleteAdmin);

router.route('/addAdmin').post(adminController.createOne);


module.exports = router;
