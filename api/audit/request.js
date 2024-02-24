const express = require('express');
const {
  isERC20Token,
  insertRequestdb,
  isContractOpenSource,
  supabase,
} = require('../../lib/utils');
const { fileExists } = require('../../lib/file');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const {
  NEW_AUDIT_RETURN_CODE,
  AUDIT_STATUS_RETURN_CODE,
} = require('./statusCodes');
const { get } = require('http');

async function getAuditRequest(address) {
  const { data, error } = await supabase
    .from('audit_requests')
    .select('*')
    .eq('contract', address);

  return { data, error };
}

const processingContracts = new Set();

router.get('/request/:address', async (req, res) => {
  const address = req.params.address;
  console.log('audit request: ', address);

  const { data: auditRequests, error } = await supabase
    .from('audit_requests')
    .select('contract')
    .eq('contract', address);

  if (error) {
    return res.status(500).send(NEW_AUDIT_RETURN_CODE.errorFetchingDb);
  }

  if (auditRequests.length) {
    return res.status(404).send(NEW_AUDIT_RETURN_CODE.requested);
  }

  const filename = path
    .join(__dirname, `./cache/contracts/${address}/source.json`)
    .toString();

  if (fileExists(filename)) {
    return res.status(404).send(NEW_AUDIT_RETURN_CODE.alreadyExist);
  }

  const [isErc20, isOpenSrc] = await Promise.all([
    isERC20Token(address),
    isContractOpenSource(address),
  ]);

  if (!isErc20) {
    return res.status(404).send(NEW_AUDIT_RETURN_CODE.notErc20);
  }

  if (!isOpenSrc) {
    return res.status(404).send(NEW_AUDIT_RETURN_CODE.notOpenSource);
  }

  if (processingContracts.has(address)) {
    return res.status(404).send(NEW_AUDIT_RETURN_CODE.requested);
  }

  processingContracts.add(address);

  try {
    await insertRequestdb({ contract: address, status: 'pending' });
    return res.status(200).send(NEW_AUDIT_RETURN_CODE.success);
  } catch (error) {
    if (error.code && error.code === '23505') {
      return res.status(404).send(NEW_AUDIT_RETURN_CODE.requested);
    } else {
      return res.status(500).send(NEW_AUDIT_RETURN_CODE.errorFetchingDb);
    }
  } finally {
    processingContracts.delete(address);
  }
});

module.exports = router;
