// API Base URL
// Automatically use local or production backend
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'  // Local development
  : 'https://flat-expense-tracker-red.vercel.app/api';  // Production

// Global variables
let flatmates = [];
let currentVegTurn = null;
let currentWaterTurn = null;
let isAdmin = false;
let adminPassword = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
});

// Initialize app - load all data
async function initializeApp() {
  await loadFlatmates();
  await loadTurns();
  await loadCurrentExpenses();
  await loadDiaryOptions();
  await loadSettlementHistory();
}

// Setup all event listeners
function setupEventListeners() {
  // Admin button
  document.getElementById('adminBtn').addEventListener('click', openAdminLogin);
  document.getElementById('closeAdminModal').addEventListener('click', closeAdminLogin);
  document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);

  // Turn buttons
  document.getElementById('addVegExpenseBtn').addEventListener('click', openVegExpenseModal);
  document.getElementById('fillWaterBtn').addEventListener('click', fillWaterCan);
  document.getElementById('addCustomExpenseBtn').addEventListener('click', openCustomExpenseModal);

  // Modal close buttons
  document.getElementById('closeVegModal').addEventListener('click', closeVegExpenseModal);
  document.getElementById('closeCustomModal').addEventListener('click', closeCustomExpenseModal);
  document.getElementById('closeSettlementModal').addEventListener('click', closeSettlementModal);

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    const adminModal = document.getElementById('adminLoginModal');
    const vegModal = document.getElementById('vegExpenseModal');
    const customModal = document.getElementById('customExpenseModal');
    const settlementModal = document.getElementById('settlementModal');
    
    if (e.target === adminModal) closeAdminLogin();
    if (e.target === vegModal) closeVegExpenseModal();
    if (e.target === customModal) closeCustomExpenseModal();
    if (e.target === settlementModal) closeSettlementModal();
  });

  // Form submissions
  document.getElementById('vegExpenseForm').addEventListener('submit', handleVegExpenseSubmit);
  document.getElementById('customExpenseForm').addEventListener('submit', handleCustomExpenseSubmit);

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    initializeApp();
    alert('✅ Data refreshed!');
  });

  // Diary person selector
  document.getElementById('diaryPersonSelect').addEventListener('change', (e) => {
    if (e.target.value) {
      loadPersonDiary(e.target.value);
    } else {
      document.getElementById('diaryContent').innerHTML = '<div class="empty-state">Select a person to view their diary</div>';
    }
  });

  // Settlement buttons
  document.getElementById('settleUpBtn')?.addEventListener('click', showSettlementSummary);
  document.getElementById('markSettledBtn')?.addEventListener('click', markAsSettled);
  document.getElementById('cancelSettlementBtn')?.addEventListener('click', closeSettlementModal);
}

// ============ ADMIN SYSTEM ============

function openAdminLogin() {
  if (isAdmin) {
    // Logout
    isAdmin = false;
    adminPassword = '';
    document.getElementById('adminIndicator').style.display = 'none';
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('adminBtn').textContent = '🔐 Admin';
    loadCurrentExpenses(); // Reload to hide delete buttons
    alert('Logged out from admin mode');
  } else {
    // Show login modal
    document.getElementById('adminLoginModal').classList.add('show');
  }
}

function closeAdminLogin() {
  document.getElementById('adminLoginModal').classList.remove('show');
  document.getElementById('adminLoginForm').reset();
}

function handleAdminLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value;
  
  if (password === 'sawan@flat') {
    isAdmin = true;
    adminPassword = password;
    document.getElementById('adminIndicator').style.display = 'block';
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('adminBtn').textContent = '🔓 Logout';
    closeAdminLogin();
    loadCurrentExpenses(); // Reload to show delete buttons
    alert('✅ Admin login successful!');
  } else {
    alert('❌ Incorrect password');
  }
}

// ============ FLATMATES ============

async function loadFlatmates() {
  try {
    const response = await fetch(`${API_URL}/flatmates`);
    flatmates = await response.json();
    console.log('Flatmates loaded:', flatmates);
  } catch (error) {
    console.error('Error loading flatmates:', error);
    alert('Failed to load flatmates');
  }
}

// ============ TURNS ============

