const mongoose = require('mongoose');
require('dotenv').config();

const Flatmate = require('./models/Flatmate');
const Turn = require('./models/Turn');

const initializeData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if flatmates already exist
    const count = await Flatmate.countDocuments();
    if (count > 0) {
      console.log('❌ Flatmates already initialized');
      process.exit(0);
    }

    // Create flatmates
    const flatmates = [
      { name: 'Kartik', color: '#3B82F6', order: 0 },
      { name: 'Akshay', color: '#10B981', order: 1 },
      { name: 'Prince', color: '#8B5CF6', order: 2 },
      { name: 'Sawan', color: '#F59E0B', order: 3 },
      { name: 'Krishna', color: '#EC4899', order: 4 }
    ];

    await Flatmate.insertMany(flatmates);
    console.log('✅ Flatmates created');

    // Initialize turns
    await Turn.create({ type: 'vegetable', currentTurnOrder: 0 });
    await Turn.create({ type: 'water', currentTurnOrder: 0, waterCansCount: 0 });
    console.log('✅ Turns initialized');

    console.log('🎉 Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

initializeData();
