const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getResources } = require('../controllers/resourceController');

router.get('/', protect, getResources);

module.exports = router;
