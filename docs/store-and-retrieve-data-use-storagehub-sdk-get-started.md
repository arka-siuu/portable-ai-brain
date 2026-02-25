---
title: Get Started with the StorageHub SDK
description: Set up your development environment, install the StorageHub SDK, and prepare your project to start interacting with the DataHaven network.
categories:
- Basics
- Store Data
- StorageHub SDK
url: https://docs.datahaven.xyz/store-and-retrieve-data/use-storagehub-sdk/get-started/
word_count: 2771
token_estimate: 5349
---

# Get Started with the StorageHub SDK

The StorageHub SDK is a modular toolkit that makes it easy to build on DataHaven, giving developers direct access to functionalities for managing storage, buckets, and proofs. It simplifies both on-chain and off-chain interactions so you can focus on your application logic rather than low-level integrations.

This guide introduces and compares the functionalities of the StorageHub SDK packages. You can use the StorageHub SDK for every step in the storage request and retrieval process. For more information, see the Workflow Overview.

## Workflow Overview

A high-level look at how data moves through DataHaven, from storage requests to upload, verification, and retrieval.

[timeline.left(datahaven-docs/.snippets/text/store-and-retrieve-data/overview/timeline-01.json)]

## StorageHub SDK Packages

The StorageHub SDK contains the following packages:

