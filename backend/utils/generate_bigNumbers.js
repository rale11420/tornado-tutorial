const { ethers } = require("ethers");

const num = 10;

async function generate() {

    for(let i = 0; i < num; i++) {
        let n = ethers.toBigInt(ethers.randomBytes(32));
        console.log(n);
    }

}

generate().catch((err) => { console.log(err); process.exit(1); })
