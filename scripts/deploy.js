const hre = require("hardhat");

async function main() {
  // Get configuration from environment or use defaults
  const initialSupply = process.env.INITIAL_SUPPLY || "1000000";
  const initialPrice = process.env.INITIAL_PRICE || "0.001";

  // Convert to Wei
  const initialSupplyWei = hre.ethers.utils.parseEther(initialSupply);
  const initialPriceWei = hre.ethers.utils.parseEther(initialPrice);

  // Deploy the contract
  const WindRanger = await hre.ethers.getContractFactory("WindRanger");
  const windranger = await WindRanger.deploy(initialSupplyWei, initialPriceWei);
  await windranger.deployed();

  console.log(`WindRanger deployed to: ${windranger.address}`);
  console.log(`Initial supply: ${initialSupply} WRT`);
  console.log(`Initial price: ${initialPrice} ETH per token`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
