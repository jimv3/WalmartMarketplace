const fs = require('fs')
const readline = require('readline')

async function processLineByLine(fileName) {
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
    const fileStream = fs.createReadStream(fileName)
    const todaysDate = new Date(Date.now())
    const year = todaysDate.getFullYear()
    const month = months[todaysDate.getMonth()]
    const day = todaysDate.getDate().toString().padStart(2, "0")
    const hour = todaysDate.getHours().toString().padStart(2, "0")
    const minute = todaysDate.getMinutes().toString().padStart(2, "0")

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let fileNumber = 1
    let fileInfo = {
        "InventoryHeader": {
            "version": "1.4"
        }
    }
    let items = []
    for await (const line of rl) {
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


if (process.argv.length < 3) {
    console.log("Usage: node retireitems.js <file>")
}
else {
    processLineByLine(process.argv[2])
}
