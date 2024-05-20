pragma circom  2.0.0;

include "./utils/pedersen.circom";

/**
 * @title Commitment Hasher Circuit
 * @dev A Circom circuit that computes a commitment and a nullifier hash using Pedersen hash functions.
 * 
 * @notice This circuit takes a secret and a nullifier as inputs and produces a commitment and a nullifier hash as outputs.
 * 
 * @param secret The secret associated with the commitment.
 * @param nullifier The nullifier used to derive the nullifierHash.
 * @param commitment The calculated commitment hash combining the secret and nullifier.
 * @param nullifierHash The calculated hash of the nullifier.
 */
template CommitmentHasher() {
    signal input secret[256];
    signal input nullifier[256];
    signal output commitment;
    signal output nullifierHash;

    component cHasher = Pedersen(512);
    component nHasher = Pedersen(256);

    for (var i = 0; i < 256; i++){
        cHasher.in[i] <== nullifier[i];
        cHasher.in[i + 256] <== secret[i];
        nHasher.in[i] <== nullifier[i];
    }

    commitment <== cHasher.o;
    nullifierHash <== nHasher.o;
}
