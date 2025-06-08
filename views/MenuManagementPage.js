window.initMenuManagementPage = function() {
  const container = document.getElementById('main-content');
  if (!container) return;
  container.innerHTML = `
    <div class="menu-management-header">
      <h2>Menu Management</h2>
      <button id="add-menu-btn" class="menu-action-btn">+ Add Menu Item</button>
    </div>
    <div id="menu-list-table"></div>
    <div id="menu-modal" class="menu-modal" style="display:none;"></div>
  `;
  loadMenuList();
  document.getElementById('add-menu-btn').onclick = () => openMenuModal();
}

function loadMenuList() {
  const list = document.getElementById('menu-list-table');
  window.getAllMenuItems(function(items) {
    if (!items.length) {
      list.innerHTML = '<p>No menu items found.</p>';
      return;
    }
    list.innerHTML = `
      <table class="menu-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.id}</td>
              <td>${item.name}</td>
              <td>${item.category}</td>
              <td>$${item.base_price}</td>
              <td>${item.status || 'Active'}</td>
              <td>
                <button class="menu-action-btn" onclick="editMenuItem('${item.id}')">Edit</button>
                <button class="menu-action-btn delete" onclick="deleteMenuItem('${item.id}')">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  });
}

window.editMenuItem = function(id) {
  window.getAllMenuItems(function(menuItems) {
    const item = menuItems.find(m => m.id === id);
    openMenuModal(item, id);
  });
}

// Add a reference to the original Firebase delete function
window.deleteMenuItemFromDb = window.deleteMenuItem;

window.deleteMenuItem = function(id) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;
  window.deleteMenuItemFromDb(id).then(loadMenuList);
}

function openMenuModal(item = {}, id = null) {
  const modal = document.getElementById('menu-modal');
  if (!modal) return;
  // Fetch all option groups and filter those assigned to this menu item
  window.getAllOptionGroups(function(optionGroups) {
    const assignedGroups = optionGroups.filter(g => Array.isArray(g.menu_ids) && g.menu_ids.includes(item.id));
    const assignedGroupsHTML = assignedGroups.length > 0
      ? `<div class="form-group"><label>Assigned Option Groups:</label><ul style="margin:0 0 8px 0;padding-left:18px;">${assignedGroups.map(g => `<li>${g.name}</li>`).join('')}</ul></div>`
      : '';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="menu-modal-content landscape-layout" onclick="event.stopPropagation()">
        <button class="menu-modal-close" id="close-menu-modal" title="Close">&times;</button>
        <form id="menu-form">
        <div class="menu-modal-columns">
          <div class="menu-modal-col-left">
            <div class="form-group">
              <label>Image:</label>
              <div id="menu-image-dropzone" style="border:2px dashed #bbb;padding:12px;text-align:center;border-radius:8px;cursor:pointer;background:#fafbfc;position:relative;">
                <input type="file" name="image" accept="image/jpeg,image/png" style="display:none;">
                <div id="menu-image-preview" style="margin-top:8px;min-height:40px;">
                  ${item.image || item.image_url ? `<img src="${item.image || item.image_url}" alt="Preview" style="max-width:120px;max-height:120px;border-radius:8px;"> <button type="button" id="remove-menu-image-btn" style="margin-left:10px;background:#eee;color:#c00;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;">Remove Image</button>` : '<span style="color:#888;">Drag & drop image here, or click to select (JPG/PNG, max 2MB)</span>'}
                </div>
                <div id="menu-image-progress" style="height:6px;width:100%;background:#eee;border-radius:4px;margin-top:8px;display:none;"><div style="height:100%;width:0;background:#007bff;border-radius:4px;transition:width 0.2s;" id="menu-image-progress-bar"></div></div>
                <canvas id="menu-image-cropper" style="display:none;margin-top:10px;border-radius:8px;max-width:100%;"></canvas>
                <div id="menu-image-crop-actions" style="display:none;margin-top:8px;"><button type="button" id="crop-image-btn" style="background:#007bff;color:#fff;padding:4px 14px;border:none;border-radius:6px;">Crop & Upload</button> <button type="button" id="cancel-crop-btn" style="background:#eee;color:#333;padding:4px 14px;border:none;border-radius:6px;">Cancel</button></div>
              </div>
            </div>
            <div class="form-group"><label>Name:</label><input type="text" name="name" value="${item.name || ''}" required></div>
            <div class="form-group"><label>Base Price:</label><input type="number" name="base_price" value="${item.base_price || ''}" required min="0" step="0.01"></div>
            <div class="form-group"><label>Status:</label><select name="status"><option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option><option value="Inactive" ${item.status === 'Inactive' ? 'selected' : ''}>Inactive</option></select></div>
          </div>
          <div class="menu-modal-col-right">
            <div class="form-group"><label>Category:</label><input type="text" name="category" value="${item.category || ''}" required></div>
            <div class="form-group"><label>Description:</label><textarea name="description">${item.description || ''}</textarea></div>
            ${assignedGroupsHTML}
          </div>
        </div>
        <div class="menu-modal-actions landscape-actions">
          <button type="submit" class="primary-btn">Save</button>
          <button type="button" id="cancel-menu-modal" class="secondary-btn">Cancel</button>
        </div>
      </form>
    </div>
    `;
    document.getElementById('close-menu-modal').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('cancel-menu-modal').onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Drag-and-drop, cropping, and image upload logic
    const dropzone = document.getElementById('menu-image-dropzone');
    const imageInput = dropzone.querySelector('input[name="image"]');
    let uploadedImageUrl = item.image || item.image_url || null;
    console.log('[DEBUG] Loaded menu item image:', item.image, item.image_url, '->', uploadedImageUrl);
    let cropImage = null;
    let generatedId = id || (item.id ? item.id : 'menu-' + Date.now());
    function showPreview(url) {
      console.log('[DEBUG] showPreview called with url:', url);
      document.getElementById('menu-image-preview').innerHTML = `<img src="${url}" alt="Preview" style="max-width:120px;max-height:120px;border-radius:8px;"> <button type="button" id="remove-menu-image-btn" style="margin-left:10px;background:#eee;color:#c00;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;">Remove Image</button>`;
      document.getElementById('remove-menu-image-btn').onclick = function() {
        uploadedImageUrl = null;
        document.getElementById('menu-image-preview').innerHTML = '<span style="color:#888;">Drag & drop image here, or click to select (JPG/PNG, max 2MB)</span>';
      };
    }
    function handleFile(file) {
      if (!file) return;
      if (!['image/jpeg','image/png'].includes(file.type)) {
        alert('Only JPG or PNG images are allowed.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2 MB.');
        return;
      }
      // Show cropper
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new window.Image();
        img.onload = function() {
          const canvas = document.getElementById('menu-image-cropper');
          const ctx = canvas.getContext('2d');
          // Crop to square, max 512x512
          const size = Math.min(img.width, img.height, 512);
          canvas.width = size;
          canvas.height = size;
          ctx.clearRect(0,0,size,size);
          ctx.drawImage(img,
            (img.width-size)/2, (img.height-size)/2, size, size,
            0, 0, size, size
          );
          canvas.style.display = 'block';
          document.getElementById('menu-image-crop-actions').style.display = 'block';
          cropImage = canvas;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    dropzone.onclick = function(e) {
      if (e.target.tagName !== 'BUTTON') imageInput.click();
    };
    imageInput.onchange = function(e) { handleFile(e.target.files[0]); };
    dropzone.ondragover = function(e) { e.preventDefault(); dropzone.style.background = '#f0f4ff'; };
    dropzone.ondragleave = function(e) { e.preventDefault(); dropzone.style.background = '#fafbfc'; };
    dropzone.ondrop = function(e) {
      e.preventDefault();
      dropzone.style.background = '#fafbfc';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    };
    // Crop & upload logic
    document.getElementById('crop-image-btn') && (document.getElementById('crop-image-btn').onclick = function() {
      if (!cropImage) return;
      cropImage.toBlob(function(blob) {
        if (!generatedId) {
          generatedId = 'menu-' + Date.now();
        }
        document.getElementById('menu-image-progress').style.display = 'block';
        window.uploadMenuImage(blob, generatedId, function(percent) {
          document.getElementById('menu-image-progress-bar').style.width = percent + '%';
        }).then(url => {
          uploadedImageUrl = url;
          showPreview(url);
          document.getElementById('menu-image-progress').style.display = 'none';
          cropImage = null;
          document.getElementById('menu-image-cropper').style.display = 'none';
          document.getElementById('menu-image-crop-actions').style.display = 'none';
        }).catch(err => {
          document.getElementById('menu-image-progress').style.display = 'none';
          alert('Image upload failed: ' + err.message);
        });
      }, 'image/jpeg', 0.92);
    });
    document.getElementById('cancel-crop-btn') && (document.getElementById('cancel-crop-btn').onclick = function() {
      cropImage = null;
      document.getElementById('menu-image-cropper').style.display = 'none';
      document.getElementById('menu-image-crop-actions').style.display = 'none';
    });
    // Remove image button for pre-existing image
    if (document.getElementById('remove-menu-image-btn')) {
      document.getElementById('remove-menu-image-btn').onclick = function() {
        uploadedImageUrl = null;
        document.getElementById('menu-image-preview').innerHTML = '<span style="color:#888;">Drag & drop image here, or click to select (JPG/PNG, max 2MB)</span>';
      };
    }

    document.getElementById('menu-form').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      let menuId = id || (item.id ? item.id : generatedId);
      let finalImageUrl = uploadedImageUrl;
      // If no new image uploaded and not removed, keep the existing image
      if (!finalImageUrl && (item.image || item.image_url)) {
        finalImageUrl = item.image || item.image_url;
      }
      console.log('[DEBUG] Saving menu item. menuId:', menuId, 'uploadedImageUrl:', uploadedImageUrl, 'finalImageUrl:', finalImageUrl);
      const newItem = {
        id: menuId,
        name: form.name.value,
        base_price: parseFloat(form.base_price.value),
        category: form.category.value,
        description: form.description.value,
        status: form.status.value,
        option_groups: item.option_groups || [],
        image: finalImageUrl,
        image_url: finalImageUrl // Always save to both fields
      };
      console.log('[DEBUG] newItem to save:', newItem);
      if (id === null) {
        window.addMenuItem(newItem).then(() => {
          modal.style.display = 'none';
          loadMenuList();
        });
      } else {
        window.updateMenuItem(menuId, newItem).then(() => {
          modal.style.display = 'none';
          loadMenuList();
        });
      }
    };
  });
} 