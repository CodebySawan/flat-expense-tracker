const express = require('express');
const router = express.Router();
const { 
  addExpense, 
  getWeeklyExpenses, 
  calculateBalances,
  deleteExpense,
  getPersonDiary 
} = require('../controllers/expenseController');

// Simple password check middleware
const checkAdmin = (req, res, next) => {
  const password = req.headers['admin-password'];
  if (password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized' });
  }
};

router.post('/', addExpense);
router.get('/weekly', getWeeklyExpenses);
router.get('/balances', calculateBalances);
router.get('/diary/:personId', getPersonDiary);
router.delete('/:id', checkAdmin, deleteExpense);

module.exports = router;