const { getCached, readCache } = require('../../lib/file');
const { flattenSourcecode } = require('../../lib/utils');
const { summaryPrompt } = require('./prompts');
const OpenAI = require('openai');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const openai = require('../../lib/openai');

const getFunctionsData = async props => {
  let internalCount = 0;
  let publicCount = 0;
  let pureCount = 0;
  let viewCount = 0;
  let payableCount = 0;
  let totalFunctions = 0;

  props.functions.tableRows.forEach(row => {
    if (row.type === 'func') {
      totalFunctions++;
      if (row.spec.includes('Internal 🔒')) {
        internalCount++;
      } else if (row.spec.includes('Public ❗️')) {
        publicCount++;
      }
    }
  });

  props.abi.forEach(item => {
    if (item.type === 'function') {
      if (item.stateMutability === 'pure') {
        pureCount++;
      } else if (item.stateMutability === 'view') {
        viewCount++;
      } else if (item.payable) {
        payableCount++;
      }
    }
  });

  const privateFunctionPattern = /function\s+\w+\s*\([^)]*\)\s*private/g;
  const payableFunctionPattern = /function\s+\w+\s*\([^)]*\)\s*payable/g;
  const pureFunctionPattern = /function\s+\w+\s*\([^)]*\)\s*pure/g;

  const privateMatches = props.source.match(privateFunctionPattern);
  const payableMatches = props.source.match(payableFunctionPattern);
  const pureMatches = props.source.match(pureFunctionPattern);

  const privateCount = privateMatches ? privateMatches.length : 0;
  pureCount = pureMatches ? pureMatches.length : 0;
  return [
    internalCount,
    publicCount,
    pureCount,
    viewCount,
    payableCount,
    totalFunctions,
    privateCount,
  ];
};

const getFindingsData = async findings => {
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  findings.forEach(finding => {
    if (finding.severity === 'HIGH') {
      highCount++;
    } else if (finding.severity === 'MEDIUM') {
      mediumCount++;
    } else if (finding.severity === 'LOW') {
      lowCount++;
    }
  });
  return [highCount, mediumCount, lowCount];
};

