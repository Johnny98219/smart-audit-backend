// server/modules/functions.js
const { getCachedOrFreshData } = require('./lib/utils');
const parser = require('@solidity-parser/parser');
const parser = require('@solidity-parser/parser');

async function getFunctions(content) {
  // const ast = parser.parse(content, { loc: true, range: true });
  const ast = (() => {
    try {
      return parser.parse(content, { loc: true });
    } catch (err) {
      console.error(`\nError found while parsing one of the provided files\n`);
      throw err;
    }
  })();

  // console.log("Contract AST loaded");

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

  // Print a legend for symbols being used
  let mutationSymbol = ' #';
  let payableSymbol = ' ($)';

  // console.log(`
  // ${payableSymbol} = payable function
  // ${mutationSymbol} = non-constant function
  //   `);

  return astTree;
}

module.exports = getFunctions;
