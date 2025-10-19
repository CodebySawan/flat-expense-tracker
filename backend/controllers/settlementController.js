const Settlement = require('../models/Settlement');
const Expense = require('../models/Expense');
const Flatmate = require('../models/Flatmate');

// Get current unsettled expenses summary
exports.getCurrentSummary = async (req, res) => {
  try {
    const expenses = await Expense.find({ isSettled: false })
      .populate('paidBy', 'name')
      .populate('sharedBy', 'name')
      .sort('date');

    if (expenses.length === 0) {
      return res.json({ 
        message: 'No pending expenses',
        expenses: [],
        settlements: []
      });
    }

    const flatmates = await Flatmate.find().sort('order');
    
    // Calculate balances
    const balances = flatmates.map(person => {
      const paid = expenses
        .filter(exp => exp.paidBy._id.toString() === person._id.toString())
        .reduce((sum, exp) => sum + exp.amount, 0);

      const shouldPay = expenses.reduce((sum, exp) => {
        const isSharing = exp.sharedBy.some(
          sharer => sharer._id.toString() === person._id.toString()
        );
        if (isSharing) {
          return sum + (exp.amount / exp.sharedBy.length);
        }
        return sum;
      }, 0);

      return {
        id: person._id,
        name: person.name,
        paid: Math.round(paid * 100) / 100,
        shouldPay: Math.round(shouldPay * 100) / 100,
        balance: Math.round((paid - shouldPay) * 100) / 100
      };
    });

    // Calculate simplified settlements
    const settlements = [];
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0.01) {
        settlements.push({
          from: debtor.name,
          fromId: debtor.id,
          to: creditor.name,
          toId: creditor.id,
          amount: Math.round(amount * 100) / 100
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const startDate = expenses[0].date;
    const endDate = expenses[expenses.length - 1].date;

    res.json({
      expenses,
      settlements,
      totalAmount: Math.round(totalAmount * 100) / 100,
      startDate,
      endDate,
      expenseCount: expenses.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark as settled and move to history
exports.markAsSettled = async (req, res) => {
  try {
    // Get all unsettled expenses
    const expenses = await Expense.find({ isSettled: false })
      .populate('paidBy')
      .populate('sharedBy');

    if (expenses.length === 0) {
      return res.json({ message: 'No expenses to settle' });
    }

    const flatmates = await Flatmate.find().sort('order');
    
    // Calculate final settlements
    const balances = flatmates.map(person => {
      const paid = expenses
        .filter(exp => exp.paidBy._id.toString() === person._id.toString())
        .reduce((sum, exp) => sum + exp.amount, 0);

      const shouldPay = expenses.reduce((sum, exp) => {
        const isSharing = exp.sharedBy.some(
          sharer => sharer._id.toString() === person._id.toString()
        );
        if (isSharing) {
          return sum + (exp.amount / exp.sharedBy.length);
        }
        return sum;
      }, 0);

      return {
        id: person._id,
        balance: paid - shouldPay
      };
    });

    const settlements = [];
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0.01) {
        settlements.push({
          from: debtor.id,
          to: creditor.id,
          amount: Math.round(amount * 100) / 100
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    // Create settlement record
    const settlement = await Settlement.create({
      startDate: expenses[0].date,
      endDate: new Date(),
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      expenses: expenses.map(e => e._id),
      settlements: settlements
    });

    // Mark all expenses as settled
    await Expense.updateMany(
      { isSettled: false },
      { isSettled: true, settlementId: settlement._id }
    );

    res.json({
      message: 'Settlement completed successfully',
      settlement
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get settlement history
exports.getSettlementHistory = async (req, res) => {
  try {
    const settlements = await Settlement.find()
      .populate({
        path: 'settlements.from settlements.to',
        select: 'name color'
      })
      .sort('-createdAt');

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete settlement from history (admin only)
exports.deleteSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const settlement = await Settlement.findById(id);
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    // Delete associated expenses
    await Expense.deleteMany({ settlementId: id });
    
    // Delete settlement
    await Settlement.findByIdAndDelete(id);

    res.json({ message: 'Settlement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};