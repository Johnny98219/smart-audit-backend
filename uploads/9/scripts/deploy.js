const hre = require("hardhat");

async function main() {
  const contractName = "FixedToken";

  const constructorArgs = ["<ADD_ARGS_HERE>"] 

  // Use this calculator: https://www.alchemy.com/gwei-calculator in order to calculate any token values and get the correct precision. 1 ETH = 1000000000000000000 WEI

  const ContractFactory = await hre.ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy(...constructorArgs);

  await contract.deployed();

  console.log(`🧑‍🍳 ${contractName} has been deployed to ${contract.address}!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
