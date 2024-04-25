// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./Hasher.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error IncorrectAmount();
error DuplicateCommitmentHash();
error TreeFull();

event Deposit(uint root, uint[10] hashPairings, uint8[10] pairDirection);
event Withdraw(address to, uint nullifierHash);

contract Tornado is ReentrancyGuard {
    Hasher hasher;
    address verifier;

    uint8 public treeLevel = 10;
    uint public denomination = 1 ether;
    uint public nextLeafIdx = 0;

    mapping (uint => bool) public roots;
    mapping (uint8 => uint) public lastLevelHash;
    mapping (uint => bool) public nullifierHashes;
    mapping (uint => bool) public commitments;

    uint[10] levelDefaults = [
        56366143589312632909165689303288424445591722494581909097469615363979918107647,
        31485947363182499870017744990773152214117338585786592748002263410830946935803,
        39130407235437970425660631574431780055592386132474081273800037714555310262130,
        15643305713301025401322084451507664648120030980733722455195682030467881400134,
        92345299156651249557922806868955670597662421524813133690461141167565261117668,
        47307361645214868044567597324695408100338423854773912465967610750828435818343,
        88912096512445324971049912158342511876505360692728279839003667894026578327666,
        77946994658454165705440064785732317598269976528600658758575742423843623495990,
        37212461082006188289348927719660091156592460620634069164606394939386358898011,
        92107057111723781731644487596367145237820179196979306040298521401349784975823
    ];

    constructor(address _hasher, address _verifier) {
        hasher = Hasher(_hasher);
        verifier = _verifier;
    }

    function deposit(uint _commitment) external payable nonReentrant {
        if(msg.value != denomination) {
            revert IncorrectAmount();
        }
        if(commitments[_commitment]) {
            revert DuplicateCommitmentHash();
        }
        if(nextLeafIdx >= 2 ** treeLevel) {
            revert TreeFull();
        }

        uint newRoot;
        uint[10] memory hashPairings;
        uint8[10] memory hashDirections;

        uint currentIdx = nextLeafIdx;
        uint currentHash = _commitment;

        uint left;
        uint right;
        uint[2] memory ins;

        for (uint8 i = 0; i < treeLevel; i++) {
            lastLevelHash[treeLevel] = currentHash;

            if(currentIdx % 2 == 0) {
                left = currentHash;
                right = levelDefaults[i];
                hashPairings[i] = levelDefaults[i];
                hashDirections[i] = 0;
            } else {
                left = levelDefaults[i];
                right = currentHash;
                hashPairings[i] = lastLevelHash[i];
                hashDirections[i] = 1;
            }

            ins[0] = left;
            ins[1] = right;

            (uint h) = hasher.MiMC5Sponge{ gas: 150000 }(ins, _commitment);

            currentHash = h;
            currentIdx = currentIdx / 2;
        }

        newRoot = currentHash;
        roots[newRoot] = true;
        nextLeafIdx++;

        commitments[_commitment] = true;

        emit Deposit(newRoot, hashPairings, hashDirections);
    }

    // function withdraw() {
        
    // }
}