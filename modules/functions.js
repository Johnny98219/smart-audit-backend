const { getCached } = require('../lib/file');
const parser = require('@solidity-parser/parser');
const path = require('path');

async function generateFunctions(
  content,
  options = { deepness: 1, negModifiers: false }
) {
  let ast;
  try {
    ast = parser.parse(content, { loc: true });
  } catch (err) {
    console.error(`\nError found while parsing one of the provided files\n`);
    throw err;
  }

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

  // Return the report contents instead of printing them
  return { reportContents, tableRows };
}

async function getFunctions(address, source_code) {
  try {
    const cacheFile = path.join(
      __dirname,
      `../cache/contracts/${address}/functions.json`
    );

    await getCached(cacheFile, generateFunctions, 2592000, source_code); // 30 days (2592000 seconds)

    return true;
  } catch (error) {
    console.error('Error in getFunctions:', error);
    return false;
  }
}

module.exports = getFunctions;
