// views/CheckoutPage.js
import { updateOrderDisplay } from '../modules/uiManager.js';
import { submitOrderToSheet } from '../modules/submitOrder.js';
import { CONFIG } from '../config.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { showToast } from '../components/Toast.js';

export function initCheckoutPage() {
  console.log('💳 Initializing Checkout Page...');

  if (!window.currentOrder) window.currentOrder = [];

  // อัปเดตหน้าจอคำสั่งซื้อ
  updateOrderDisplay(window.currentOrder);

  // เชื่อมปุ่ม Place Order
  const placeOrderBtn = document.querySelector('.place-order-btn');
  const orderSubtitle = document.querySelector('.order-subtitle');

  let orderNumber = generateOrderNumber();
  orderSubtitle.textContent = `Order #${orderNumber} • Dine In`;

  placeOrderBtn?.addEventListener('click', async () => {
    if (window.currentOrder.length === 0) {
      alert('กรุณาเพิ่มเมนูก่อนสั่งซื้อ');
      return;
    }

    // ปิดปุ่มกันกดซ้ำ
    placeOrderBtn.disabled = true;

    const success = await submitOrderToSheet(orderNumber, window.currentOrder, CONFIG.appsScriptUrl);

    if (success) {
      window.currentOrder = [];
      updateOrderDisplay([]);
      orderNumber = generateOrderNumber();
      orderSubtitle.textContent = `Order #${orderNumber} • Dine In`;
    }

    placeOrderBtn.disabled = false;
  });
}

showToast('✅ Order Placed!');
