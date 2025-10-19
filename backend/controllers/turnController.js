const Turn = require('../models/Turn');
const Flatmate = require('../models/Flatmate');

// Get current turns
exports.getCurrentTurns = async (req, res) => {
  try {
    let vegTurn = await Turn.findOne({ type: 'vegetable' });
    let waterTurn = await Turn.findOne({ type: 'water' });

    // Initialize if not exists
    if (!vegTurn) {
      vegTurn = await Turn.create({ type: 'vegetable', currentTurnOrder: 0 });
    }
    if (!waterTurn) {
      waterTurn = await Turn.create({ type: 'water', currentTurnOrder: 0, waterCansCount: 0 });
    }

    // Get flatmates to show names
    const flatmates = await Flatmate.find().sort('order');
    const vegPerson = flatmates[vegTurn.currentTurnOrder];
    const waterPerson = flatmates[waterTurn.currentTurnOrder];

    res.json({
      vegetable: {
        currentPerson: vegPerson,
        turnOrder: vegTurn.currentTurnOrder
      },
      water: {
        currentPerson: waterPerson,
        turnOrder: waterTurn.currentTurnOrder,
        cansCount: waterTurn.waterCansCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Move to next vegetable turn
exports.nextVegetableTurn = async (req, res) => {
  try {
    const vegTurn = await Turn.findOne({ type: 'vegetable' });
    const flatmatesCount = await Flatmate.countDocuments();
    
    vegTurn.currentTurnOrder = (vegTurn.currentTurnOrder + 1) % flatmatesCount;
    await vegTurn.save();

    const flatmates = await Flatmate.find().sort('order');
    const nextPerson = flatmates[vegTurn.currentTurnOrder];

    res.json({ 
      message: 'Vegetable turn moved',
      nextPerson,
      turnOrder: vegTurn.currentTurnOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fill water can (2 cans logic)
exports.fillWaterCan = async (req, res) => {
  try {
    const waterTurn = await Turn.findOne({ type: 'water' });
    const flatmatesCount = await Flatmate.countDocuments();
    
    waterTurn.waterCansCount += 1;

    // If 2 cans filled, move to next person
    if (waterTurn.waterCansCount >= 2) {
      waterTurn.waterCansCount = 0;
      waterTurn.currentTurnOrder = (waterTurn.currentTurnOrder + 1) % flatmatesCount;
    }

    await waterTurn.save();

    const flatmates = await Flatmate.find().sort('order');
    const currentPerson = flatmates[waterTurn.currentTurnOrder];

    res.json({
      message: waterTurn.waterCansCount === 0 ? 'Turn moved to next person' : `Can ${waterTurn.waterCansCount} filled`,
      currentPerson,
      cansCount: waterTurn.waterCansCount,
      turnOrder: waterTurn.currentTurnOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};