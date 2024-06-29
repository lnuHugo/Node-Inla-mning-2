import express from "express";
import cors from "cors";
import Blockchain from "./models/Blockchain.mjs";
import PubNubServer from "./pubnubServer.mjs";
import TransactionPool from "./models/TransactionPool.mjs";
import Wallet from "./models/Wallet.mjs";
import blockchainRouter from "./routes/blockchain-routes.mjs";
import blockRouter from "./routes/block-routes.mjs";
import dotenv from "dotenv";
import transactionRouter from "./routes/transaction-routes.mjs";
import { connectDb } from "./config/mongo.mjs";
import colors from "colors";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";
import authRouter from "./routes/auth-routes.mjs";
import coursesRouter from "./routes/courses-routes.mjs";
import usersRouter from "./routes/user-routes.mjs";

import path from "path";
import { fileURLToPath } from "url";
import { errorHandler } from "./middleware/errorHandler.mjs";

dotenv.config({ path: "../.env" });

connectDb();

const credentials = {
  publishKey: process.env.PUBLISH_KEY,
  subscribeKey: process.env.SUBSCRIBE_KEY,
  secretKey: process.env.SECRET_KEY,
  userId: process.env.USER_ID,
};

export const blockchain = new Blockchain();
export const pubnubServer = new PubNubServer({
  blockchain: blockchain,
  credentials: credentials,
});
export const transactionPool = new TransactionPool();
export const wallet = new Wallet();

const fileName = fileURLToPath(import.meta.url);
const dirname = path.dirname(fileName);
global.__appdir = dirname;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

setTimeout(() => {
  pubnubServer.broadcast();
}, 1000);

app.use("/api/v1/blockchain", blockchainRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/block", blockRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/courses", coursesRouter);
app.use("/api/v1/users", usersRouter);

app.use(express.static(path.join(__appdir, "public")));
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(limit);
app.use(cors());
app.use(hpp());

app.use(errorHandler);

const limit = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100,
});

process.on("unhandledRejection", (err, promise) => {
  console.log(`FEL: ${err.message}`.red);
  server.close(() => process.exit(1));
});

const PORT_DEFAULT = 4001;
const ROOT_NODE = `http://localhost:${PORT_DEFAULT}`;
let PORT_NODE;

const synchronize = async () => {
  const response = await fetch(`${ROOT_NODE}/api/v1/blockchain`);
  if (response.ok) {
    const result = await response.json();
    console.log("SYNC", result.data);
    blockchain.substituteChain(result.data);
  }
};

if (process.env.CREATING_DYNAMIC_PORT === "true") {
  PORT_NODE = PORT_DEFAULT + Math.ceil(Math.random() * 1000);
}

const PORT = PORT_NODE || PORT_DEFAULT;

app.listen(PORT, () => {
  console.log(`Application currently running on port: ${PORT}`);

  if (PORT !== PORT_DEFAULT) {
    synchronize();
  }
});