async function loadTurns() {
  try {
    const response = await fetch(`${API_URL}/turns`);
    const data = await response.json();
    
    currentVegTurn = data.vegetable;
    currentWaterTurn = data.water;

    updateTurnDisplay();
  } catch (error) {
    console.error('Error loading turns:', error);
    alert('Failed to load turns');
  }
}

function updateTurnDisplay() {
  // Vegetable turn
  document.getElementById('vegCurrentPerson').innerHTML = `
    <span class="person-name">${currentVegTurn.currentPerson.name}</span>
  `;

  // Water turn
  document.getElementById('waterCurrentPerson').innerHTML = `
    <span class="person-name">${currentWaterTurn.currentPerson.name}</span>
  `;

  // Water cans
  const can1 = document.getElementById('can1');
  const can2 = document.getElementById('can2');
  
  can1.classList.toggle('filled', currentWaterTurn.cansCount >= 1);
  can2.classList.toggle('filled', currentWaterTurn.cansCount >= 2);
}

async function fillWaterCan() {
  try {
    const response = await fetch(`${API_URL}/turns/water/fill`, {
      method: 'POST'
    });
    const data = await response.json();
    
    console.log('Water can filled:', data);
    
    currentWaterTurn = {
      currentPerson: data.currentPerson,
      turnOrder: data.turnOrder,
      cansCount: data.cansCount
    };
    
    updateTurnDisplay();
    
    if (data.cansCount === 0) {
      alert(`✅ Both cans filled! Turn moved to ${data.currentPerson.name}`);
    } else {
      alert(`✅ Can ${data.cansCount} filled!`);
    }
  } catch (error) {
    console.error('Error filling water can:', error);
    alert('Failed to fill water can');
  }
}

// ============ VEGETABLE EXPENSE ============

function openVegExpenseModal() {
  const modal = document.getElementById('vegExpenseModal');
  document.getElementById('vegPersonName').value = currentVegTurn.currentPerson.name;
  
  // Populate shared by checkboxes
  const checkboxContainer = document.getElementById('vegSharedByCheckboxes');
  checkboxContainer.innerHTML = flatmates.map(f => `
    <div class="checkbox-item">
      <input type="checkbox" id="veg_shared_${f._id}" value="${f._id}" checked>
      <label for="veg_shared_${f._id}">${f.name}</label>
    </div>
  `).join('');
  
  modal.classList.add('show');
}

function closeVegExpenseModal() {
  const modal = document.getElementById('vegExpenseModal');
  modal.classList.remove('show');
  document.getElementById('vegExpenseForm').reset();
}

async function handleVegExpenseSubmit(e) {
  e.preventDefault();
  
  const amount = document.getElementById('vegAmount').value;
  const description = document.getElementById('vegDescription').value;
  
  // Get selected shared by
  const sharedBy = [];
  flatmates.forEach(f => {
    const checkbox = document.getElementById(`veg_shared_${f._id}`);
    if (checkbox && checkbox.checked) {
      sharedBy.push(f._id);
    }
  });
  
  if (sharedBy.length === 0) {
    alert('Please select at least one person who shared this expense');
    return;
  }
  
  const expenseData = {
    type: 'vegetable',
    description: description,
    amount: parseFloat(amount),
    paidBy: currentVegTurn.currentPerson._id,
    sharedBy: sharedBy
  };
  
  try {
    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expenseData)
    });
    
    const data = await response.json();
    console.log('Expense added:', data);
    
    // Move to next turn
    await nextVegetableTurn();
    
    closeVegExpenseModal();
    alert('✅ Expense added and turn moved!');
    
    // Reload data
    await loadCurrentExpenses();
    
    // Reload diary if one is selected
    const selectedPerson = document.getElementById('diaryPersonSelect').value;
    if (selectedPerson) {
      await loadPersonDiary(selectedPerson);
    }
  } catch (error) {
    console.error('Error adding expense:', error);
    alert('Failed to add expense');
  }
}

async function nextVegetableTurn() {
  try {
    const response = await fetch(`${API_URL}/turns/vegetable/next`, {
      method: 'POST'
    });
    const data = await response.json();
    
    currentVegTurn = {
      currentPerson: data.nextPerson,
      turnOrder: data.turnOrder
    };
    
    updateTurnDisplay();
  } catch (error) {
    console.error('Error moving turn:', error);
  }
}

