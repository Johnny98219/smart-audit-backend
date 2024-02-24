const { gpt } = require('./model');
const fs = require('fs');
const path = require('path');
const {
  criticFormatConstraint,
  criticZeroShotPrompt,
  criticFewShotPrompt,
} = require('./prompts');

function critic_prompt_wrap(vul_info_list) {
  let index = 0;
  let vul_info_str = '';
  for (let vul_info of vul_info_list) {
    let function_name = vul_info['function_name'];
    let function_code = vul_info['code'];
    let vulnerability = vul_info['vulnerability'];
    let reason = vul_info['reason'];
    vul_info_str +=
      'function_name: ' +
      function_name +
      '\n' +
      'code: ' +
      function_code +
      '\n' +
      'vulnerability' +
      ': ' +
      vulnerability +
      '\n' +
      'reason: ' +
      reason +
      '\n------------------\n';
    index += 1;
  }

  return criticZeroShotPrompt + vul_info_str + criticFormatConstraint;
}
function critic_response_parse(critic_outputs) {
  let output_list = [];

  critic_outputs.forEach(auditor_output => {
    try {
      if (typeof auditor_output === 'string') {
        auditor_output = JSON.parse(auditor_output);
      }

      if (auditor_output && auditor_output.output_list) {
        if (Array.isArray(auditor_output.output_list)) {
          output_list = [...output_list, ...auditor_output.output_list];
        } else {
          console.log(
            'output_list is not an array:',
            auditor_output.output_list
          );
        }
      } else {
        console.log('output_list not found or invalid in:', auditor_output);
      }
    } catch (e) {
      console.error('Parsing JSON failed:', e);
    }
  });
  return output_list;
}
async function run_critic(
  auditor_output_list,
  backend,
  temperature,
  num_critic,
  shot = 'few'
) {
  // backend = 'gpt-4',
  // temperature = 0,
  // auditor_dir = 'auditor_gpt-4_0.7_top3_2',
  // num_critic = 2,
  // shot = "few"
  // let critic_dir = path.join(__dirname,"..","logs", auditor_dir, `critic_${backend}_${temperature}_${num_critic}`);

  // fs.readdirSync(path.join(__dirname,"..","logs", auditor_dir)).forEach(async(filename) => {

  // let auditor_output_list = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  let critic_bug_info_final_list = [];
  let vul_info_str = '';
  for (let i = 0; i < auditor_output_list.length; i++) {
    let bug_info = auditor_output_list[i];
    let function_name = bug_info['function_name'];
    let function_code = bug_info['code'];
    let vulnerability = bug_info['vulnerability'];
    let reason = bug_info['reason'];
    vul_info_str += `function_name: ${function_name}\ncode: ${function_code}\nvulnerability: ${vulnerability}\nreason: ${reason}\n------------------\n`;
  }

  let critic_prompt;
  if (shot === 'zero') {
    critic_prompt = criticZeroShotPrompt;
  } else if (shot === 'few') {
    critic_prompt = criticFewShotPrompt;
  } else {
    throw new Error('Please specify zero or few shots..');
  }

  let critic_input = critic_prompt + vul_info_str + criticFormatConstraint;
  // Here you would call the OpenAI API with openai.Completion.create() and process the response.
  // This is a placeholder for the actual API call.
  let critic_outputs = await gpt(
    critic_input,
    backend,
    temperature,
    num_critic
  );
  let critic_bug_info_list = critic_response_parse(critic_outputs);
  for (let i = 0; i < critic_bug_info_list.length; i++) {
    console.log('------------------');
    try {
      let function_name = auditor_output_list[i]['function_name'];
      let code = auditor_output_list[i]['code'];
      let file_name = auditor_output_list[i]['file_name'];
      let reason = auditor_output_list[i]['reason'];

      let critic_bug_info = critic_bug_info_list[i];
      critic_bug_info['reason'] = reason;
      critic_bug_info['code'] = code;
      critic_bug_info['file_name'] = file_name;

      critic_bug_info_final_list.push(critic_bug_info);
    } catch (error) {
      console.log(`${i}th function_name is not found in auditor output list`);
      console.log(
        `len auditor: ${auditor_output_list.length} len critic ${critic_bug_info_list.length}`
      );
      console.log(
        `auditor_output_list: ${JSON.stringify(auditor_output_list)}`
      );
    }
  }
  console.log(critic_bug_info_final_list);

  return critic_bug_info_final_list;
}
module.exports = { run_critic };
