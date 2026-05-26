import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
const MORPHO = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";
const ORACLE = "0x4A11590e5326138B514E08A9B52202D42077Ca65";
const marketId = process.argv[2] || "0x3a4048c64ba1b375330d376b1ce40e4047d03b47ab4d48af484edec9fec801ba";
const user = process.argv[3] || "0xC4C00d8b323f37527eEda27c87412378be9F68Ec";
const LLTV = 945000000000000000n;
const morphoAbi = [
  { type:"function", name:"market", stateMutability:"view", inputs:[{type:"bytes32"}], outputs:[{type:"uint128"},{type:"uint128"},{type:"uint128"},{type:"uint128"},{type:"uint128"},{type:"uint128"}] },
  { type:"function", name:"position", stateMutability:"view", inputs:[{type:"bytes32"},{type:"address"}], outputs:[{type:"uint256"},{type:"uint128"},{type:"uint128"}] },
];
const oracleAbi = [{ type:"function", name:"price", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] }];
const client = createPublicClient({ chain: base, transport: http("https://mainnet.base.org") });
const m = await client.readContract({ address: MORPHO, abi: morphoAbi, functionName: "market", args: [marketId] });
const p = await client.readContract({ address: MORPHO, abi: morphoAbi, functionName: "position", args: [marketId, user] });
const price = await client.readContract({ address: ORACLE, abi: oracleAbi, functionName: "price" });
const WAD = 10n ** 18n;
const ORACLE_SCALE = 10n ** 36n;
const totalBorrowAssets = m[2];
const totalBorrowShares = m[3];
const borrowShares = p[1];
const collateral = p[2];
const debt = totalBorrowShares === 0n ? 0n : (borrowShares * totalBorrowAssets) / totalBorrowShares;
const collateralValue = (collateral * price) / ORACLE_SCALE;
const maxBorrow = (collateralValue * LLTV) / WAD;
const hf = debt === 0n ? null : Number((maxBorrow * WAD) / debt) / 1e18;
console.log("==============================");
console.log("User:        ", user);
console.log("Collateral:  ", (Number(collateral) / 1e18).toFixed(4));
console.log("Debt:        ", (Number(debt) / 1e18).toFixed(4), "WETH");
console.log("Price:       ", (Number(price) / 1e36).toFixed(6));
console.log("Collat value:", (Number(collateralValue) / 1e18).toFixed(4), "WETH");
console.log("LLTV:       ", (Number(LLTV) / 1e18 * 100).toFixed(1) + "%");
console.log("------------------------------");
console.log("HEALTH FACTOR:", hf === null ? "no debt" : hf.toFixed(4));
console.log(hf === null ? "" : (hf >= 1 ? ">> HEALTHY" : ">> LIQUIDATABLE!"));
