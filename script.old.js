console.log('📦 Top of script.js');

import { loadMenuData } from './modules/menuOptionLoader.js';
import { renderMenuItems } from './modules/menuRenderer.js';
import { addToOrder } from './modules/orderManager.js';
import { updateOrderDisplay, addMenuItemEventListeners } from './modules/uiManager.js';
import { submitOrderToSheet } from './modules/submitOrder.js';

const sheetId = '1NcIdaR6b0r9G2_fXmA2DCh7KTYCV0iErlFa9z_Uggiw';
const apiKey = 'AIzaSyBQIlvCTVdruH90juumWCwgyIjzXBS5uvM';
const menuSheet = 'Main_Menu';
const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbxIDjOuargjlkMLf_lpfFi4jPW58OoLh2KuS7z5Ve1SoQMiVWciIYqH6SQXytu-2iQ/exec';

let menuItems = [];
let currentOrder = [];
let orderNumber = '1234';

window.currentOrder = currentOrder;
window.DEBUG = { menuItems };

document.addEventListener('DOMContentLoaded', async () => {
  menuItems = await loadMenuData(sheetId, apiKey, menuSheet);
  window.DEBUG.menuItems = menuItems;
  renderMenuItems(menuItems);
  addMenuItemEventListeners();

  const placeOrderBtn = document.querySelector('.place-order-btn');
  placeOrderBtn.addEventListener('click', async () => {
    if (window.currentOrder.length === 0) {
      alert('Please add items to your order.');
      return;
    }

    placeOrderBtn.disabled = true;
    showLoading();

    try {
      const success = await submitOrderToSheet(orderNumber, window.currentOrder, appsScriptUrl);
      if (success) {
        window.currentOrder = [];
        updateOrderDisplay([]);
        orderNumber = generateOrderNumber();
        document.querySelector('.order-subtitle').textContent = `Order #${orderNumber} • Dine In`;
        showToast(`✅ Order #${orderNumber} placed successfully!`);
      }
    } catch (err) {
      alert(`❌ Failed to place order: ${err.message}`);
    } finally {
      hideLoading();
      placeOrderBtn.disabled = false;
    }
  });
});

function generateOrderNumber() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function showLoading() {
  document.getElementById('loading-indicator').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-indicator').classList.add('hidden');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
