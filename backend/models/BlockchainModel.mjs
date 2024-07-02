import mongoose from "mongoose";

const blockchainSchema = new mongoose.Schema({
  chain: {
    type: Array,
    required: true,
  },
  pendingTransactions: {
    type: Array,
    required: true,
  },
});

const BlockchainModel = mongoose.model("Blockchain", blockchainSchema);

export default BlockchainModel;
