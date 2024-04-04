const axios = require('axios');
const qs = require('querystring');

// Read the feedId from command line arguments
const feedId = process.argv[2];

// Base-64 encoded value for basic authorization
const walmartAPIKey = process.env.WALMART_API_KEY;

// Generate a GUID for WM_QOS.CORRELATION_ID
const correlationId = generateGUID();

// Function to generate a GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Retrieves an access token from the Walmart Marketplace API.
 * @returns {Promise<string>} The access token.
 * @throws {Error} If there is an error calling the token API.
 */
async function getToken() {
    try {
        const url = 'https://marketplace.walmartapis.com/v3/token';
        const options = {
            method: 'POST',
            headers: {
                Authorization: `Basic ${walmartAPIKey}`,
                'WM_QOS.CORRELATION_ID': correlationId,
                'WM_SVC.NAME': 'Ingram Feed Check',
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: qs.stringify({ 'grant_type': 'client_credentials' }),
            url
        }
        const response = await axios(options);
        return response.data.access_token;
    } catch (error) {
        console.error('Error calling token API:', error.message);
        throw error;
    }
}

/**
 * Retrieves the count of items in a feed.
 * @returns {Promise<number>} The count of items in the feed.
 * @throws {Error} If there is an error calling the feeds API.
 */
async function getFeedItemCount(accessToken) {
    try {
        const response = await axios.get(`https://marketplace.walmartapis.com/v3/feeds?feedId=${feedId}`, {
            headers: {
                'WM_QOS.CORRELATION_ID': correlationId,
                'WM_SVC.NAME': 'Ingram Feed Check',
                Accept: 'application/json',
                'WM_SEC.ACCESS_TOKEN': accessToken
            }
        });
        console.log(`Filename: ${response.data.results.feed[0].fileName}`);
        console.log(`Feed type: ${response.data.results.feed[0].feedType}`);
        console.log(`Feed status: ${response.data.results.feed[0].feedStatus}`);
        return response.data.results.feed[0].feedStatus === 'PROCESSED' ? response.data.results.feed[0].itemsReceived : 0;
    } catch (error) {
        console.error('Error calling feeds API:', error.message);
        throw error;
    }
}

async function getFeedErrors(accessToken, itemCount) {
    let offset = 0;
    let errors = [];
    try {
        while (offset < itemCount) {
            const response = await axios.get(`https://marketplace.walmartapis.com/v3/feeds/${feedId}?includeDetails=true&offset=${offset}`, {
                headers: {
                    'WM_QOS.CORRELATION_ID': correlationId,
                    'WM_SVC.NAME': 'Ingram Feed Check',
                    Accept: 'application/json',
                    'WM_SEC.ACCESS_TOKEN': accessToken
                }
            });
            let responseErrors = response.data.itemDetails.itemIngestionStatus.filter(item => item.ingestionStatus != 'SUCCESS' && !(item.ingestionErrors?.ingestionError?.every(error => error.code === 'PIVI_021')) && !(item.ingestionErrors?.ingestionError?.every(error => error.code === 'ERR_OFFER_2014')));
            if (responseErrors.length > 0) {
                errors = errors.concat(responseErrors.map(item => { return { sku: item.sku, ingestionStatus: item.ingestionStatus, itemErrors: [item.ingestionErrors?.ingestionError?.map(error => `${error.type}:${error.code}:${error.description}`).join(', ')] } }));
            }
            offset += 50;
        }
        console.log(`Read ${offset} items of ${itemCount}.`);
        return errors;
    } catch (error) {
        console.error('Error calling feeds API:', error.message);
        console.error(`Read ${offset} items of ${itemCount} before error occurred.`);
        throw error;
    }
}

(async () => {
    try {
        const accessToken = await getToken();
        const itemCount = await getFeedItemCount(accessToken);
        const errors = await getFeedErrors(accessToken, itemCount);
        console.log('Item count:', itemCount);
        console.log('Errors:', errors);
    } catch (error) {
        console.error('Error:', error.message);
    }
})();