import { useState } from "react";
import utils from "../utils/u.js";
import { ethers } from "ethers";

const ButtonState = { Normal: 0, Loading: 1, Disabled: 2 };

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
            // var balance = await window.ethereum.request({
            //     "method": "eth_getBalance",
            //     "params": [
            //         activeAccount,
            //         "latest"
            //     ]
            // });           
            // balance = utils.moveDecimalLeft(ethers.toBigInt(balance).toString(), 18);

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

    return (
        <div> 
        {
            !!(account) ? 
                (
                    <div>
                        <p>ChainId: {account.chainId}</p>
                        <p>Wallet address: {account.address}</p>
                        <p>Balance: {account.balance} ETH</p>
                    </div>
                ) : 
                (
                    <button onClick={connectMetamask} disabled={metamaskButtonState == ButtonState.Disabled} >Connect Metamask</button>
                )
        }
        </div>
    );
};

export default Interface;