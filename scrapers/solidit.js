const axios = require('axios');
const supabase = require('../lib/supabase');

async function fetchBounties(maxPages = null) {
  const baseUrl = 'https://solodit.xyz/api/bounties/';
  let currentPage = 1;
  let totalPages = 0;

  // Define the headers to be used in the request
  const headers = {
    authorization: 'Token 98b30cf101eb0dd220c0024ebda7e9ee906dd5d5',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  };

  do {
    try {
      const response = await axios.get(`${baseUrl}?&page=${currentPage}`, {
        headers,
      });
      const data = response.data;

      if (data.results.length > 0) {
        console.log(`Bounties: Add ${data.results.length} items to database`);
        await addToDatabase(data.results);
      }

      totalPages = data.total_pages;
      currentPage++;

      if (maxPages && currentPage > maxPages) {
        break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      console.log(`Page ${currentPage} of ${totalPages} failed.`);
      break;
    }
  } while (currentPage <= totalPages);
}

async function addToDatabase(items) {
  try {
    items = items.map(item => {
      if (item.firm && typeof item.firm === 'object') {
        return { ...item, firm: JSON.stringify(item.firm) };
      }
      return item;
    });

    const { error } = await supabase.from('bounties').upsert(items);

    if (error) {
      throw error;
    }

    console.log(
      `Bounty: Bulk upsert completed. Items processed: ${items.length}`
    );
  } catch (error) {
    console.error('Bounty: Error in bulk upsert:', error);
  }
}

if (require.main === module) {
  fetchBounties()
    .then(() => console.log('Bounty: Data fetching completed.'))
    .catch(err =>
      console.error('Bounty: Data fetching encountered an error:', err)
    );
} else {
  module.exports = fetchBounties;
}
