const axios = require('axios');

const endpoint = 'https://api.parsec.finance/graphql'; // 172.67.184.81:443

async function graphqlRequest(query, variables = {}) {
  const requestBody = {
    query,
    variables,
  };

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'GUEST',
        Origin: 'https://parsec.fi',
        Referer: 'https://parsec.fi/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Parsec request failed:', error);
    return null;
  }
}

const fetchContractLogsIntervals = variables => {
  const query = `
    query ContractLogsIntervals(
      $address: String!,
      $log: String!,
      $logInput: String!,
      $since: Int!,
      $interval: String!,
      $chain: String,
      $operator: String,
      $filters: [LogFilter]
    ) {
      contract(address: $address, chain: $chain) {
        chain
        address
        name
        logIntervals(
          log: $log
          since: $since
          filters: $filters
          logInput: $logInput
          interval: $interval
          operator: $operator
        ) {
          startTs
          endTs
          value
        }
      }
    }
  `;
  return graphqlRequest(query, variables);
};

const fetchTokenHolders = variables => {
  const query = `
    query TokenHolders(
        $limit: Int!, 
        $symbol: String, 
        $address: String, 
        $chain: String!
      ) {
      token(symbol: $symbol, address: $address, chain: $chain) {
        symbol
        address
        chain
        decimals
        usdPrice
        totalSupply
        topHolders(limit: $limit) {
          address
          addressLabel {
            src
            tags
            label
            address
          }
          balance
        }
      }
    }
  `;
  return graphqlRequest(query, variables);
};

const fetchLiquidityPool = variables => {
  const query = `
    query LiquidityPool(
      $poolAddress: String!,
      $exchange: String!,
      $binWidth: Float!,
      $limit: Int!,
      $x3BinWidth: Float!,
      $x3Limit: Int!,
      $x10BinWidth: Float!,
      $x10Limit: Int!
    ) {
      liquidityPool(poolAddress: $poolAddress, exchange: $exchange) {
        address
        books(
          binWidths: [$binWidth, $x3BinWidth, $x10BinWidth]
          limits: [$limit, $x3Limit, $x10Limit]
          relativeBinWidth: true
        ) {
          asks {
            p0
            p1
            qty
          }
          bids {
            p0
            p1
            qty
          }
          price
        }
      }
    }
  `;
  return graphqlRequest(query, variables);
};

const fetchTx = variables => {
  const query = `
    query Tx($hash: String!, $chain: String!) {
      tx(hash: $hash, chain: $chain) {
        hash
        to
        from
        chain
        gasUsed
        gasPrice
        gasLimit
        input
        call
        nonce
        index
        status
        value
        state
        error
        contract_creation
        timestamp
        block
        toAddressLabel {
          src
          label
          address
          tags
        }
        fromAddressLabel {
          src
          label
          address
          tags
        }
        marketData {
          type
          data
        }
        inputDecoded {
          function
          args
        }
        logs {
          address
          addressLabel {
            src
            label
            tags
            address
          }
          data
          name
          index
          topic
          rawData
          dataLabels
        }
        transfers {
          timestamp
          to
          from
          value
          address
          symbol
          decimals
          usdPrice
          imgSrc
          isNft
          toLabel {
            src
            label
            address
            tags
          }
          fromLabel {
            src
            label
            address
            tags
          }
        }
      }
    }
  `;

  return graphqlRequest(query, variables);
};

module.exports = {
  fetchContractLogsIntervals,
  fetchTokenHolders,
  fetchLiquidityPool,
  fetchTx,
};