const getGPTSummary = async prompt => {
  const params = (OpenAI.Chat.ChatCompletionCreateParams = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  const completion = await openai.chat.completions.create(params);
  return completion.choices[0]?.message?.content;
};

const generateString = async data => {
  let description = '';

  const sell_tax = data.sell_tax * 100;
  description +=
    sell_tax == 0
      ? 'No sell tax, which is great. '
      : `Sell tax is ${sell_tax}%, ${
          sell_tax >= 9
            ? 'extremely high.'
            : sell_tax >= 5
            ? 'a bit high.'
            : 'normal.'
        }`;

  description += '\n';

  const buy_tax = data.buy_tax * 100;
  description +=
    buy_tax == 0
      ? 'No buy tax, which is great. '
      : `Buy tax is ${buy_tax}%, ${
          buy_tax >= 9
            ? 'extremely high.'
            : buy_tax >= 5
            ? 'a bit high.'
            : 'normal.'
        }`;

  description += '\n';

  description +=
    data.is_honeypot == 0
      ? 'Not a honeypot, which is typical.'
      : 'DANGER: This is a honeypot. Owners can withhold funds.';

  description += '\n';

  description +=
    data.is_antiwhale == 0
      ? 'Not antiwhale, which is concerning. '
      : 'Antiwhale measures are in place, which is good. ';

  description += '\n';

  description +=
    data.is_mintable == 0
      ? 'Not mintable, maintaining token scarcity. '
      : 'Mintable, which can increase token supply.';

  description += '\n';

  description +=
    data.blacklisted == 1
      ? 'Blacklisting function exists, not ideal but also normal.'
      : 'No blacklisting, allowing unrestricted trading.';

  description += '\n';

  description +=
    data.is_in_dex == 1
      ? 'Listed in a dex, which is normal.'
      : 'Not listed in a dex, which is unusual.';

  description += '\n';

  const holder_count = (Number(data.holder_count) / 1000) * 1000;
  description +=
    Number(data.holder_count) > 1000
      ? `Over ${holder_count} holders, indicating good adoption.`
      : 'Less than 1000 holders, indicating low adoption.';

  description += '\n';

  description +=
    Number(data.lp_holder_count) > 0
      ? `More than ${data.lp_holder_count} LP holders, which is positive.`
      : 'Less than 2 LP holders, which is slightly concerning. It may still be very early in the project.';

  description += '\n';

  if (data.number_of_high_severity_issues > 0) {
    description += `${data.number_of_high_severity_issues} high severity issue${
      data.number_of_high_severity_issues > 1 ? 's' : ''
    } that are very risky and warrant immediate attention, `;
  } else {
    description += `no high severity issues, which is excellent news, `;
  }

  if (data.number_of_medium_severity_issues > 0) {
    description += `${
      data.number_of_medium_severity_issues
    } medium severity issue${
      data.number_of_medium_severity_issues > 1 ? 's' : ''
    } suggesting caution, `;
  } else {
    description += `no medium severity issues, `;
  }

  if (data.number_of_low_severity_issues > 0) {
    description += `and ${
      data.number_of_low_severity_issues
    } low severity issue${
      data.number_of_low_severity_issues > 1 ? 's' : ''
    }, which are not typically a cause for immediate concern. `;
  } else {
    description += `and no low severity issues. `;
  }

  if (
    data.number_of_high_severity_issues === 0 &&
    data.number_of_medium_severity_issues === 0 &&
    data.number_of_low_severity_issues === 0
  ) {
    description += `Overall, this is indicative of a robust and secure codebase with no significant risks identified.`;
  } else if (
    data.number_of_high_severity_issues === 0 &&
    data.number_of_medium_severity_issues === 0
  ) {
    description += `Overall, the lack of medium and high severity issues suggests a sound security posture, although low severity issues should be attended to (if possible) in due course.`;
  } else {
    description += `Overall, the findings warrant careful attention to enhance the security and trustworthiness of the codebase.`;
  }

  return description;
};

async function createSummary(address) {
  const basePath = `./cache/contracts/${address}/`;

  //   console.log(`basePath: ${basePath}`);

  //   console.log(`current working directory: ${process.cwd()}`);

  //   //   server/cache/contracts/0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3/findings.json

  //   // current working directory for this file:
  //   console.log(`__dirname: ${__dirname}`);

  //   const check = fileExists(`${basePath}functions.json`);
  //   const findings2 = await readCache(
  //     `./cache/contracts/${address}/functions.json`
  //   );

  //   console.log(`----findings length: ${findings2}`);

  //   if (!check) {
  //     throw new Error('No data found');
  //   } else {
  //     console.log('Data found');
  //     throw new Error('---- found');
  //   }

  const security = await readCache(`${basePath}security.json`);
  const functions = await readCache(`${basePath}functions.json`);
  const findings = await readCache(`${basePath}findings.json`);
  let source = await readCache(`${basePath}source.json`);
  let abi = JSON.parse(source[0].ABI);
  source = flattenSourcecode(source);

  const functionsData = await getFunctionsData({
    functions: functions,
    abi: abi,
    source: source,
  });
  const findingsData = await getFindingsData(findings);
  const parsedSecurity = security.result[address.toLowerCase()];

  const data = {
    token_name: parsedSecurity.token_name,
    token_symbol: parsedSecurity.token_symbol,
    is_honeypot: parsedSecurity.is_honeypot,
    blacklisted: parsedSecurity.is_blacklisted,
    external_functions: functionsData[1],
    internal_functions: functionsData[0],
    private_functions: functionsData[6],
    view_functions: functionsData[3],
    pure_functions: functionsData[2],
    payable_functions: functionsData[4],
    total_functions: functionsData[5],
    number_of_medium_severity_issues: findingsData[1],
    number_of_high_severity_issues: findingsData[0],
    number_of_low_severity_issues: findingsData[2],
    is_antiwhale: parsedSecurity.is_anti_whale,
    buy_tax: parsedSecurity.buy_tax,
    holder_count: parsedSecurity.holder_count,
    is_mintable: parsedSecurity.is_mintable,
    is_in_dex: parsedSecurity.is_in_dex,
    is_open_source: parsedSecurity.is_open_source,
    lp_holder_count: parsedSecurity.lp_holder_count,
    total_supply: parsedSecurity.total_supply,
    sell_tax: parsedSecurity.sell_tax,
  };
  const notes = await generateString(data);
  const refineprompt = summaryPrompt
    .replace('***notes***', notes)
    .replace('***name***', data.token_name)
    .replace('***symbol***', data.token_symbol);
  console.log(refineprompt);
  const summary = await getGPTSummary(refineprompt);

  return { text: summary, table: data };
}

const getSummary = async address => {
  try {
    const cacheFile = path.join(
      __dirname,
      `../../cache/contracts/${address}/summary.json`
    );

    await getCached(cacheFile, createSummary, 2592000, address); // 30 days (2592000 seconds)

    return true;
  } catch (error) {
    console.error('Error in getSummary:', error);
    return false;
  }
};
// createAuditSummery("0x514910771AF9Ca656af840dff83E8264EcF986CA")
module.exports = getSummary;
