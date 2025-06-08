window.renderMenuItems = function(menuItems) {
    const menuGrid = document.querySelector('.menu-grid');
  if (!menuGrid) return;
    menuGrid.innerHTML = '';
  menuItems.forEach(item => {
    // ... your rendering logic here ...
    // Example:
    const el = document.createElement('div');
    el.className = 'menu-item';
    el.dataset.id = item.id;
    el.dataset.category = item.category;
    el.innerHTML = `
              <div class="menu-item-name">${item.name}</div>
      <div class="menu-item-price">$${item.base_price}</div>
      <div class="menu-item-desc">${item.description || ''}</div>
              <button class="add-to-order">Add</button>
      `;
    menuGrid.appendChild(el);
    });
  }
  