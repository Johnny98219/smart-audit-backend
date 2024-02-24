text = `{
    "output_list": [
        {
            "function_name": "finalizeTransfer",
            "vulnerability": "Potential Reentrancy",
            "criticism": "The criticism is valid if the 'takeTaxes' function indeed interacts with external contracts, which could potentially lead to reentrancy attacks. However, without the implementation details of 'takeTaxes', it is not possible to accurately assess the risk. If 'takeTaxes' is a simple internal logic that does not call external contracts, then the risk is non-existent. The correctness score is moderate due to the lack of detail. Severity could be high if the vulnerability exists, as reentrancy can lead to significant losses. Profitability would also be high for an attacker if the vulnerability is exploitable.",
            "correctness": 5,
            "severity": 7,
            "profitability": 7
        },
        {
            "function_name": "transferOwnership",
            "vulnerability": "Ownership Takeover",
            "criticism": "The reasoning provided is incorrect. The 'transferOwner' function is designed to transfer ownership of the contract, not the tokens held by the previous owner. The criticism seems to confuse ownership of the contract with ownership of the tokens. Therefore, the vulnerability described does not exist in the context given. The correctness score is low due to the misunderstanding of the function's purpose. Severity and profitability are both zero as the vulnerability is non-existent based on the provided code and description.",
            "correctness": 1,
            "severity": 0,
            "profitability": 0
        },
        {
            "function_name": "setLpPair",
            "vulnerability": "Centralization Risk",
            "criticism": "The reasoning is somewhat correct in identifying a centralization risk, as the owner has the power to enable or disable liquidity pairs. However, this is a common pattern in many DeFi projects to manage pairs and does not necessarily indicate a vulnerability but rather a point of trust in the contract owner. The severity of this risk depends on the trust in the contract owner and the governance model of the project. Profitability is not directly applicable here, as it is more about potential market manipulation than direct profit from exploiting a vulnerability.",
            "correctness": 6,
            "severity": 5,
            "profitability": 0
        }
    ]
}`;

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
      }
    }
  });

  let output = {};
  output['output_list'] = objects; // objects is your parsed array
  return output;
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

let testp = relaxedJSONParse(text);

let outputs = [];

outputs.push(testp);

let response = auditorResponseParse(outputs);

console.log(response);

// Stringify the entire object
const jsonStringifiedObject = JSON.stringify(testp, null, 2);
console.log(jsonStringifiedObject);
