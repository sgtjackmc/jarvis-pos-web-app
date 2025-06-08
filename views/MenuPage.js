window.initMenuPage = function() {
  console.log('Loading Menu Page...');
  window.getAllMenuItems(function(menuItems) {
    window.DEBUG = { menuItems };
    renderCategoryTabs(menuItems);
    renderMenuItems(menuItems, 'All');
    setupCategoryTabListeners(menuItems);
    setupMenuItemCardListeners(menuItems);
    if (!window.currentOrder) window.currentOrder = [];
    window.updateOrderDisplay(window.currentOrder);
    // ... add category tab listeners if needed ...
    console.log('✅ MenuPage Loaded and category tabs initialized.');
  });
}

function renderCategoryTabs(menuItems) {
  const categories = Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean);
  const tabsHTML = ['All', ...categories].map(cat =>
    `<button class="category-tab" data-category="${cat}">${cat}</button>`
  ).join('');
  document.getElementById('category-tabs').innerHTML = tabsHTML;
  // Set 'All' as active by default
  document.querySelector('.category-tab[data-category="All"]').classList.add('active');
}

function renderMenuItems(menuItems, selectedCategory = 'All') {
    const menuGrid = document.querySelector('.menu-grid');
  if (!menuGrid) return;
  menuGrid.innerHTML = '';
  const filtered = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);
  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'menu-item-card';
    el.dataset.id = item.id;
    // Use item.image, item.image_url, or fallback
    const imgUrl = item.image || item.image_url || '/img/placeholder.jpeg';
    el.innerHTML = `
      <div class="menu-item-image" style="background-image:url('${imgUrl}');height:120px;background-size:cover;background-position:center;border-radius:8px;"></div>
      <div class="menu-item-name" style="font-weight:bold;margin-top:8px;">${item.name}</div>
      <div class="menu-item-price" style="color:#007bff;">฿${item.base_price}</div>
      <div class="menu-item-desc" style="font-size:13px;color:#666;">${item.description || ''}</div>
    `;
    menuGrid.appendChild(el);
  });
}

function setupCategoryTabListeners(menuItems) {
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.onclick = function() {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      renderMenuItems(menuItems, cat);
      setupMenuItemCardListeners(menuItems, cat);
    };
  });
}

function setupMenuItemCardListeners(menuItems, selectedCategory = 'All') {
  const filtered = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);
  document.querySelectorAll('.menu-item-card').forEach(card => {
    card.onclick = function() {
      const id = card.dataset.id;
      const item = filtered.find(m => m.id === id);
      if (item) showMenuItemModal(item);
    };
  });
}

