# morpho-risk

A tiny, zero-dependency-on-APIs tool to check the **health factor** and liquidation risk of any [Morpho](https://morpho.org) position on **Base**, using only public RPC.

No API keys. No indexer. No Morpho API. Just public on-chain data and the official Morpho math.

## Install

```bash
git clone https://github.com/alexpetrache-dev/morpho-risk.git
cd morpho-risk
npm install
```

## Usage

```bash
node health.js <marketId> <walletAddress>
```

Run with no arguments to try it with a built-in example position:

```bash
node health.js
```

## Example output

```
Usuario:     0xC4C00d8b323f37527eEda27c87412378be9F68Ec
Colateral:   1044.9082
Deuda:       1147.8007 WETH
Valor colat: 1290.8204 WETH
LLTV:        94.5%
HEALTH FACTOR: 1.0628
>> POSICION SANA
```

A health factor below 1.0 means the position can be liquidated.

## How it works

It reads three values directly from the Morpho Blue contract on Base:

- the market state (`market`) to convert borrow shares into real debt,
- the user position (`position`) for collateral and borrow shares,
- the market oracle (`price`) for the collateral price.

Then it applies the Morpho health factor formula:

```
healthFactor = (collateral * price * LLTV) / debt
```

## Extra: find-borrower.js

A helper that scans recent `Borrow` events to find real borrower addresses in a market, useful for testing.

```bash
node find-borrower.js
```

## License

MIT

## Scan a whole wallet

Instead of checking one market at a time, scan all of a wallet's recent Morpho positions on Base and get the health factor, liquidation price, and how much the collateral price can drop before liquidation:

```bash
node scan.js <walletAddress>
```

It scans the last ~50,000 blocks (~1 day) for collateral activity. For full history you would need an indexer (out of scope for this lightweight tool).

### Alert threshold

Pass a health factor threshold as a second argument. Any position below it is flagged with an alert:

```bash
node scan.js <walletAddress> 1.10
```

## Install as a command

Once installed, you can run it directly as `morpho-risk` from anywhere:

```bash
npm install
npm link
morpho-risk <walletAddress> [threshold]
```
