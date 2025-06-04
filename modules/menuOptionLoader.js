export async function loadMenuData(sheetId, apiKey, menuSheet) {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${menuSheet}?key=${apiKey}`);
    const data = await res.json();

    const { optionGroups, allOptions } = await loadOptionData(sheetId, apiKey);

    const menuItems = processMenuData(data.values, optionGroups, allOptions);
    return menuItems;
}

export async function loadOptionData(sheetId, apiKey) {
    const [groupRes, optionRes] = await Promise.all([
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Option_Groups?key=${apiKey}`),
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Options?key=${apiKey}`)
    ]);

    const groupJson = await groupRes.json();
    const optionJson = await optionRes.json();

    const groupRows = groupJson.values.slice(1); // skip header
    const optionRows = optionJson.values.slice(1);

    const optionGroups = groupRows.map(row => ({
        group_id: row[0],
        menu_ids: row[1]?.split(',').map(id => id.trim()) || [],
        name: row[2],
        type: row[3] || 'multi'
    }));

    const allOptions = optionRows.map(row => ({
        option_id: row[0],
        group_id: row[1],
        name: row[2],
        price: parseFloat(row[3]) || 0
    }));

    return { optionGroups, allOptions };
}

export function processMenuData(values, optionGroups, allOptions) {
    const headers = values[0];
    const rows = values.slice(1);

    const menuItems = rows.map(row => {
        const item = {};
        headers.forEach((key, index) => {
            item[key.toLowerCase().replace(/\s/g, '_')] = row[index] || '';
        });

        // ดึงเฉพาะ group ที่ menu_id ตรงกับเมนูนี้
        const matchedGroups = optionGroups.filter(group => group.menu_ids.includes(item.id));

        item.option_groups = matchedGroups.map(group => {
            const options = allOptions.filter(opt => opt.group_id === group.group_id);
            return {
                name: group.name,
                type: group.type,
                options: options.map(opt => ({
                    name: opt.name,
                    price: opt.price
                }))
            };
        });

        return item;
    });

    return menuItems;
}
