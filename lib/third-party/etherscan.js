const axios = require('axios');

const endpoint = 'https://api.etherscan.io/api';
const maxRetries = 3;
const retryDelay = 1500;

async function etherscanRequest(module, action, params = {}) {
  const queryParams = new URLSearchParams({
    module: module,
    action: action,
    ...params,
    apikey: process.env.ETHERSCAN_API_KEY,
  }).toString();

  const url = `${endpoint}?${queryParams}`;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.status !== '0') {
        return response.data.result;
      } else {
        console.log(
          `Etherscan request failed: ${url} -- ${response.data.message}`
        );
      }
    } catch (error) {
      console.error('Etherscan request failed, retrying...', error);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        return null;
      }
    }
  }
}

module.exports = etherscanRequest;
