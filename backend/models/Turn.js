const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['vegetable', 'water'],
    required: true
  },
  currentTurnOrder: {
    type: Number,
    required: true,
    default: 0
  },
  waterCansCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Turn', turnSchema);