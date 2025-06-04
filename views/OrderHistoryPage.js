
import { CONFIG } from '../config.js';

export async function initOrderHistoryPage() {
  const sheetId = CONFIG.sheetId;
  const apiKey = CONFIG.apiKey;
  const ordersSheet = 'Order';

  const container = document.querySelector('.order-history-list');
  if (!container) return;

  container.innerHTML = '<p>Loading orders...</p>';

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${ordersSheet}?key=${apiKey}`);
    const data = await res.json();
    const rows = data.values;

    if (!rows || rows.length <= 1) {
      container.innerHTML = '<p>No orders found.</p>';
      return;
    }

    const headers = rows[0].map(h => h.trim());
    const entries = rows.slice(1).reverse(); // เรียงจากใหม่สุด

    const orders = entries.map(row => {
      const entry = {};
      headers.forEach((key, i) => {
        entry[key] = row[i] || '';
      });
      return entry;
    });

    container.innerHTML = '';
    orders.forEach(order => {
      const number = order['orderNumber'] || 'N/A';
      const timestamp = formatDate(order['timestamp']);
      const summary = order['orderItems'] || '(no summary)';
      const total = formatMoney(order['total']);
      const payment = order['paymentMethod'] || '-';

      const el = document.createElement('div');
      el.className = 'order-history-card';
      el.innerHTML = `
        <div class="order-header">
          <strong>#${number}</strong> | ${timestamp}
        </div>
        <div class="order-summary">${summary}</div>
        <div class="order-meta">
          <span>Total: ${total}</span>
          <span>${payment}</span>
        </div>
      `;
      container.appendChild(el);
    });

  } catch (err) {
    console.error('❌ Failed to load orders:', err);
    container.innerHTML = '<p>Error loading orders.</p>';
  }
}

function formatDate(raw) {
  if (!raw) return 'Invalid Date';
  const date = new Date(raw);
  if (isNaN(date)) return 'Invalid Date';
  return date.toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function formatMoney(value) {
  const num = parseFloat(value);
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
}