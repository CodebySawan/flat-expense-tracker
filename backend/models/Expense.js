const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['vegetable', 'custom'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flatmate',
    required: true
  },
  sharedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flatmate'
  }],
  date: {
    type: Date,
    default: Date.now
  },
  settlementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Settlement',
    default: null
  },
  isSettled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);