// modules/submitOrder.js
// All import/export statements removed. Use window.firebaseConfig and window.addOrder for Firebase.

window.submitOrder = function(orderNumber, currentOrder, paymentMethod = 'Cash') {
  // Compose order data
  const orderData = {
    orderNumber: orderNumber,
    items: currentOrder,
    paymentMethod: paymentMethod,
    timestamp: new Date().toISOString()
  };
  // Use the global addOrder function from firebaseApi.js
  return window.addOrder(orderData);
}
