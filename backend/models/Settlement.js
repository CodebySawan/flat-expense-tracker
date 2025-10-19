const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  expenses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  }],
  settlements: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flatmate'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flatmate'
    },
    amount: {
      type: Number
    }
  }],
  settledBy: {
    type: String,
    default: 'Admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);