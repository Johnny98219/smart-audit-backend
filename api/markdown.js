const express = require('express');
const axios = require('axios');
const router = express.Router();
const { fetchData } = require('../lib/utils');
const parser = require('@solidity-parser/parser');

router.get('/:address', async (req, res) => {
  // express.json();

  const address = req.params.address;

  console.log('markdown address: ', address);

  // const { address } = req.body;

  if (!address) {
    return res.status(400).send('No address provided');
  }

  let filename = `./cache/contracts/${address}/source.json`;
  let url = `https://eth.blockscout.com/api/v2/smart-contracts/${address}`;

  let source_code = '';

  try {
    let filedata = await fetchData(filename, url);

    source_code = filedata['source_code'];
    let content = source_code;
    // console.log("content: ", content);
    let noColorOutput = false;

    const ast = (() => {
      try {
        return parser.parse(content, { loc: true });
      } catch (err) {
        console.error(
          `\nError found while parsing one of the provided files\n`
        );
        throw err;
      }
    })();

    console.log('Contract AST loaded');

    var modifiers = [];
    var added = [];

    let tableRows = [];

    let filesTable = `
  |  File Name  |  SHA-1 Hash  |
  |-------------|--------------|
  `;

    let contractsTable = `
  |  Contract  |         Type        |       Bases      |                  |                 |
  |:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
  |     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
  `;

    var isPublic = false;
    var doesModifierExist = false;
    var isConstructor = false;
    var options = {
      deepness: 1,
      negModifiers: false,
    };

    parser.visit(ast, {
      ModifierInvocation: function ModifierInvocation(node) {
        if (modifiers.indexOf(node.name) == -1) {
          modifiers.push(node.name);
        }
      },
      ModifierDefinition: function ModifierDefinition(node) {
        if (modifiers.indexOf(node.name) == -1) {
          modifiers.push(node.name);
        }
      },
    });

    parser.visit(ast, {
      ContractDefinition(node) {
        const name = node.name;
        let bases = node.baseContracts
          .map(spec => {
            return spec.baseName.namePath;
          })
          .join(', ');

        let specs = '';
        if (node.kind === 'library') {
          specs += 'Library';
        } else if (node.kind === 'interface') {
          specs += 'Interface';
        } else {
          specs += 'Implementation';
        }

        contractsTable += `||||||
  | **${name}** | ${specs} | ${bases} |||
  `;
        let row = {
          type: 'contract',
          name: name,
          spec: specs,
          mutating: null,
          payable: null,
        };

        tableRows.push(row);
      },

      FunctionDefinition(node) {
        let name;
        isPublic = false;
        doesModifierExist = false;
        isConstructor = false;

        if (node.isConstructor) {
          name = '<Constructor>';
        } else if (node.isFallback) {
          name = '<Fallback>';
        } else if (node.isReceiveEther) {
          name = '<Receive Ether>';
        } else {
          name = node.name;
        }

        let spec = '';
        if (node.visibility === 'public' || node.visibility === 'default') {
          spec += 'Public ❗️';
          isPublic = true;
        } else if (node.visibility === 'external') {
          spec += 'External ❗️';
          isPublic = true;
        } else if (node.visibility === 'private') {
          spec += 'Private 🔐';
        } else if (node.visibility === 'internal') {
          spec += 'Internal 🔒';
        }

        let payable = '';
        if (node.stateMutability === 'payable') {
          payable = '💵';
        }

        let mutating = '';
        if (!node.stateMutability) {
          mutating = '🛑';
        }

        contractsTable += `| └ | ${name} | ${spec} | ${mutating} ${payable} |`;

        let row = {
          type: 'func',
          name: name,
          spec: spec,
          mutating: mutating,
          payable: payable,
        };

        tableRows.push(row);
      },

      'FunctionDefinition:exit': function (node) {
        if (!isConstructor && isPublic && !doesModifierExist) {
          contractsTable += 'NO❗️';
        } else if (isPublic && options.negModifiers) {
          for (var i = 0; i < modifiers.length; i++) {
            if (added.indexOf(modifiers[i]) == -1) {
              contractsTable += ' ~~' + modifiers[i] + '~~ ';
            }
          }
          added = [];
        }

        contractsTable += ` |
  `;
      },

      ModifierInvocation(node) {
        doesModifierExist = true;
        contractsTable += ` ${node.name}`;
        added.push(node.name);
      },
    });

    const reportContents = `${'#'.repeat(
      options.deepness
    )} Function Description Report
  
  ${'#'.repeat(options.deepness + 1)} Files Description Table
  
  ${filesTable}
  
  ${'#'.repeat(options.deepness + 1)} Contracts Description Table
  
  ${contractsTable}
  
  ${'#'.repeat(options.deepness + 1)} Legend
  
  |  Symbol  |  Meaning  |
  |:--------:|-----------|
  |    🛑    | Function can modify state |
  |    💵    | Function is payable |
  `;

    // console.log("reportContents: ", reportContents);

    res.status(200).send({
      report: reportContents,
      table: tableRows,
    });
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

module.exports = router;
