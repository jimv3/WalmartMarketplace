const fs = require('fs');

function readFileAndCreateSet(filePath) {
    const set = new Set();
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const lines = fileData.split('\n');

    lines.forEach((line) => {
        set.add(line);
    });

    return set;
}

let missing = [];
const zeroAtWalmart = readFileAndCreateSet('./zero_at_walmart.csv');
const zeroAtIngram = readFileAndCreateSet('./zero_at_ingram.csv');

for (const value of zeroAtIngram.values()) {
    if (!zeroAtWalmart.has(value)) {
        missing.push(value);
    }
}

async function processLineByLine(itemsToZero) {
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
    const todaysDate = new Date(Date.now())
    const year = todaysDate.getFullYear()
    const month = months[todaysDate.getMonth()]
    const day = todaysDate.getDate().toString().padStart(2, "0")
    const hour = todaysDate.getHours().toString().padStart(2, "0")
    const minute = todaysDate.getMinutes().toString().padStart(2, "0")

    let fileNumber = 1
    let fileInfo = {
        "InventoryHeader": {
            "version": "1.4"
        }
    }
    let items = []
    for (const line of itemsToZero) {
        items.push({ "sku": line, "quantity": { "unit": "EACH", "amount": 0 } })

        if (items.length === 10000) {
            fileInfo["Inventory"] = items
            console.log(`File: ${fileNumber}`)
            //console.log(JSON.stringify(fileInfo))
            fs.writeFileSync(`./WalmartFiles/inventory_${year}${month}${day}_${hour}${minute}_${fileNumber}.json`, JSON.stringify(fileInfo))
            items = []
            fileNumber += 1
        }
    }

    if (items.length > 0) {
        fileInfo["Inventory"] = items
        fs.writeFileSync(`./WalmartFiles/inventory_${year}${month}${day}_${hour}${minute}_${fileNumber}.json`, JSON.stringify(fileInfo))
    }
}

processLineByLine(missing);