function showMenuItemModal(item) {
  window.getAllOptionGroups(function(optionGroups) {
    const assignedGroups = optionGroups.filter(g => Array.isArray(g.menu_ids) && g.menu_ids.includes(item.id));
    // Remove any existing modal
    let overlay = document.getElementById('menu-item-modal-overlay');
    if (overlay) overlay.remove();
    // Build option groups HTML
    let optionGroupsHTML = '';
    if (assignedGroups.length > 0) {
      optionGroupsHTML = assignedGroups.map(group => {
        const groupOptionsHTML = (group.options || []).map(opt => `
          <label style="display:flex;align-items:center;gap:10px;font-size:1.1em;margin-bottom:6px;">
            <input type="${group.type === 'single' ? 'radio' : 'checkbox'}"
                   name="option-group-${group.name}"
                   value="${opt.name}"
                   data-price="${opt.price}"
                   data-group="${group.name}">
            ${opt.name} ${opt.price ? `(+${opt.price})` : ''}
          </label>
        `).join('');
        return `
          <div class="option-group" style="margin-bottom:18px;">
            <div class="option-group-title" style="font-size:1.1em;">${group.name}</div>
            <div class="option-group-options">${groupOptionsHTML}</div>
          </div>
        `;
      }).join('');
    }
    // Drawer HTML
    overlay = document.createElement('div');
    overlay.id = 'menu-item-modal-overlay';
    overlay.className = 'menu-drawer-overlay';
    const imgUrl = item.image || item.image_url || '/img/placeholder.jpeg';
    overlay.innerHTML = `
      <div class="menu-drawer menu-drawer-2col">
        <button class="menu-drawer-close" id="close-menu-item-modal" title="Close">&times;</button>
        <div class="menu-drawer-cols">
          <div class="menu-drawer-col-left">
            <div class="menu-drawer-img" style="background-image:url('${imgUrl}');"></div>
            <div class="menu-drawer-title">${item.name}</div>
            <div class="menu-drawer-desc">${item.description || ''}</div>
            <div class="menu-drawer-qty-row">
              <button id="qty-minus" class="menu-drawer-qty-btn">-</button>
              <span id="qty-value" class="menu-drawer-qty-value">1</span>
              <button id="qty-plus" class="menu-drawer-qty-btn">+</button>
            </div>
            <button id="add-to-order-btn" class="menu-drawer-add-btn">Add to Order</button>
          </div>
          <div class="menu-drawer-col-right">
            <div class="menu-drawer-options">${optionGroupsHTML}</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    // Animate drawer in
    setTimeout(() => {
      overlay.querySelector('.menu-drawer').classList.add('open');
      overlay.focus();
    }, 10);
    // Close logic
    function closeDrawer() {
      const drawer = overlay.querySelector('.menu-drawer');
      drawer.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    }
    document.getElementById('close-menu-item-modal').onclick = closeDrawer;
    overlay.onclick = (e) => { if (e.target === overlay) closeDrawer(); };
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeDrawer();
        document.removeEventListener('keydown', escHandler);
      }
    });
    // QTY logic
    let qty = 1;
    document.getElementById('qty-minus').onclick = () => {
      if (qty > 1) {
        qty--;
        document.getElementById('qty-value').textContent = qty;
      }
    };
    document.getElementById('qty-plus').onclick = () => {
      qty++;
      document.getElementById('qty-value').textContent = qty;
    };
    // Add to Order logic
    document.getElementById('add-to-order-btn').onclick = function() {
      // Gather selected options
      const selectedOptions = [];
      overlay.querySelectorAll('input[type=checkbox]:checked, input[type=radio]:checked').forEach(input => {
        selectedOptions.push({
          name: input.value,
          price: parseFloat(input.dataset.price) || 0,
          group: input.dataset.group
        });
    });
      // Calculate total price
      let totalPrice = parseFloat(item.base_price) || 0;
      selectedOptions.forEach(opt => { totalPrice += opt.price; });
      // Build order item
      const optionKey = selectedOptions.map(opt => `${opt.group}:${opt.name}`).sort().join('|');
      const itemKey = `${item.id}|${optionKey}`;
      if (!window.currentOrder) window.currentOrder = [];
      const existingIndex = window.currentOrder.findIndex(orderItem => orderItem.key === itemKey);
      if (existingIndex !== -1) {
        window.currentOrder[existingIndex].quantity += qty;
    } else {
        window.currentOrder.push({
          key: itemKey,
          id: item.id,
          name: item.name,
          price: totalPrice,
          quantity: qty,
          selectedOptions
        });
      }
      window.updateOrderDisplay(window.currentOrder);
      closeDrawer();
    };
    // Autofocus first input
    setTimeout(() => {
      const firstInput = overlay.querySelector('input, button');
      if (firstInput) firstInput.focus();
    }, 100);
  });
}

window.editOrderItem = function(orderItemKey) {
  if (!window.currentOrder) return;
  const orderItem = window.currentOrder.find(i => i.key === orderItemKey);
  if (!orderItem) return;
  // Find the menu item data
  const menuItem = (window.DEBUG && window.DEBUG.menuItems)
    ? window.DEBUG.menuItems.find(m => m.id === orderItem.id)
    : null;
  if (!menuItem) return;
  window.getAllOptionGroups(function(optionGroups) {
    const assignedGroups = optionGroups.filter(g => Array.isArray(g.menu_ids) && g.menu_ids.includes(menuItem.id));
    // Remove any existing modal
    let overlay = document.getElementById('menu-item-modal-overlay');
    if (overlay) overlay.remove();
    // Build option groups HTML (with checked/selected states)
    let optionGroupsHTML = '';
    if (assignedGroups.length > 0) {
      optionGroupsHTML = assignedGroups.map(group => {
        const groupOptionsHTML = (group.options || []).map(opt => {
          let checked = '';
          if (orderItem.selectedOptions && orderItem.selectedOptions.some(sel => sel.name === opt.name && sel.group === group.name)) {
            checked = 'checked';
          }
          return `<label style="display:flex;align-items:center;gap:10px;font-size:1.1em;margin-bottom:6px;">
            <input type="${group.type === 'single' ? 'radio' : 'checkbox'}"
                   name="option-group-${group.name}"
                   value="${opt.name}"
                   data-price="${opt.price}"
                   data-group="${group.name}"
                   ${checked}>
            ${opt.name} ${opt.price ? `(+${opt.price})` : ''}
          </label>`;
        }).join('');
        return `
          <div class="option-group" style="margin-bottom:18px;">
            <div class="option-group-title" style="font-size:1.1em;">${group.name}</div>
            <div class="option-group-options">${groupOptionsHTML}</div>
          </div>
        `;
      }).join('');
    }
    // Drawer HTML
    overlay = document.createElement('div');
    overlay.id = 'menu-item-modal-overlay';
    overlay.className = 'menu-drawer-overlay';
    const imgUrl = menuItem.image || menuItem.image_url || '/img/placeholder.jpeg';
    overlay.innerHTML = `
      <div class="menu-drawer menu-drawer-2col">
        <button class="menu-drawer-close" id="close-menu-item-modal" title="Close">&times;</button>
        <div class="menu-drawer-cols">
          <div class="menu-drawer-col-left">
            <div class="menu-drawer-img" style="background-image:url('${imgUrl}');"></div>
            <div class="menu-drawer-title">${menuItem.name}</div>
            <div class="menu-drawer-desc">${menuItem.description || ''}</div>
            <div class="menu-drawer-qty-row">
              <button id="qty-minus" class="menu-drawer-qty-btn">-</button>
              <span id="qty-value" class="menu-drawer-qty-value">${orderItem.quantity}</span>
              <button id="qty-plus" class="menu-drawer-qty-btn">+</button>
            </div>
            <button id="add-to-order-btn" class="menu-drawer-add-btn">Update Item</button>
          </div>
          <div class="menu-drawer-col-right">
            <div class="menu-drawer-options">${optionGroupsHTML}</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    // Animate drawer in
    setTimeout(() => {
      overlay.querySelector('.menu-drawer').classList.add('open');
      overlay.focus();
    }, 10);
    // Close logic
    function closeDrawer() {
      const drawer = overlay.querySelector('.menu-drawer');
      drawer.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    }
    document.getElementById('close-menu-item-modal').onclick = closeDrawer;
    overlay.onclick = (e) => { if (e.target === overlay) closeDrawer(); };
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeDrawer();
        document.removeEventListener('keydown', escHandler);
      }
    });
    // QTY logic
    let qty = orderItem.quantity;
    document.getElementById('qty-minus').onclick = () => {
      if (qty > 1) {
        qty--;
        document.getElementById('qty-value').textContent = qty;
      }
    };
    document.getElementById('qty-plus').onclick = () => {
      qty++;
      document.getElementById('qty-value').textContent = qty;
    };
    // Update Item logic
    document.getElementById('add-to-order-btn').onclick = function() {
      // Gather selected options
      const selectedOptions = [];
      overlay.querySelectorAll('input[type=checkbox]:checked, input[type=radio]:checked').forEach(input => {
        selectedOptions.push({
          name: input.value,
          price: parseFloat(input.dataset.price) || 0,
          group: input.dataset.group
        });
      });
      // Calculate total price
      let totalPrice = parseFloat(menuItem.base_price) || 0;
      selectedOptions.forEach(opt => { totalPrice += opt.price; });
      // Build new key
      const optionKey = selectedOptions.map(opt => `${opt.group}:${opt.name}`).sort().join('|');
      const newKey = `${menuItem.id}|${optionKey}`;
      // Update the order item in window.currentOrder
      const idx = window.currentOrder.findIndex(i => i.key === orderItemKey);
      if (idx !== -1) {
        window.currentOrder[idx] = {
          key: newKey,
          id: menuItem.id,
          name: menuItem.name,
          price: totalPrice,
          quantity: qty,
          selectedOptions
        };
      }
      window.updateOrderDisplay(window.currentOrder);
      closeDrawer();
    };
    // Autofocus first input
    setTimeout(() => {
      const firstInput = overlay.querySelector('input, button');
      if (firstInput) firstInput.focus();
    }, 100);
  });
};
