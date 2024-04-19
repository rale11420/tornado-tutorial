pragma circom  2.0.0;

include "commitment_hasher.circom";
include "./utils/mimc5sponge.circom";

template Withdraw() {
    signal input root;
    signal input nullifierHash;
    signal input recipient;

    signal input secret[256];
    signal input nullifier[256];
    signal input hashPairings[10];
    signal input hashDirections[10];

    component cHasher = CommitmentHasher();
    cHasher.secret <== secret;
    cHasher.nullifier <== nullifier;

    cHasher.nullifierHash === nullifierHash;

    component leafHashers[10];
    
    signal currentHash[10 + 1];
    currentHash[0] <== cHasher.commitment;

    signal left[10];
    signal right[10];

    for(var i = 0; i < 10; i++) {
        var d = hashDirections[i];

        leafHashers[i] = MiMC5Sponge(2);

        left[i] <== (1 - d) * currentHash[i];
        leafHashers[i].ins[0] <== left[i] + d * hashPairings[i];
        right[i] <== d * currentHash[i];
        leafHashers[i].ins[1] <== right[i] + (1 + d) * hashPairings[i];

        leafHashers[i].k <== cHasher.commitment;
        currentHash[i + 1] <== leafHashers[i].o;
    }

    root === currentHash[10];

    signal recipientSquare;
    recipientSquare <== recipient * recipient;
}

component main {public [root, nullifierHash, recipient]} = Withdraw();
