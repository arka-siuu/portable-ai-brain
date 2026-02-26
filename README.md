# Portable AI Brain

**User-Owned, Encrypted & Verifiable AI Memory**

Built on DataHaven + Quai Network

**Video Presentation:** [https://youtu.be/Lg-3nI6EE3M](https://youtu.be/Lg-3nI6EE3M)

---

## Problem

Modern AI systems remember — but users don't own that memory.

When you switch between ChatGPT, Claude, Gemini, Llama, or Groq, your identity resets, your preferences disappear, and your goals vanish. AI memory today is centralized, provider-locked, non-portable, not cryptographically verifiable, and stored without explicit user consent.

**What if memory belonged to the user — not the model?**

---

## Solution

Portable AI Brain is a user-owned cognitive layer that separates identity, consent, storage, and inference into distinct trust planes:

| Plane | Technology | Responsibility |
|-------|------------|----------------|
| Identity | Pelagus Wallet | User signs actions |
| Consent | Quai Network | On-chain approval of memory writes |
| Truth | DataHaven | Encrypted, immutable memory storage |
| Inference | LLM Providers | Stateless text generation |

AI models become interchangeable. Memory becomes portable. Ownership becomes real.

---

## System Architecture

**Before:**
```
User → AI Model → Model Memory (centralized, siloed)
```

**After:**
```
User
 ↓
Pelagus Wallet (Identity)
 ↓
Quai Network (Consent Event)
 ↓
DataHaven (Encrypted Memory Storage)
 ↓
Any LLM Provider (Stateless)
```

---

## Why DataHaven?

DataHaven provides client-side AES-256-GCM encryption, immutable file-per-memory storage, Merkle-root verification, on-chain proof of storage, bucket-based ownership, verifiable deletion, and MSP-based decentralized storage.

Every memory is encrypted before leaving the device, stored as a separate immutable file, and generates a fingerprint committed on-chain that updates the bucket Merkle root. The MSP never sees plaintext — memory integrity is cryptographically provable.

---

## Why Quai Network?

Storage alone isn't enough. AI should not remember anything without explicit user approval.

A `MemoryConsent` smart contract deployed on Quai testnet enforces this. Before storing any memory, the AI extracts durable memory candidates, the user approves on-chain via Pelagus wallet, a `MemoryApproved` event is emitted, and only then is memory stored in DataHaven.

This ensures AI cannot store memory autonomously, user consent is immutable, and governance exists at the infrastructure level.

---

## Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MemoryConsent {
    event MemoryApproved(address indexed user, bytes32 indexed memoryHash);

    function approve(bytes32 memoryHash) external {
        emit MemoryApproved(msg.sender, memoryHash);
    }
}
```

Minimal design — no storage, no mappings, only event emission for minimal gas cost.

---

## Key Features

**Cross-LLM Portability** — Memory works across Llama 3.1, Gemma, Groq models, and any provider. Same brain, different models, same identity.

**Encrypted Memory Vault** — AES-256-GCM encryption stored on DataHaven. The MSP never sees plaintext.

**On-Chain Consent** — Pelagus wallet signs approval. Real Quai transaction. Event verified via RPC. No memory stored without consent.

**Verifiable Storage** — DataHaven fingerprint logged, FileKey returned, Merkle root updated, and retrieval integrity checked.

**Stateless LLM Switching** — Clear chat history and switch model. Without loading memory, the model knows nothing. With memory, full personalization is restored.

---

## Tech Stack

**Backend:** Node.js, TypeScript, `@storagehub-sdk/core`, `@storagehub-sdk/msp-client`, `@polkadot/api`, `viem`

**Blockchain:** DataHaven Testnet, Quai Orchard Testnet (Cyprus-1 zone), Pelagus Wallet

**Crypto:** AES-256-GCM (Node built-in crypto), keccak256 memory hashing

---

## Project Structure

```
src/
├── index.ts
├── config/
├── datahaven/
├── memory/
├── crypto/
├── llm/
├── quai/
│   ├── consentService.ts
│   └── deploy.ts
contracts/
└── MemoryConsent.sol
public/
└── index.html
```

---

## Running Locally

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment**

Create a `.env` file:
```env
PRIVATE_KEY=<DataHaven wallet key>
ENCRYPTION_KEY=<32-byte hex>
QUAI_RPC_URL=https://orchard.rpc.quai.network/cyprus1
QUAI_CONTRACT_ADDRESS=<deployed contract address>
```

**3. Deploy MemoryConsent (one-time)**

*Option A (Recommended):* Deploy via Remix using Pelagus injected provider.

*Option B:*
```bash
npm run deploy
```
Remove `QUAI_PRIVATE_KEY` from `.env` after deployment.

**4. Start the app**
```bash
npm run serve
```

Open `http://localhost:3000`

---

## Demo Flow

1. Connect Pelagus wallet
2. Chat with an LLM
3. Memory extracted — appears in Pending Consent panel
4. Click "Approve & Store"
5. Pelagus prompts for signature
6. Quai transaction emitted
7. Backend verifies event
8. Memory encrypted and stored in DataHaven
9. Switch model
10. Load memory — personalization restored

---

## Security Model

- No plaintext stored on-chain
- No private keys stored in backend runtime
- Consent verified before storage
- No dependency loop between chains
- Graceful failure if RPC unavailable

---

## Trust Model

| Layer | Guarantees |
|-------|------------|
| Pelagus | User identity |
| Quai | Consent immutability |
| DataHaven | Memory integrity |
| LLM | Stateless inference |

---

## What Makes This Novel

This is not prompt engineering, fine-tuning, provider memory, or localStorage hacks. This is infrastructure-level separation of memory from models — decoupling identity, consent, storage, and inference in a layered way that has not been done before.

---

## Vision

AI should not own your memory. You should.

Portable AI Brain turns memory into infrastructure.

---

## License

MIT

---

## Acknowledgements

- [DataHaven](https://datahaven.net)
- [Quai Network](https://qu.ai)
- [Pelagus Wallet](https://pelaguswallet.io)
