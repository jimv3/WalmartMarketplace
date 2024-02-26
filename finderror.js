const feedErrors = require('./page1status.json')

console.log(feedErrors.itemDetails.itemIngestionStatus.filter(status => status.ingestionStatus != "SUCCESS"))