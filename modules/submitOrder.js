// modules/submitOrder.js

export async function submitOrderToSheet(orderNumber, currentOrder, appsScriptUrl) {
  const timestamp = new Date().toISOString();
  const orderItems = currentOrder.map(item => {
    const addOns = item.selectedOptions?.length
      ? ` (${item.selectedOptions.map(opt => opt.name).join(', ')})`
      : '';
    return `${item.name}${addOns} x${item.quantity}`;
  }).join(', ');

  const orderData = [
    [
      orderNumber,
      timestamp,
      JSON.stringify(currentOrder),
      orderItems,
      currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2),
      'Dine In',
      'Card'
    ]
  ];

  try {
    const res = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({ values: orderData })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status} ${res.statusText}`);
    }
    if (!orderData || orderData.length === 0) {
      alert('❌ No order data to submit. Please add items to your order.');
      return false;
    }

    const text = await res.text();
    const result = JSON.parse(text);

    if (result.success) {
      alert(`✅ Order #${orderNumber} placed successfully!`);
      return true;
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (err) {
    alert(`❌ Error: ${err.message}`);
    console.error('Submit failed:', err);
    return false;
  }
}
