const OpenAI = require('openai');
require('dotenv').config({ path: '../../../.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

let completionTokens = 0;
let promptTokens = 0;

function relaxedJSONParse(jsonString) {
  let objects = [];
  let currentObject = '';
  let inString = false;
  let inValue = false;
  let escapeNext = false;

  const regex = /"output_list": \[\s*([\s\S]*?)\s*\]/;
  const match = jsonString.match(regex);
  if (!match) {
    console.log("match doesn't exist");
    objects['output_list'] = objects;
    return objects;
  }

  jsonString = match[1];

  let pobjects = jsonString.split('},');
  pobjects = pobjects.map((obj, i) =>
    i < pobjects.length - 1 ? obj + '}' : obj
  );

  for (let i = 0; i < pobjects.length; i++) {
    currentObject = pobjects[i];
    const regex = /"([^"]+)":\s*(?:"([^"]+)"|\d+)/g;
    let match;

    while ((match = regex.exec(currentObject)) !== null) {
      const key = match[0];
      const sanitized_key = key.replace(/"/g, `🪬`);
      currentObject = currentObject.replace(key, sanitized_key);
    }
    pobjects[i] = currentObject;
    // console.log(currentObject);
  }

  for (let i = 0; i < pobjects.length; i++) {
    currentObject = pobjects[i];
    const regex = /",|"\n/g;
    let match;

    while ((match = regex.exec(currentObject)) !== null) {
      const key = match[0];
      const sanitized_key = key.replace(/"/g, `🪬`);
      currentObject = currentObject.replace(key, sanitized_key);
    }
    pobjects[i] = currentObject;
  }

  for (let i = 0; i < pobjects.length; i++) {
    currentObject = pobjects[i];
    currentObject = currentObject.replace(/"/g, `'`);
    currentObject = currentObject.replace(/🪬/g, '"');
    pobjects[i] = currentObject;
  }

  pobjects.forEach(pobject => {
    currentObject = pobject;
    inValue = false;

    currentObject = currentObject.trim();
    if (currentObject.startsWith('{')) {
      try {
        objects.push(JSON.parse(currentObject));
      } catch (e) {
        console.error('Invalid JSON object skipped:', currentObject, e.message);
        console.log(jsonString);
      }
    }
  });

  let output = {};
  output['output_list'] = objects; // objects is your parsed array
  return output;
}

async function gpt(
  prompt,
  model,
  temperature = 0.7,
  n = 1,
  maxTokens = 4000,
  stop = null
) {
  if (model === 'gpt-4') {
    model = 'gpt-4-1106-preview';
  }
  return chatgpt(prompt, model, temperature, maxTokens, n, stop);
}

async function chatgpt(prompt, model, temperature, maxTokens, n, stop) {
  let outputs = [];
  while (n > 0) {
    const cnt = Math.min(n, 20);
    n -= cnt;

    console.log(prompt);
    console.log('maxTokens: ', maxTokens);
    console.log('temperature: ', temperature);
    console.log('n: ', cnt);
    console.log('stop: ', stop);
    console.log('model: ', model);
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature,
      max_tokens: maxTokens,
      n: cnt,
      stop: stop,
    });

    // console.log(response.choices);
    // console.log('End of response');

    response.choices.forEach(choice => {
      let content = choice.message.content;
      content = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      //   console.log('content: ', content);

      const parsedObjects = relaxedJSONParse(content);

      console.log('parsedObjects: ', parsedObjects);

      const jsonStringifiedObjects = JSON.stringify(parsedObjects, null, 2);

      outputs.push(parsedObjects);
    });

    completionTokens += response.usage.completion_tokens;
    promptTokens += response.usage.prompt_tokens;
  }

  return outputs;
}

function gptUsage(backend = 'gpt-4') {
  let cost = 0;
  if (backend === 'gpt-4') {
    cost = (completionTokens / 1000) * 0.06 + (promptTokens / 1000) * 0.03;
  } else if (backend === 'gpt-3.5-turbo') {
    cost = (completionTokens / 1000) * 0.002 + (promptTokens / 1000) * 0.0015;
  }
  return { completionTokens, promptTokens, cost };
}

module.exports = {
  gpt,
  gptUsage,
};
