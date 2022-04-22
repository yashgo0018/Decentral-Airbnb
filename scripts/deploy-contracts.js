const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // mainnet weth contract address
  let WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // if not mainnet deploy the weth contract
  if (hre.network.name !== "mainnet") {
    const WETH = await hre.ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.deployed();
    WETH_ADDRESS = weth.address;
  }

  // deploy the airbnb contract
  const Airbnb = await hre.ethers.getContractFactory("Airbnb");
  const airbnb = await Airbnb.deploy(WETH_ADDRESS);
  await airbnb.deployed();

  // create the Airbnb.json file with all required config
  const { chainId } = hre.config.networks[hre.network.name];
  const airbnbData = {
    address: airbnb.address,
    chainId,
    abi: JSON.parse(airbnb.interface.format('json'))
  };

  // save the file in the react projecxt
  fs.writeFileSync("src/abi/Airbnb.json", JSON.stringify(airbnbData));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });