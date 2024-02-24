const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const NodeCache = require('node-cache');

const statsCache = new NodeCache({ stdTTL: 3600, checkperiod: 120});

async function scrapeWebpage(url) {
    try {
        const response = await axios.get(url);

        const $ = cheerio.load(response.data);
        const scriptContent = $('#__NEXT_DATA__').html();
        // Use Cheerio selectors to extract data from the webpage
        const rows = [];
        $('tbody').each((index, element) => {
            const cells = $(element).find('td.py-5').map((i, el) => {
                return $(el).find('div div:nth-child(2) span').text();
            })
            rows.push(cells);
        });
        return {
            scriptContent,
        };
    } catch (error) {
        console.error('Error scraping webpage:', error);
        return null;
    }
}

function runBugBountyScraper() {
    const url = 'https://immunefi.com/explore/';
    scrapeWebpage(url)
        .then(data => {
            const scrapedData = JSON.parse(data.scriptContent).props.pageProps.bounties;
            // Store the data in cache
            statsCache.set('bugbounties', scrapedData);
            console.log('Scraped data stored in cache');
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

router.get('/', (req, res) => {
    const stats = statsCache.get('bugbounties');
    if (stats === undefined) {
        runBugBountyScraper();
        res.json(statsCache.get('bugbounties'));
    } else {
        res.json(stats);
    }
});
// Schedule the cron job to run every 1 hour
cron.schedule('0 * * * *',runBugBountyScraper);
module.exports = router;

