import { useState } from "react";
import utils from "../utils/u.js";
import { ethers } from "ethers";

const wc = require("../circuit/witness_calculator.js");
const tornadoJson = require("../json/Tornado.json");
const tornadoABI = tornadoJson.abi;
const tornadoInterface = new ethers.utils.Interface(tornadoABI);

const ButtonState = { Normal: 0, Loading: 1, Disabled: 2 };
tornadoAddress = "";

const Interface = () => {
    const [account, updateAccount] = useState(null);
    const [metamaskButtonState, updateMetamaskButtonState] = useState(ButtonState.Normal);

    const connectMetamask = async () => {

        updateMetamaskButtonState(ButtonState.Disabled);
        try {
            if (!window.ethereum) {
                alert("Install Metamask");
                throw "no-metamask";
            }
            
            var accounts = await window.ethereum.request({
                "method": "eth_requestAccounts",
                "params": []
            });
            
            var chainId = await window.ethereum.request({
                "method": "eth_chainId",
                "params": []
            
            });
            
            var activeAccount = accounts[0];
            var balance = await window.ethereum.request({
                "method": "eth_getBalance",
                "params": [
                    activeAccount,
                    "latest"
                ]
            });           
            balance = utils.moveDecimalLeft(ethers.toBigInt(balance).toString());

            var newAccountState = {
                chainId: chainId,
                address: activeAccount,
                balance: balance
            };

            updateAccount(newAccountState);
        } catch (error) {
            console.log(error);
        }

        updateMetamaskButtonState(ButtonState.Normal);
    };

    const depositETH = async () => {
        const secret = ethers.toBigInt(ethers.utils.randomBytes(32)).toString();
        const nullifier = ethers.toBigInt(ethers.utils.randomBytes(32)).toString();

        const input = {
            secret: utils.BN256ToBin(secret).split(""),
            nullifier: utils.BN256ToBin(nullifier).split("")
        };

        var res = await fetch("/deposit.wasm");
        var buffer = await res.arrayBuffer();
        var depositWC = await wc(buffer);

        const r = await depositWC.calculateWitness(input, 0);
        const commitment = r[1];
        const nullifierHash = r[2];

        const value = ethers.toBigInt("1000000000000000000").toHexString();

        const tx = {
            to: tornadoAddress,
            from: account.address,
            value: value,
            data: tornadoInterface.encodeFunctionData("deposit", [commitment])
        };

        try {
            const txHash = await window.ethereum.request({method: "eth_sendTransaction", params: [tx]});
            const receipt = await window.ethereum.request({method: "eth_getTransactionReceipt", params: [txHash]});

            const log = receipt.log[0];

            const decodedData = tornadoInterface.decodeEventLog("Deposit", log.data, log.topics);
            
        } catch (error) {
            
        }
    };

    return (
        <div> 
            {
                !!(account) ? 
                    (
                        <div>
                            <p>ChainId: {ethers.toBigInt(account.chainId).toString()}</p>
                            <p>Wallet address: {account.address}</p>
                            <p>Balance: {account.balance} ETH</p>
                        </div>
                    ) : (
                        <button onClick={connectMetamask} disabled={metamaskButtonState == ButtonState.Disabled} >Connect Metamask</button>
                    )
            }
            <div>
                <hr/>
            </div>
            {
                !!(account) ? 
                    (
                        <div>
                            <button onClick={depositETH}>Deposit 1 ETH</button>
                        </div>
                    ) : (
                        <div>
                            <p>You need Metamask</p>
                        </div>
                    )
            }
        </div>
    );
};

export default Interface;