export function addToOrder(currentOrder, item, quantity) {
    const selectedOptions = item.selectedOptions || [];

    // สร้าง itemKey โดยอิงจาก option group เพื่อให้ไม่ชนกัน
    const optionKey = selectedOptions
        .map(opt => `${opt.group}:${opt.name}`)
        .sort()
        .join('|');

    const itemKey = `${item.id}|${optionKey}`;

    // คำนวณราคารวม base + options
    let totalPrice = parseFloat(item.base_price);
    selectedOptions.forEach(opt => {
        totalPrice += parseFloat(opt.price);
    });

    const existingIndex = currentOrder.findIndex(orderItem => orderItem.key === itemKey);

    if (existingIndex !== -1) {
        currentOrder[existingIndex].quantity += quantity;
    } else {
        currentOrder.push({
            key: itemKey,
            id: item.id,
            name: item.name,
            price: totalPrice,
            quantity: quantity,
            selectedOptions: selectedOptions
        });
    }

    return currentOrder;
}
