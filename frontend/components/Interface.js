import { useState } from 'react'
import utils from '../utils/u.js'
import { ethers } from 'ethers'

const wc = require('../circuit/witness_calculator.js')
const tornadoJson = require('../json/Tornado.json')
const tornadoABI = tornadoJson.abi
const tornadoInterface = new ethers.utils.Interface(tornadoABI)

const ButtonState = { Normal: 0, Loading: 1, Disabled: 2 }
tornadoAddress = ''

const Interface = () => {
    const [account, updateAccount] = useState(null)
    const [metamaskButtonState, updateMetamaskButtonState] = useState(
        ButtonState.Normal
    )
    const [proofElements, updateProofElements] = useState(null)
    const [proofStringEl, updateProofStringEl] = useState(null)
    const [textArea, updateTextArea] = useState(null)

    const connectMetamask = async () => {
        updateMetamaskButtonState(ButtonState.Disabled)
        try {
            if (!window.ethereum) {
                alert('Install Metamask')
                throw 'no-metamask'
            }

            var accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
                params: [],
            })

            var chainId = await window.ethereum.request({
                method: 'eth_chainId',
                params: [],
            })

            var activeAccount = accounts[0]
            var balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [activeAccount, 'latest'],
            })
            balance = utils.moveDecimalLeft(ethers.toBigInt(balance).toString())

            var newAccountState = {
                chainId: chainId,
                address: activeAccount,
                balance: balance,
            }

            updateAccount(newAccountState)
        } catch (error) {
            console.log(error)
        }

        updateMetamaskButtonState(ButtonState.Normal)
    }

    const depositETH = async () => {
        const secret = ethers.toBigInt(ethers.utils.randomBytes(32)).toString()
        const nullifier = ethers
            .toBigInt(ethers.utils.randomBytes(32))
            .toString()

        const input = {
            secret: utils.BN256ToBin(secret).split(''),
            nullifier: utils.BN256ToBin(nullifier).split(''),
        }

        var res = await fetch('/deposit.wasm')
        var buffer = await res.arrayBuffer()
        var depositWC = await wc(buffer)

        const r = await depositWC.calculateWitness(input, 0)
        const commitment = r[1]
        const nullifierHash = r[2]

        const value = ethers.toBigInt('1000000000000000000').toHexString()

        const tx = {
            to: tornadoAddress,
            from: account.address,
            value: value,
            data: tornadoInterface.encodeFunctionData('deposit', [commitment]),
        }

        try {
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx],
            })
            const receipt = await window.ethereum.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash],
            })

            const log = receipt.log[0]

            const decodedData = tornadoInterface.decodeEventLog(
                'Deposit',
                log.data,
                log.topics
            )

            const proofElements = {
                root: utils.BN256ToDecimal(decodedData.root),
                nullifierHash: `${nullifierHash}`,
                secret: secret,
                nullifier: nullifier,
                commitment: `${commitment}`,
                hashPairings: decodedData.hashPairings.map((n) =>
                    utils.BN256ToDecimal(n)
                ),
                hashDirections: decodedData.pairDirection,
            }

            updateProofElements(btoa[JSON.stringify(proofElements)])
        } catch (error) {
            console.log(e)
        }
    }

    const copyProof = () => {
        if (!!proofStringEl) {
            navigator.clipboard.writeText(proofStringEl.innerHTML)
        }
    }

    const withdrawETH = async () => {
        if (!textArea || !textArea.value) {
            alert('Plese input proof of deposit')
        }

        try {
            const proofString = textArea.value
            const proofElements = JSON.parse(atob(proofString))
            const SnarkJS = window('snarkjs')

            const proofInput = {
                root: proofElements.root,
                nullifierHash: proofElements.nullifierHash,
                recipient: utils.BN256ToDecimal(account.address),
                secret: utils.BN256ToBin(proofElements.secret).split(''),
                nullifier: utils.BN256ToBin(proofElements.nullifier).split(''),
                hashPairings: proofElements.hashPairings,
                hashDirections: proofElements.hashDirections,
            }

            const { proof, publicSignals } = await SnarkJS.groth16.fullProve(
                proofInput,
                '/withdraw.wasm',
                '/setup_final.zkey'
            )

            const callInputs = [
                proof.pi_a.slice(0, 2).map(utils.BN256ToHex),
                proof.pi_b
                    .slice(0, 2)
                    .map((row) =>
                        utils.reverseCoordinates(row.map(utils.BN256ToHex))
                    ),
                proof.pi_c.slice(0, 2).map(utils.BN256ToHex),
                publicSignals.slice(0, 2).map(utils.BN256ToHex),
            ]

            const callData = tornadoInterface.encodeFunctionData(
                'withdraw',
                callInputs
            )
            const tx = {
                to: tornadoAddress,
                from: account.address,
                data: callData,
            }

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx],
            })
            const receipt = await window.ethereum.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash],
            })
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <div>
            {!!account ? (
                <div>
                    <p>
                        ChainId: {ethers.toBigInt(account.chainId).toString()}
                    </p>
                    <p>Wallet address: {account.address}</p>
                    <p>Balance: {account.balance} ETH</p>
                </div>
            ) : (
                <button
                    onClick={connectMetamask}
                    disabled={metamaskButtonState == ButtonState.Disabled}
                >
                    Connect Metamask
                </button>
            )}
            <div>
                <hr />
            </div>
            {!!account ? (
                <div>
                    {!!proofElements ? (
                        <div>
                            <p>
                                <strong>Proof of deposit: </strong>
                            </p>
                            <div>
                                <span
                                    ref={(proofStringEl) => {
                                        updateProofStringEl(proofStringEl)
                                    }}
                                >
                                    {proofElements}
                                </span>
                            </div>
                            {!!proofStringEl && (
                                <button onClick={copyProof}>Copy</button>
                            )}
                        </div>
                    ) : (
                        <button onClick={depositETH}>Deposit 1 ETH</button>
                    )}
                </div>
            ) : (
                <div>
                    <p>You need Metamask</p>
                </div>
            )}
            <div>
                <hr />
            </div>
            {!!account ? (
                <div>
                    <div>
                        <textarea
                            ref={(ta) => {
                                updateTextArea(ta)
                            }}
                        ></textarea>
                    </div>
                    <button onClick={withdrawETH}>Withdraw 1 ETH</button>
                </div>
            ) : (
                <div>
                    <p>You need Metamask</p>
                </div>
            )}
        </div>
    )
}

export default Interface
