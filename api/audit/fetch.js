const express = require('express');
const { readCache } = require('../../lib/file');
const router = express.Router();
const path = require('path');
const { flattenSourcecode } = require('../../lib/utils');

router.get('/fetch/:address', async (req, res) => {
  const address = req.params.address;

  let filedata = await readCache(
    path.join(__dirname, `../../cache/contracts/${address}/source.json`)
  );
  let source_code = filedata;
  source_code = flattenSourcecode(source_code);

  const securityCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/security.json`
  );
  const rugpullCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/rugpull.json`
  );
  const tokenCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/info.json`
  );
  const metadataCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/meta.json`
  );
  const functionsCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/functions.json`
  );
  const dependenciesCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/dependencies.json`
  );
  const treeCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/tree.json`
  );
  const statsCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/stats.json`
  );
  const findingsCacheFile = path.join(
    __dirname,
    `../../cache/contracts/${address}/findings.json`
  );
  const securityCache = await readCache(securityCacheFile);
  const rugpullCache = await readCache(rugpullCacheFile);
  const tokenCache = await readCache(tokenCacheFile); // TODO: Fetch & cache, this is realtime data (can be cached upto 1min)
  const metadataCache = await readCache(metadataCacheFile);
  const treeCache = await readCache(treeCacheFile);
  const statsCache = await readCache(statsCacheFile); // ???? Not used
  const findingsCache = await readCache(findingsCacheFile);
  const functionsCache = await readCache(functionsCacheFile);
  const dependenciesCache = await readCache(dependenciesCacheFile);

  const files = [];
  const solidity = filedata['data'];

  if (solidity) {
    delete solidity['abi'];
    delete solidity['creation_bytecode'];
    delete solidity['source_code'];
    delete solidity['deployed_bytecode'];
    delete solidity['decoded_constructor_args'];
    delete solidity['sourcify_repo_url'];

    for (let i = 0; i < solidity['additional_sources']?.length; i++) {
      files.push(solidity['additional_sources'][i]['file_path']);
    }

    delete solidity['additional_sources'];
  }

  let parse_meta = metadataCache['tokens'][0];
  let parse_token = tokenCache;
  //   let parse_functions = functionsCache["data"];
  //   let parse_dependencies = dependenciesCache["data"];
  let parse_rugpull = rugpullCache['result'];
  let parse_security = securityCache['result'];

  parse_security = parse_security[Object.keys(parse_security)[0]];

  try {
    return res.status(200).send({
      token: parse_token,
      metadata: parse_meta,
      security: parse_security,
      rugpull: parse_rugpull,
      functions: functionsCache,
      dependencies: dependenciesCache,
      files: files,
      solidity: solidity,
      code: {
        tree: treeCache,
        code: source_code,
        findings: findingsCache,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