| <div style="width: 220px;">Package</div>                                                                     | Description                                                                  | When to Use                | Environments      |
|:-------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------|:---------------------------|:------------------|
| **[`@storagehub-sdk/core`](https://www.npmjs.com/package/@storagehub-sdk/core){target=\_blank}**             | Foundational, backend-agnostic building blocks for StorageHub.               | Chain-facing interactions  | Node.js, Browsers |
| **[`@storagehub-sdk/msp-client`](https://www.npmjs.com/package/@storagehub-sdk/msp-client){target=\_blank}** | High-level client for interacting with Main Storage Provider (MSP) services. | Provider-facing operations | Node.js, Browsers |

??? interface "`@storagehub-sdk/core`"

    The primary functions of [`@storagehub-sdk/core`](https://www.npmjs.com/package/@storagehub-sdk/core){target=\_blank} are to act as backend-agnostic building blocks including: 
    
    - Wallets and signing
    - [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193){target=\_blank}
    - Precompile helpers for bridging between Substrate and EVM
    - Merkle and WASM utilities
    - Low-level HTTP
    - Types and constants shared across the SDK.

    This package includes EVM account-typed helpers, WASM-backed file utilities, and stable primitives usable without any backend.

??? interface "`@storagehub-sdk/msp-client`"

    The primary functions of [`@storagehub-sdk/msp-client`](https://www.npmjs.com/package/@storagehub-sdk/msp-client){target=\_blank} are as follows:

    - Retrieve MSP-specific client information, such as:
        - Health
        - Authorization nonce/verify
        - Upload and download endpoints
    - Talk to an MSP backend for authorization and file transfer.
    - Includes REST contracts for MSP, token handling, and streaming or multipart upload and download helpers.

    This package includes all MSP-tied logic.

## Prerequisites

Before you begin, ensure you have the following:

- [Node.js ≥ 22](https://nodejs.org/en/download){target=\_blank} installed. LTS version recommended.
- [pnpm](https://pnpm.io/){target=\_blank}, [npm](https://www.npmjs.com/){target=\_blank}, or [yarn](https://yarnpkg.com/){target=\_blank} installed for package management
- [Testnet network configuration details](/store-and-retrieve-data/network-details/testnet/#network-configuration){target=\_blank}, including the RPC and WSS endpoints
- [Testnet MSP base URL](/store-and-retrieve-data/network-details/testnet/#msp-service-endpoint){target=\_blank}
- [Testnet tokens](https://apps.datahaven.xyz/faucet){target=\_blank}

??? interface "Need a starter project?"

    If you don't have an existing project, follow these steps to create a TypeScript project you can use to follow the guides in this section:
        
    1. Create a new project folder by executing the following command in the terminal:

        ```shell
        mkdir datahaven-project && cd datahaven-project
        ```

    2. Initialize a `package.json` file using the correct command for your package manager:

        === "pnpm"

            ```shell
            pnpm init
            ```

        === "yarn"

            ```shell
            yarn init
            ```

        === "npm"

            ```shell
            npm init --y
            ```

    3. Add the TypeScript and Node type definitions to your projects using the correct command for your package manager:

        === "pnpm"
            
            ``` bash
            pnpm add -D typescript tsx ts-node @types/node
            ```

        === "yarn"
            
            ``` bash
            yarn add -D typescript tsx ts-node @types/node
            ```

        === "npm"
            
            ``` bash
            npm install -D typescript tsx ts-node @types/node
            ```

    4. Create a `tsconfig.json` file in the root of your project and paste the following configuration:

        ```json title="tsconfig.json"
        {
            "compilerOptions": {
                "target": "ES2022",
                "module": "NodeNext",
                "moduleResolution": "NodeNext",
                "esModuleInterop": true,
                "strict": true,
                "resolveJsonModule": true,
                "skipLibCheck": true,
                "outDir": "dist",
                "declaration": true,
                "sourceMap": true
            },
            "include": ["src/**/*.ts"]
        }
        ```

    5. Initialize the `src` directory:

        ```shell
        mkdir src && touch src/index.ts
        ```
## Install the StorageHub SDK

Add the core and MSP client packages to your project. These libraries provide the APIs and utilities needed to interact with DataHaven’s storage network.

=== "pnpm"
    
    ```bash
    pnpm add @storagehub-sdk/core @storagehub-sdk/msp-client
    ```

=== "yarn"
    
    ```bash
    yarn add @storagehub-sdk/core @storagehub-sdk/msp-client
    ```

=== "npm"
    
    ```bash
    npm install @storagehub-sdk/core @storagehub-sdk/msp-client
    ```

## Initialize the StorageHub SDK

Follow the steps in this section to set up the clients needed to work with the StorageHub SDK, allowing you to interact with DataHaven and manage your data.

### Install Client Dependencies

=== "pnpm"

    ```bash { .break-spaces }
    pnpm add @storagehub/types-bundle @polkadot/api @polkadot/types @polkadot/util-crypto @storagehub/api-augment viem
    ```

=== "yarn"

    ```bash { .break-spaces }
    yarn add @storagehub/types-bundle @polkadot/api @polkadot/types @polkadot/util-crypto @storagehub/api-augment viem
    ```

=== "npm"

    ```bash { .break-spaces }
    npm install @storagehub/types-bundle @polkadot/api @polkadot/types @polkadot/util-crypto @storagehub/api-augment viem
    ```

??? interface "Why do I need these dependencies?"

    - **[`@storagehub/types-bundle`](https://www.npmjs.com/package/@storagehub/types-bundle){target=_blank}:** Describes DataHaven's custom on-chain types.

    - **[`@polkadot/api`](https://www.npmjs.com/package/@polkadot/api){target=_blank}:** The core JavaScript library used to talk to any Substrate-based blockchain, which in this case is DataHaven.

    - **[`@polkadot/types`](https://www.npmjs.com/package/@polkadot/types){target=_blank}:** Provides type definitions and codecs for encoding/decoding Substrate data structures.

    - **[`@polkadot/util-crypto`](https://www.npmjs.com/package/@polkadot/util-crypto){target=_blank}:** Cryptographic utilities for key generation, signing, and hashing operations. Used for wallet management and transaction signing.

    - **[`@storagehub/api-augment`](https://www.npmjs.com/package/@storagehub/api-augment){target=_blank}:** Extends `@polkadot/api` with DataHaven's custom pallets and RPC methods. You will import it in your `index.ts` file where your main script logic will be executed.

    - **[`viem`](https://www.npmjs.com/package/viem){target=_blank}:** Lightweight library for building Ethereum-compatible applications.

### Set Up Networks

1. In the folder where your `index.ts` (or main code file) is located, create a new folder called `config`:

    ```shell
    mkdir config && cd config
    ```

2. Create a `networks.ts` file.

    ```sh
    touch networks.ts
    ```

3. Add the following code:

    !!! note
        The code in the following sections uses DataHaven testnet configuration values, which include the chain ID RPC URL, WSS URL, MSP URL, and token metadata. If you’re running a local devnet, make sure to select the configuration parameters within the `NETWORKS` constant that are relevant for local devnet. You can also find all the relevant local devnet values in the [Local Devnet](/store-and-retrieve-data/network-details/local-devnet/) page.

    ```ts title="networks.ts"
    import { Chain, defineChain } from 'viem';

    export const NETWORKS = {
      devnet: {
        id: 181222,
        name: 'DataHaven Local Devnet',
        rpcUrl: 'http://127.0.0.1:9666',
        wsUrl: 'ws://127.0.0.1:9666',
        mspUrl: 'http://127.0.0.1:8080/',
        nativeCurrency: { name: 'StorageHub', symbol: 'SH', decimals: 18 },
        filesystemContractAddress:
          '0x0000000000000000000000000000000000000064' as `0x${string}`,
      },
      testnet: {
        id: 55931,
        name: 'DataHaven Testnet',
        rpcUrl: 'https://services.datahaven-testnet.network/testnet',
        wsUrl: 'wss://services.datahaven-testnet.network/testnet',
        mspUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network/',
        nativeCurrency: { name: 'Mock', symbol: 'MOCK', decimals: 18 },
        filesystemContractAddress:
          '0x0000000000000000000000000000000000000404' as `0x${string}`,
      },
    };

    export const NETWORK = NETWORKS.testnet; // Change this to switch between devnet and testnet

    export const chain: Chain = defineChain({
      id: NETWORK.id,
      name: NETWORK.name,
      nativeCurrency: NETWORK.nativeCurrency,
      rpcUrls: { default: { http: [NETWORK.rpcUrl] } },
    });
    ```

### Set Up Client Service

You need to set up the necessary clients to connect to the DataHaven network, which runs on a dual-protocol architecture (Substrate for core logic and EVM for compatibility).

1. In the folder where your `index.ts` (or main code file) is located, create a new folder called `services`:

    ```shell
    mkdir services && cd services
    ```

2. Create a `clientService.ts` file.

    ```sh
    touch clientService.ts
    ```

3. Add the following code:

    ```ts title="clientService.ts"
    import { privateKeyToAccount } from 'viem/accounts';
    import {
      createPublicClient,
      createWalletClient,
      http,
      WalletClient,
      PublicClient,
    } from 'viem';
    import { StorageHubClient } from '@storagehub-sdk/core';
    import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
    import { types } from '@storagehub/types-bundle';
    import { cryptoWaitReady } from '@polkadot/util-crypto';
    import { NETWORK, chain } from '../config/networks.js';
    const account = privateKeyToAccount('INSERT_PRIVATE_KEY' as `0x${string}`);
    const address = account.address;

    // Create signer from secret URI
    await cryptoWaitReady();
    const walletKeyring = new Keyring({ type: 'ethereum' });
    const signer = walletKeyring.addFromUri('INSERT_PRIVATE_KEY');

    const walletClient: WalletClient = createWalletClient({
      chain,
      account,
      transport: http(NETWORK.rpcUrl),
    });

    const publicClient: PublicClient = createPublicClient({
      chain,
      transport: http(NETWORK.rpcUrl),
    });

    // Create StorageHub client
    const storageHubClient: StorageHubClient = new StorageHubClient({
      rpcUrl: NETWORK.rpcUrl,
      chain: chain,
      walletClient: walletClient,
      filesystemContractAddress: NETWORK.filesystemContractAddress,
    });

    // Create Polkadot API client
    const provider = new WsProvider(NETWORK.wsUrl);
    const polkadotApi: ApiPromise = await ApiPromise.create({
      provider,
      typesBundle: types,
      noInitWarn: true,
    });

    export {
      account,
      address,
      signer,
      publicClient,
      walletClient,
      storageHubClient,
      polkadotApi,
    };
    ```

    !!! warning
        It is assumed that private keys are securely stored and managed in accordance with standard security practices.

    With the code in place, you now have the following:

    - EVM path:
        - **`account`**: The viem account object derived from your private key. Used internally by `walletClient` for signing EVM transactions.
        - **`address`**: Your Ethereum-style address (e.g., `0x...`). Useful for displaying your identity or filtering events.
        - **`walletClient`**: Used for signing and broadcasting EVM transactions using your private key.
        - **`publicClient`**: Used for reading general public data from the chain, such as checking transaction receipts or block status.
        - **`storageHubClient`**: A higher-level SDK client that wraps EVM precompile interactions. Use this for common storage operations like creating buckets, issuing storage requests, uploading/deleting files, and managing payment streams, without writing raw Solidity calls.

    - Native Substrate path:
        - **`signer`**: A Polkadot.js Keyring signer required for signing native Substrate extrinsics (transactions) that don't go through the EVM layer (such as [BSP verification](/provide-storage/backup-storage-provider/verify-bsp-node-via-api){target=\_blank}).
        - **`polkadotApi`**: Used for reading on-chain state (storage requests, pallets, MSP file confirmations) from the underlying DataHaven Substrate runtime and for submitting native Substrate transactions when direct access to Substrate features is needed.

    When to use which:

    - **For most storage operations** (upload, download, delete, buckets), use `storageHubClient`—it handles the EVM precompiles for you.
    - **For reading Substrate-specific state** (e.g., provider reputation, forest roots, bucket metadata not exposed via EVM), use `polkadotApi`.
    - **For low-level EVM contract interactions** or custom precompile calls, use `walletClient` + `publicClient` directly.
    - **For native Substrate extrinsics** (if you need features not yet bridged to EVM), use `polkadotApi` + `signer`.

### Set Up MSP Service

To interact with DataHaven's Main Storage Provider (MSP) services, you need to establish a connection using the `MspClient` from the StorageHub SDK. This involves configuring the HTTP client, setting up session management for authenticated requests, and initializing the MSP client itself.

1. Create a `mspService.ts` file within your `services` folder.

    ```sh
    touch mspService.ts
    ```

2. Add the following code:

    !!! note
        The code below uses DataHaven testnet configuration values, which include the chain ID, RPC URL, WSS URL, MSP URL, and token metadata. If you’re running a local devnet, make sure to replace these with your local configuration parameters. You can find all the relevant local devnet values in the [Local Devnet](/store-and-retrieve-data/network-details/local-devnet) page.

    ```ts title="mspService.ts"
    import {
      HealthStatus,
      InfoResponse,
      MspClient,
      UserInfo,
    } from '@storagehub-sdk/msp-client';
    import { HttpClientConfig } from '@storagehub-sdk/core';
    import { address, walletClient } from './clientService.js';
    import { NETWORK } from '../config/networks.js';

    // Configure the HTTP client to point to the MSP backend
    const httpCfg: HttpClientConfig = { baseUrl: NETWORK.mspUrl };

    // Initialize a session token for authenticated requests (updated after authentication
    // through SIWE)
    let sessionToken: string | undefined = undefined;

    // Provide session information to the MSP client whenever available
    // Returns a token and user address if authenticated, otherwise undefined
    const sessionProvider = async () =>
      sessionToken
        ? ({ token: sessionToken, user: { address: address } } as const)
        : undefined;

    // Establish a connection to the Main Storage Provider (MSP) backend
    const mspClient = await MspClient.connect(httpCfg, sessionProvider);

    // Retrieve MSP metadata, including its unique ID and version, and log it to the console
    const getMspInfo = async (): Promise<InfoResponse> => {
      const mspInfo = await mspClient.info.getInfo();
      console.log(`MSP ID: ${mspInfo.mspId}`);
      return mspInfo;
    };

    // Retrieve and log the MSP’s current health status
    const getMspHealth = async (): Promise<HealthStatus> => {
      const mspHealth = await mspClient.info.getHealth();
      console.log(`MSP Health: ${mspHealth}`);
      return mspHealth;
    };

    // Authenticate the user via SIWE (Sign-In With Ethereum) using the connected wallet
    // Once authenticated, store the returned session token and retrieve the user’s profile
    const authenticateUser = async (): Promise<UserInfo> => {
      console.log('Authenticating user with MSP via SIWE...');

      // In development domain and uri can be arbitrary placeholders,
      // but in production they must match your actual frontend origin.
      const domain = 'localhost';
      const uri = 'http://localhost';

      const siweSession = await mspClient.auth.SIWE(walletClient, domain, uri);
      console.log('SIWE Session:', siweSession);
      sessionToken = (siweSession as { token: string }).token;

      const profile: UserInfo = await mspClient.auth.getProfile();
      return profile;
    };

    // Export initialized client and helper functions for use in other modules
    export { mspClient, getMspInfo, getMspHealth, authenticateUser };
    ```

    With the code in place, you now have the following:

    - **`mspClient`**: Used for interacting with a Main Storage Provider (MSP) backend — allowing you to authenticate via SIWE, retrieve MSP information and health status, and perform storage-related actions through REST-like endpoints.
    - **`getMspInfo`**: Fetches general MSP metadata such as its unique ID, version, and available endpoints.
    - **`getMspHealth`**: Checks the operational health of the MSP and reports whether it’s running normally or facing issues.
    - **`authenticateUser`**: Authenticates your wallet with the MSP via Sign-In With Ethereum (SIWE), creates a session token, and returns your user profile.

## Set Up the Smart Contract Path (Optional)

The guides in this section offer two approaches for interacting with DataHaven's on-chain storage logic:

- **SDK**: Uses the `StorageHubClient` from `@storagehub-sdk/core`, which wraps precompile calls behind convenient methods like `storageHubClient.createBucket(...)`. This is the recommended path for most developers.
- **SC (Smart Contract)**: Calls the [FileSystem Precompile](https://github.com/Moonsong-Labs/storage-hub/blob/main/precompiles/pallet-file-system/FileSystem.sol#L7){target=\_blank} directly using viem's `readContract` and `writeContract` with the raw ABI. This gives you full control over the transaction parameters and is useful for custom integrations or when you need access to precompile functions not yet exposed by the SDK.

Guides that support both approaches have an **SDK / SC toggle** at the top of the page, letting you switch between them.

### What Is a Precompile?

A precompile is a smart contract deployed at a fixed address that bridges EVM calls into the underlying Substrate runtime. Instead of writing Solidity contracts from scratch, you call the precompile's functions through standard EVM tooling (like viem), and the chain routes those calls to the native storage pallets. 

The FileSystem Precompile handles operations like creating buckets, issuing storage requests, and deleting files. More precompiles will become available as the network evolves.

You already have the precompile addresses configured in your `networks.ts` file under the `filesystemContractAddress` field for both testnet (`0x...0404`) and local devnet (`0x...0064`).

### Download the FileSystem ABI

To call the precompile directly, you need its ABI. Create an `abis` folder in your project and download the ABI file:

```bash
mkdir abis
```

Download the [`FileSystemABI.json`](/downloads/abis/FileSystemABI.json){: download } file and place it in the `abis` folder. Your project structure should look like this:

```text
your-project/
├── abis/
│   └── FileSystemABI.json
├── config/
│   └── networks.ts
├── services/
│   ├── clientService.ts
│   └── mspService.ts
└── index.ts
```

In the SC guides, you'll import the ABI like this:

```ts
import fileSystemAbi from '../abis/FileSystemABI.json' with { type: 'json' };
```

And use it with viem to call precompile functions directly:

```ts
import { toHex } from 'viem';
import { chain, NETWORK } from './config/networks.js';
import { publicClient, walletClient, account, address } from './services/clientService.js';
import fileSystemAbi from './abis/FileSystemABI.json' with { type: 'json' };

// Read (no transaction)
const bucketId = await publicClient.readContract({
  address: NETWORK.filesystemContractAddress,
  abi: fileSystemAbi,
  functionName: 'deriveBucketId',
  args: [address, toHex('my-bucket')],
});

// Write (submits a transaction)
const txHash = await walletClient.writeContract({
  account,
  address: NETWORK.filesystemContractAddress,
  abi: fileSystemAbi,
  chain,
  functionName: 'createBucket',
  args: [
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    toHex('my-bucket'),
    false,
    '0x628a23c7aa64902e13f63ffdd0725e07723745f84cabda048d901020d200da1e',
  ],
});
```

With both the SDK and the ABI in place, you're ready to follow either path in the guides that follow.

## Next Steps

Now that you have the StorageHub SDK packages installed and all the necessary clients set up, you are ready to start building with DataHaven.

<div class="grid cards" markdown>

-  <a href="/store-and-retrieve-data/use-storagehub-sdk/create-a-bucket/" markdown>:material-arrow-right: 

    **Create A Bucket**

    Follow this guide to create your first bucket, DataHaven's storage container for your files. This is the perfect first step on your journey of building on DataHaven.

    </a>

-  <a href="/store-and-retrieve-data/use-storagehub-sdk/end-to-end-storage-workflow/" markdown>:material-arrow-right:

    **End-to-End Storage Workflow**

    This tutorial takes you step-by-step through storing a file on DataHaven and retrieving it from the network. Take this step to see how all the pieces fit together in one go.

    </a>

</div>
