// /api/audit/index.js
const express = require('express');
const router = express.Router();

const fetch = require('./request');
const request = require('./fetch');
const status = require('./status');
const code = require('./code');

router.use(fetch);
router.use(request);
router.use(status);
router.use(code);

module.exports = router;
