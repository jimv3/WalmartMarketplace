const fs = require('fs')
const itemsWithOnHand = require('./items.json')
const itemsWithZeroOnHand = require('./onhands.json')
const itemsWithZeroOnHandSkus = itemsWithZeroOnHand.Items.map(item => item.sku)

async function process(fileteredList) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const todaysDate = new Date(Date.now())
    const year = todaysDate.getFullYear()
    const month = months[todaysDate.getMonth()]
    const day = todaysDate.getDate().toString().padStart(2, "0")
    const hour = todaysDate.getHours().toString().padStart(2, "0")
    const minute = todaysDate.getMinutes().toString().padStart(2, "0")

    let fileNumber = 1
    let fileInfo = {
        "InventoryHeader": { "version": "1.4" }, "Inventory": []
    }
    let items = []
    for await (const line of fileteredList) {
        fileInfo.Inventory.push({ "sku": line.sku, "quantity": { "unit": "EACH", "amount": 0 } })


        fs.writeFileSync(`./WalmartFiles/inventory_${year}${month}${day}_${hour}${minute}.json`, JSON.stringify(fileInfo))
        items = []
        fileNumber += 1
    }
}

process(itemsWithOnHand.Items.filter(item => itemsWithZeroOnHandSkus.includes(item.sku)))
