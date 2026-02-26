/**
 * deploy.ts — Deploy MemoryConsent.sol using ethers.js v6 + raw JSON-RPC
 * (avoids quais SDK compatibility issues with current Quai RPC endpoints)
 *
 * USAGE:  npm run deploy
 * Then copy the contract address into .env as QUAI_CONTRACT_ADDRESS
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const RPC_URLS = [
    'https://rpc.quai.network/cyprus1',       // mainnet
    'https://orchard.rpc.quai.network/cyprus1', // testnet
];
const PRIVATE_KEY = process.env.QUAI_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error('❌ QUAI_PRIVATE_KEY missing from .env');
    process.exit(1);
}

// ─── Compile ─────────────────────────────────────────────────────────────────

async function compileSol(): Promise<{ abi: unknown[]; bytecode: string }> {
    const solc = await import('solc').then((m: { default?: unknown }) =>
        (m.default ?? m) as { compile: (i: string) => string }
    );
    const solPath = join(__dirname, '../../contracts/MemoryConsent.sol');
    const source = readFileSync(solPath, 'utf-8');
    const input = JSON.stringify({
        language: 'Solidity',
        sources: { 'MemoryConsent.sol': { content: source } },
        settings: {
            optimizer: { enabled: true, runs: 200 },
            outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
        },
    });
    const output = JSON.parse(solc.compile(input));
    if (output.errors) {
        const errs = (output.errors as Array<{ severity: string; message: string }>)
            .filter((e) => e.severity === 'error');
        if (errs.length) { console.error(errs); process.exit(1); }
    }
    const contract = output.contracts['MemoryConsent.sol']['MemoryConsent'];
    return { abi: contract.abi, bytecode: '0x' + contract.evm.bytecode.object };
}

// ─── Find working RPC ─────────────────────────────────────────────────────────

async function getWorkingProvider(): Promise<{ provider: ethers.JsonRpcProvider; url: string }> {
    for (const url of RPC_URLS) {
        try {
            console.log(`   Trying RPC: ${url}`);
            const provider = new ethers.JsonRpcProvider(url);
            // Test with a 10s timeout
            await Promise.race([
                provider.getBlockNumber(),
                new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000)),
            ]);
            console.log(`   ✅ RPC connected: ${url}`);
            return { provider, url };
        } catch (e) {
            console.log(`   ⚠️  Failed: ${(e as Error).message.slice(0, 60)}`);
        }
    }
    throw new Error('No Quai RPC responded — check network connectivity');
}

// ─── Deploy ──────────────────────────────────────────────────────────────────

async function deploy() {
    console.log('\n🚀 Deploying MemoryConsent to Quai Network...\n');

    console.log('   Compiling MemoryConsent.sol...');
    const { abi, bytecode } = await compileSol();
    console.log('   ✅ Compiled successfully');

    const { provider, url } = await getWorkingProvider();
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    console.log(`   Wallet: ${wallet.address}`);

    // Get balance
    try {
        const balance = await provider.getBalance(wallet.address);
        console.log(`   Balance: ${ethers.formatEther(balance)} QUAI`);
    } catch { /* non-fatal */ }

    console.log('\n   Deploying contract...');
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();
    const deployTx = contract.deploymentTransaction();
    console.log(`   ✅ Tx hash: ${deployTx?.hash ?? 'submitted'}`);

    console.log('   Waiting for confirmation (may take ~30s)...');
    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log('\n✅ MemoryConsent deployed!');
    console.log(`   Contract address: ${address}`);
    console.log(`   Network RPC: ${url}`);
    console.log('\n📝 Add to your .env:');
    console.log(`   QUAI_CONTRACT_ADDRESS=${address}`);
}

deploy().catch((err: Error) => {
    console.error('\n❌ Deployment failed:', err.message);
    console.error('\n💡 Alternative: Deploy via Quai Remix (no local key needed):');
    console.error('   1. Open https://remix.qu.ai');
    console.error('   2. Paste contracts/MemoryConsent.sol');
    console.error('   3. Connect Pelagus → Deploy');
    console.error('   4. Copy contract address → paste in .env as QUAI_CONTRACT_ADDRESS');
    process.exit(1);
});
