import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
const MORPHO = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";
const marketId = "0x3a4048c64ba1b375330d376b1ce40e4047d03b47ab4d48af484edec9fec801ba";
const client = createPublicClient({ chain: base, transport: http("https://mainnet.base.org") });
const latest = await client.getBlockNumber();
const fromBlock = latest - 10000n;
const logs = await client.getLogs({
  address: MORPHO,
  event: parseAbiItem("event Borrow(bytes32 indexed id, address caller, address indexed onBehalf, address indexed receiver, uint256 assets, uint256 shares)"),
  args: { id: marketId },
  fromBlock, toBlock: latest,
});
console.log("Eventos Borrow:", logs.length);
const borrowers = [...new Set(logs.map(l => l.args.onBehalf))];
console.log("Borrowers unicos:", borrowers.length);
console.log("Primeros 5:", borrowers.slice(0, 5));
