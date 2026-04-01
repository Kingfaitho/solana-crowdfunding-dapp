# Solana Crowdfunding Dapp

A full-stack decentralised crowdfunding application — smart contract on Solana devnet, React frontend, live and working.

I built this because crowdfunding is a problem I understand from a product perspective. Platforms like Kickstarter take 5-10% in fees, hold your money, and can freeze your campaign for any reason. On Solana, the contract holds the funds — not a company. The rules are enforced by code, not policy.

This is what that looks like in practice.

## How it works

Campaigns are created on-chain. Anyone with a Phantom wallet can donate SOL directly to a campaign. The campaign creator can withdraw funds at any time. Every transaction is visible on the Solana explorer.

- `create` — Deploy a campaign on-chain with a name and description
- `donate` — Send SOL directly to a campaign from any wallet
- `withdraw` — Creator withdraws funds, enforced by the program

## Live on Devnet

Program ID: `7HWVQUBtomi7pLhThdJzXcYTBPnT9tytm3GZa46p4pee`

View on Solana Explorer:
https://explorer.solana.com/address/7HWVQUBtomi7pLhThdJzXcYTBPnT9tytm3GZa46p4pee?cluster=devnet

## Live Demo

Live Demo: https://solana-crowdfunding-dapp-8vbydk2ij-kingfaithos-projects.vercel.app

## Tests

```
✔ Creates a campaign
✔ Donates to a campaign — 500,000,000 lamports (0.5 SOL)
✔ Withdraws from a campaign

3 passing
```

## Stack

- Rust + Anchor 0.32.1
- React + TypeScript (Vite)
- Solana Wallet Adapter — Phantom
- @coral-xyz/anchor client SDK
- Deployed on Solana devnet

## Run the smart contract

```bash
git clone https://github.com/Kingfaitho/solana-crowdfunding-dapp
cd solana-crowdfunding-dapp
npm install
anchor test
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Connect your Phantom wallet on devnet and create a campaign.

---

This is the most complete project in this series — on-chain logic, a working frontend, wallet integration, and a live deployment. The gap between a smart contract and a product people can actually use is where most blockchain developers stop. This is me not stopping there.
