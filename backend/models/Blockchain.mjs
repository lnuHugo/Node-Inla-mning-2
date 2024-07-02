import { generateHash } from "../utilities/crypto-lib.mjs";
import Block from "./Block.mjs";
import Transaction from "./Transaction.mjs";
import { MINING_REWARD, REWARD_ADDRESS } from "../config/settings.mjs";
import BlockchainModel from "./BlockchainModel.mjs";

export default class Blockchain {
  constructor() {
    this.chain = [Block.genesisBlock];
    this.pendingTransactions = [];
  }

  // Instance method...
  async addBlock({ data }) {
    const newBlock = Block.createBlock({
      lastBlock: this.chain.at(-1),
      data: data,
      /* data: this.pendingTransactions, */
    });

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    await this.saveBlockchain();

    return newBlock;
  }

  addTransaction(amount, sender, recipient) {
    const transaction = new Transaction(amount, sender, recipient);
    this.pendingTransactions.push(transaction);
    return transaction;
  }

  /* 
  getLastBlock() {
    return this.chain.at(-1);
  } */

  async saveBlockchain() {
    await BlockchainModel.replaceOne(
      {},
      {
        chain: this.chain,
        pendingTransactions: this.pendingTransactions,
      },
      { upsert: true }
    );
  }

  async loadBlockchain() {
    const blockchainData = await BlockchainModel.findOne({});
    if (blockchainData) {
      this.chain = blockchainData.chain;
      this.pendingTransactions = blockchainData.pendingTransactions;
    }
  }

  substituteChain(chain) {
    if (chain.length <= this.chain.length) return;

    if (!Blockchain.validateChain(chain)) return;

    this.chain = chain;
  }

  static validateChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesisBlock))
      return false;

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, data, nonce, difficulty } =
        chain.at(i);
      const currentLastHash = chain[i - 1].hash;
      const lastDifficulty = chain[i - 1].difficulty;

      if (lastHash !== currentLastHash) return false;

      if (Math.abs(lastDifficulty - difficulty) > 1) return false;

      const correctHash = generateHash(
        timestamp,
        lastHash,
        data,
        nonce,
        difficulty
      );
      if (hash !== correctHash) return false;
    }

    return true;
  }

  validateTransactionData({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let counter = 0;

      for (let transaction of block.data) {
        if (transaction.inputMap.address === REWARD_ADDRESS.address) {
          counter++;

          if (counter > 1) return false;

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD)
            return false;
        } else {
          if (!Transaction.validate(transaction)) {
            return false;
          }

          if (transactionSet.has(transaction)) {
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
  }
}
