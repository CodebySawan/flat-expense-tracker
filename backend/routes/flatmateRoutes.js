const express = require('express');
const router = express.Router();
const { getAllFlatmates, initializeFlatmates } = require('../controllers/flatmateController');

router.get('/', getAllFlatmates);
router.post('/initialize', initializeFlatmates);

module.exports = router;