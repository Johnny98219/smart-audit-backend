const { getCached } = require('../lib/file');
const { linearize } = require('c3-linearization');
const parser = require('@solidity-parser/parser');
const path = require('path');

async function generateDependencies(content) {
  const ast = (() => {
    try {
      return parser.parse(content, { loc: true });
    } catch (err) {
      console.error(`\nError found while parsing one of the provided files\n`);
      throw err;
    }
  })();

  console.log('Contract AST loaded');

  let contractName = null;
  const dependencies = {};

  parser.visit(ast, {
    ContractDefinition(node) {
      const contractName = node.name;
      dependencies[contractName] = node.baseContracts.map(
        spec => spec.baseName.namePath
      );
    },
  });

  console.log('Dependencies loaded');

  console.log('Dependencies before linearization:', dependencies);

  let linearizedDependencies;
  try {
    linearizedDependencies = linearize(dependencies, { reverse: true });
  } catch (err) {
    console.error('Error during linearization:', err);
    return res.status(400).send(`Linearization error: ${err.message}`);
  }
  console.log('Dependencies linearized');

  // Create nodes and links for D3
  const nodes = Object.keys(linearizedDependencies).map(name => ({
    id: name,
  }));
  const links = [];

  console.log('Nodes and links created');

  Object.entries(linearizedDependencies).forEach(([contract, bases]) => {
    // For each base, create a link from the base to the contract
    bases.forEach(base => {
      if (base !== contract) {
        // Avoid self-references
        links.push({ source: base, target: contract });
      }
    });
  });

  console.log('Links created');

  // Combine nodes and links into a single object for JSON output
  const d3Data = { nodes, links };

  return d3Data;
}

async function getDependencies(address, source_code) {
  try {
    const cacheFile = path.join(
      __dirname,
      `../cache/contracts/${address}/dependencies.json`
    );

    await getCached(cacheFile, generateDependencies, 2592000, source_code); // 30 days (2592000 seconds)

    return true;
  } catch (error) {
    console.error('Error in getDependencies:', error);
    return false;
  }
}

module.exports = getDependencies;
