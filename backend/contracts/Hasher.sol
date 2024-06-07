// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title Hasher
 * @dev A contract that implements the MiMC5 cryptographic hash function using Feistel and Sponge constructions.
 */
contract Hasher {
    uint8 numberOfRounds = 20;
    uint p =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint[20] c = [
        0,
        97601377400413275829077561935054313120124005635779023012257940020489541426615,
        75667833473444280523595655255061618373235449285755756508799341298832077628840,
        20777692423407160186949599786310319740851741060318786859987551886716277871414,
        109395573775651416013561760102460285302876414584707887405989276116796975704508,
        9237790496903805357640999211613295082667644318860727630477933085957561920412,
        88217136199099091734794967082700985451963431228500342360875933255193098778073,
        87892180054219101637272062099047823355710444200887474476936869179441799079583,
        18380448236657819236709895954603093048877989195555311124772649738480238344543,
        37832094065846366777872301885699611353133220848854482142604174326445019345243,
        76875764846855676328054175616557883188586489641920782474600955044970553302441,
        55954275659290528140899495455457820476596786359727089137298516755879327405286,
        23383606856149508846848520365400750745871947959757546950308010949778201073734,
        104205626463997312707141225986130134402237846516685175680604801650666542409703,
        94593073973749975077757939690142732892396190210211121231769865690002672986338,
        6525567474744417904537943114272832224095070816549604424344791045774769181471,
        68957985124129998729836487347827105793728107664588978354657861198580103141727,
        71887921890546015894931472953189912203569110635151664136003784106870726018873,
        83999744901501710084241856497170333866084120663041597519210436999751051784455,
        83609206051462019113574355964455870505471165308843272719705749250652700388243
    ];

    /**
     * @dev Computes the MiMC5 Feistel round function.
     * @param _iL The left input value.
     * @param _iR The right input value.
     * @param _k The round key.
     * @return oL The left output value after all rounds.
     * @return oR The right output value after all rounds.
     */
    function MiMC5Feistel(
        uint _iL,
        uint _iR,
        uint _k
    ) internal view returns (uint oL, uint oR) {
        uint lastL = _iL;
        uint lastR = _iR;

        uint temp;

        uint base;
        uint base2;
        uint base4;

        for (uint8 i = 0; i < numberOfRounds; i++) {
            base = addmod(lastR, _k, p);
            base = addmod(base, c[i], p);

            base2 = mulmod(base, base, p);
            base4 = mulmod(base2, base2, p);
            base = mulmod(base4, base, p);

            temp = lastR;
            lastR = addmod(lastL, base, p);
            lastL = temp;
        }

        return (lastL, lastR);
    }

    /**
     * @dev Computes the MiMC5 hash using the Sponge construction.
     * @param _ins The input array to be hashed.
     * @param _k The key used in the Feistel rounds.
     * @return h The hash value.
     */
    function MiMC5Sponge(
        uint[2] memory _ins,
        uint _k
    ) external view returns (uint h) {
        uint lastR = 0;
        uint lastC = 0;

        for (uint8 i = 0; i < _ins.length; i++) {
            lastR = addmod(lastR, _ins[i], p);
            (lastR, lastC) = MiMC5Feistel(lastR, lastC, _k);
        }

        h = lastR;
    }
}
