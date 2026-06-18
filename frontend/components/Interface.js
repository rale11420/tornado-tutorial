import { useState } from 'react'
import utils from '../utils/u.js'
import { ethers } from 'ethers'
import styles from './Interface.module.css'

const wc = require('../circuit/witness_calculator.js')
const tornadoJson = require('../json/Tornado.json')
const tornadoABI = tornadoJson.abi
const tornadoInterface = new ethers.Interface(tornadoABI)

const ButtonState = { Normal: 0, Disabled: 1 }
const tornadoAddress = process.env.NEXT_PUBLIC_TORNADO_ADDRESS || ''

const short = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

const Interface = () => {
    const [account, updateAccount] = useState(null)
    const [connecting, setConnecting] = useState(false)
    const [proofElements, updateProofElements] = useState(null)
    const [proofStringEl, updateProofStringEl] = useState(null)
    const [textArea, updateTextArea] = useState(null)
    const [depositLoading, setDepositLoading] = useState(false)
    const [withdrawLoading, setWithdrawLoading] = useState(false)

    const connectMetamask = async () => {
        setConnecting(true)
        try {
            if (!window.ethereum) {
                alert('Please install MetaMask')
                return
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
                params: [],
            })

            const chainId = await window.ethereum.request({
                method: 'eth_chainId',
                params: [],
            })

            if (parseInt(chainId, 16) !== 11155111) {
                alert(
                    `Please switch MetaMask to Sepolia testnet (Chain ID: 11155111). Your current chain ID is ${parseInt(chainId, 16)}.`
                )
                return
            }

            const activeAccount = accounts[0]
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [activeAccount, 'latest'],
            })

            updateAccount({
                chainId,
                address: activeAccount,
                balance: ethers.formatEther(balance),
            })
        } catch (error) {
            console.log(error)
        }
        setConnecting(false)
    }

    const depositETH = async () => {
        setDepositLoading(true)
        try {
            const secret = ethers.toBigInt(ethers.randomBytes(32)).toString()
            const nullifier = ethers.toBigInt(ethers.randomBytes(32)).toString()

            const input = {
                secret: utils.BN256ToBin(secret).split(''),
                nullifier: utils.BN256ToBin(nullifier).split(''),
            }

            const res = await fetch('/deposit.wasm')
            const buffer = await res.arrayBuffer()
            const depositWC = await wc(buffer)
            const r = await depositWC.calculateWitness(input, 0)
            const commitment = r[1]
            const nullifierHash = r[2]

            const tx = {
                to: tornadoAddress,
                from: account.address,
                value: '0xde0b6b3a7640000',
                data: tornadoInterface.encodeFunctionData('deposit', [commitment]),
            }

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx],
            })

            let receipt = null
            while (!receipt) {
                await new Promise((r) => setTimeout(r, 2000))
                receipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                })
            }

            const log = receipt.logs[0]
            const decodedData = tornadoInterface.decodeEventLog(
                'Deposit',
                log.data,
                log.topics
            )

            const proof = {
                root: utils.BN256ToDecimal(decodedData.root),
                nullifierHash: `${nullifierHash}`,
                secret,
                nullifier,
                commitment: `${commitment}`,
                hashPairings: decodedData.hashPairings.map((n) =>
                    utils.BN256ToDecimal(n)
                ),
                hashDirections: decodedData.pairDirection,
            }

            updateProofElements(btoa(JSON.stringify(proof)))
        } catch (error) {
            console.log(error)
        }
        setDepositLoading(false)
    }

    const copyProof = () => {
        if (proofStringEl) {
            navigator.clipboard.writeText(proofStringEl.innerHTML)
        }
    }

    const withdrawETH = async () => {
        if (!textArea?.value) {
            alert('Please paste your deposit note first')
            return
        }
        if (!window.snarkjs) {
            alert('snarkjs is still loading, please retry in a moment')
            return
        }

        setWithdrawLoading(true)
        try {
            const proof = JSON.parse(atob(textArea.value))
            const SnarkJS = window.snarkjs

            const proofInput = {
                root: proof.root,
                nullifierHash: proof.nullifierHash,
                recipient: utils.BN256ToDecimal(account.address),
                secret: utils.BN256ToBin(proof.secret).split(''),
                nullifier: utils.BN256ToBin(proof.nullifier).split(''),
                hashPairings: proof.hashPairings,
                hashDirections: proof.hashDirections,
            }

            const { proof: zkProof, publicSignals } =
                await SnarkJS.groth16.fullProve(
                    proofInput,
                    '/withdraw.wasm',
                    '/setup_final.zkey'
                )

            const callInputs = [
                zkProof.pi_a.slice(0, 2).map(utils.BN256ToHex),
                zkProof.pi_b
                    .slice(0, 2)
                    .map((row) =>
                        utils.reverseCoordinates(row.map(utils.BN256ToHex))
                    ),
                zkProof.pi_c.slice(0, 2).map(utils.BN256ToHex),
                publicSignals.slice(0, 2).map(utils.BN256ToHex),
            ]

            const callData = tornadoInterface.encodeFunctionData(
                'withdraw',
                callInputs
            )

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [
                    { to: tornadoAddress, from: account.address, data: callData },
                ],
            })

            let withdrawReceipt = null
            while (!withdrawReceipt) {
                await new Promise((r) => setTimeout(r, 2000))
                withdrawReceipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                })
            }
        } catch (e) {
            console.log(e)
        }
        setWithdrawLoading(false)
    }

    return (
        <div className={styles.app}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🌀</span>
                    <span>ZKMixer</span>
                </div>
                <div className={styles.networkBadge}>⬡ Sepolia</div>
            </header>

            <main className={styles.main}>
                {!account ? (
                    <div className={styles.hero}>
                        <span className={styles.heroEyebrow}>
                            Zero-Knowledge Privacy
                        </span>
                        <h1 className={styles.heroTitle}>
                            Mix your ETH.
                            <br />
                            <span className={styles.gradient}>
                                Leave no trace.
                            </span>
                        </h1>
                        <p className={styles.heroSub}>
                            Deposit 1 ETH. Save your proof note. Withdraw from
                            any address — fully anonymous, powered by
                            zk-SNARKs.
                        </p>
                        <button
                            className={styles.connectBtn}
                            onClick={connectMetamask}
                            disabled={connecting}
                        >
                            {connecting ? (
                                <>
                                    <span className={styles.spinner} />
                                    Connecting…
                                </>
                            ) : (
                                'Connect Wallet'
                            )}
                        </button>
                        <div className={styles.techBadges}>
                            <span>Groth16</span>
                            <span>Circom 2.0</span>
                            <span>MiMC Hash</span>
                            <span>Sepolia</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.walletBar}>
                            <div className={styles.walletInfo}>
                                <span className={styles.dot} />
                                <span className={styles.address}>
                                    {short(account.address)}
                                </span>
                                <span className={styles.balance}>
                                    {parseFloat(account.balance).toFixed(4)} ETH
                                </span>
                            </div>
                            <span className={styles.contractAddr}>
                                {tornadoAddress
                                    ? short(tornadoAddress)
                                    : 'Contract not configured'}
                            </span>
                        </div>

                        <div className={styles.panels}>
                            {/* ── Deposit ── */}
                            <div className={styles.panel}>
                                <div className={styles.panelTop}>
                                    <h2 className={styles.panelTitle}>
                                        Deposit
                                    </h2>
                                    <span className={styles.amountBadge}>
                                        1 ETH
                                    </span>
                                </div>
                                <p className={styles.panelDesc}>
                                    Send 1 ETH to the mixer. You&apos;ll
                                    receive a secret note — keep it safe,
                                    it&apos;s your only way to withdraw.
                                </p>

                                {proofElements ? (
                                    <div className={styles.noteBox}>
                                        <div className={styles.noteLabel}>
                                            <span className={styles.greenDot} />
                                            Deposit note — save this!
                                        </div>
                                        <div className={styles.noteText}>
                                            <span
                                                ref={(el) =>
                                                    updateProofStringEl(el)
                                                }
                                            >
                                                {proofElements}
                                            </span>
                                        </div>
                                        <button
                                            className={styles.copyBtn}
                                            onClick={copyProof}
                                        >
                                            Copy note
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={styles.actionBtn}
                                        onClick={depositETH}
                                        disabled={depositLoading}
                                    >
                                        {depositLoading ? (
                                            <>
                                                <span
                                                    className={styles.spinner}
                                                />
                                                Depositing…
                                            </>
                                        ) : (
                                            'Deposit 1 ETH'
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* ── Withdraw ── */}
                            <div className={styles.panel}>
                                <div className={styles.panelTop}>
                                    <h2 className={styles.panelTitle}>
                                        Withdraw
                                    </h2>
                                    <span className={styles.amountBadge}>
                                        1 ETH
                                    </span>
                                </div>
                                <p className={styles.panelDesc}>
                                    Paste your deposit note, generate a ZK
                                    proof on-device, and withdraw to any
                                    address — no link to the original deposit.
                                </p>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Paste your deposit note here…"
                                    ref={(ta) => updateTextArea(ta)}
                                />
                                <button
                                    className={styles.actionBtn}
                                    onClick={withdrawETH}
                                    disabled={withdrawLoading}
                                >
                                    {withdrawLoading ? (
                                        <>
                                            <span className={styles.spinner} />
                                            Generating proof…
                                        </>
                                    ) : (
                                        'Withdraw 1 ETH'
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>

            <footer className={styles.footer}>
                Powered by Groth16 · Circom 2.0 · Sepolia Testnet
            </footer>
        </div>
    )
}

export default Interface
