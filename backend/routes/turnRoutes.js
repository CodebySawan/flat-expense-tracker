const express = require('express');
const router = express.Router();
const { getCurrentTurns, nextVegetableTurn, fillWaterCan } = require('../controllers/turnController');

router.get('/', getCurrentTurns);
router.post('/vegetable/next', nextVegetableTurn);
router.post('/water/fill', fillWaterCan);

module.exports = router;