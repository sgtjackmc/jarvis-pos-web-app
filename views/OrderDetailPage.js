import { CONFIG } from '../config.js';

export async function initOrderDetailPage() {
    const orderId = new URLSearchParams(window.location.search).get('id');
    if (!orderId) {
        showError('No order ID provided');
        return;
    }

    const container = document.querySelector('.order-detail-container');
    if (!container) return;

    container.innerHTML = '<p>Loading order details...</p>';

    try {
        const order = await fetchOrderDetails(orderId);
        if (!order) {
            showError('Order not found');
            return;
        }

        renderOrderDetails(order, container);
        setupPrintButton(order);
    } catch (err) {
        console.error('Failed to load order details:', err);
        showError('Error loading order details');
    }
}

async function fetchOrderDetails(orderId) {
    const sheetId = CONFIG.sheetId;
    const apiKey = CONFIG.apiKey;
    const ordersSheet = 'Order';

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${ordersSheet}?key=${apiKey}`);
    const data = await res.json();
    const rows = data.values;

    if (!rows || rows.length <= 1) return null;

    const headers = rows[0].map(h => h.trim());
    const order = rows.slice(1).find(row => {
        const entry = {};
        headers.forEach((key, i) => {
            entry[key] = row[i] || '';
        });
        return entry.orderNumber === orderId;
    });

    if (!order) return null;

    const orderDetails = {};
    headers.forEach((key, i) => {
        orderDetails[key] = order[i] || '';
    });
    return orderDetails;
}

function renderOrderDetails(order, container) {
    const items = JSON.parse(order.orderItems || '[]');
    const timestamp = formatDate(order.timestamp);
    const total = formatMoney(order.total);
    const payment = order.paymentMethod || '-';

    container.innerHTML = `
        <div class="order-detail-header">
            <h2>Order #${order.orderNumber}</h2>
            <div class="order-meta">
                <span>Date: ${timestamp}</span>
                <span>Payment: ${payment}</span>
            </div>
        </div>
        <div class="order-items">
            <h3>Items</h3>
            <div class="items-list">
                ${items.map(item => `
                    <div class="order-item">
                        <div class="item-name">${item.name}</div>
                        <div class="item-options">${formatOptions(item.options)}</div>
                        <div class="item-price">${formatMoney(item.price)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="order-total">
            <strong>Total: ${total}</strong>
        </div>
        <div class="order-actions">
            <button class="print-receipt-btn">Print Receipt</button>
            <button class="back-btn" onclick="window.history.back()">Back to Orders</button>
        </div>
    `;
}

function setupPrintButton(order) {
    const printBtn = document.querySelector('.print-receipt-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => generateReceipt(order));
    }
}

function generateReceipt(order) {
    const items = JSON.parse(order.orderItems || '[]');
    const timestamp = formatDate(order.timestamp);
    const total = formatMoney(order.total);
    const payment = order.paymentMethod || '-';

    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
        <html>
        <head>
            <title>Receipt #${order.orderNumber}</title>
            <style>
                body { font-family: monospace; padding: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .items { margin: 20px 0; }
                .item { margin: 5px 0; }
                .total { text-align: right; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <h2>JAX Burger</h2>
                    <p>Order #${order.orderNumber}</p>
                    <p>${timestamp}</p>
                </div>
                <div class="items">
                    ${items.map(item => `
                        <div class="item">
                            <div>${item.name}</div>
                            <div>${formatOptions(item.options)}</div>
                            <div>${formatMoney(item.price)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="total">
                    <strong>Total: ${total}</strong>
                    <div>Payment: ${payment}</div>
                </div>
                <div class="footer">
                    <p>Thank you for your order!</p>
                </div>
                <div class="no-print">
                    <button onclick="window.print()">Print Receipt</button>
                </div>
            </div>
        </body>
        </html>
    `);
    receiptWindow.document.close();
}

function formatOptions(options) {
    if (!options || !options.length) return '';
    return options.map(opt => opt.name).join(', ');
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

function showError(message) {
    const container = document.querySelector('.order-detail-container');
    if (container) {
        container.innerHTML = `<p class="error">${message}</p>`;
    }
} 