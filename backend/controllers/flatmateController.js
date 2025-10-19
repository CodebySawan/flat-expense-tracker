const Flatmate = require('../models/Flatmate');

// Get all flatmates
exports.getAllFlatmates = async (req, res) => {
  try {
    const flatmates = await Flatmate.find().sort('order');
    res.json(flatmates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Initialize flatmates (run once to add all 5 members)
exports.initializeFlatmates = async (req, res) => {
  try {
    const count = await Flatmate.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Flatmates already initialized' });
    }

    const flatmates = [
      { name: 'Kartik', color: '#3B82F6', order: 0 },
      { name: 'Akshay', color: '#10B981', order: 1 },
      { name: 'Prince', color: '#8B5CF6', order: 2 },
      { name: 'Sawan', color: '#F59E0B', order: 3 },
      { name: 'Krishna', color: '#EC4899', order: 4 }
    ];

    await Flatmate.insertMany(flatmates);
    res.json({ message: 'Flatmates initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};