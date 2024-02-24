const express = require('express');
const removeAnnotations = require('../../modules/audit/preprocess');
const { runAudit } = require('../../modules/audit/gpt_auditor');
const { run_critic } = require('../../modules/audit/gpt_critic');
const { run_rank } = require('../../modules/audit/gpt_rank');

const router = express.Router();

router.post('/code', async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    const sourceCode = data.source;
    const processedCode = removeAnnotations(sourceCode);
    const findings = await runAudit(processedCode, 'gpt-4', 0.7, 3, 1, true);
    if (findings.length === 0) {
      res.status(200).json({ message: 'No vulnerabilities found.' });
    } else {
      const findingswithcritic = await run_critic(findings, 'gpt-4', 0, 2);
      console.log({ findingswithcritic });
      const findingswithrank = await run_rank(findingswithcritic);
      console.log(findingswithrank);
      res
        .status(200)
        .json({ message: 'Auditing successful.', findings: findingswithrank });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

module.exports = router;
