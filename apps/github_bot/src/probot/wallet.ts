import dotenv from "dotenv";
import Bounty from "../utils/abi.json";
import { ethers } from "ethers";
dotenv.config();
import { generatePrivateKey } from "viem/accounts";

// function getPrivateKey() {
//   console.log(generatePrivateKey());
// }
// getPrivateKey();

const PRIVATE_KEY = process.env.GITHUB_BOT_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

if (!PRIVATE_KEY) throw new Error("Private Key not found");

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

//contract instance
const contractAddress = process.env.CONTRACT_ADDRESS!;
export const bountyContract = new ethers.Contract(
  contractAddress,
  Bounty.abi,
  wallet
);
