---
title: Create a Bucket via SDK
description: Guide on what storage buckets are in DataHaven, how to create them with the StorageHub SDK, and what edge cases to look out for.
categories:
- Store Data
- StorageHub SDK
url: https://docs.datahaven.xyz/store-and-retrieve-data/use-storagehub-sdk/create-a-bucket/
word_count: 3847
token_estimate: 7287
---

# Create a Bucket

Buckets are logical containers (folders) that group your files under a Main Storage Provider (MSP). Each bucket is tied to a specific MSP and value proposition, which together define where your data will be stored and at what price. Before you can issue storage requests or upload files to DataHaven, you must first create a bucket.

This guide walks you through creating your first bucket programmatically using the StorageHub SDK — from connecting to an MSP and initializing the SDK to deriving a bucket ID, creating the bucket on-chain, and verifying its data.

## Prerequisites

- [Node.js](https://nodejs.org/en/download){target=_blank} v22+ installed
- A TypeScript project

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

- [Dependencies installed](/store-and-retrieve-data/use-storagehub-sdk/get-started/#install-the-storagehub-sdk)

- [Clients initialized](/store-and-retrieve-data/use-storagehub-sdk/get-started/#initialize-the-storagehub-sdk)
## Initialize the Script Entry Point

Create an `index.ts` file if you haven't already. Its `run` method will orchestrate all the logic in this guide, and you’ll replace the labelled placeholders with real code step by step. By now, your services folder (including the MSP and client helper services) should already be created. If not, see the [Get Started](/store-and-retrieve-data/use-storagehub-sdk/get-started/) guide.

The `index.ts` snippet below also imports `bucketOperations.ts`, which is not in your project yet—that's expected, as you'll create it later in this guide.

Add the following code to your `index.ts` file:

```ts title="index.ts"
import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import {
  createBucket,
  verifyBucketCreation,
  waitForBackendBucketReady,
} from './operations/bucketOperations.js';
import { HealthStatus } from '@storagehub-sdk/msp-client';
import { mspClient } from './services/mspService.js';
async function run() {
  // For anything from @storagehub-sdk/core to work, initWasm() is required
  // on top of the file
  await initWasm();
  
  // --- Bucket creating logic ---
  // **PLACEHOLDER FOR STEP 1: CHECK MSP HEALTH**
  // **PLACEHOLDER FOR STEP 2: CREATE BUCKET**
  // **PLACEHOLDER FOR STEP 3: VERIFY BUCKET**
  // **PLACEHOLDER FOR STEP 4: WAIT FOR BACKEND**

  // Disconnect the Polkadot API at the very end
  await polkadotApi.disconnect();
}

await run();
```

## Check MSP Health

Next, since you are already connected to the MSP client, check its health status before creating a bucket.

1. Replace the placeholder `// **PLACEHOLDER FOR STEP 1: CHECK MSP HEALTH**` with the following code:

    ```ts title="index.ts // **PLACEHOLDER FOR STEP 1: CHECK MSP HEALTH**"
      // Check MSP Health Status
      const mspHealth: HealthStatus = await mspClient.info.getHealth();
      console.log('MSP Health Status:', mspHealth);
    ```

2. Check the health status by running the script:

    ```bash
    ts-node index.ts
    ```

    The response should return a **`healthy`** status, like this:

    <div class="termynal" data-termynal>
        <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
        <span data-ty><pre>MSP Health Status: {
        status: 'healthy',
        version: '0.1.0',
        service: 'backend-title',
        components: {
            storage: { status: 'healthy' },
            postgres: { status: 'healthy' },
            rpc: { status: 'healthy' }
        }
    }</pre></span>
    <span data-ty="input"><span class="file-path"></span></span>
    </div>
## Create a Bucket

Buckets must be created under a specific MSP, and each MSP exposes one or more value propositions that describe what the storage fees under that MSP are going to look like. 

Before creating a bucket you need to fetch those value props, choose the one you want to use, and then submit the bucket-creation transaction. To do all this, you are going to: 

1. Create a `getValueProps` helper method within `mspService.ts`.
2. Create a `createBucket` helper method within `bucketOperations.ts`.
3. Update the `index.ts` file to trigger the logic you've implemented.

### Add Method to Get Value Props

Fetch the `valueProps` from the MSP you are connected to. An MSP's value prop is its storage fee. The files you will store within a certain bucket will cost you based on the value prop you choose.

To fetch `valueProps` from the MSP Client, take the following steps:

1. Add the following helper method to your `mspService.ts` file:

    ```ts title="mspService.ts"
    // Retrieve MSP value propositions and select one for bucket creation
    const getValueProps = async (): Promise<`0x${string}`> => {
      const valueProps: ValueProp[] = await mspClient.info.getValuePropositions();
      if (!Array.isArray(valueProps) || valueProps.length === 0) {
        throw new Error('No value propositions available from MSP');
      }
      // For simplicity, select the first value proposition and return its ID
      const valuePropId = valueProps[0].id as `0x${string}`;
      console.log(`Chose Value Prop ID: ${valuePropId}`);
      return valuePropId;
    };
    ```

2. Add the `getValueProps` method to the export statement at the bottom of the `mspService.ts` file.

    ```ts title="mspService.ts"
    // Export initialized client and helper functions for use in other modules
    export { mspClient, getMspInfo, getMspHealth, authenticateUser, getValueProps };
    ```

??? code "View complete `mspService.ts` file"

    ```ts title="mspService.ts"
    import {
      HealthStatus,
      InfoResponse,
      MspClient,
      UserInfo,
      ValueProp,
    } from '@storagehub-sdk/msp-client';
    import { HttpClientConfig } from '@storagehub-sdk/core';
    import { address, walletClient } from './clientService.js';

    const NETWORKS = {
      devnet: {
        id: 181222,
        name: 'DataHaven Local Devnet',
        rpcUrl: 'http://127.0.0.1:9666',
        wsUrl: 'wss://127.0.0.1:9666',
        mspUrl: 'http://127.0.0.1:8080/',
        nativeCurrency: { name: 'StorageHub', symbol: 'SH', decimals: 18 },
      },
      testnet: {
        id: 55931,
        name: 'DataHaven Testnet',
        rpcUrl: 'https://services.datahaven-testnet.network/testnet',
        wsUrl: 'wss://services.datahaven-testnet.network/testnet',
        mspUrl: 'https://deo-dh-backend.testnet.datahaven-infra.network/',
        nativeCurrency: { name: 'Mock', symbol: 'MOCK', decimals: 18 },
      },
    };

    // Configure the HTTP client to point to the MSP backend
    const httpCfg: HttpClientConfig = { baseUrl: NETWORKS.testnet.mspUrl };

    // Initialize a session token for authenticated requests (updated after authentication through SIWE)
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

    // Retrieve MSP value propositions and select one for bucket creation
    const getValueProps = async (): Promise<`0x${string}`> => {
      const valueProps: ValueProp[] = await mspClient.info.getValuePropositions();
      if (!Array.isArray(valueProps) || valueProps.length === 0) {
        throw new Error('No value propositions available from MSP');
      }
      // For simplicity, select the first value proposition and return its ID
      const valuePropId = valueProps[0].id as `0x${string}`;
      console.log(`Chose Value Prop ID: ${valuePropId}`);
      return valuePropId;
    };

    // Export initialized client and helper functions for use in other modules
    export { mspClient, getMspInfo, getMspHealth, authenticateUser, getValueProps };
    ```

### Add Method to Create a Bucket

Bucket-related logic will live in a separate `bucketOperations.ts` file. To implement it, take the following steps:

1. Create a new folder called `operations` within the `src` folder (at the same level as the `services` folder) like so:

    ```bash
    mkdir operations
    ```

2. Create a new file within the `operations` folder called `bucketOperations.ts`

3. Add the following code, which uses the `getValueProps` helper from the previous section in `createBucket`:

    !!! note
        After creating a bucket, it is crucial to wait for the transaction receipt, as shown in the code below. If writing custom bucket-creation logic, make sure to include that step; otherwise, you will fetch bucket data before it is available.

    ```ts title="bucketOperations.ts"
    import {
      storageHubClient,
      address,
      publicClient,
      polkadotApi,
    } from '../services/clientService.js';
    import {
      getMspInfo,
      getValueProps,
      mspClient,
    } from '../services/mspService.js';
    export async function createBucket(bucketName: string) {
      // Get basic MSP information from the MSP including its ID
      const { mspId } = await getMspInfo();

      // Choose one of the value props retrieved from the MSP through the helper function
      const valuePropId = await getValueProps();
      console.log(`Value Prop ID: ${valuePropId}`);

      // Derive bucket ID
      const bucketId = (await storageHubClient.deriveBucketId(
        address,
        bucketName,
      )) as string;
      console.log(`Derived bucket ID: ${bucketId}`);

      // Check that the bucket doesn't exist yet
      const bucketBeforeCreation =
        await polkadotApi.query.providers.buckets(bucketId);
      console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);
      if (!bucketBeforeCreation.isEmpty) {
        throw new Error(`Bucket already exists: ${bucketId}`);
      }

      const isPrivate = false;

      // Create bucket on chain
      const txHash: `0x${string}` | undefined = await storageHubClient.createBucket(
        mspId as `0x${string}`,
        bucketName,
        isPrivate,
        valuePropId,
      );

      console.log('createBucket() txHash:', txHash);
      if (!txHash) {
        throw new Error('createBucket() did not return a transaction hash');
      }

      // Wait for transaction receipt
      // Don't proceed until receipt is confirmed on chain
      const txReceipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (txReceipt.status !== 'success') {
        throw new Error(`Bucket creation failed: ${txHash}`);
      }

      return { bucketId, txReceipt };
    }
    ```

    The `createBucket` helper handles the full lifecycle of a bucket-creation transaction:  

    - It fetches the MSP ID and selects a value prop (required to create a bucket).  
    - It derives a deterministic bucket ID from your wallet address and chosen bucket name.  
    - Before sending any on-chain transaction, it checks whether the bucket already exists to prevent accidental overwrites.  

    Once the check passes, the `createBucket` extrinsic is called via the StorageHub client, returning the `bucketId` and `txReceipt`.  

### Call the Create Bucket Helper Method

Now that you've extracted all the bucket creation logic into its own method, you'll update the `index.ts` file.  

1. Replace the placeholder `// **PLACEHOLDER FOR STEP 2: CREATE BUCKET**` with the following code:

    ```ts title="index.ts // **PLACEHOLDER FOR STEP 2: CREATE BUCKET**"
      // Create a bucket
      const bucketName = 'init-bucket';
      const { bucketId, txReceipt } = await createBucket(bucketName);
      console.log(`Created Bucket ID: ${bucketId}`);
      console.log(`createBucket() txReceipt: ${txReceipt}`);
    ```

    !!! note
        You can also get a list of all your created buckets within a certain MSP using the `mspClient.buckets.listBuckets()` function. Make sure you are authenticated before triggering this function.


2. Execute the `createBucket` method by running the script:

    ```bash
    ts-node index.ts
    ```

    The response should look something like this:

    <div class="termynal" data-termynal>
        <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
        <span data-ty>Derived bucket ID: 0x659ca967940ee656b10ea85813bb14f054137d330ec87f9914a2c46a981196f6</span>
        <span data-ty>Bucket before creation is empty true</span>
        <span data-ty>createBucket() txHash: 0x2f370c2a7906b830d6351857449af201a5abe90f0ace8e8a6c972509ca579cc8</span>
        <span data-ty>Created Bucket ID: 0x659ca967940ee656b10ea85813bb14f054137d330ec87f9914a2c46a981196f6</span>
        <span data-ty>createBucket() txReceipt: {
      transactionHash: '0x2f370c2a7906b830d6351857449af201a5abe90f0ace8e8a6c972509ca579cc8',
      transactionIndex: 0,
      blockHash: '0x773b4139cd5b1dc4374e137dcf279b89869a3f86caec070ec3478ce898adfc33',
      from: '0x00fa35d84a43db75467d2b2c1ed8974aca57223e',
      to: '0x0000000000000000000000000000000000000404',
      blockNumber: 174629n,
      cumulativeGasUsed: 111152n,
      gasUsed: 111152n,
      contractAddress: null,
      logs: [
        {
          address: '0x0000000000000000000000000000000000000404',
          topics: [Array],
          data: '0x',
          blockHash: '0x773b4139cd5b1dc4374e137dcf279b89869a3f86caec070ec3478ce898adfc33',
          blockNumber: 174629n,
          transactionHash: '0x2f370c2a7906b830d6351857449af201a5abe90f0ace8e8a6c972509ca579cc8',
          transactionIndex: 0,
          logIndex: 0,
          transactionLogIndex: '0x0',
          removed: false
        }
      ],
      logsBloom: '0x00000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000080040000000000000000000000000000000000040100000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000004000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000010000000800000000000000000000040000000000000000000000000000000010000000000000000000000000000080000',
      status: 'success',
      effectiveGasPrice: 1000000000n,
      type: 'legacy'
    }</span>
    <span data-ty="input"><span class="file-path"></span></span>
    </div>
## Check if Bucket is On-Chain

The last step is to verify that the bucket was created successfully on-chain and to confirm its stored data. Just like with the `createBucket` method, you can extract all the bucket verification logic into its own `verifyBucketCreation` method. 

1. Add the following code in your `bucketOperations.ts` file:
    
    ```ts title="bucketOperations.ts"
    // Verify bucket creation on chain and return bucket data
    export async function verifyBucketCreation(bucketId: string) {
      const { mspId } = await getMspInfo();

      const bucket = await polkadotApi.query.providers.buckets(bucketId);
      if (bucket.isEmpty) {
        throw new Error('Bucket not found on chain after creation');
      }

      const bucketData = bucket.unwrap().toHuman();
      console.log(
        'Bucket userId matches initial bucket owner address',
        bucketData.userId === address,
      );
      console.log(
        `Bucket MSPId matches initial MSPId: ${bucketData.mspId === mspId}`,
      );
      return bucketData;
    }
    ```

2. Update the `index.ts` file to trigger the helper method you just implemented:

    ```ts title="index.ts // **PLACEHOLDER FOR STEP 3: VERIFY BUCKET**"
      // Verify bucket exists on chain
      const bucketData = await verifyBucketCreation(bucketId);
      console.log('Bucket data:', bucketData);
    ```

    The response should look something like this:

    <div class="termynal" data-termynal>
        <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
        <span data-ty>Bucket userId matches initial bucket owner address: true</span>
        <span data-ty>Bucket mspId matches initial mspId: true</span>
        <span data-ty><pre>Bucket data: {
      root: '0x03170a2e7597b7b7e3d84c05391d139a62b157e78786d8c082f29dcf4c111314',
      userId: '0x00FA35D84a43db75467D2B2c1ed8974aCA57223e',
      mspId: '0x0000000000000000000000000000000000000000000000000000000000000001',
      private: false,
      readAccessGroupId: null,
      size_: '0',
      valuePropId: '0x628a23c7aa64902e13f63ffdd0725e07723745f84cabda048d901020d200da1e'
    }</pre></span>
    <span data-ty="input"><span class="file-path"></span></span>
    </div>
??? code "View complete `bucketOperations.ts` file up until this point"

    ```ts title="bucketOperations.ts"
    import {
      storageHubClient,
      address,
      publicClient,
      polkadotApi,
    } from '../services/clientService.js';
    import {
      getMspInfo,
      getValueProps,
      mspClient,
    } from '../services/mspService.js';
    export async function createBucket(bucketName: string) {
      // Get basic MSP information from the MSP including its ID
      const { mspId } = await getMspInfo();

      // Choose one of the value props retrieved from the MSP through the helper function
      const valuePropId = await getValueProps();
      console.log(`Value Prop ID: ${valuePropId}`);

      // Derive bucket ID
      const bucketId = (await storageHubClient.deriveBucketId(
        address,
        bucketName,
      )) as string;
      console.log(`Derived bucket ID: ${bucketId}`);

      // Check that the bucket doesn't exist yet
      const bucketBeforeCreation =
        await polkadotApi.query.providers.buckets(bucketId);
      console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);
      if (!bucketBeforeCreation.isEmpty) {
        throw new Error(`Bucket already exists: ${bucketId}`);
      }

      const isPrivate = false;

      // Create bucket on chain
      const txHash: `0x${string}` | undefined = await storageHubClient.createBucket(
        mspId as `0x${string}`,
        bucketName,
        isPrivate,
        valuePropId,
      );

      console.log('createBucket() txHash:', txHash);
      if (!txHash) {
        throw new Error('createBucket() did not return a transaction hash');
      }

      // Wait for transaction receipt
      // Don't proceed until receipt is confirmed on chain
      const txReceipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (txReceipt.status !== 'success') {
        throw new Error(`Bucket creation failed: ${txHash}`);
      }

      return { bucketId, txReceipt };
    }
    // Verify bucket creation on chain and return bucket data
    export async function verifyBucketCreation(bucketId: string) {
      const { mspId } = await getMspInfo();

      const bucket = await polkadotApi.query.providers.buckets(bucketId);
      if (bucket.isEmpty) {
        throw new Error('Bucket not found on chain after creation');
      }

      const bucketData = bucket.unwrap().toHuman();
      console.log(
        'Bucket userId matches initial bucket owner address',
        bucketData.userId === address,
      );
      console.log(
        `Bucket MSPId matches initial MSPId: ${bucketData.mspId === mspId}`,
      );
      return bucketData;
    }
    ```

??? code "View complete `index.ts` file up until this point"

    ```ts title="index.ts"
    import '@storagehub/api-augment';
    import { initWasm } from '@storagehub-sdk/core';
    import { polkadotApi } from './services/clientService.js';
    import {
      createBucket,
      verifyBucketCreation,
      waitForBackendBucketReady,
    } from './operations/bucketOperations.js';
    import { HealthStatus } from '@storagehub-sdk/msp-client';
    import { mspClient } from './services/mspService.js';
    async function run() {
    // For anything from @storagehub-sdk/core to work, initWasm() is required
    // on top of the file
    await initWasm();
    
    // --- Bucket creating logic ---
      // Check MSP Health Status
      const mspHealth: HealthStatus = await mspClient.info.getHealth();
      console.log('MSP Health Status:', mspHealth);
      // Create a bucket
      const bucketName = 'init-bucket';
      const { bucketId, txReceipt } = await createBucket(bucketName);
      console.log(`Created Bucket ID: ${bucketId}`);
      console.log(`createBucket() txReceipt: ${txReceipt}`);
      // Verify bucket exists on chain
      const bucketData = await verifyBucketCreation(bucketId);
      console.log('Bucket data:', bucketData);
    // **PLACEHOLDER FOR STEP 4: WAIT FOR BACKEND**

    // Disconnect the Polkadot API at the very end
    await polkadotApi.disconnect();
    }
    ```

And that’s it. You’ve successfully created a bucket and verified it on-chain.

## Wait for Backend Before Proceeding

If you attempt to upload a file right after creating a bucket, it's possible that DataHaven’s indexer hasn't processed that block yet. Until the indexer catches up, the MSP backend can’t resolve the new bucket ID, so any upload attempt will fail. To avoid that race condition, you can add a small polling helper that waits for the indexer to acknowledge the bucket before continuing.

1. Add the following code in your `bucketOperations.ts` file:
        
    ```ts title="bucketOperations.ts"
    // Wait until the backend/indexer has indexed the newly created bucket
    export async function waitForBackendBucketReady(bucketId: string) {
      const maxAttempts = 10; // Number of polling attempts
      const delayMs = 2000; // Delay between attempts in milliseconds

      for (let i = 0; i < maxAttempts; i++) {
        console.log(
          `Checking for bucket in MSP backend, attempt ${
            i + 1
          } of ${maxAttempts}...`,
        );
        try {
          // Query the MSP backend for the bucket metadata.
          // If the backend has synced the bucket, this call resolves successfully.
          const bucket = await mspClient.buckets.getBucket(bucketId);

          if (bucket) {
            // Bucket is now available and the script can safely continue
            console.log('Bucket found in MSP backend:', bucket);
            return;
          }
        } catch (error: any) {
          // Backend hasn’t indexed the bucket yet
          if (error?.status === 404 || error?.body?.error === 'Not found: Record') {
            console.log(`Bucket not found in MSP backend yet (404).`);
          } else {
            // Any other error is unexpected and should fail the entire workflow
            console.log('Unexpected error while fetching bucket from MSP:', error);
            throw error;
          }
        }
        // Wait before polling again
        await new Promise((r) => setTimeout(r, delayMs));
      }
      // All attempts exhausted
      throw new Error(`Bucket ${bucketId} not found in MSP backend after waiting`);
    }
    ```

2. Update the `index.ts` file to trigger the helper method you just implemented:

    ```ts title="index.ts // **PLACEHOLDER FOR STEP 4: WAIT BACKEND**"
      // Wait until indexer/backend knows about the bucket
      await waitForBackendBucketReady(bucketId);
    ```

    The response should look something like this:

    <div class="termynal" data-termynal>
        <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
        <span data-ty><pre>Checking for bucket in MSP backend, attempt 1 of 10...
    Bucket not found in MSP backend yet (404).
    Checking for bucket in MSP backend, attempt 2 of 10...
    Bucket not found in MSP backend yet (404).
    Checking for bucket in MSP backend, attempt 3 of 10...
    Bucket not found in MSP backend yet (404).
    Checking for bucket in MSP backend, attempt 4 of 10...
    Bucket not found in MSP backend yet (404).
    Checking for bucket in MSP backend, attempt 5 of 10...
    Bucket not found in MSP backend yet (404).
    Checking for bucket in MSP backend, attempt 6 of 10...
    Bucket found in MSP backend: {
      bucketId: '0x750337cba34ddcfdec3101cf8cc5ae09042a921b5571971533af2aab372604b9',
      name: 'init-bucket',
      root: '0x0000000000000000000000000000000000000000000000000000000000000000',
      isPublic: true,
      sizeBytes: 0,
      valuePropId: '0x628a23c7aa64902e13f63ffdd0725e07723745f84cabda048d901020d200da1e',
      fileCount: 0
    }</pre></span>
    <span data-ty="input"><span class="file-path"></span></span>
    </div>
??? code "View complete `bucketOperations.ts` file"

    ```ts title="bucketOperations.ts"
    import {
      storageHubClient,
      address,
      publicClient,
      polkadotApi,
    } from '../services/clientService.js';
    import {
      getMspInfo,
      getValueProps,
      mspClient,
    } from '../services/mspService.js';

    export async function createBucket(bucketName: string) {
      // Get basic MSP information from the MSP including its ID
      const { mspId } = await getMspInfo();

      // Choose one of the value props retrieved from the MSP through the helper function
      const valuePropId = await getValueProps();
      console.log(`Value Prop ID: ${valuePropId}`);

      // Derive bucket ID
      const bucketId = (await storageHubClient.deriveBucketId(
        address,
        bucketName,
      )) as string;
      console.log(`Derived bucket ID: ${bucketId}`);

      // Check that the bucket doesn't exist yet
      const bucketBeforeCreation =
        await polkadotApi.query.providers.buckets(bucketId);
      console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);
      if (!bucketBeforeCreation.isEmpty) {
        throw new Error(`Bucket already exists: ${bucketId}`);
      }

      const isPrivate = false;

      // Create bucket on chain
      const txHash: `0x${string}` | undefined = await storageHubClient.createBucket(
        mspId as `0x${string}`,
        bucketName,
        isPrivate,
        valuePropId,
      );

      console.log('createBucket() txHash:', txHash);
      if (!txHash) {
        throw new Error('createBucket() did not return a transaction hash');
      }

      // Wait for transaction receipt
      // Don't proceed until receipt is confirmed on chain
      const txReceipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (txReceipt.status !== 'success') {
        throw new Error(`Bucket creation failed: ${txHash}`);
      }

      return { bucketId, txReceipt };
    }

    // Verify bucket creation on chain and return bucket data
    export async function verifyBucketCreation(bucketId: string) {
      const { mspId } = await getMspInfo();

      const bucket = await polkadotApi.query.providers.buckets(bucketId);
      if (bucket.isEmpty) {
        throw new Error('Bucket not found on chain after creation');
      }

      const bucketData = bucket.unwrap().toHuman();
      console.log(
        'Bucket userId matches initial bucket owner address',
        bucketData.userId === address,
      );
      console.log(
        `Bucket MSPId matches initial MSPId: ${bucketData.mspId === mspId}`,
      );
      return bucketData;
    }

    // Wait until the backend/indexer has indexed the newly created bucket
    export async function waitForBackendBucketReady(bucketId: string) {
      const maxAttempts = 10; // Number of polling attempts
      const delayMs = 2000; // Delay between attempts in milliseconds

      for (let i = 0; i < maxAttempts; i++) {
        console.log(
          `Checking for bucket in MSP backend, attempt ${
            i + 1
          } of ${maxAttempts}...`,
        );
        try {
          // Query the MSP backend for the bucket metadata.
          // If the backend has synced the bucket, this call resolves successfully.
          const bucket = await mspClient.buckets.getBucket(bucketId);

          if (bucket) {
            // Bucket is now available and the script can safely continue
            console.log('Bucket found in MSP backend:', bucket);
            return;
          }
        } catch (error: any) {
          // Backend hasn’t indexed the bucket yet
          if (error?.status === 404 || error?.body?.error === 'Not found: Record') {
            console.log(`Bucket not found in MSP backend yet (404).`);
          } else {
            // Any other error is unexpected and should fail the entire workflow
            console.log('Unexpected error while fetching bucket from MSP:', error);
            throw error;
          }
        }
        // Wait before polling again
        await new Promise((r) => setTimeout(r, delayMs));
      }
      // All attempts exhausted
      throw new Error(`Bucket ${bucketId} not found in MSP backend after waiting`);
    }
    ```

??? code "View complete `index.ts` file"

    ```ts title="index.ts"
    import '@storagehub/api-augment';
    import { initWasm } from '@storagehub-sdk/core';
    import { polkadotApi } from './services/clientService.js';
    import {
      createBucket,
      verifyBucketCreation,
      waitForBackendBucketReady,
    } from './operations/bucketOperations.js';
    import { HealthStatus } from '@storagehub-sdk/msp-client';
    import { mspClient } from './services/mspService.js';

    async function run() {
      // For anything from @storagehub-sdk/core to work, initWasm() is required
      // on top of the file
      await initWasm();

      // --- Bucket creating logic ---

      // Check MSP Health Status
      const mspHealth: HealthStatus = await mspClient.info.getHealth();
      console.log('MSP Health Status:', mspHealth);

      // Create a bucket
      const bucketName = 'init-bucket';
      const { bucketId, txReceipt } = await createBucket(bucketName);
      console.log(`Created Bucket ID: ${bucketId}`);
      console.log(`createBucket() txReceipt: ${txReceipt}`);

      // Verify bucket exists on chain
      const bucketData = await verifyBucketCreation(bucketId);
      console.log('Bucket data:', bucketData);

      // Wait until indexer/backend knows about the bucket
      await waitForBackendBucketReady(bucketId);

      // Disconnect the Polkadot API at the very end
      await polkadotApi.disconnect();
    }

    await run();
    ```    

## Next Steps

<div class="grid cards" markdown>

-  <a href="/store-and-retrieve-data/use-storagehub-sdk/upload-a-file/" markdown>:material-arrow-right: 
    
    **Upload a File**

    Once your storage request is confirmed, use the StorageHub SDK to upload a file to the network.

    </a>

-   <a href="/store-and-retrieve-data/use-storagehub-sdk/end-to-end-storage-workflow/" markdown>:material-arrow-right:

    **Build a Data Workflow End-to-End**

    Learn step-by-step how to store a file on DataHaven and retrieve it from the network.

    </a>

</div>
