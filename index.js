#!/usr/bin/env node
import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
const MORPHO = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";
const user = process.argv[2] || "0xC4C00d8b323f37527eEda27c87412378be9F68Ec";
const threshold = Number(process.argv[3]) || 1.0;
const client = createPublicClient({ chain: base, transport: http("https://mainnet.base.org") });
const supplyCollateral = parseAbiItem("event SupplyCollateral(bytes32 indexed id, address indexed caller, address indexed onBehalf, uint256 assets)");
const latest = await client.getBlockNumber();
const CHUNK = 10000n;
const CHUNKS = 5n;
const marketSet = new Set();
for (let i = 0n; i < CHUNKS; i++) {
  const to = latest - (i * CHUNK);
  const from = to - CHUNK + 1n;
  const logs = await client.getLogs({ address: MORPHO, event: supplyCollateral, args: { onBehalf: user }, fromBlock: from, toBlock: to });
  logs.forEach(l => marketSet.add(l.args.id));
  console.log("  tramo", Number(i+1n), "de", Number(CHUNKS), "revisado...");
}
const markets = [...marketSet];
console.log("Wallet:", user);
console.log("Markets encontrados:", markets.length);
const morphoAbi = [
  { type:"function", name:"idToMarketParams", stateMutability:"view", inputs:[{type:"bytes32"}], outputs:[{type:"address"},{type:"address"},{type:"address"},{type:"address"},{type:"uint256"}] },
  { type:"function", name:"market", stateMutability:"view", inputs:[{type:"bytes32"}], outputs:[{type:"uint128"},{type:"uint128"},{type:"uint128"},{type:"uint128"},{type:"uint128"},{type:"uint128"}] },
  { type:"function", name:"position", stateMutability:"view", inputs:[{type:"bytes32"},{type:"address"}], outputs:[{type:"uint256"},{type:"uint128"},{type:"uint128"}] },
];
const oracleAbi = [{ type:"function", name:"price", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] }];
const WAD = 10n ** 18n;
const ORACLE_SCALE = 10n ** 36n;
console.log("");
for (const id of markets) {
  const mp = await client.readContract({ address: MORPHO, abi: morphoAbi, functionName: "idToMarketParams", args: [id] });
  const oracle = mp[2];
  const lltv = mp[4];
  const m = await client.readContract({ address: MORPHO, abi: morphoAbi, functionName: "market", args: [id] });
  const p = await client.readContract({ address: MORPHO, abi: morphoAbi, functionName: "position", args: [id, user] });
  const price = await client.readContract({ address: oracle, abi: oracleAbi, functionName: "price" });
  const debt = m[3] === 0n ? 0n : (p[1] * m[2]) / m[3];
  const collateralValue = (p[2] * price) / ORACLE_SCALE;
  const maxBorrow = (collateralValue * lltv) / WAD;
  const hf = debt === 0n ? null : Number((maxBorrow * WAD) / debt) / 1e18;
  const liqPrice = (p[2] === 0n || lltv === 0n) ? null : (debt * ORACLE_SCALE) / ((p[2] * lltv) / WAD);
  console.log("Market:", id.slice(0, 10) + "...");
  console.log("  Debt:   ", (Number(debt) / 1e18).toFixed(4));
  console.log("  Collat value:", (Number(collateralValue) / 1e18).toFixed(4));
  console.log("  Health factor:", hf === null ? "no debt" : hf.toFixed(4), hf === null ? "" : (hf >= 1 ? "HEALTHY" : "LIQUIDATABLE!"));
  if (hf !== null && hf < threshold) { console.log("  *** ALERT: health factor " + hf.toFixed(4) + " is below your threshold of " + threshold + " ***"); }
  if (liqPrice !== null) { const drop = (Number(price - liqPrice) / Number(price)) * 100; console.log("  Liq. price:   ", (Number(liqPrice) / 1e36).toFixed(6), "(price can drop " + drop.toFixed(1) + "% before liquidation)"); }
  console.log("");
}
