// API endpoints
const API_BASE = '';

// Format currency
function formatCurrency(value) {
  if (!value) return '$0';
  return '$' + parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format address (truncate)
function formatAddress(address) {
  if (!address) return '-';
  return address.substring(0, 8) + '...' + address.substring(address.length - 4);
}

// Load stats
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const stats = await response.json();
    
    document.getElementById('totalTrades').textContent = stats.totalTrades || 0;
    document.getElementById('uniqueTraders').textContent = stats.uniqueTraders || 0;
    document.getElementById('totalVolume').textContent = formatCurrency(stats.totalVolume);
    document.getElementById('avgSize').textContent = formatCurrency(stats.avgSize);
    document.getElementById('newAccountTrades').textContent = stats.newAccountTrades || 0;
    document.getElementById('maxSize').textContent = formatCurrency(stats.maxSize);
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Load trades
async function loadTrades() {
  try {
    const response = await fetch(`${API_BASE}/api/trades?limit=50`);
    const trades = await response.json();
    
    const tbody = document.querySelector('#tradesTable tbody');
    
    if (trades.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No large trades recorded yet.</p>
            <p>The monitor is running and will capture trades >$25k.</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = trades.map(trade => `
      <tr>
        <td>${formatDate(trade.timestamp)}</td>
        <td>${trade.marketQuestion?.substring(0, 40) || 'Unknown'}...${trade.marketQuestion?.length > 40 ? '...' : ''}</td>
        <td>${trade.outcome || '-'}</td>
        <td class="size">${formatCurrency(trade.size)}</td>
        <td>${trade.price ? (trade.price * 100).toFixed(1) + '%' : '-'}</td>
        <td class="trader-address">${formatAddress(trade.traderAddress)}</td>
        <td>${trade.isNewAccount ? '<span class="new-badge">NEW</span>' : ''}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load trades:', err);
  }
}

// Load traders
async function loadTraders() {
  try {
    const response = await fetch(`${API_BASE}/api/traders`);
    const traders = await response.json();
    
    const tbody = document.querySelector('#tradersTable tbody');
    
    if (traders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <i class="fas fa-users"></i>
            <p>No trader data available yet.</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = traders.map(trader => `
      <tr>
        <td class="trader-address">${formatAddress(trader.traderAddress)}</td>
        <td>${trader.tradeCount}</td>
        <td class="size">${formatCurrency(trader.totalVolume)}</td>
        <td>${formatCurrency(trader.avgSize)}</td>
        <td>${formatCurrency(trader.maxSize)}</td>
        <td>${formatDate(trader.firstTrade)}</td>
        <td>${formatDate(trader.lastTrade)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load traders:', err);
  }
}

// Load alerts
async function loadAlerts() {
  try {
    const response = await fetch(`${API_BASE}/api/alerts`);
    const alerts = await response.json();
    
    const container = document.getElementById('alertsList');
    
    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bell-slash"></i>
          <p>No alerts yet.</p>
          <p>Alerts appear when large trades from new accounts are detected.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = alerts.map(alert => {
      const alertClass = alert.type === 'NEW_ACCOUNT_LARGE_TRADE' ? 'new-account' : 'large-trade';
      return `
        <div class="alert-item ${alertClass}">
          <div class="alert-header">
            <span class="alert-type">${alert.type.replace(/_/g, ' ')}</span>
            <span class="alert-time">${formatDate(alert.createdAt)}</span>
          </div>
          <div class="alert-message">${alert.message}</div>
          <div class="alert-details">
            <span><i class="fas fa-chart-line"></i> ${formatCurrency(alert.size)}</span>
            <span><i class="fas fa-wallet"></i> ${formatAddress(alert.traderAddress)}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load alerts:', err);
  }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active from all
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active to clicked
    btn.classList.add('active');
    const tabId = btn.dataset.tab + '-tab';
    document.getElementById(tabId).classList.add('active');
    
    // Load data for tab
    if (btn.dataset.tab === 'trades') loadTrades();
    if (btn.dataset.tab === 'traders') loadTraders();
    if (btn.dataset.tab === 'alerts') loadAlerts();
  });
});

// Initial load
loadStats();
loadTrades();

// Refresh every 30 seconds
setInterval(() => {
  loadStats();
  if (document.querySelector('#trades-tab.active')) loadTrades();
  if (document.querySelector('#traders-tab.active')) loadTraders();
  if (document.querySelector('#alerts-tab.active')) loadAlerts();
}, 30000);
