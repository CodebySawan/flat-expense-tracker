const Expense = require('../models/Expense');
const Flatmate = require('../models/Flatmate');

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const { type, description, amount, paidBy, sharedBy } = req.body;

    const expense = await Expense.create({
      type,
      description,
      amount,
      paidBy,
      sharedBy,
      isSettled: false
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name')
      .populate('sharedBy', 'name');

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current unsettled expenses
exports.getWeeklyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ isSettled: false })
      .populate('paidBy', 'name color')
      .populate('sharedBy', 'name')
      .sort('-date');

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate balances
exports.calculateBalances = async (req, res) => {
  try {
    const expenses = await Expense.find({ isSettled: false })
      .populate('paidBy')
      .populate('sharedBy');

    const flatmates = await Flatmate.find().sort('order');
    
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
        color: person.color,
        paid: Math.round(paid * 100) / 100,
        shouldPay: Math.round(shouldPay * 100) / 100,
        balance: Math.round((paid - shouldPay) * 100) / 100
      };
    });

    const settlements = [];
    const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0.01) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount * 100) / 100
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    res.json({ balances, settlements });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get person diary
exports.getPersonDiary = async (req, res) => {
  try {
    const { personId } = req.params;
    
    const expenses = await Expense.find({ isSettled: false })
      .populate('paidBy', 'name color')
      .populate('sharedBy', 'name')
      .sort('date');

    const person = await Flatmate.findById(personId);
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    const denaHai = [];
    expenses.forEach(exp => {
      const isSharing = exp.sharedBy.some(s => s._id.toString() === personId);
      const isPayer = exp.paidBy._id.toString() === personId;
      
      if (isSharing && !isPayer) {
        const shareAmount = exp.amount / exp.sharedBy.length;
        denaHai.push({
          date: exp.date,
          description: exp.description,
          amount: Math.round(shareAmount * 100) / 100,
          to: exp.paidBy.name,
          toColor: exp.paidBy.color,
          expenseId: exp._id
        });
      }
    });

    const lenaHai = [];
    expenses.forEach(exp => {
      const isPayer = exp.paidBy._id.toString() === personId;
      
      if (isPayer) {
        exp.sharedBy.forEach(sharer => {
          if (sharer._id.toString() !== personId) {
            const shareAmount = exp.amount / exp.sharedBy.length;
            lenaHai.push({
              date: exp.date,
              description: exp.description,
              amount: Math.round(shareAmount * 100) / 100,
              from: sharer.name,
              expenseId: exp._id
            });
          }
        });
      }
    });

    const totalDena = denaHai.reduce((sum, item) => sum + item.amount, 0);
    const totalLena = lenaHai.reduce((sum, item) => sum + item.amount, 0);
    const netBalance = totalLena - totalDena;

    res.json({
      person: person.name,
      denaHai: denaHai.sort((a, b) => new Date(b.date) - new Date(a.date)),
      lenaHai: lenaHai.sort((a, b) => new Date(b.date) - new Date(a.date)),
      totalDena: Math.round(totalDena * 100) / 100,
      totalLena: Math.round(totalLena * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete expense (admin only) - SIMPLE VERSION
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting expense:', id);
    
    await Expense.findByIdAndDelete(id);
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: error.message });
  }
};