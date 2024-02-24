function parseTransactionResponse(response) {
  let {
    hash,
    chain,
    from,
    fromAddressLabel,
    to,
    toAddressLabel,
    gasPrice,
    gasUsed,
    inputDecoded,
    nonce,
    block,
    value,
  } = response;
  const fromLabel = response.toAddressLabel
    ? response.toAddressLabel.label
    : '';
  const approveAddress = inputDecoded.args.match(/0x[a-fA-F0-9]{40}/)[0];
  const status = response.status || 'pending';
  const gasPriceInGwei = gasPrice / 1e9;
  const fee = gasUsed ? `Ξ${((gasPrice * gasUsed) / 1e18).toFixed(9)}` : 'N/A';

  // Placeholder for time as the timestamp is not provided in the response
  //   const time = 'Timestamp not available'; // Update this based on the actual timestamp
  from = fromAddressLabel ? fromAddressLabel.label : from;
  to = toAddressLabel ? toAddressLabel.label : to;

  let action = `sent Ξ${value.toFixed(6)}`;
  if (inputDecoded) {
    // parse json string in inputDecoded.args
    const args = JSON.parse(inputDecoded.args);
    switch (inputDecoded.function) {
      case 'approve':
        action = inputDecoded.function + ' ' + args[0].arg;
        break;
      case 'transferFrom':
        action = inputDecoded.function + ' ' + args[0].arg + ' ' + args[1].arg;
        break;
      default:
        break;
    }
    action = inputDecoded.function + ' ' + approveAddress;
  }

  if (inputDecoded) {
    const args = JSON.parse(inputDecoded.args);
    console.log(args);
  }

  return `
  ${hash}
  ├── Status  ${status}
  ├── From    ${from}
  │    └─ To  ${to}
  └── Action  ${action}`;
}

// Formatting the output
//   return `
//       tx: ${hash}
//       status: ${status}
//       time: ${time}
//       chain: ${chain === 'eth' ? 'ethereum' : chain}
//       from: ${from} ${fromLabel}
//       note: approve ${approveAddress}
//       gas: ${gasPriceInGwei.toFixed(3)} gwei(${gasUsed} used)
//       fee: ${fee}
//       block: ${block || 'Not available'} [tx index: ${nonce}]
//     `;
// }

// Example response
const response = {
  block: null,
  call: '0x095ea7b3',
  chain: 'eth',
  contract_creation: null,
  error: null,
  from: '0xdedc1f006aa8b726936cf3224fd7181f559f8cdb',
  fromAddressLabel: null,
  gasLimit: null,
  gasPrice: 19967699614,
  gasUsed: null,
  hash: '0xe4f6d3a4d0126088eaa784ecb9ef337e719e44b309bf4c197cedcdee9249ac67',
  index: null,
  input:
    '0x095ea7b300000000000000000000000077edae6a5f332605720688c7fda7476476e8f83f00000000000000000000000000000000000000000000000031a900c91609e6ea',
  inputDecoded: {
    args: '[{"arg":"0x77edae6a5f332605720688c7fda7476476e8f83f","name":"spender"},{"arg":3578392242580743914,"name":"amount"}]',
    function: 'approve',
  },
  logs: [],
  marketData: [],
  nonce: '5',
  state: 'pending',
  status: null,
  timestamp: null,
  to: '0xc0200b1c6598a996a339196259ffdc30c1f44339',
  toAddressLabel: {
    address: '0xc0200b1c6598a996a339196259ffdc30c1f44339',
    label: 'KEK',
    src: 'name',
    tags: [],
  },
  transfers: [],
  value: 0,
};

console.log(parseTransactionResponse(response));
