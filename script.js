// script.js
// All import/export statements removed. Use window.firebaseConfig and global functions as needed.

window.addEventListener('DOMContentLoaded', () => {
  window.loadAppSettings(function(settings) {
    // Now settings are loaded, render UI
    // Example: update tax toggle
    const taxSwitch = document.getElementById('tax-toggle-switch');
    if (taxSwitch) {
      taxSwitch.checked = !!window.APP_SETTINGS.taxEnabled;
      taxSwitch.onchange = function() {
        window.saveAppSettings({ taxEnabled: this.checked });
      };
    }
    // Render main UI (menu, order, etc.)
    updateOrderHeader();
    if (window.currentOrder) window.updateOrderDisplay(window.currentOrder);
  });

  // Default view: show menu
  if (typeof window.initMenuPage === 'function') window.initMenuPage();

  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const text = item.textContent.trim();
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      // Show settings panel in main content only for Settings
      const settingsPanel = document.getElementById('settings-panel');
      const ordersSection = document.getElementById('orders-section');
      if (settingsPanel && ordersSection) {
        if (text === 'Settings') {
          settingsPanel.style.display = 'block';
          ordersSection.style.display = 'none';
        } else {
          settingsPanel.style.display = 'none';
          ordersSection.style.display = '';
        }
      }
      if (text === 'Order History') {
        if (typeof window.initOrderHistoryPage === 'function') window.initOrderHistoryPage();
      } else if (text === 'Menu') {
        if (typeof window.initMenuManagementPage === 'function') window.initMenuManagementPage();
      } else if (text === 'Orders') {
        if (typeof window.initMenuPage === 'function') window.initMenuPage();
      } else if (text === 'Settings') {
        if (typeof window.initSettingsPage === 'function') window.initSettingsPage();
      }
    });
  });

  // Example: Place Order Button Handler
  document.querySelector('.place-order-btn').onclick = function() {
    if (!window.currentOrder || window.currentOrder.length === 0) {
      alert('Please add items to your order.');
      return;
    }
    const orderNumber = window.currentOrderNumber;
    const paymentMethod = document.querySelector('.payment-method.active')?.textContent?.trim() || 'Cash';
    const orderType = window.currentOrderType;
    const orderData = {
      orderNumber: orderNumber,
      items: window.currentOrder,
      paymentMethod: paymentMethod,
      orderType: orderType,
      timestamp: new Date().toISOString(),
      paid: paymentMethod === 'Later' ? false : true
    };
    // Save to Firebase
    window.addOrder(orderData).then(() => {
      alert('Order placed!');
      window.currentOrder = [];
      window.currentOrderNumber = window.generateOrderNumber();
      window.currentOrderType = 'Dine In';
      updateOrderHeader();
      window.updateOrderDisplay([]);
      // Optionally reload order history or reset UI
    }).catch(err => {
      alert('Failed to place order: ' + err.message);
    });
  };

  // Make payment method buttons clickable/selectable
  document.querySelectorAll('.payment-method').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Order type selector logic
  document.querySelectorAll('.order-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      window.currentOrderType = this.getAttribute('data-type');
      updateOrderHeader();
    });
  });

  updateOrderHeader();

  // Auth logic
  const mainContent = document.getElementById('main-content');
  const authPanel = document.getElementById('auth-panel');
  function showAuthPanel() {
    if (authPanel) authPanel.style.display = 'flex';
    if (mainContent) mainContent.style.opacity = '0.2';
    // Hide all app content except auth panel
    document.querySelectorAll('.sidebar, .header, .order-panel').forEach(el => el.style.display = 'none');
  }
  function hideAuthPanel() {
    if (authPanel) authPanel.style.display = 'none';
    if (mainContent) mainContent.style.opacity = '';
    document.querySelectorAll('.sidebar, .header, .order-panel').forEach(el => el.style.display = '');
  }
  window.onAuthStateChanged(function(user) {
    if (!user) {
      showAuthPanel();
    } else {
      hideAuthPanel();
      // Optionally show user info in UI
    }
  });
  document.getElementById('google-signin-btn')?.addEventListener('click', function() {
    window.signInWithGoogle().catch(err => alert('Sign in failed: ' + err.message));
  });
  // Optionally add sign out to profile menu
  // ... rest of your app logic ...
});

window.initMenuPage = function() {
  const container = document.getElementById('main-content');
  if (container) {
    container.innerHTML = `
      <div id="orders-section">
        <div id="category-tabs"></div>
        <div class="menu-grid"></div>
      </div>
    `;
  }
  window.getAllMenuItems(function(menuItems) {
    window.DEBUG = { menuItems };
    renderCategoryTabs(menuItems);
    renderMenuItems(menuItems, 'All');
    setupCategoryTabListeners(menuItems);
    setupMenuItemCardListeners(menuItems);
    if (!window.currentOrder) window.currentOrder = [];
    window.updateOrderDisplay(window.currentOrder);
  });
};

window.generateOrderNumber = function() {
  // Simple order number generator: use timestamp or increment logic as needed
  return Math.floor(Date.now() / 1000).toString().slice(-6);
};

window.currentOrderNumber = window.generateOrderNumber();
window.currentOrderType = 'Dine In';
window.ACCOUNTING_TAX_ENABLED = true;

function updateOrderHeader() {
  document.getElementById('order-number').textContent = 'Order #' + window.currentOrderNumber;
  document.getElementById('order-type-label').textContent = window.currentOrderType;
}

