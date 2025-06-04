export function renderMenuItems(menuItems, category = 'All Items') {
    const menuGrid = document.querySelector('.menu-grid');
    menuGrid.innerHTML = '';
  
    const filteredItems = category === 'All Items'
      ? menuItems
      : menuItems.filter(item => item.category === category);
  
    filteredItems.forEach(item => {
      let optionGroupsHTML = '';
  
      if (Array.isArray(item.option_groups) && item.option_groups.length > 0) {
        optionGroupsHTML = item.option_groups.map(group => {
          const groupOptionsHTML = group.options.map(opt => `
            <label class="option-label">
              <input type="${group.type === 'single' ? 'radio' : 'checkbox'}"
                     name="${item.id}-${group.name}"
                     class="add-on-option option-input"
                     data-price="${opt.price}"
                     data-name="${opt.name}"
                     data-group="${group.name}">
              <span class="option-name">${opt.name}</span>
              <span class="option-price">+$${opt.price}</span>
            </label>
          `).join('');
  
          return `
            <fieldset class="option-group">
              <legend class="option-group-title">${group.name}</legend>
              <div class="option-group-options">${groupOptionsHTML}</div>
            </fieldset>
          `;
        }).join('');
      }
  
      const menuItemHTML = `
        <div class="menu-item" data-id="${item.id}">
          <div class="menu-item-image" style="background-image: url('${item.image_url || '/img/placeholder.jpeg'}');"></div>
          <div class="menu-item-content">
            <div class="menu-item-header">
              <div class="menu-item-name">${item.name}</div>
              <div class="menu-item-price">$<span class="price-value">${item.base_price}</span></div>
            </div>
            <div class="menu-item-desc">${item.description}</div>
            <div class="menu-item-add-ons">${optionGroupsHTML}</div>
            <div class="menu-item-action">
              <div class="quantity-control">
                <div class="quantity-btn minus-btn">-</div>
                <div class="quantity-value">0</div>
                <div class="quantity-btn plus-btn">+</div>
              </div>
              <button class="add-to-order">Add</button>
            </div>
          </div>
        </div>
      `;
  
      menuGrid.insertAdjacentHTML('beforeend', menuItemHTML);
    });
    
  }
  