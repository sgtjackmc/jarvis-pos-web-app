window.initOptionGroupsManagementPage = function() {
  const container = document.getElementById('main-content');
  if (!container) return;
  container.innerHTML = `
    <div class="option-groups-management-header">
      <h2>Option Groups Management</h2>
      <button id="add-option-group-btn" class="menu-action-btn">+ Add Option Group</button>
    </div>
    <div id="option-groups-list"></div>
    <div id="option-group-modal" class="menu-modal" style="display:none;"></div>
  `;
  loadOptionGroupsList();
  document.getElementById('add-option-group-btn').onclick = () => openOptionGroupModal();
};

function loadOptionGroupsList() {
  const list = document.getElementById('option-groups-list');
  window.getAllOptionGroups(function(groups) {
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
}

window.editOptionGroup = function(id) {
  window.getAllOptionGroups(function(groups) {
    const group = groups.find(g => g.id === id);
    openOptionGroupModal(group, id);
  });
};

window.deleteOptionGroup = function(id) {
  if (!confirm('Are you sure you want to delete this option group?')) return;
  window.deleteOptionGroup(id).then(loadOptionGroupsList);
};

function openOptionGroupModal(group = {}, id = null) {
  const modal = document.getElementById('option-group-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  // Get all menu items for assignment
  window.getAllMenuItems(function(menuItems) {
    let menu_ids = group.menu_ids || [];
    if (typeof menu_ids === 'string') {
      try { menu_ids = JSON.parse(menu_ids); } catch { menu_ids = []; }
    }
    let options = group.options || [];
    if (typeof options === 'string') {
      try { options = JSON.parse(options); } catch { options = []; }
    }

  modal.innerHTML = `
    <div class="menu-modal-content" onclick="event.stopPropagation()" style="max-width:600px;width:90%;">
      <button class="menu-modal-close" id="close-option-group-modal" title="Close">&times;</button>
        <h3>${id === null ? 'Add' : 'Edit'} Option Group</h3>
      <form id="option-group-form">
          <div class="form-group">
            <label>Name:</label>
            <input type="text" name="name" value="${group.name || ''}" required>
        </div>
          <div class="form-group">
            <label>Type:</label>
            <select name="type">
            <option value="single" ${group.type === 'single' ? 'selected' : ''}>Single Selection</option>
            <option value="multi" ${group.type === 'multi' ? 'selected' : ''}>Multiple Selection</option>
          </select>
        </div>
          <div class="form-group">
            <label>Assign to Menu Items:</label>
            <div style="max-height:120px;overflow:auto;border:1px solid #eee;padding:8px;border-radius:4px;">
              ${menuItems.map(mi => `
                <label style="display:inline-block;margin-right:12px;">
                  <input type="checkbox" name="menu_ids" value="${mi.id}" ${menu_ids.includes(mi.id) ? 'checked' : ''}>
                  ${mi.name}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Options:</label>
            <div id="options-list-wrapper" style="max-height:240px;overflow-y:auto;padding-right:4px;margin-bottom:8px;background:#f8f9fa;border-radius:6px;">
              <div id="options-list">
                ${options.map((opt, i) => `
                  <div class="option-row" data-oi="${i}">
                    <input type="text" class="option-name" value="${opt.name || ''}" placeholder="Option Name" ${i === options.length - 1 ? 'autofocus' : ''}/>
                    <input type="number" class="option-price" value="${opt.price || 0}" placeholder="0.00" step="0.01" min="0" style="width:80px;" />
                    <button type="button" class="remove-option-btn" data-oi="${i}">&times;</button>
                  </div>
                `).join('')}
              </div>
            </div>
            <div style="text-align:right;">
              <button type="button" id="add-option-btn" class="secondary-btn">+ Add Option</button>
            </div>
        </div>
          <div class="menu-modal-actions">
            <button type="submit" class="primary-btn">Save</button>
            <button type="button" id="cancel-option-group-modal" class="secondary-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('close-option-group-modal').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('cancel-option-group-modal').onclick = () => { modal.style.display = 'none'; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Option add/remove logic
    document.getElementById('add-option-btn').onclick = () => {
      // Collect all current form values before re-rendering
      const form = document.getElementById('option-group-form');
      // Name
      const name = form.querySelector('input[name="name"]').value;
      // Type
      const type = form.querySelector('select[name="type"]').value;
      // Assigned menu items
      const newMenuIds = Array.from(form.querySelectorAll('input[name=menu_ids]:checked')).map(cb => cb.value);
      // Options
      const optionRows = modal.querySelectorAll('.option-row');
      if (optionRows.length > 0) {
        options = Array.from(optionRows).map(row => ({
          name: row.querySelector('.option-name').value,
          price: parseFloat(row.querySelector('.option-price').value) || 0
        }));
      }
      options.push({ name: '', price: 0 });
      openOptionGroupModal({ ...group, name, type, menu_ids: newMenuIds, options }, id);
    };
    modal.querySelectorAll('.remove-option-btn').forEach(btn => {
      btn.onclick = () => {
        const oi = +btn.getAttribute('data-oi');
        options.splice(oi, 1);
        openOptionGroupModal({ ...group, menu_ids, options }, id);
      };
    });

    // Save handler
    document.getElementById('option-group-form').onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
      const newMenuIds = Array.from(form.querySelectorAll('input[name=menu_ids]:checked')).map(cb => cb.value);
      const newOptions = [];
      form.querySelectorAll('.option-row').forEach((row, i) => {
        newOptions.push({
          name: row.querySelector('.option-name').value,
          price: parseFloat(row.querySelector('.option-price').value) || 0
        });
      });
    const newGroup = {
      name: form.name.value,
      type: form.type.value,
        menu_ids: newMenuIds,
        options: newOptions
    };
      if (id === null) {
        window.addOptionGroup(newGroup).then(() => {
          modal.style.display = 'none';
          loadOptionGroupsList();
        });
      } else {
        window.updateOptionGroup(id, newGroup).then(() => {
      modal.style.display = 'none';
      loadOptionGroupsList();
        });
      }
    };

    // Autofocus the last option name input after adding
    setTimeout(() => {
      const optionInputs = modal.querySelectorAll('.option-name');
      if (optionInputs.length) optionInputs[optionInputs.length - 1].focus();
    }, 0);
  });
} 