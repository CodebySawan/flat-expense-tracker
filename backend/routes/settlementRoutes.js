const express = require('express');
const router = express.Router();
const {
  getCurrentSummary,
  markAsSettled,
  getSettlementHistory,
  deleteSettlement
} = require('../controllers/settlementController');

// Simple password check
const checkAdmin = (req, res, next) => {
  const password = req.headers['admin-password'];
  if (password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized' });
  }
};

router.get('/current', getCurrentSummary);
router.get('/history', getSettlementHistory);
router.post('/settle', checkAdmin, markAsSettled);
router.delete('/:id', checkAdmin, deleteSettlement);

module.exports = router;