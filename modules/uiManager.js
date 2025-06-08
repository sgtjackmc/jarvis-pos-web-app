window.updateOrderDisplay = function(currentOrder) {
    const orderItemsContainer = document.querySelector('.order-items');
    orderItemsContainer.innerHTML = '';
    let subtotal = 0;
  
    currentOrder.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      // จัดกลุ่ม options ตาม group name
    const grouped = {};
    (item.selectedOptions || []).forEach(opt => {
    if (!grouped[opt.group]) grouped[opt.group] = [];
    grouped[opt.group].push(opt.name);
    });

    // สร้าง HTML แสดง options แบบแยกกลุ่ม
    const optionsHTML = Object.entries(grouped).map(([group, options]) => {
    return `<div class=\"order-item-add-ons\">${group}: ${options.join(', ')}</div>`;
    }).join('');


    const orderItemHTML = `
    <div class=\"order-item\" data-id=\"${item.id}\" data-key=\"${item.key}\">\n      <div class=\"order-item-details\">\n        <div class=\"order-item-header\">\n          <div class=\"order-item-name\">${item.name}</div>\n          <div class=\"order-item-total\">${window.APP_SETTINGS.currencySymbol}${itemTotal.toFixed(2)}</div>\n        </div>\n        ${optionsHTML}\n      </div>\n    </div>\n  `;
  
  
      orderItemsContainer.insertAdjacentHTML('beforeend', orderItemHTML);
    });
  
    // Make order items clickable for editing
    orderItemsContainer.querySelectorAll('.order-item').forEach(el => {
      el.style.cursor = 'pointer';
      el.onclick = function() {
        const key = el.getAttribute('data-key');
        if (key) window.editOrderItem(key);
      };
    });
  
    const taxRow = document.querySelector('.summary-row:nth-child(2)');
    let tax = 0;
    let total = subtotal;
    // Use Firebase-synced settings
    if (window.APP_SETTINGS.taxEnabled === true) {
      tax = subtotal * 0.07;
      total = subtotal + tax;
      if (taxRow) {
        taxRow.style.display = '';
        document.querySelector('.summary-row:nth-child(2) .summary-value').textContent = `${window.APP_SETTINGS.currencySymbol}${tax.toFixed(2)}`;
      }
    } else {
      if (taxRow) taxRow.style.display = 'none';
      tax = 0;
      total = subtotal;
    }
    document.querySelector('.summary-row:nth-child(1) .summary-value').textContent = `${window.APP_SETTINGS.currencySymbol}${subtotal.toFixed(2)}`;
    document.querySelector('.total-value').textContent = `${window.APP_SETTINGS.currencySymbol}${total.toFixed(2)}`;
  }
  
  window.addMenuItemEventListeners = function() {
    document.querySelectorAll('.menu-item').forEach(menuItem => {
      const minusBtn = menuItem.querySelector('.minus-btn');
      const plusBtn = menuItem.querySelector('.plus-btn');
      const quantityValue = menuItem.querySelector('.quantity-value');
  
      minusBtn?.addEventListener('click', () => {
        let qty = parseInt(quantityValue.textContent);
        if (qty > 0) quantityValue.textContent = qty - 1;
      });
  
      plusBtn?.addEventListener('click', () => {
        let qty = parseInt(quantityValue.textContent);
        quantityValue.textContent = qty + 1;
      });
  
      const addButton = menuItem.querySelector('.add-to-order');
      addButton?.addEventListener('click', () => {
        const itemId = menuItem.dataset.id;
        const quantity = parseInt(quantityValue.textContent);
        if (quantity <= 0) return;
  
        const item = window.DEBUG?.menuItems.find(m => m.id === itemId);
        if (!item) return;
  
        let totalPrice = parseFloat(item.base_price);
        const selectedOptions = [];
  
        menuItem.querySelectorAll('.add-on-option:checked').forEach(opt => {
          const price = parseFloat(opt.dataset.price);
          const name = opt.dataset.name;
          const group = opt.dataset.group;
          totalPrice += price;
          selectedOptions.push({ name, price, group });
        });
  
        const optionKey = selectedOptions.map(opt => `${opt.group}:${opt.name}`).sort().join('|');
        const itemKey = `${item.id}|${optionKey}`;
  
        if (!window.currentOrder) window.currentOrder = [];
        const existingIndex = window.currentOrder.findIndex(orderItem => orderItem.key === itemKey);
  
        if (existingIndex !== -1) {
          window.currentOrder[existingIndex].quantity += quantity;
        } else {
          window.currentOrder.push({
            key: itemKey,
            id: item.id,
            name: item.name,
            price: totalPrice,
            quantity,
            selectedOptions
          });
        }
  
        quantityValue.textContent = '0';
        updateOrderDisplay(window.currentOrder);
      });
    });
  }
  
  function addCategoryTabListeners(menuItems) {
  const tabs = document.querySelectorAll('.category-tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // เอา active ออกจากทุก tab
      tabs.forEach(t => t.classList.remove('active'));

      // ใส่ active tab ที่ถูกคลิก
      tab.classList.add('active');

      const category = tab.textContent.trim();
      renderMenuItems(menuItems, category);
      addMenuItemEventListeners(); // ต้องเรียกใหม่ทุกครั้งหลัง render
    });
  });
}

window.generateOrderNumber = function() {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
