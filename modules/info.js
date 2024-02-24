const path = require('path');
const axios = require('axios');
const { getCached, fetchCache, readCache } = require('../lib/file');
const { fetchTokens } = require('../lib/third-party/defined');
const etherscanRequest = require('../lib/third-party/etherscan');

async function getMetadata(address) {
  const variables = {
    ids: [
      {
        address: address,
        networkId: 1,
      },
    ],
  };

  const data = await fetchTokens(variables);
  if (data) {
    return data.data;
  } else {
    return null;
  }
}

async function getMetadata2(address) {
  const token_url = `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${address}`;
  const token_info_url = `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${address}/info`;

  try {
    const token_response = await fetch(token_url);
    const token_data = await token_response.json();

    const token_info_response = await fetch(token_info_url);
    const token_info_data = await token_info_response.json();

    const description = token_info_data.data.attributes.description;

    if (token_data.errors || token_info_data.errors) {
      return null;
    }

    const formatted_desc = description
      .replace(/\r\n/g, '\n')
      .toLowerCase()
      .split('. ')
      .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
      .join('. ');

    const compiled_data = [
      {
        address: address,
        decimals: parseInt(token_data.data.attributes.decimals),
        id: `${address}:1`,
        name: token_data.data.attributes.name,
        networkId: 1,
        symbol: token_data.data.attributes.symbol,
        imageLargeUrl: token_info_data.data.attributes.image_url,
        imageSmallUrl: token_info_data.data.attributes.image_url,
        imageThumbUrl: token_info_data.data.attributes.image_url,
        explorerData: {
          id: `${address}:1`,
          blueCheckmark: false,
          description: formatted_desc,
          divisor: parseInt(token_data.data.attributes.decimals),
          tokenPriceUSD: token_data.data.attributes.price_usd,
          tokenType: token_data.data.type === 'token' ? 'ERC20' : 'ERC721',
        },
        info: {
          address: address,
          circulatingSupply: token_data.data.attributes.fdv_usd,
          id: `${address}:1`,
          imageLargeUrl: token_info_data.data.attributes.image_url,
          imageSmallUrl: token_info_data.data.attributes.image_url,
          imageThumbUrl: token_info_data.data.attributes.image_url,
          isScam: null,
          name: token_data.data.attributes.name,
          networkId: 1,
          symbol: token_data.data.attributes.symbol,
          totalSupply: parseInt(token_data.data.attributes.total_supply),
        },
        socialLinks: {
          bitcointalk: '',
          blog: '',
          coingecko: token_info_data.data.attributes.coingecko_coin_id
            ? `https://www.coingecko.com/en/coins/${token_info_data.data.attributes.coingecko_coin_id}`
            : null,
          coinmarketcap: null,
          discord: token_info_data.data.attributes.discord_url,
          email: '',
          facebook: '',
          github: '',
          instagram: null,
          linkedin: '',
          reddit: '',
          slack: '',
          telegram: token_info_data.data.attributes.telegram_handle
            ? `https://t.me/${token_info_data.data.attributes.telegram_handle}`
            : null,
          twitch: null,
          twitter: token_info_data.data.attributes.twitter_handle
            ? `https://x.com/${token_info_data.data.attributes.twitter_handle}`
            : null,
          website: token_info_data.data.attributes.websites[0],
          wechat: '',
          whitepaper: '',
          youtube: null,
        },
      },
    ];

    return { tokens: compiled_data };
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

async function getScan(address) {
  try {
    const response = await axios.post(
      'https://www.coinscope.co/api/search/cyberscan',
      {
        address: address,
        network: 'ETH',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    return data;
  } catch (error) {
    console.error('Error making the request', error);
    return null;
  }
}

async function getSource(address) {
  try {
    let data = await etherscanRequest('contract', 'getsourcecode', {
      address: address,
    });

    return data;
  } catch (error) {
    console.error('Error making the request', error);
    return null;
  }
}

async function getPair(filepath) {
  try {
    const { CurlImpersonate } = require('node-curl-impersonate');

    const security = await readCache(filepath + 'security.json');
    const tokenData = security.result[Object.keys(security.result)[0]];
    const dexes = tokenData.dex;

    console.log('dexes', dexes);

    let highestLiquidityDex = dexes[0];
    for (const dex of dexes) {
      if (
        parseFloat(dex.liquidity) > parseFloat(highestLiquidityDex.liquidity)
      ) {
        highestLiquidityDex = dex;
      }
    }

    const pair = highestLiquidityDex.pair;

    const url = `https://www.dextools.io/shared/data/pair?address=${pair}&chain=ether&audit=true&locks=true`;

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        Referer: `https://www.dextools.io/app/en/ether/pair-explorer/${pair}`,
      },
      impersonate: 'chrome-116',
      verbose: false,
    };

    const curl = new CurlImpersonate(url, options);

    curl
      .makeRequest()
      .then(response => {
        data = response.response;
        console.log(data);
        return data;
      })
      .catch(error => {
        console.error('Error:', error);
        return null;
      });
  } catch (error) {
    return null;
  }
}

const requestRegistry = {};

async function getInfo(address) {
  const filepath = './cache/contracts/' + address + '/';

  if (requestRegistry[address]) {
    console.log(`Waiting for ongoing request for address: ${address}`);
    return requestRegistry[address];
  }

  const requestPromise = (async () => {
    try {
      await Promise.all([
        fetchCache(
          filepath + 'info.json',
          `https://eth.blockscout.com/api/v2/tokens/${address}`,
          3
        ),
        getCached(filepath + 'meta.json', getMetadata2, 86400, address),
        getCached(filepath + 'source.json', getSource, 43200, address),
        fetchCache(
          filepath + 'security.json',
          `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${address}`,
          1,
          3600
        ),
        fetchCache(
          filepath + 'rugpull.json',
          `https://api.gopluslabs.io/api/v1/rugpull_detecting/1?contract_addresses=${address}`,
          1,
          3600
        ),
        getCached(filepath + 'scan.json', getScan, 3600, address),
      ]);

      // await getCached(filepath + 'pair.json', getPair, 3600, filepath);
      //   await getCached(filepath + 'meta2.json', getMetadata2, 86400, address);

      return true;
    } catch (error) {
      console.error('Error in getInfo:', error);
      return false;
    } finally {
      delete requestRegistry[address];
    }
  })();

  requestRegistry[address] = requestPromise;
  return requestPromise;
}

module.exports = getInfo;
