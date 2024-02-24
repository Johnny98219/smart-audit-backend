const axios = require('axios');

const endpoint = 'https://graph.defined.fi/graphql';

async function graphqlRequest(query, variables = {}) {
  const requestBody = {
    query,
    variables,
  };

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        authority: 'graph.defined.fi',
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9,ko;q=0.8',
        authorization: process.env.DEFINED_FI_API_KEY,
        'content-type': 'application/json',
        origin: 'https://www.defined.fi',
        referer: 'https://www.defined.fi/',
        'sec-ch-ua':
          '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        'x-amz-user-agent': 'aws-amplify/3.0.7',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Defined request failed:', error);
    return null;
  }
}

// const variables = {
//   ids: [
//     {
//       address: '0xYourTokenAddress',
//       networkId: 1,
//     },
//   ],
// };
const fetchTokens = variables => {
  const query = `
    query GetTokens($ids: [TokenInput!]!) {
      tokens(ids: $ids) {
        address
        decimals
        id
        name
        networkId
        symbol
        imageLargeUrl
        imageSmallUrl
        imageThumbUrl
        explorerData {
          id
          blueCheckmark
          description
          divisor
          tokenPriceUSD
          tokenType
        }
        info {
          address
          circulatingSupply
          id
          imageLargeUrl
          imageSmallUrl
          imageThumbUrl
          isScam
          name
          networkId
          symbol
          totalSupply
        }
        socialLinks {
          bitcointalk
          blog
          coingecko
          coinmarketcap
          discord
          email
          facebook
          github
          instagram
          linkedin
          reddit
          slack
          telegram
          twitch
          twitter
          website
          wechat
          whitepaper
          youtube
        }
      }
    }
  `;
  return graphqlRequest(query, variables);
};

// const variables = {
//   networkFilter: [1],
//   resolution: '1D',
//   limit: 10,
// };
const listTopTokens = variables => {
  const query = `
    query ListTopTokens($networkFilter: [Int!], $resolution: String, $limit: Int) {
      listTopTokens(
        networkFilter: $networkFilter
        resolution: $resolution
        limit: $limit
      ) {
        createdAt
        lastTransaction
        marketCap
        txnCount1
        txnCount4
        txnCount12
        txnCount24
        uniqueBuys1
        uniqueBuys4
        uniqueBuys12
        uniqueBuys24
        uniqueSells1
        uniqueSells4
        uniqueSells12
        uniqueSells24
        ...BaseTokenWithMetadata
      }
    }

    fragment BaseTokenWithMetadata on TokenWithMetadata {
      address
      decimals
      exchanges {
        ...ExchangeModel
      }
      id
      imageLargeUrl
      imageSmallUrl
      imageThumbUrl
      liquidity
      name
      networkId
      price
      priceChange
      priceChange1
      priceChange12
      priceChange24
      priceChange4
      quoteToken
      resolution
      symbol
      topPairId
      volume
    }

    fragment ExchangeModel on Exchange {
      address
      color
      exchangeVersion
      id
      name
      networkId
      tradeUrl
      iconUrl
      enabled
    }
  `;
  return graphqlRequest(query, variables);
};

// const variables = {
//   limit: 30,
//   networkFilter: [1],
//   exchangeFilter: [
//     // ... list of exchange addresses ...
//   ],
//   minLiquidityFilter: 1000,
//   // cursor: optional, if needed
// };
const fetchLatestPairs = variables => {
  const query = `
    query GetLatestPairs(
      $limit: Int, 
      $networkFilter: [Int!], 
      $exchangeFilter: [String!], 
      $minLiquidityFilter: Int, 
      $cursor: String
    ) {
      getLatestPairs(
        networkFilter: $networkFilter
        exchangeFilter: $exchangeFilter
        limit: $limit
        minLiquidityFilter: $minLiquidityFilter
        cursor: $cursor
      ) {
        cursor
        items {
          address
          exchangeHash
          id
          initialPriceUsd
          liquidAt
          liquidity
          liquidityToken
          networkId
          newToken
          nonLiquidityToken
          oldToken
          priceChange
          priceUsd
          transactionHash
          token0 {
            address
            currentPoolAmount
            decimals
            id
            initialPoolAmount
            name
            networkId
            pairId
            poolVariation
            symbol
            __typename
          }
          token1 {
            address
            currentPoolAmount
            decimals
            id
            initialPoolAmount
            name
            networkId
            pairId
            poolVariation
            symbol
            __typename
          }
          __typename
        }
        __typename
      }
    }
  `;
  return graphqlRequest(query, variables);
};

module.exports = {
  fetchTokens,
  listTopTokens,
  fetchLatestPairs,
};
