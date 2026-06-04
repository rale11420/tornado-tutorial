const hre = require("hardhat");

async function main() {
    const hasher = await hre.ethers.deployContract("Hasher");
    await hasher.waitForDeployment();
    console.log("Hasher deployed to:", hasher.target);
    const hasherAddress = hasher.target;

    const verifier = await hre.ethers.deployContract("Groth16Verifier");
    await verifier.waitForDeployment();
    console.log("Verifier deployed to:", verifier.target);
    const verifierAddress = verifier.target;

    const tornado = await hre.ethers.deployContract("Tornado", [hasherAddress, verifierAddress]);
    await tornado.waitForDeployment();
    console.log("Tornado deployed to:", tornado.target);

    console.log("\n--- Add this to frontend/.env.local ---");
    console.log(`NEXT_PUBLIC_TORNADO_ADDRESS=${tornado.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
