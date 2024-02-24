const { gpt, gptUsage } = require('./model');
const {
  auditorPrompt,
  auditorFormatConstraint,
  topkPrompt1,
  topkPrompt2,
} = require('./prompts'); // Adjust paths as necessary

function removeSpaces(str) {
  return str.split(/\s+/).join(' ');
}

function promptWrap(prompt, formatConstraint, code, topk) {
  return `${prompt}${code}${formatConstraint}${topkPrompt1.replace(
    '{topk}',
    topk
  )}${topkPrompt2}`;
}

function auditorResponseParse(auditorOutputs) {
  let outputList = [];

  auditorOutputs.forEach(auditorOutput => {
    try {
      if (typeof auditorOutput === 'string') {
        auditorOutput = JSON.parse(auditorOutput);
      }

      if (auditorOutput && auditorOutput.output_list) {
        if (Array.isArray(auditorOutput.output_list)) {
          outputList = [...outputList, ...auditorOutput.output_list];
        } else {
          console.log(
            'output_list is not an array:',
            auditorOutput.output_list
          );
        }
      } else {
        console.log('output_list not found or invalid in:', auditorOutput);
      }
    } catch (e) {
      console.error('Parsing JSON failed:', e);
    }
  });

  return outputList;
}

async function solve(backend, temperature, topk, numAuditor, code) {
  const auditorInput = promptWrap(
    auditorPrompt,
    auditorFormatConstraint,
    code,
    topk
  );

  try {
    const auditorOutputs = await gpt(
      auditorInput,
      backend,
      temperature,
      numAuditor
    );
    return auditorResponseParse(auditorOutputs);
  } catch (e) {
    console.error(e);
    return [];
  }
}
async function runAudit(
  source_code,
  backend,
  temperature,
  topk,
  numAuditor,
  isCode
) {
  const cleanedCode = removeSpaces(source_code);
  const bugInfoList = await solve(
    backend,
    temperature,
    topk,
    numAuditor,
    cleanedCode
  );

  if (bugInfoList.length === 0) {
    console.log('Auditing failed or no vulnerabilities found.');
    return [];
  } else {
    console.log(bugInfoList);
    console.log('Auditing successful.');
  }

  return isCode
    ? bugInfoList
    : bugInfoList.map(info => ({ ...info, sourceCode: cleanedCode }));
}

module.exports = {
  runAudit,
};