// ============ CUSTOM EXPENSE ============

function openCustomExpenseModal() {
  const modal = document.getElementById('customExpenseModal');
  
  // Populate paid by dropdown
  const paidBySelect = document.getElementById('customPaidBy');
  paidBySelect.innerHTML = flatmates.map(f => 
    `<option value="${f._id}">${f.name}</option>`
  ).join('');
  
  // Populate shared by checkboxes
  const checkboxContainer = document.getElementById('sharedByCheckboxes');
  checkboxContainer.innerHTML = flatmates.map(f => `
    <div class="checkbox-item">
      <input type="checkbox" id="shared_${f._id}" value="${f._id}" checked>
      <label for="shared_${f._id}">${f.name}</label>
    </div>
  `).join('');
  
  modal.classList.add('show');
}

function closeCustomExpenseModal() {
  const modal = document.getElementById('customExpenseModal');
  modal.classList.remove('show');
  document.getElementById('customExpenseForm').reset();
}

async function handleCustomExpenseSubmit(e) {
  e.preventDefault();
  
  const paidBy = document.getElementById('customPaidBy').value;
  const amount = document.getElementById('customAmount').value;
  const description = document.getElementById('customDescription').value;
  
  // Get selected shared by
  const sharedBy = [];
  flatmates.forEach(f => {
    const checkbox = document.getElementById(`shared_${f._id}`);
    if (checkbox && checkbox.checked) {
      sharedBy.push(f._id);
    }
  });
  
  if (sharedBy.length === 0) {
    alert('Please select at least one person who shared this expense');
    return;
  }
  
  const expenseData = {
    type: 'custom',
    description: description,
    amount: parseFloat(amount),
    paidBy: paidBy,
    sharedBy: sharedBy
  };
  
  try {
    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expenseData)
    });
    
    const data = await response.json();
    console.log('Custom expense added:', data);
    
    closeCustomExpenseModal();
    alert('✅ Custom expense added!');
    
    // Reload data
    await loadCurrentExpenses();
    
    // Reload diary if one is selected
    const selectedPerson = document.getElementById('diaryPersonSelect').value;
    if (selectedPerson) {
      await loadPersonDiary(selectedPerson);
    }
  } catch (error) {
    console.error('Error adding custom expense:', error);
    alert('Failed to add custom expense');
  }
}

// ============ CURRENT EXPENSES ============

