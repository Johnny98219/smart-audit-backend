const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/live/:address', async (req, res) => {
  const address = req.params.address;
  //   console.log('token live request: ', address);

  const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;

  try {
    const response = await axios.get(url);
    const filedata = response.data;
    const pair = filedata['pairs'][0];

    // remove unnecessary fields
    delete pair['url'];

    res.status(200).send(pair);
  } catch (error) {
    res.status(404).send('Error fetching data');
  }
});

module.exports = router;
