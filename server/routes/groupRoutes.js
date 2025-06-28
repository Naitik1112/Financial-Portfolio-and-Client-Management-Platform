const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

router.post('/', groupController.createGroup);

router.delete('/:id', groupController.deleteGroup);

// POST: Add user to group
router.post('/add-user', groupController.addUserToGroup);

// GET: All group names
router.get('/all-groups', groupController.getAllGroupNames);

// GET: All users in a group
router.get('/group-users/:groupId', groupController.getUsersInGroup);

// GET: All groups a user belongs to
router.get('/user-groups/:userId', groupController.getGroupOfUser);

router.delete('/remove-user/:userId', groupController.removeUserFromGroup);

module.exports = router;