async function loadCurrentExpenses() {
  const container = document.getElementById('currentExpensesList');
  container.innerHTML = '<div class="loading">Loading expenses...</div>';
  
  try {
    const response = await fetch(`${API_URL}/expenses/weekly`);
    const expenses = await response.json();
    
    if (expenses.length === 0) {
      container.innerHTML = '<div class="empty-state">No current expenses</div>';
      return;
    }
    
    container.innerHTML = expenses.map(exp => {
      const date = new Date(exp.date).toLocaleDateString('en-IN');
      return `
        <div class="expense-item">
          <div class="expense-info">
            <h4>${exp.description}</h4>
            <p>${exp.paidBy.name} paid • ${date} • Shared by ${exp.sharedBy.length} people</p>
          </div>
          <div class="expense-actions">
            <div class="expense-amount">₹${exp.amount}</div>
            ${isAdmin ? `<button class="btn-danger" onclick="deleteExpense('${exp._id}')">Delete</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading expenses:', error);
    container.innerHTML = '<div class="empty-state">Failed to load expenses</div>';
  }
}

async function deleteExpense(expenseId) {
  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }
  
  console.log('Attempting to delete expense:', expenseId);
  console.log('Admin password:', adminPassword);
  
  try {
    const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: {
        'admin-password': adminPassword,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      alert('✅ Expense deleted successfully!');
      await loadCurrentExpenses();
      
      // Reload diary if one is selected
      const selectedPerson = document.getElementById('diaryPersonSelect').value;
      if (selectedPerson) {
        await loadPersonDiary(selectedPerson);
      }
    } else {
      alert('❌ Failed to delete: ' + data.message);
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('Failed to delete expense: ' + error.message);
  }
}

// ============ DIARY SYSTEM ============

async function loadDiaryOptions() {
  const select = document.getElementById('diaryPersonSelect');
  select.innerHTML = '<option value="">-- Select --</option>' + 
    flatmates.map(f => `<option value="${f._id}">${f.name}</option>`).join('');
}

async function loadPersonDiary(personId) {
  const container = document.getElementById('diaryContent');
  container.innerHTML = '<div class="loading">Loading diary...</div>';
  
  try {
    const response = await fetch(`${API_URL}/expenses/diary/${personId}`);
    const data = await response.json();
    
    let html = `<h3 style="color: #333; margin-bottom: 20px;">${data.person}'s Diary</h3>`;
    
    // Dena Hai section
    html += `
      <div class="diary-section-block">
        <h3>🔴 Dena Hai (You Owe)</h3>
    `;
    
    if (data.denaHai.length === 0) {
      html += '<div class="empty-state">No pending payments</div>';
    } else {
      data.denaHai.forEach(item => {
        const date = new Date(item.date).toLocaleDateString('en-IN');
        html += `
          <div class="diary-item dena">
            <div class="diary-item-header">
              <div class="diary-item-amount dena">₹${item.amount} to ${item.to}</div>
            </div>
            <div class="diary-item-details">${date} • ${item.description}</div>
          </div>
        `;
      });
    }
    
    html += '</div>';
    
    // Lena Hai section
    html += `
      <div class="diary-section-block">
        <h3>🟢 Lena Hai (Others Owe You)</h3>
    `;
    
    if (data.lenaHai.length === 0) {
      html += '<div class="empty-state">No one owes you</div>';
    } else {
      data.lenaHai.forEach(item => {
        const date = new Date(item.date).toLocaleDateString('en-IN');
        html += `
          <div class="diary-item lena">
            <div class="diary-item-header">
              <div class="diary-item-amount lena">₹${item.amount} from ${item.from}</div>
            </div>
            <div class="diary-item-details">${date} • ${item.description}</div>
          </div>
        `;
      });
    }
    
    html += '</div>';
    
    // Summary
    html += `
      <div class="diary-summary">
        <div class="diary-summary-row">
          <span>Total Dena Hai:</span>
          <span style="color: #ef4444; font-weight: bold;">₹${data.totalDena}</span>
        </div>
        <div class="diary-summary-row">
          <span>Total Lena Hai:</span>
          <span style="color: #10b981; font-weight: bold;">₹${data.totalLena}</span>
        </div>
        <div class="diary-summary-row net">
          <span>Net Balance:</span>
          <span style="color: ${data.netBalance >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">
            ${data.netBalance >= 0 ? '+' : ''}₹${data.netBalance}
          </span>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading diary:', error);
    container.innerHTML = '<div class="empty-state">Failed to load diary</div>';
  }
}

// ============ SETTLEMENT SYSTEM ============

async function showSettlementSummary() {
  try {
    const response = await fetch(`${API_URL}/settlements/current`);
    const data = await response.json();
    
    if (data.expenses.length === 0) {
      alert('No expenses to settle!');
      return;
    }
    
    const modal = document.getElementById('settlementModal');
    const container = document.getElementById('settlementSummary');
    
    const startDate = new Date(data.startDate).toLocaleDateString('en-IN');
    const endDate = new Date(data.endDate).toLocaleDateString('en-IN');
    
    let html = `
      <div class="settlement-info">
        <div class="settlement-info-row">
          <strong>Period:</strong>
          <span>${startDate} to ${endDate}</span>
        </div>
        <div class="settlement-info-row">
          <strong>Total Expenses:</strong>
          <span>₹${data.totalAmount}</span>
        </div>
        <div class="settlement-info-row">
          <strong>Number of Expenses:</strong>
          <span>${data.expenseCount}</span>
        </div>
      </div>
      
      <div class="settlement-list">
        <h3>Final Settlements:</h3>
    `;
    
    if (data.settlements.length === 0) {
      html += '<div class="empty-state">All balanced! No settlements needed.</div>';
    } else {
      data.settlements.forEach(s => {
        html += `
          <div class="settlement-item">
            <div class="settlement-text">
              <strong>${s.from}</strong> pays <strong>${s.to}</strong>
            </div>
            <div class="settlement-amount">₹${s.amount}</div>
          </div>
        `;
      });
    }
    
    html += '</div>';
    
    container.innerHTML = html;
    modal.classList.add('show');
  } catch (error) {
    console.error('Error loading settlement summary:', error);
    alert('Failed to load settlement summary');
  }
}

function closeSettlementModal() {
  document.getElementById('settlementModal').classList.remove('show');
}

async function markAsSettled() {
  if (!confirm('Are you sure you want to mark all expenses as settled? This will move them to history.')) {
    return;
  }
  
  console.log('Marking as settled with admin password:', adminPassword);
  
  try {
    const response = await fetch(`${API_URL}/settlements/settle`, {
      method: 'POST',
      headers: {
        'admin-password': adminPassword,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Settlement response status:', response.status);
    const data = await response.json();
    console.log('Settlement response data:', data);
    
    if (response.ok) {
      alert('✅ Settlement completed! All expenses moved to history.');
      closeSettlementModal();
      await loadCurrentExpenses();
      await loadSettlementHistory();
      
      // Clear diary
      document.getElementById('diaryPersonSelect').value = '';
      document.getElementById('diaryContent').innerHTML = '<div class="empty-state">Select a person to view their diary</div>';
    } else {
      alert('❌ Settlement failed: ' + data.message);
    }
  } catch (error) {
    console.error('Error marking as settled:', error);
    alert('Failed to mark as settled: ' + error.message);
  }
}

// ============ SETTLEMENT HISTORY ============

async function loadSettlementHistory() {
  const container = document.getElementById('settlementHistoryList');
  container.innerHTML = '<div class="loading">Loading history...</div>';
  
  try {
    const response = await fetch(`${API_URL}/settlements/history`);
    const settlements = await response.json();
    
    if (settlements.length === 0) {
      container.innerHTML = '<div class="empty-state">No settlement history yet</div>';
      return;
    }
    
    container.innerHTML = settlements.map(settlement => {
      const startDate = new Date(settlement.startDate).toLocaleDateString('en-IN');
      const endDate = new Date(settlement.endDate).toLocaleDateString('en-IN');
      const settledDate = new Date(settlement.createdAt).toLocaleDateString('en-IN');
      
      let html = `
        <div class="history-item">
          <div class="history-header">
            <div>
              <div class="history-title">Settlement - ${settledDate}</div>
              <div class="history-date">${startDate} to ${endDate}</div>
            </div>
            ${isAdmin ? `<button class="btn-danger" onclick="deleteSettlement('${settlement._id}')">Delete</button>` : ''}
          </div>
          
          <div class="history-info">
            <div class="history-info-item">
              <span class="history-info-label">Total Amount</span>
              <span class="history-info-value">₹${settlement.totalAmount}</span>
            </div>
            <div class="history-info-item">
              <span class="history-info-label">Expenses</span>
              <span class="history-info-value">${settlement.expenses.length}</span>
            </div>
          </div>
          
          <div class="history-settlements">
            <strong>Settlements:</strong>
      `;
      
      settlement.settlements.forEach(s => {
        const fromName = flatmates.find(f => f._id === s.from)?.name || 'Unknown';
        const toName = flatmates.find(f => f._id === s.to)?.name || 'Unknown';
        
        html += `
          <div class="history-settlement-item">
            <span>${fromName} → ${toName}</span>
            <span style="font-weight: bold; color: #10b981;">₹${s.amount}</span>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
      
      return html;
    }).join('');
  } catch (error) {
    console.error('Error loading settlement history:', error);
    container.innerHTML = '<div class="empty-state">Failed to load history</div>';
  }
}

async function deleteSettlement(settlementId) {
  if (!confirm('Are you sure you want to delete this settlement from history? This will also delete all associated expenses permanently.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/settlements/${settlementId}`, {
      method: 'DELETE',
      headers: {
        'admin-password': adminPassword
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Settlement deleted from history!');
      await loadSettlementHistory();
    } else {
      alert('❌ ' + data.message);
    }
  } catch (error) {
    console.error('Error deleting settlement:', error);
    alert('Failed to delete settlement');
  }
}