import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';
import {
    createPublicClient,
    createWalletClient,
    http,
    type WalletClient,
    type PublicClient,
} from 'viem';
import { StorageHubClient, initWasm } from '@storagehub-sdk/core';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { NETWORK, chain } from '../config/networks.js';

// ─── Trust boundary ────────────────────────────────────────────────────────────
// Private key stays in .env — never sent to DataHaven or any LLM provider.
// ──────────────────────────────────────────────────────────────────────────────

if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY missing from .env — cannot sign transactions');
}

const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(privateKey);
export const address = account.address;

// ─── EVM path (storage operations) ────────────────────────────────────────────

export const walletClient: WalletClient = createWalletClient({
    chain,
    account,
    transport: http(NETWORK.rpcUrl),
});

export const publicClient: PublicClient = createPublicClient({
    chain,
    transport: http(NETWORK.rpcUrl),
});

export const storageHubClient = new StorageHubClient({
    rpcUrl: NETWORK.rpcUrl,
    chain,
    walletClient,
    filesystemContractAddress: NETWORK.filesystemContractAddress,
});

// ─── Substrate path (on-chain reads) ──────────────────────────────────────────

await cryptoWaitReady();
const walletKeyring = new Keyring({ type: 'ethereum' });
export const signer = walletKeyring.addFromUri(privateKey);

const provider = new WsProvider(NETWORK.wsUrl);
export const polkadotApi: ApiPromise = await ApiPromise.create({
    provider,
    typesBundle: types,
    noInitWarn: true,
});

export { account };