window.initSettingsPage = function() {
  const container = document.getElementById('main-content');
  if (!container) return;
  container.innerHTML = `
    <div class="settings-cards">
      <div class="settings-card">
        <div class="settings-section-title">Accounting Settings</div>
        <div class="form-group" style="margin-bottom:18px;">
          <label for="tax-toggle-switch" style="font-size:15px;cursor:pointer;">Enable Tax (7%)</label>
          <input type="checkbox" id="tax-toggle-switch" style="width:22px;height:22px;cursor:pointer;margin-left:12px;">
        </div>
        <div class="form-group">
          <label for="currency-select" style="font-size:15px;cursor:pointer;">Currency</label>
          <select id="currency-select" class="settings-select">
            <option value="THB">THB (฿)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>
      <div class="settings-card">
        <div class="settings-section-title">Menu Item Category Management</div>
        <div id="category-management-container"></div>
      </div>
      <div class="settings-card" id="option-groups-settings-section">
        <div class="settings-section-title">Option Groups Management</div>
        <div id="option-groups-management-container"></div>
      </div>
    </div>
  `;
  // Tax toggle logic
  const taxSwitch = document.getElementById('tax-toggle-switch');
  if (taxSwitch) {
    taxSwitch.checked = !!window.APP_SETTINGS.taxEnabled;
    taxSwitch.onchange = function() {
      window.saveAppSettings({ taxEnabled: this.checked });
    };
  }
  // Currency select logic
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) {
    currencySelect.value = window.APP_SETTINGS.currency || 'THB';
    currencySelect.onchange = function() {
      let symbol = '฿';
      if (this.value === 'USD') symbol = '$';
      if (this.value === 'EUR') symbol = '€';
      window.saveAppSettings({ currency: this.value, currencySymbol: symbol });
    };
  }
  // --- Category Management ---
  const catContainer = document.getElementById('category-management-container');
  function renderCategories(categories) {
    catContainer.innerHTML = `
      <ul id="category-list" style="list-style:none;padding:0;">
        ${Object.entries(categories || {}).map(([key, cat]) => `
          <li class="form-group" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <input type="text" value="${cat.name}" data-key="${key}" class="cat-edit-input" style="font-size:15px;padding:2px 6px;border-radius:6px;border:1px solid #ccc;flex:1;">
            <button class="primary-btn cat-save-btn" data-key="${key}" style="padding:4px 14px;">Save</button>
            <button class="secondary-btn cat-delete-btn" data-key="${key}" style="padding:4px 14px;color:#c00;">Delete</button>
          </li>
        `).join('')}
      </ul>
      <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-top:10px;">
        <input type="text" id="new-cat-name" placeholder="New category name" style="font-size:15px;padding:2px 6px;border-radius:6px;border:1px solid #ccc;flex:1;">
        <button id="add-cat-btn" class="primary-btn" style="padding:4px 14px;">Add Category</button>
      </div>
    `;
    // Save, Delete, Add logic
    catContainer.querySelectorAll('.cat-save-btn').forEach(btn => {
      btn.onclick = function() {
        const key = btn.dataset.key;
        const name = catContainer.querySelector(`.cat-edit-input[data-key='${key}']`).value.trim();
        if (!name) return alert('Category name required');
        window.db.ref('menuCategories/' + key).update({ name });
      };
    });
    catContainer.querySelectorAll('.cat-delete-btn').forEach(btn => {
      btn.onclick = function() {
        const key = btn.dataset.key;
        if (confirm('Delete this category?')) {
          window.db.ref('menuCategories/' + key).remove();
        }
      };
    });
    catContainer.querySelector('#add-cat-btn').onclick = function() {
      const name = catContainer.querySelector('#new-cat-name').value.trim();
      if (!name) return alert('Category name required');
      const newKey = window.db.ref('menuCategories').push().key;
      window.db.ref('menuCategories/' + newKey).set({ name });
      catContainer.querySelector('#new-cat-name').value = '';
    };
  }
  window.db.ref('menuCategories').on('value', snap => {
    renderCategories(snap.val() || {});
  });
  // Option Groups Management UI (existing)
  const ogContainer = document.getElementById('option-groups-management-container');
  if (ogContainer) {
    ogContainer.innerHTML = `
      <div class="option-groups-management-header">
        <button id="add-option-group-btn" class="menu-action-btn">+ Add Option Group</button>
      </div>
      <div id="option-groups-list"></div>
      <div id="option-group-modal" class="menu-modal" style="display:none;"></div>
    `;
    // Use the same logic as loadOptionGroupsList
    window.getAllOptionGroups(function(groups) {
      const list = document.getElementById('option-groups-list');
      if (!groups.length) {
        list.innerHTML = '<p>No option groups found.</p>';
            return;
        }
      list.innerHTML = `
        <table class="menu-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Menu Items</th>
              <th>Options</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${groups.map(g => `
              <tr>
                <td>${g.name}</td>
                <td>${g.type}</td>
                <td>${(g.menu_ids || []).join(', ')}</td>
                <td>${Array.isArray(g.options) ? g.options.length : 0}</td>
                <td>
                  <button class="menu-action-btn" onclick="editOptionGroup('${g.id}')">Edit</button>
                  <button class="menu-action-btn delete" onclick="deleteOptionGroup('${g.id}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });
    document.getElementById('add-option-group-btn').onclick = () => window.openOptionGroupModal();
  }
};
