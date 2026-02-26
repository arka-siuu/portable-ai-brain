const { Wallet } = require("ethers");

const wallet = Wallet.createRandom();

console.log("ADDRESS:", wallet.address);
console.log("PRIVATE KEY:", wallet.privateKey);