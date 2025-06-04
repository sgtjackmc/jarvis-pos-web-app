// views/MenuPage.js
import { loadMenuData } from '../modules/menuOptionLoader.js';
import { renderMenuItems } from '../modules/menuRenderer.js'; // Assuming this renders items with data-category
import { updateOrderDisplay, addMenuItemEventListeners } from '../modules/uiManager.js';
import { CONFIG } from '../config.js';

/**
 * Filters and displays menu items based on the selected category.
 * This function assumes that menu items in the DOM have a 'data-category' attribute.
 * @param {string} categoryName - The category to filter by (e.g., "Burgers", "All Items").
 */
function filterMenuItemsOnPage(categoryName) {
    const menuGrid = document.querySelector('.menu-grid');
    if (!menuGrid) {
        console.warn('Menu grid not found for filtering.');
        return;
    }
    const menuItemsElements = menuGrid.querySelectorAll('.menu-item'); // Select all rendered menu items

    // console.log(`Filtering by category: ${categoryName}`); // For debugging

    menuItemsElements.forEach(item => {
        // Get the category of the current menu item from its data-category attribute
        // This attribute should be set by your renderMenuItems function
        const itemCategory = item.dataset.category;

        if (categoryName === 'All Items' || !categoryName || itemCategory === categoryName) {
            // Show the item if "All Items" is selected, no category is selected (should default to all), or if its category matches
            item.style.display = ''; // Or 'block', 'flex', etc., depending on your layout needs
        } else {
            // Hide the item if its category does not match
            item.style.display = 'none';
        }
    });
}

/**
 * Adds event listeners to category tabs to filter menu items.
 * @param {Array} allMenuItemsData - The raw menu items data array, potentially for future use if direct data filtering is needed.
 * Currently, filtering is based on DOM elements' data-attributes.
 */
function addCategoryTabListeners(allMenuItemsData) {
    const categoryTabs = document.querySelectorAll('.category-tab');

    if (!categoryTabs.length) {
        console.warn('No category tabs found to attach listeners.');
        return;
    }

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            const clickedTab = event.currentTarget;

            // Remove 'active' class from all tabs
            categoryTabs.forEach(t => t.classList.remove('active'));

            // Add 'active' class to the clicked tab
            clickedTab.classList.add('active');

            // Get the category name from the data-category attribute of the clicked tab
            const categoryName = clickedTab.dataset.category;

            if (categoryName) {
                filterMenuItemsOnPage(categoryName);
            } else {
                console.warn('Clicked tab does not have a data-category attribute. Showing all items.');
                filterMenuItemsOnPage('All Items'); // Default to showing all if no category
            }
        });
    });

    // Optional: Initially filter by the default active tab (if any) when the page loads
    const activeTab = document.querySelector('.category-tab.active');
    if (activeTab && activeTab.dataset.category) {
        filterMenuItemsOnPage(activeTab.dataset.category);
    } else if (categoryTabs.length > 0 && categoryTabs[0].dataset.category) {
        // If no specific active tab, try to filter by the first tab's category
        filterMenuItemsOnPage(categoryTabs[0].dataset.category);
    } else {
        // Fallback to "All Items" if no active tab or first tab has no category
        filterMenuItemsOnPage('All Items');
    }
}

export async function initMenuPage() {
  console.log('🧾 Loading Menu Page...');

  const sheetId = CONFIG.sheetId;
  const menuSheet = 'Main_Menu'; // Assuming this is the sheet name for menu items
  const apiKey = CONFIG.apiKey;

  try {
    // 1. โหลดเมนูจาก Google Sheets API
    // This menuItems variable holds the raw data from the sheet
    const menuItemsData = await loadMenuData(sheetId, apiKey, menuSheet);
    // Store for debugging if needed
    window.DEBUG = { menuItemsData };

    // 2. แสดงเมนูในหน้า HTML
    // IMPORTANT: Your renderMenuItems function MUST ensure that each .menu-item element
    // it creates in the DOM has a `data-category="[CategoryName]"` attribute.
    // For example, if an item is in "Burgers", it should look like:
    // <div class="menu-item" data-category="Burgers">...</div>
    // The category name here should match the data-category value on the tabs.
    renderMenuItems(menuItemsData); // This function populates the .menu-grid

    // 3. เพิ่ม event listeners สำหรับปุ่ม +/– และ Add ในแต่ละรายการเมนู
    addMenuItemEventListeners();

    // 4. เริ่มต้นอัปเดต Order Panel (ตะกร้าสินค้า)
    if (!window.currentOrder) { // Initialize if not already present
        window.currentOrder = [];
    }
    updateOrderDisplay(window.currentOrder);

    // 5. เพิ่ม event listeners ให้กับ Category Tabs
    // Pass menuItemsData if direct data filtering becomes necessary in the future,
    // but current implementation filters based on DOM attributes set by renderMenuItems.
    addCategoryTabListeners(menuItemsData);

    console.log('✅ MenuPage Loaded and category tabs initialized.');
  } catch (err) {
    console.error('❌ Failed to load menu or initialize MenuPage:', err);
    // Consider providing user-friendly error feedback on the page itself
    const menuGrid = document.querySelector('.menu-grid');
    if(menuGrid) {
        menuGrid.innerHTML = '<p style="color: red; text-align: center;">ขออภัย โหลดเมนูไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแล</p>';
    } else {
        alert('โหลดเมนูไม่สำเร็จ กรุณาลองใหม่');
    }
  }
}
