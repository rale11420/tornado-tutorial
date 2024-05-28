Project from tutorial:

Tornado Cash: https://www.youtube.com/playlist?list=PL_SqG412uYVYtEM8B8xNccFyhrGsMV1MG


# TO DO
add styling <br>

# Tornado cash - tutorial repo
The project is an exercise in writing arithmetic circuits in Circom, using groth16, the SnarkJS library, and creating a trusted setup for the project.

The project consists of three directories:

- backend
- frontend
- circuit

## Backend
Contains the contracts needed to implement Tornado Cash:

- Hasher.sol: Contract that implements the MiMC5 cryptographic hash function using Feistel and Sponge constructions.
- Tornado.sol: Contract for private transactions using a Merkle tree and zk-SNARKs.
- Verifier.sol: Contract generated using SnarkJS.

## Frontend
Contains a simple NextJS frontend with functionality for depositing and withdrawing funds.

## Circuit
Contains arithmetic circuits:

- deposit.circom: Implements commitment_hasher.
- withdraw.circom: A Circom circuit template for verifying withdrawals in a Tornado Cash-like privacy system.
- commitment_hasher.circom: A Circom circuit that computes a commitment and a nullifier hash using Pedersen hash functions.

Additionally, the utils folder contains auxiliary circuits for calculations:

- mimc_sponge
- montgomery
- pedersen

The folder also includes a generated ceremony file.