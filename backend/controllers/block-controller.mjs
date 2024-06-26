import { pubnubServer } from "../server.mjs";
import { blockchain } from "../server.mjs";

export const mineBlock = (req, res) => {
  const data = req.body;
  console.log(data);

  const block = blockchain.addBlock({ data: data });
  pubnubServer.broadcast();

  res.status(201).json({ success: true, statusCode: 201, data: block });
};
