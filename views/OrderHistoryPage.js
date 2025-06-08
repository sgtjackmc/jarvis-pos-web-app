// views/OrderHistoryPage.js
// All import/export statements removed. Attach global functions to window if needed.

window.initOrderHistoryPage = function() {
  const container = document.getElementById('main-content');
  if (!container) return;
  container.innerHTML = `
    <div class="order-history-page">
      <h2>Order History</h2>
      <div class="order-history-list"></div>
    </div>
    <div id="order-detail-modal-overlay" style="display:none;"></div>
  `;
  const list = container.querySelector('.order-history-list');
  list.innerHTML = '<p>Loading orders...</p>';

  window.getAllOrders(function(orders) {
    if (!orders.length) {
      list.innerHTML = '<p>No orders found.</p>';
      return;
    }
    list.innerHTML = '';
    orders.reverse().forEach(order => {
      const number = order.orderNumber || 'N/A';
      const timestamp = order.timestamp ? new Date(order.timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '';
      const total = (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const payment = order.paymentMethod || '-';
      const paid = order.paid === undefined ? (payment === 'Later' ? false : true) : order.paid;
      const items = order.items || [];
      const key = order.id || number;
      const el = document.createElement('div');
      el.className = 'order-history-card';
      el.innerHTML = `
        <div class="order-history-summary-row">
          <div class="order-history-summary-main">
            <span class="order-history-number">Order #${number}</span>
            <span class="order-history-date">${timestamp}</span>
          </div>
          <div class="order-history-summary-meta">
            <span class="order-history-total">${window.APP_SETTINGS.currencySymbol}${total.toFixed(2)}</span>
            <span class="order-history-payment-status ${paid ? 'paid' : 'not-paid'}">${paid ? 'Paid' : 'Not Paid'}</span>
            <span class="order-history-payment">${payment}</span>
            ${!paid ? `<button class="mark-paid-btn" data-key="${key}">Mark as Paid</button>` : ''}
          </div>
        </div>
        <button class="order-history-details-btn" data-key="${key}">Details</button>
      `;
      // Mark as Paid logic
      const markPaidBtn = el.querySelector('.mark-paid-btn');
      if (markPaidBtn) {
        markPaidBtn.onclick = function() {
          if (!order.id) return;
          window.updateOrder(order.id, { paid: true }).then(() => {
            markPaidBtn.remove();
            const statusSpan = el.querySelector('.order-history-payment-status');
            if (statusSpan) {
              statusSpan.textContent = 'Paid';
              statusSpan.classList.remove('not-paid');
              statusSpan.classList.add('paid');
            }
          });
        };
      }
      // Details button logic
      el.querySelector('.order-history-details-btn').onclick = function() {
        showOrderDetailModal(order);
      };
      list.appendChild(el);
    });
  });

  // Slide panel modal logic
  function showOrderDetailModal(order) {
    let overlay = document.getElementById('order-detail-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'order-detail-modal-overlay';
      document.body.appendChild(overlay);
    }
    let editMode = false;
    let editedOrder = JSON.parse(JSON.stringify(order)); // Deep copy for editing
    renderPanel();

    function renderPanel() {
      const isPaid = !!order.paid;
      overlay.innerHTML = `
        <div class="order-detail-modal-panel">
          <button class="order-detail-modal-close" title="Close">&times;</button>
          <div class="order-detail-modal-header">
            <div class="order-detail-modal-title">Order #${order.orderNumber || ''}</div>
            <div class="order-detail-modal-date">${order.timestamp ? new Date(order.timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : ''}</div>
          </div>
          <div class="order-detail-modal-section">
            <div><b>Order Type:</b> ${editMode ? renderOrderTypeSelect() : (order.orderType || '-')}</div>
            <div><b>Payment:</b> ${editMode ? renderPaymentMethodSelect() : (order.paymentMethod || '-')} (${editMode ? renderPaidToggle() : (order.paid ? 'Paid' : 'Not Paid')})</div>
            <div><b>Total:</b> ${window.APP_SETTINGS.currencySymbol}${(order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</div>
          </div>
          <div class="order-detail-modal-section">
            <div style="font-weight:600;margin-bottom:6px;">Items</div>
            ${(editedOrder.items || []).map((item, idx) => `
              <div class="order-detail-modal-item">
                <div class="order-detail-modal-item-main">
                  <span>${item.name}</span> x${editMode ? `<input type='number' min='1' value='${item.quantity || 1}' data-idx='${idx}' class='edit-qty-input' style='width:48px;margin:0 6px;' />` : (item.quantity || 1)} <span style="float:right;">${window.APP_SETTINGS.currencySymbol}${(item.price * item.quantity).toFixed(2)}</span>
                  ${editMode ? `<button class='remove-item-btn' data-idx='${idx}' title='Remove' style='margin-left:8px;color:#c00;background:none;border:none;font-size:1.1em;cursor:pointer;'>&times;</button>` : ''}
                </div>
                ${item.selectedOptions && item.selectedOptions.length > 0 ? `
                  <div class="order-detail-modal-item-options">
                    ${item.selectedOptions.map(opt => `- ${opt.group ? opt.group + ': ' : ''}${opt.name}`).join('<br>')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <div style="margin-top:18px;display:flex;gap:12px;">
            ${!isPaid && !editMode ? `<button class='edit-order-btn' style='background:var(--primary);color:#fff;padding:8px 22px;border-radius:8px;font-weight:600;border:none;'>Edit</button>` : ''}
            ${editMode
              ? `<button class='save-order-btn' style='background:var(--primary);color:#fff;padding:8px 22px;border-radius:8px;font-weight:600;border:none;'>Save</button>
                 <button class='cancel-edit-btn' style='background:#eee;color:#333;padding:8px 22px;border-radius:8px;font-weight:500;border:none;'>Cancel</button>`
              : `<button class='remove-order-btn' style='background:#c00;color:#fff;padding:8px 22px;border-radius:8px;font-weight:600;border:none;'>Remove Order</button>`}
          </div>
        </div>
      `;
      overlay.style.display = 'block';
      setTimeout(() => {
        overlay.classList.add('open');
        overlay.querySelector('.order-detail-modal-panel').classList.add('open');
      }, 10);
      // Close logic
      function closeModal() {
        overlay.classList.remove('open');
        if (overlay.querySelector('.order-detail-modal-panel')) {
          overlay.querySelector('.order-detail-modal-panel').classList.remove('open');
        }
        setTimeout(() => { overlay.style.display = 'none'; overlay.innerHTML = ''; }, 300);
      }
      overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
      overlay.querySelector('.order-detail-modal-close').onclick = closeModal;
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', escHandler);
        }
      });
      // Edit/Save/Cancel logic
      const editBtn = overlay.querySelector('.edit-order-btn');
      if (editBtn) editBtn.onclick = () => { editMode = true; renderPanel(); };
      const cancelBtn = overlay.querySelector('.cancel-edit-btn');
      if (cancelBtn) cancelBtn.onclick = () => { editMode = false; editedOrder = JSON.parse(JSON.stringify(order)); renderPanel(); };
      const saveBtn = overlay.querySelector('.save-order-btn');
      if (saveBtn) saveBtn.onclick = () => {
        // Validate and update order
        window.updateOrder(order.id, {
          orderType: editedOrder.orderType,
          paymentMethod: editedOrder.paymentMethod,
          paid: editedOrder.paid,
          items: editedOrder.items
        }).then(() => {
          Object.assign(order, editedOrder);
          editMode = false;
          renderPanel();
          if (window.initOrderHistoryPage) window.initOrderHistoryPage();
        });
      };
      // Remove Order logic
      const removeBtn = overlay.querySelector('.remove-order-btn');
      if (removeBtn) removeBtn.onclick = () => {
        // Show reason modal
        showDeleteReasonModal(order);
      };
      // Editable fields logic
      if (editMode) {
        // Order type
        const orderTypeSel = overlay.querySelector('.edit-order-type');
        if (orderTypeSel) orderTypeSel.onchange = e => { editedOrder.orderType = e.target.value; };
        // Payment method
        const paymentSel = overlay.querySelector('.edit-payment-method');
        if (paymentSel) paymentSel.onchange = e => { editedOrder.paymentMethod = e.target.value; };
        // Paid toggle
        const paidToggle = overlay.querySelector('.edit-paid-toggle');
        if (paidToggle) paidToggle.onchange = e => { editedOrder.paid = paidToggle.checked; };
        // Qty inputs
        overlay.querySelectorAll('.edit-qty-input').forEach(input => {
          input.onchange = e => {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            editedOrder.items[parseInt(input.dataset.idx)].quantity = val;
            renderPanel();
          };
        });
        // Remove item
        overlay.querySelectorAll('.remove-item-btn').forEach(btn => {
          btn.onclick = e => {
            editedOrder.items.splice(parseInt(btn.dataset.idx), 1);
            renderPanel();
          };
        });
      }
    }
    function renderOrderTypeSelect() {
      const types = ['Dine In', 'Take Away', 'Delivery'];
      return `<select class='edit-order-type'>${types.map(t => `<option value='${t}'${editedOrder.orderType === t ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
    }
    function renderPaymentMethodSelect() {
      const methods = ['Cash', 'QR', 'Later'];
      return `<select class='edit-payment-method'>${methods.map(m => `<option value='${m}'${editedOrder.paymentMethod === m ? ' selected' : ''}>${m}</option>`).join('')}</select>`;
    }
    function renderPaidToggle() {
      return `<label style='margin-left:8px;'><input type='checkbox' class='edit-paid-toggle'${editedOrder.paid ? ' checked' : ''}/> Paid</label>`;
    }
    function calcTotal(items) {
      return (items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    // --- Reason for Deletion Modal ---
    function showDeleteReasonModal(order) {
      let reasonOverlay = document.createElement('div');
      reasonOverlay.style.position = 'fixed';
      reasonOverlay.style.top = '0';
      reasonOverlay.style.left = '0';
      reasonOverlay.style.right = '0';
      reasonOverlay.style.bottom = '0';
      reasonOverlay.style.background = 'rgba(0,0,0,0.25)';
      reasonOverlay.style.zIndex = '2000';
      reasonOverlay.innerHTML = `
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:32px 28px 24px 28px;border-radius:12px;box-shadow:0 4px 32px rgba(0,0,0,0.18);min-width:320px;max-width:96vw;">
          <div style="font-size:1.18em;font-weight:600;margin-bottom:12px;">Reason for Deletion</div>
          <textarea id="delete-reason-input" rows="3" style="width:100%;font-size:1.08em;padding:8px 6px;border-radius:6px;border:1px solid #ccc;resize:vertical;"></textarea>
          <div style="margin-top:18px;display:flex;gap:12px;justify-content:flex-end;">
            <button id="cancel-delete-btn" style="background:#eee;color:#333;padding:8px 22px;border-radius:8px;font-weight:500;border:none;">Cancel</button>
            <button id="confirm-delete-btn" style="background:#c00;color:#fff;padding:8px 22px;border-radius:8px;font-weight:600;border:none;">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(reasonOverlay);
      document.getElementById('cancel-delete-btn').onclick = () => reasonOverlay.remove();
      document.getElementById('confirm-delete-btn').onclick = () => {
        const reason = document.getElementById('delete-reason-input').value.trim();
        if (!reason) {
          document.getElementById('delete-reason-input').style.borderColor = '#c00';
          document.getElementById('delete-reason-input').focus();
          return;
        }
        // Log deletion
        window.db.ref('deletedOrdersLog').push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          deletedAt: new Date().toISOString(),
          deletedBy: window.currentUser || 'Unknown',
          reason: reason,
          orderSnapshot: order
        }).then(() => {
          // Delete order
          window.db.ref('orders/' + order.id).remove().then(() => {
            reasonOverlay.remove();
            overlay.classList.remove('open');
            if (overlay.querySelector('.order-detail-modal-panel')) {
              overlay.querySelector('.order-detail-modal-panel').classList.remove('open');
            }
            setTimeout(() => { overlay.style.display = 'none'; overlay.innerHTML = ''; }, 300);
            if (window.initOrderHistoryPage) window.initOrderHistoryPage();
          });
        });
      };
    }
  }
};

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