// routes/snapshotRoutes.js
const express = require('express');
const router = express.Router();
const { fetchAndStoreSnapshot } = require('../utils/snapshotUtils');
const businessController = require("../controllers/businessController");

router.get('/trigger', async (req, res) => {
  try {
    const snapshot = await fetchAndStoreSnapshot();
    res.status(200).json({
      status: 'success',
      message: 'Snapshot stored successfully',
      data: snapshot
    });
  } catch (err) {
    console.error('Snapshot error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to store snapshot'
    });
  }
});

router.get("/fake-business-snapshots", businessController.getFakeBusinessSnapshots);

router.get('/business-snapshot/:type', businessController.getGroupedBusinessSnapshots);

module.exports = router;




module.exports = router;
