const express = require("express");
const router = express.Router();
const parser = require("@solidity-parser/parser");
const main = require("../modules/deployer/main");
const dependencies = require("../modules/deployer/dependencies");
const solc = require("solc");
const openai = require("../openai");

async function callOpenAI(query) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: `${defaultPrompt}\n${query}` }],
  });

  const trueResponse = JSON.parse(
    String(response.choices[0].message.content)
      .replace(/\n/g, "")
      .replace(/   /g, "")
      .replace(/ /g, "")
      .replace(/%/g, "")
  );
  return trueResponse;
}

function validateString(input) {
  const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;
  const startsWithNumberRegex = /^\d/;

  return (
    specialCharsRegex.test(input) |
    startsWithNumberRegex.test(input) |
    input.includes(" ")
  );
}

function updateCode(code, prompt) {
  try {
    let newCode = code;
    let error = null;
    const { nameRegex, symbolRegex, supplyRegex, buyTaxRegex, sellTaxRegex } =
      regex();
    for (const [key, val] of Object.entries(prompt)) {
      switch (key) {
        case "name":
          if (!validateString(val)) {
            newCode = newCode.replace(
              nameRegex,
              `string private constant _name = "${val}";`
            );
          }
          break;

        case "symbol":
          newCode = newCode.replace(
            symbolRegex,
            `string private constant _symbol = "${val}";`
          );
          break;

        case "supply":
          newCode = newCode.replace(
            supplyRegex,
            `uint256 private constant _tTotal = ${val} * 10**9;`
          );
          break;

        case "buy_tax":
          newCode = newCode.replace(
            buyTaxRegex,
            `uint256 private _taxFeeOnBuy = ${val};`
          );
          break;

        case "sell_tax":
          newCode = newCode.replace(
            sellTaxRegex,
            `uint256 private _taxFeeOnSell = ${val};`
          );
          break;

        default:
          error = "parameter category not supported";
          break;
      }
    }
    return { newCode, error };
  } catch (e) {
    if (e instanceof parser.ParserError) {
      console.error("Parse error: ", e.errors);
    }
    console.error("Update code Error: ", e);
  }
}

router.post("/update-code", async (req, res) => {
  if (req.body === undefined) {
    res.status(400).send("Bad request");
    return;
  }

  const { prompt, code } = req.body;

  if (!prompt || !code) {
    res.status(400).send("Bad request");
    return;
  }

  try {
    const response = await callOpenAI(prompt);

    const { newCode, error } = updateCode(code, response);
    if (error) {
      res.status(404).send({ error });
      return;
    }

    res.status(200).send({
      code: newCode,
      status: getStatus(newCode),
    });
    return;
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send("Error: " + error.message);
  }
});

const defaultPrompt = `
Given the following request, return key / val formatted json string like
{ [key]: [val] }
'key' is what user wants to update, 'val' is target value.
if request indicates a buy tax, return key as buy_tax, same for sell_tax.
---------------------------------------
`;

function regex() {
  const nameRegex = /string private constant _name\s*=\s*"(.*?)";/;
  const symbolRegex = /string private constant _symbol\s*=\s*"(.*?)";/;
  const supplyRegex =
    /uint256 private constant _tTotal\s*=\s*(\d+)\s*\*\s*10\*\*9\s*;/;
  const buyTaxRegex = /uint256 private _taxFeeOnBuy\s*=\s*(\d+)\s*;/;
  const sellTaxRegex = /uint256 private _taxFeeOnSell\s*=\s*(\d+)\s*;/;
  return {
    nameRegex,
    symbolRegex,
    supplyRegex,
    buyTaxRegex,
    sellTaxRegex,
  };
}

const getStatus = (code) => {
  const { nameRegex, symbolRegex, supplyRegex, buyTaxRegex, sellTaxRegex } =
    regex();
  return {
    name: code.match(nameRegex)[1],
    symbol: code.match(symbolRegex)[1],
    supply: code.match(supplyRegex)[1],
    buy_tax: code.match(buyTaxRegex)[1],
    sell_tax: code.match(sellTaxRegex)[1],
  };
};

router.post("/compile", (req, res) => {
  const input = {
    language: "Solidity",
    sources: {
      'ABC.sol': {
        content: dependencies.concat(JSON.parse(req.body.code))
      }
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  res.status(200).json({
    bytecode: output.contracts['ABC.sol'].ABC.evm.bytecode.object,
    abi: output.contracts['ABC.sol'].ABC.abi
  })
});

router.get("/code", (req, res) => {
  res.status(200).json({
    code: main,
    status: getStatus(main),
  });
});

module.exports = router;
