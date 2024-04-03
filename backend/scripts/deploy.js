// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const hasher = await hre.ethers.deployContract("MiMC5Sponge");
  await hasher.waitForDeployment();
  console.log(hasher.address);
  const hasherAddress = hasher.address; 

  const verifier = await hre.ethers.deployContract("Verifier");
  await verifier.waitForDeployment();
  console.log(verifier.address);
  const verifierAddress = verifier.address;

  const tornado = await hre.ethers.deployContract("Tornado", [hasherAddress]);
  await tornado.waitForDeployment();
    console.log(tornado.address);
    const tornadoAddress = tornado.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
