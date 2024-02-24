const express = require('express');
const axios = require('axios');
const router = express.Router();
// const { readCache } = require('../lib/utils');
const { readCache } = require('../lib/file');
const getInfo = require('../modules/info');

router.get('/request/:address', async (req, res) => {
  const address = req.params.address;
  console.log('-- info request: ', address);

  let token_info = await getInfo(address);

  if (!token_info) {
    return res.status(404).json({ error: 'token not found' });
  } else {
    return res.status(200).json({ status: 'ok' });
  }
});

router.get('/:type/:address', async (req, res) => {
  const address = req.params.address;
  const info_type = req.params.type;

  let filename = `./cache/contracts/${address}/${info_type}.json`;

  console.log(`-- info fetch: ${info_type} ${address}`);

  try {
    let filedata = await readCache(filename);

    let token_info;
    switch (info_type) {
      case 'meta':
        token_info = filedata.tokens;
        token_info = token_info[Object.keys(token_info)[0]];
        break;
      case 'security':
        token_info = filedata.result;
        token_info = token_info[Object.keys(token_info)[0]];
        break;
      case 'scan':
        token_info = filedata.auditLayout;
        break;
      case 'source':
        token_info = filedata[0];

        let sourceCode = token_info.SourceCode;

        // Check if sourceCode is wrapped with {{ }}
        if (sourceCode.startsWith('{{') && sourceCode.endsWith('}}')) {
          sourceCode = sourceCode.slice(1, -1);
        }

        token_info = JSON.parse(sourceCode);

        break;
      default:
        token_info = filedata;
        break;
    }

    res.status(200).send(token_info);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: 'not found' });
  }
});

module.exports = router;
