const { getCached } = require('../lib/file');
const parser = require('@solidity-parser/parser');
const path = require('path');

async function generateTree(content) {
  const ast = (() => {
    try {
      return parser.parse(content, { loc: true });
    } catch (err) {
      console.error(`\nError found while parsing one of the provided files\n`);
      throw err;
    }
  })();

  console.log('Contract AST loaded -- generateTree');

  const astTree = [];
  let currentContract = null;

  parser.visit(ast, {
    ContractDefinition(node) {
      const name = node.name;
      let bases = node.baseContracts
        .map(spec => {
          return spec.baseName.namePath;
        })
        .join(', ');

      bases = bases.length ? `(${bases})` : '';

      let specs = '';
      if (node.kind === 'library') {
        specs += '[Lib]';
      } else if (node.kind === 'interface') {
        specs += '[Int]';
      }

      // console.log(` + ${specs} ${name} ${bases}`);
      const lineNumber = node.loc.start.line;
      currentContract = {
        type: 'contract',
        name: name,
        bases: bases,
        specs: specs,
        line: lineNumber,
        functions: [],
      };
      astTree.push(currentContract);
      // console.log("line: ", lineNumber);

      // console.log(` + ${specs} ${name} ${bases} at line ${lineNumber}`);
    },

    'ContractDefinition:exit': function (node) {
      // console.log("");
      currentContract = null;
      // console.log("ContractDefinition:exit");
    },

    FunctionDefinition(node) {
      let name;

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
        spec += '[Pub]';
      } else if (node.visibility === 'external') {
        spec += '[Ext]';
      } else if (node.visibility === 'private') {
        spec += '[Prv]';
      } else if (node.visibility === 'internal') {
        spec += '[Int]';
      }

      let payable = '';
      if (node.stateMutability === 'payable') {
        payable = ' ($)';
      }

      let mutating = '';
      if (!node.stateMutability) {
        mutating = ' #';
      }

      let modifiers = '';
      for (let m of node.modifiers) {
        if (!!modifiers) modifiers += ',';
        modifiers += m.name;
      }

      // console.log(`    - ${spec} ${name}${payable}${mutating}`);
      const lineNumber = node.loc.start.line;
      const functionDef = {
        type: 'func',
        name: name,
        spec: spec,
        payable: payable,
        modifiers: modifiers,
        line: lineNumber,
      };

      if (currentContract) {
        currentContract.functions.push(functionDef);
      }

      if (!!modifiers) {
        // console.log(`       - modifiers: ${modifiers}`);
      }
    },
  });

  return astTree;
}

async function getTree(address, source_code) {
  try {
    const cacheFile = path.join(
      __dirname,
      `../cache/contracts/${address}/tree.json`
    );

    await getCached(cacheFile, generateTree, 2592000, source_code); // 30 days (2592000 seconds)

    return true;
  } catch (error) {
    console.error('Error in getTree:', error);
    return false;
  }
}

module.exports = getTree;
