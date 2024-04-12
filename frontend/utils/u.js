const ethers = require("ethers");

const utils = {
    moveDecimalLeft: (str, count) => {
        let start = str.length - count;
        let prePadding = "0";

        while(start > 0) {
            prePadding += "0";
            start += 1;
        };

        str = prePadding + str;
        let result = str.slice(0, start) + "." + str.slice(start);

        if(result[0] == ".") {
            result = "0" + result;
        }

        return result;
    },
    BN256ToBin: (str) => {
        let r = BigInt(str).toString(2);
        let prePadding = "";
        let paddingAmount = 256 - r.length;

        for(var i = 0; i < paddingAmount; i++) {
            prePadding += "0";
        };

        return prePadding + r;
    },

    BN256ToDecimal: (bn) => {
        return ethers.toBigInt(bn).toString();
    }
};

export default utils;