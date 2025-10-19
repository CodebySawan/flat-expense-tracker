const mongoose = require('mongoose');
require('dotenv').config();

const Expense = require('./models/Expense');

const fixExpenses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Update all expenses to have isSettled: false if not set
    const result = await Expense.updateMany(
      { isSettled: { $exists: false } },
      { $set: { isSettled: false, settlementId: null } }
    );

    console.log(`✅ Updated ${result.modifiedCount} expenses`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixExpenses();