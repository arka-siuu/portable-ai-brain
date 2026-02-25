---
title: Upload a File via SDK
description: This guide shows you how to make a storage request, check its on-chain state, and upload your file. Turn your local file into a registered asset on DataHaven.
categories:
- Store Data
- StorageHub SDK
url: https://docs.datahaven.xyz/store-and-retrieve-data/use-storagehub-sdk/upload-a-file/
word_count: 5990
token_estimate: 11369
---

# Upload a File

This guide covers the full path from a local file to a registered asset inside a bucket on DataHaven. This path can be divided into three major steps:

1. **Issue a Storage Request**: Register your intent to store a file in your bucket and set its replication policy. Initialize `FileManager`, compute the file’s fingerprint, fetch MSP info (and extract peer IDs), choose a replication level and replica count, then call `issueStorageRequest`.
2. **Verify If Storage Request Is On-Chain**: Derive the deterministic file key, query on-chain state, and confirm the request exists and matches your local fingerprint and bucket.
3. **Upload a File**: Send the file bytes to the MSP, linked to your storage request. Confirm that the upload receipt indicates a successful upload.

These steps form the core workflow for any application that places data into DataHaven.

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
- [A bucket created](/store-and-retrieve-data/use-storagehub-sdk/create-a-bucket/){target=\_blank} with the ID handy
- A file to upload to DataHaven (any file type is accepted; the current testnet file size limit is 5 MB).

## Add Method to Upload File

Because of the `uploadFile` method's complexity, you will be adding pieces of its logic step by step. Before that, you need to prepare the file and the method's imports, by following these steps:

1. Create a new folder called `operations` within the `src` folder (at the same level as the `services` folder) like so:

    ```bash
    mkdir operations
    ```

2. Create a new file within the `operations` folder called `fileOperations.ts`.

3. Add the following code:

    ```ts title="fileOperations.ts"
    import { createReadStream, statSync } from 'node:fs';
    import { Readable } from 'node:stream';
    import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
    import { TypeRegistry } from '@polkadot/types';
    import { AccountId20, H256 } from '@polkadot/types/interfaces';
    import {
      storageHubClient,
      address,
      publicClient,
      polkadotApi,
      account,
    } from '../services/clientService.js';
    import {
      mspClient,
      getMspInfo,
      authenticateUser,
    } from '../services/mspService.js';
    import { PalletFileSystemStorageRequestMetadata } from '@polkadot/types/lookup';
    export async function uploadFile(
      bucketId: string,
      filePath: string,
      fileName: string
    ) {
      // ISSUE STORAGE REQUEST
      // **PLACEHOLDER FOR STEP 1: INITIALIZE FILE MANAGER**
      // **PLACEHOLDER FOR STEP 2: CREATE FINGERPRINT**
      // **PLACEHOLDER FOR STEP 3: ISSUE STORAGE REQUEST**
      // VERIFY STORAGE REQUEST ON-CHAIN
      // **PLACEHOLDER FOR STEP 4: COMPUTE FILE KEY**
      // **PLACEHOLDER FOR STEP 5: RETRIEVE STORAGE REQUEST DATA**
      // **PLACEHOLDER FOR STEP 6: READ STORAGE REQUEST DATA**
      // UPLOAD FILE
      // **PLACEHOLDER FOR STEP 7: AUTHENTICATE**
      // **PLACEHOLDER FOR STEP 8: UPLOAD FILE TO MSP**

      return { fileKey, uploadReceipt };
    }
    ```

## Issue a Storage Request

A storage request is the instruction that tells DataHaven—through your chosen Main Storage Provider (MSP)—to persist a specific file in a bucket with the redundancy policy you select.

In this section of the guide, you’ll go from a local file to a confirmed on-chain transaction. You'll initialize a File Manager, derive the file’s fingerprint, fetch MSP details (including peer IDs), choose a replication level, and issue the storage request. When the transaction is finalized, you’ll have a transaction hash and an on-chain record of the request you can verify in the next section of this guide.

### Initialize File Manager

To initialize the File Manager, add the following code to your `fileOperations.ts` file:

```ts title="fileOperations.ts // **PLACEHOLDER FOR STEP 1: INITIALIZE FILE MANAGER**"
  // Set up FileManager
  const fileSize = statSync(filePath).size;
  const fileManager = new FileManager({
    size: fileSize,
    stream: () =>
      Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
  });
```

### Define Storage Request Parameters

To issue a storage request, you need to prepare the following:

- `fingerprint` of your file (from `FileManager`)
- `fileSize` in `BigInt` format
- `mspId` of the target MSP
- `peerId` extracted from the MSP’s multiaddresses
- `replicationLevel` that defines how redundancy is applied
- `replicas` indicating how many copies to request
- `bucketId` created earlier (already passed as a parameter in `uploadFile` method)
- `fileName` you plan to store (already passed as a parameter in `uploadFile` method)

Add the following code to gather these values:

```ts title="fileOperations.ts // **PLACEHOLDER FOR STEP 2: CREATE FINGERPRINT**"
  // Get file details

  const fingerprint = await fileManager.getFingerprint();
  console.log(`Fingerprint: ${fingerprint.toHex()}`);

  const fileSizeBigInt = BigInt(fileManager.getFileSize());
  console.log(`File size: ${fileSize} bytes`);

  // Get MSP details

  // Fetch MSP details from the backend (includes its on-chain ID and libp2p addresses)
  const { mspId, multiaddresses } = await getMspInfo();
  // Ensure the MSP exposes at least one multiaddress (required to reach it over libp2p)
  if (!multiaddresses?.length) {
    throw new Error('MSP multiaddresses are missing');
  }
  // Extract the MSP’s libp2p peer IDs from the multiaddresses
  // Each address should contain a `/p2p/<peerId>` segment
  const peerIds: string[] = extractPeerIDs(multiaddresses);
  // Validate that at least one valid peer ID was found
  if (peerIds.length === 0) {
    throw new Error('MSP multiaddresses had no /p2p/<peerId> segment');
  }

  // Extracts libp2p peer IDs from a list of multiaddresses.
  // A multiaddress commonly ends with `/p2p/<peerId>`, so this function
  // splits on that delimiter and returns the trailing segment when present.
  function extractPeerIDs(multiaddresses: string[]): string[] {
    return (multiaddresses ?? [])
      .map((addr) => addr.split('/p2p/').pop())
      .filter((id): id is string => !!id);
  }

  // Set the redundancy policy for this request.
  // Custom replication allows the client to specify an exact replica count.
  const replicationLevel = ReplicationLevel.Custom;
  const replicas = 1;
```

### Issue Storage Request

Issue the storage request by adding the following code:

!!! note
    After issuing a storage request, it is crucial to wait for the transaction receipt, as shown in the code below. If writing custom storage-request-creation logic, make sure to include that step; otherwise, you will fetch storage request data before it is available.


```ts title="fileOperations.ts // **PLACEHOLDER FOR STEP 3: ISSUE STORAGE REQUEST**"
  // Issue storage request
  const txHash: `0x${string}` | undefined =
    await storageHubClient.issueStorageRequest(
      bucketId as `0x${string}`,
      fileName,
      fingerprint.toHex() as `0x${string}`,
      fileSizeBigInt,
      mspId as `0x${string}`,
      peerIds,
      replicationLevel,
      replicas,
    );
  console.log('issueStorageRequest() txHash:', txHash);
  if (!txHash) {
    throw new Error('issueStorageRequest() did not return a transaction hash');
  }

  // Wait for storage request transaction
  // Don't proceed until receipt is confirmed on chain
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  if (receipt.status !== 'success') {
    throw new Error(`Storage request failed: ${txHash}`);
  }
  console.log('issueStorageRequest() txReceipt:', receipt);
```

Upon a successful storage request, the output will look something like this:

<div class="termynal" data-termynal>
    <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
    <span data-ty>issueStorageRequest() txHash: 0x1cb9446510d9f204c93f1c348e0a13422adef91f1740ea0fdb1534e3ccb232ef</span>
    <span data-ty><pre>issueStorageRequest() txReceipt: {
  transactionHash: '0x1cb9446510d9f204c93f1c348e0a13422adef91f1740ea0fdb1534e3ccb232ef',
  transactionIndex: 0,
  blockHash: '0x0cd98b5d6050b926e6876a5b09124d1840e2c94d95faffdd6668a659e3c5c6a7',
  from: '0x00fa35d84a43db75467d2b2c1ed8974aca57223e',
  to: '0x0000000000000000000000000000000000000404',
  blockNumber: 98684n,
  cumulativeGasUsed: 239712n,
  gasUsed: 239712n,
  contractAddress: null,
  logs: [
    {
      address: '0x0000000000000000000000000000000000000404',
      topics: [Array],
      data: '0x',
      blockHash: '0x0cd98b5d6050b926e6876a5b09124d1840e2c94d95faffdd6668a659e3c5c6a7',
      blockNumber: 98684n,
      transactionHash: '0xfb344dc05359ee4d13189e65fc3230a1998a1802d3a0cf929ffb80a0670d7ce0',
      transactionIndex: 0,
      logIndex: 0,
      transactionLogIndex: '0x0',
      removed: false
    }
  ],
  logsBloom: '0x00000000000000040000000000000000000000000000000000000000000000040000000000000000000000000001000000000000000000000000080000000000000000040000000000000000000000000000000000000140000000000000000000000000000000000000000000000400000000100000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800800000000000000000000000000200000000000000000000000010000000000000000000000000000080000',
  status: 'success',
  effectiveGasPrice: 1000000000n,
  type: 'legacy'
}</pre></span>
<span data-ty="input"><span class="file-path"></span></span>
</div>
??? code "View complete `fileOperations.ts` up until this point"

    ```ts title="fileOperations.ts"
    import { createReadStream, statSync } from 'node:fs';
    import { Readable } from 'node:stream';
    import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
    import { TypeRegistry } from '@polkadot/types';
    import { AccountId20, H256 } from '@polkadot/types/interfaces';
    import {
      storageHubClient,
      address,
      publicClient,
      polkadotApi,
      account,
    } from '../services/clientService.js';
    import {
      mspClient,
      getMspInfo,
      authenticateUser,
    } from '../services/mspService.js';
    import { PalletFileSystemStorageRequestMetadata } from '@polkadot/types/lookup';
    export async function uploadFile(
      bucketId: string,
      filePath: string,
      fileName: string
    ) {

      // ISSUE STORAGE REQUEST
        // Set up FileManager
        const fileSize = statSync(filePath).size;
        const fileManager = new FileManager({
          size: fileSize,
          stream: () =>
            Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
        });
        // Get file details

        const fingerprint = await fileManager.getFingerprint();
        console.log(`Fingerprint: ${fingerprint.toHex()}`);

        const fileSizeBigInt = BigInt(fileManager.getFileSize());
        console.log(`File size: ${fileSize} bytes`);

        // Get MSP details

        // Fetch MSP details from the backend (includes its on-chain ID and libp2p addresses)
        const { mspId, multiaddresses } = await getMspInfo();
        // Ensure the MSP exposes at least one multiaddress (required to reach it over libp2p)
        if (!multiaddresses?.length) {
          throw new Error('MSP multiaddresses are missing');
        }
        // Extract the MSP’s libp2p peer IDs from the multiaddresses
        // Each address should contain a `/p2p/<peerId>` segment
        const peerIds: string[] = extractPeerIDs(multiaddresses);
        // Validate that at least one valid peer ID was found
        if (peerIds.length === 0) {
          throw new Error('MSP multiaddresses had no /p2p/<peerId> segment');
        }

        // Extracts libp2p peer IDs from a list of multiaddresses.
        // A multiaddress commonly ends with `/p2p/<peerId>`, so this function
        // splits on that delimiter and returns the trailing segment when present.
        function extractPeerIDs(multiaddresses: string[]): string[] {
          return (multiaddresses ?? [])
            .map((addr) => addr.split('/p2p/').pop())
            .filter((id): id is string => !!id);
        }

        // Set the redundancy policy for this request.
        // Custom replication allows the client to specify an exact replica count.
        const replicationLevel = ReplicationLevel.Custom;
        const replicas = 1;
        // Issue storage request
        const txHash: `0x${string}` | undefined =
          await storageHubClient.issueStorageRequest(
            bucketId as `0x${string}`,
            fileName,
            fingerprint.toHex() as `0x${string}`,
            fileSizeBigInt,
            mspId as `0x${string}`,
            peerIds,
            replicationLevel,
            replicas,
          );
        console.log('issueStorageRequest() txHash:', txHash);
        if (!txHash) {
          throw new Error('issueStorageRequest() did not return a transaction hash');
        }

        // Wait for storage request transaction
        // Don't proceed until receipt is confirmed on chain
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        if (receipt.status !== 'success') {
          throw new Error(`Storage request failed: ${txHash}`);
        }
        console.log('issueStorageRequest() txReceipt:', receipt);
      // VERIFY STORAGE REQUEST ON-CHAIN
      // **PLACEHOLDER FOR STEP 4: COMPUTE FILE KEY**
      // **PLACEHOLDER FOR STEP 5: RETRIEVE STORAGE REQUEST DATA**
      // **PLACEHOLDER FOR STEP 6: READ STORAGE REQUEST DATA**
      // UPLOAD FILE
      // **PLACEHOLDER FOR STEP 7: AUTHENTICATE**
      // **PLACEHOLDER FOR STEP 8: UPLOAD FILE TO MSP **

      return { fileKey, uploadReceipt };
    }
    ```

## Verify Storage Request Registration

Use this section of the guide to confirm that a file's storage request has been successfully recorded on-chain. You'll learn how to derive the deterministic file key and query the on-chain storage requests via the Polkadot.js API. A successful check confirms that the request exists and that core fields, such as the bucket ID and content fingerprint, match your local values. If no record is found, the transaction may not have been finalized yet, or one of the inputs used to compute the file key may not exactly match what was used when the request was issued.

### Compute the File Key

To compute the deterministic file key, derive it from the owner (`AccountId20`), bucket ID, and file name:

```ts title="fileOperations.ts // **PLACEHOLDER FOR STEP 4: COMPUTE THE FILE KEY**"
  // Compute file key
  const registry = new TypeRegistry();
  const owner = registry.createType(
    'AccountId20',
    account.address,
  ) as AccountId20;
  const bucketIdH256 = registry.createType('H256', bucketId) as H256;
  const fileKey = await fileManager.computeFileKey(
    owner,
    bucketIdH256,
    fileName,
  );
```

### Retrieve Storage Request Data

To retrieve storage request data, query `fileSystem.storageRequests` and pass in the computed file key:

```ts title="fileOperations.ts // **PLACEHOLDER FOR STEP 5: RETRIEVE STORAGE REQUEST DATA**"
  // Verify storage request on chain
  const storageRequest =
    await polkadotApi.query.fileSystem.storageRequests(fileKey);
  if (!storageRequest.isSome) {
    throw new Error('Storage request not found on chain');
  }
```

### Read Storage Request Data

To read storage request data, it first must be unwrapped as follows:

```ts title="fileOperations.ts // **PLACEHOLDER FOR STEP 6: READ STORAGE REQUEST DATA**"
  // Read the storage request data
  const storageRequestData = storageRequest.unwrap().toHuman();
  console.log('Storage request data:', storageRequestData);
  console.log(
    'Storage request bucketId matches initial bucketId:',
    storageRequestData.bucketId === bucketId,
  );
  console.log(
    'Storage request fingerprint matches initial fingerprint: ',
    storageRequestData.fingerprint === fingerprint.toString(),
  );
```

Upon successful storage request verification, you'll see a message like:

<div class="termynal" data-termynal>
    <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
    <span data-ty><pre> Storage request data: {
  requestedAt: '387,185',
  expiresAt: '387,295',
  owner: '0x00FA35D84a43db75467D2B2c1ed8974aCA57223e',
  bucketId: '0x8009cc4028ab4c8e333b13d38b840107f8467e27be11e9624e3b0d505314a5da',
  location: 'helloworld.txt',
  fingerprint: '0x1bc3a71173c16c1eee04f7e7cf2591678b0b6cdf08eb81c638ae60a38b706aad',
  size_: '18',
  msp: [
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    false
  ],
  userPeerIds: [
    '12D3KooWNEor6iiEAbZhCXqJbXibdjethDY8oeDoieVVxpZhQcW1',
    '12D3KooWNEor6iiEAbZhCXqJbXibdjethDY8oeDoieVVxpZhQcW1',
    '12D3KooWNEor6iiEAbZhCXqJbXibdjethDY8oeDoieVVxpZhQcW1'
  ],
  bspsRequired: '1',
  bspsConfirmed: '0',
  bspsVolunteered: '0',
  depositPaid: '1,000,010,114,925,524,930'
}</pre></span>
    <span data-ty>'Storage request bucketId matches initial bucketId: true</span>
    <span data-ty>Storage request fingerprint matches initial fingerprint: true</span>
    <span data-ty="input"><span class="file-path"></span></span>
</div>
??? code "View complete `fileOperations.ts` up until now"

    ```ts title="fileOperations.ts"
    import { createReadStream, statSync } from 'node:fs';
    import { Readable } from 'node:stream';
    import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
    import { TypeRegistry } from '@polkadot/types';
    import { AccountId20, H256 } from '@polkadot/types/interfaces';
    import {
      storageHubClient,
      address,
      publicClient,
      polkadotApi,
      account,
    } from '../services/clientService.js';
    import {
      mspClient,
      getMspInfo,
      authenticateUser,
    } from '../services/mspService.js';
    import { PalletFileSystemStorageRequestMetadata } from '@polkadot/types/lookup';
    export async function uploadFile(
      bucketId: string,
      filePath: string,
      fileName: string
    ) {

      // ISSUE STORAGE REQUEST
        // Set up FileManager
        const fileSize = statSync(filePath).size;
        const fileManager = new FileManager({
          size: fileSize,
          stream: () =>
            Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
        });
        // Get file details

        const fingerprint = await fileManager.getFingerprint();
        console.log(`Fingerprint: ${fingerprint.toHex()}`);

        const fileSizeBigInt = BigInt(fileManager.getFileSize());
        console.log(`File size: ${fileSize} bytes`);

        // Get MSP details

        // Fetch MSP details from the backend (includes its on-chain ID and libp2p addresses)
        const { mspId, multiaddresses } = await getMspInfo();
        // Ensure the MSP exposes at least one multiaddress (required to reach it over libp2p)
        if (!multiaddresses?.length) {
          throw new Error('MSP multiaddresses are missing');
        }
        // Extract the MSP’s libp2p peer IDs from the multiaddresses
        // Each address should contain a `/p2p/<peerId>` segment
        const peerIds: string[] = extractPeerIDs(multiaddresses);
        // Validate that at least one valid peer ID was found
        if (peerIds.length === 0) {
          throw new Error('MSP multiaddresses had no /p2p/<peerId> segment');
        }

        // Extracts libp2p peer IDs from a list of multiaddresses.
        // A multiaddress commonly ends with `/p2p/<peerId>`, so this function
        // splits on that delimiter and returns the trailing segment when present.
        function extractPeerIDs(multiaddresses: string[]): string[] {
          return (multiaddresses ?? [])
            .map((addr) => addr.split('/p2p/').pop())
            .filter((id): id is string => !!id);
        }

        // Set the redundancy policy for this request.
        // Custom replication allows the client to specify an exact replica count.
        const replicationLevel = ReplicationLevel.Custom;
        const replicas = 1;
        // Issue storage request
        const txHash: `0x${string}` | undefined =
          await storageHubClient.issueStorageRequest(
            bucketId as `0x${string}`,
            fileName,
            fingerprint.toHex() as `0x${string}`,
            fileSizeBigInt,
            mspId as `0x${string}`,
            peerIds,
            replicationLevel,
            replicas,
          );
        console.log('issueStorageRequest() txHash:', txHash);
        if (!txHash) {
          throw new Error('issueStorageRequest() did not return a transaction hash');
        }

        // Wait for storage request transaction
        // Don't proceed until receipt is confirmed on chain
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        if (receipt.status !== 'success') {
          throw new Error(`Storage request failed: ${txHash}`);
        }
        console.log('issueStorageRequest() txReceipt:', receipt);
      // VERIFY STORAGE REQUEST ON-CHAIN
        // Compute file key
        const registry = new TypeRegistry();
        const owner = registry.createType(
          'AccountId20',
          account.address,
        ) as AccountId20;
        const bucketIdH256 = registry.createType('H256', bucketId) as H256;
        const fileKey = await fileManager.computeFileKey(
          owner,
          bucketIdH256,
          fileName,
        );
        // Verify storage request on chain
        const storageRequest =
          await polkadotApi.query.fileSystem.storageRequests(fileKey);
        if (!storageRequest.isSome) {
          throw new Error('Storage request not found on chain');
        }
        // Read the storage request data
        const storageRequestData = storageRequest.unwrap().toHuman();
        console.log('Storage request data:', storageRequestData);
        console.log(
          'Storage request bucketId matches initial bucketId:',
          storageRequestData.bucketId === bucketId,
        );
        console.log(
          'Storage request fingerprint matches initial fingerprint: ',
          storageRequestData.fingerprint === fingerprint.toString(),
        );
      // UPLOAD FILE
      // **PLACEHOLDER FOR STEP 7: AUTHENTICATE**
      // **PLACEHOLDER FOR STEP 8: UPLOAD FILE TO MSP**

      return { fileKey, uploadReceipt };
    }
    ```

## Upload a File

Once your bucket is ready and the storage request has been successfully recorded on-chain, it's time to upload your file's bytes to your selected Main Storage Provider (MSP), linking the data to your on-chain request.

This section walks you through preparing your local file for upload and confirming your MSP has successfully accepted it for ingestion and replication.

### Authenticate

Before any file operations, authenticate with the MSP. The `authenticateUser` helper signs a SIWE message and returns a session token that authorizes your uploads, updates, and deletions. Add the following code to use the `authenticateUser` helper method you've already implemented in `mspService.ts`:

```ts title="fileOperations.ts // **PLACEHOLDER FOR STEP 7: AUTHENTICATE**"
  // Authenticating the bucket owner address with MSP prior to file upload is required
  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);
```

### Upload File to MSP

Add the following code to trigger the file upload to the connected MSP and to verify if it was successful:

```ts title="fileOperations.ts // **PLACEHOLDER FOR STEP 8: UPLOAD FILE TO MSP**"
  // Upload file to MSP
  const uploadReceipt = await mspClient.files.uploadFile(
    bucketId,
    fileKey.toHex(),
    await fileManager.getFileBlob(),
    address,
    fileName,
  );
  console.log('File upload receipt:', uploadReceipt);

  if (uploadReceipt.status !== 'upload_successful') {
    throw new Error('File upload to MSP failed');
  }
```

!!! note
    To check your currently active payment streams (amount of fees you are being billed) within a certain MSP use the `mspClient.info.getPaymentStreams` method. Make sure you are authenticated prior to triggering this function.

Upon a successful file upload, the transaction receipt will look like this:

<div class="termynal" data-termynal>
    <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
    <span data-ty><pre>File upload receipt: {
  status: 'upload_successful',
  fileKey: '0x8345bdd406fd9df119757b77c84e16a2e304276372dc21cb37a69a471ee093a6',
  bucketId: '0xdd2148ff63c15826ab42953a9d214770e6c2a73b22b83d28819a1777ab9d1322',
  fingerprint: '0x1bc3a71173c16c1eee04f7e7cf2591678b0b6cdf08eb81c638ae60a38b706aad',
  location: 'helloworld.txt'
}</pre></span>
<span data-ty="input"><span class="file-path"></span></span>
</div>
??? code "View `fileOperations.ts` up until this point"

    ```ts title="fileOperations.ts"
    import { createReadStream, statSync } from 'node:fs';
    import { Readable } from 'node:stream';
    import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
    import { TypeRegistry } from '@polkadot/types';
    import { AccountId20, H256 } from '@polkadot/types/interfaces';
    import {
      storageHubClient,
      address,
      publicClient,
      polkadotApi,
      account,
    } from '../services/clientService.js';
    import {
      mspClient,
      getMspInfo,
      authenticateUser,
    } from '../services/mspService.js';
    import { PalletFileSystemStorageRequestMetadata } from '@polkadot/types/lookup';
    export async function uploadFile(
      bucketId: string,
      filePath: string,
      fileName: string,
    ) {
      //   ISSUE STORAGE REQUEST

      // Set up FileManager
      const fileSize = statSync(filePath).size;
      const fileManager = new FileManager({
        size: fileSize,
        stream: () =>
          Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
      });

      // Get file details

      const fingerprint = await fileManager.getFingerprint();
      console.log(`Fingerprint: ${fingerprint.toHex()}`);

      const fileSizeBigInt = BigInt(fileManager.getFileSize());
      console.log(`File size: ${fileSize} bytes`);

      // Get MSP details

      // Fetch MSP details from the backend (includes its on-chain ID and libp2p addresses)
      const { mspId, multiaddresses } = await getMspInfo();
      // Ensure the MSP exposes at least one multiaddress (required to reach it over libp2p)
      if (!multiaddresses?.length) {
        throw new Error('MSP multiaddresses are missing');
      }
      // Extract the MSP’s libp2p peer IDs from the multiaddresses
      // Each address should contain a `/p2p/<peerId>` segment
      const peerIds: string[] = extractPeerIDs(multiaddresses);
      // Validate that at least one valid peer ID was found
      if (peerIds.length === 0) {
        throw new Error('MSP multiaddresses had no /p2p/<peerId> segment');
      }

      // Extracts libp2p peer IDs from a list of multiaddresses.
      // A multiaddress commonly ends with `/p2p/<peerId>`, so this function
      // splits on that delimiter and returns the trailing segment when present.
      function extractPeerIDs(multiaddresses: string[]): string[] {
        return (multiaddresses ?? [])
          .map((addr) => addr.split('/p2p/').pop())
          .filter((id): id is string => !!id);
      }

      // Set the redundancy policy for this request.
      // Custom replication allows the client to specify an exact replica count.
      const replicationLevel = ReplicationLevel.Custom;
      const replicas = 1;

      // Issue storage request
      const txHash: `0x${string}` | undefined =
        await storageHubClient.issueStorageRequest(
          bucketId as `0x${string}`,
          fileName,
          fingerprint.toHex() as `0x${string}`,
          fileSizeBigInt,
          mspId as `0x${string}`,
          peerIds,
          replicationLevel,
          replicas,
        );
      console.log('issueStorageRequest() txHash:', txHash);
      if (!txHash) {
        throw new Error('issueStorageRequest() did not return a transaction hash');
      }

      // Wait for storage request transaction
      // Don't proceed until receipt is confirmed on chain
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status !== 'success') {
        throw new Error(`Storage request failed: ${txHash}`);
      }
      console.log('issueStorageRequest() txReceipt:', receipt);

      //   VERIFY STORAGE REQUEST ON CHAIN

      // Compute file key
      const registry = new TypeRegistry();
      const owner = registry.createType(
        'AccountId20',
        account.address,
      ) as AccountId20;
      const bucketIdH256 = registry.createType('H256', bucketId) as H256;
      const fileKey = await fileManager.computeFileKey(
        owner,
        bucketIdH256,
        fileName,
      );

      // Verify storage request on chain
      const storageRequest =
        await polkadotApi.query.fileSystem.storageRequests(fileKey);
      if (!storageRequest.isSome) {
        throw new Error('Storage request not found on chain');
      }

      // Read the storage request data
      const storageRequestData = storageRequest.unwrap().toHuman();
      console.log('Storage request data:', storageRequestData);
      console.log(
        'Storage request bucketId matches initial bucketId:',
        storageRequestData.bucketId === bucketId,
      );
      console.log(
        'Storage request fingerprint matches initial fingerprint: ',
        storageRequestData.fingerprint === fingerprint.toString(),
      );

      //   UPLOAD FILE TO MSP

      // Authenticating the bucket owner address with MSP prior to file upload is required
      const authProfile = await authenticateUser();
      console.log('Authenticated user profile:', authProfile);

      // Upload file to MSP
      const uploadReceipt = await mspClient.files.uploadFile(
        bucketId,
        fileKey.toHex(),
        await fileManager.getFileBlob(),
        address,
        fileName,
      );
      console.log('File upload receipt:', uploadReceipt);

      if (uploadReceipt.status !== 'upload_successful') {
        throw new Error('File upload to MSP failed');
      }

      return { fileKey, uploadReceipt };
    }
    ```

## Call the Upload File Helper Method

Create an `index.ts` file if you haven't already. Its `run` method will orchestrate all the logic in this guide. By now, your services folder (including the MSP and client helper services) should already be created. If not, see the [Get Started](/store-and-retrieve-data/use-storagehub-sdk/get-started/) guide.  

The `index.ts` snippet below also imports `fileOperations.ts`, which you've created already through the previous sections in this guide.  

Add the following code to your `index.ts` file:

```ts title="index.ts"
  import '@storagehub/api-augment';
  import { initWasm } from '@storagehub-sdk/core';
  import { polkadotApi } from './services/clientService.js';
  import {
    uploadFile,
    waitForBackendFileReady,
    waitForMSPConfirmOnChain,
  } from './operations/fileOperations.js';
  async function run() {
    // For anything from @storagehub-sdk/core to work, initWasm() is required
    // on top of the file
    await initWasm();

      // Add your bucket ID here from the bucket you created earlier
      // Example (32byte hash): 0xdd2148ff63c15826ab42953a9d214770e6c8a73b22b83d28819a1777ab9d1322
      const bucketId = 'INSERT_BUCKET_ID';

      // Specify the file name of the file to be uploaded
      const fileName = 'INSERT_FILE_NAME'; // Example: filename.jpeg
      const filePath = new URL(`../files/${fileName}`, import.meta.url).pathname;

      // Upload file
      const { fileKey, uploadReceipt } = await uploadFile(
        bucketId,
        filePath,
        fileName
      );
      console.log(`File uploaded: ${fileKey}`);
      console.log(`Status: ${uploadReceipt.status}`);
      // Wait until indexer/backend knows about the file
      // Add wait logic here before proceeding
    // Disconnect the Polkadot API at the very end
    await polkadotApi.disconnect();
}

run();

```

Run the script:

```bash
ts-node index.ts
```

Now that you have completed `fileOperations.ts` and `index.ts`, the final output when running the `index.ts` script should be:

<div class="termynal" data-termynal>
  <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
  <span data-ty>File uploaded: 0x8345bdd406fd9df119757b77c84e16a2e304276372dc21cb37a69a471ee093a6</span>
  <span data-ty>Status: upload_successful</span>
  <span data-ty="input"><span class="file-path"></span></span>
</div>
## Wait for Backend Before Proceeding

If attempting to access a file right after uploading it to DataHaven, it's possible that DataHaven’s indexer hasn't processed that block yet. Until the indexer catches up, the MSP backend can’t resolve the new file's data. To avoid that race condition, you can add two small polling helpers that wait for the indexer to acknowledge the file before continuing.

The two mentioned polling helper methods are:

1. **`waitForMSPConfirmOnChain`**: Polls the DataHaven runtime until the MSP has confirmed the storage request on-chain. 
2. **`waitForBackendFileReady`**: Polls the MSP backend using `mspClient.files.getFileInfo(bucketId, fileKey)` until the file metadata becomes available. Even if the file is confirmed on-chain, the backend may not yet be aware of it.

Once both checks pass, you know the file is committed on-chain, and the MSP backend is ready to serve it, so a subsequent download call won’t randomly fail with a `404` while the system is still syncing.

1. Add the following code in your `fileOperations.ts` file:
        
    ```ts title="fileOperations.ts"
    export async function waitForMSPConfirmOnChain(fileKey: string) {
      const maxAttempts = 20; // Number of polling attempts
      const delayMs = 2000; // Delay between attempts in milliseconds

      for (let i = 0; i < maxAttempts; i++) {
        console.log(
          `Check if storage request has been confirmed by the MSP on-chain, attempt ${i + 1} of ${maxAttempts}...`,
        );

        // Query the runtime for the StorageRequest entry associated with this fileKey
        const req = await polkadotApi.query.fileSystem.storageRequests(fileKey);

        // StorageRequest removed from state before confirmation is an error
        if (req.isNone) {
          throw new Error(
            `StorageRequest for ${fileKey} no longer exists on-chain.`,
          );
        }
        // Decode the on-chain metadata struct
        const data: PalletFileSystemStorageRequestMetadata = req.unwrap();

        // Check MSP status
        const mspStatus = data.mspStatus;
        console.log(`MSP confirmation status: ${mspStatus.type}`);

        const mspConfirmed =
          mspStatus.isAcceptedNewFile || mspStatus.isAcceptedExistingFile;

        // If MSP has confirmed the storage request, we’re good to proceed
        if (mspConfirmed) {
          console.log('Storage request confirmed by MSP on-chain');
          return;
        }

        // Wait before polling again
        await new Promise((r) => setTimeout(r, delayMs));
      }
      // All attempts exhausted
      throw new Error('Timed out waiting for MSP confirmation on-chain');
    }
     export async function waitForBackendFileReady(
       bucketId: string,
       fileKey: string,
     ) {
       // wait up to 12 minutes (144 attempts x 5 seconds)
       // 11 minutes is the amount of time BSPs have to reach the required replication level
       const maxAttempts = 144; // Number of polling attempts
       const delayMs = 5000; // Delay between attempts in milliseconds

       for (let i = 0; i < maxAttempts; i++) {
         console.log(
           `Checking for file in MSP backend, attempt ${i + 1} of ${maxAttempts}...`,
         );

         try {
           // Query MSP backend for the file metadata
           const fileInfo = await mspClient.files.getFileInfo(bucketId, fileKey);

           // File is fully ready — backend has indexed it and can serve it
           if (fileInfo.status === 'ready') {
             console.log('File found in MSP backend:', fileInfo);
             return fileInfo;
           }

           // Failure statuses (irrecoverable for this upload lifecycle)
           if (fileInfo.status === 'revoked') {
             throw new Error('File upload was cancelled by user');
           } else if (fileInfo.status === 'rejected') {
             throw new Error('File upload was rejected by MSP');
           } else if (fileInfo.status === 'expired') {
             throw new Error(
               'Storage request expired: the required number of BSP replicas was not achieved within the deadline',
             );
           }

           // Otherwise still pending (indexer not done, MSP still syncing, etc.)
           console.log(`File status is "${fileInfo.status}", waiting...`);
         } catch (error: any) {
           if (error?.status === 404 || error?.body?.error === 'Not found: Record') {
             // Handle "not yet indexed" as a *non-fatal* condition
             console.log(
               'File not yet indexed in MSP backend (404 Not Found). Waiting before retry...',
             );
           } else {
             // Any unexpected backend error should stop the workflow and surface to the caller
             console.log('Unexpected error while fetching file from MSP:', error);
             throw error;
           }
         }

         // Wait before polling again
         await new Promise((r) => setTimeout(r, delayMs));
       }

       // All attempts exhausted
       throw new Error('Timed out waiting for MSP backend to mark file as ready');
     }
    ```

2. Update the `index.ts` file to trigger the helper method you just implemented:

    ```ts title="index.ts"
      // Wait until indexer/backend knows about the file
      await waitForMSPConfirmOnChain(fileKey.toHex());
      await waitForBackendFileReady(bucketId, fileKey.toHex());
    ```

    The response should look something like this:

    <div class="termynal" data-termynal>
        <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
        <span data-ty><pre>Check storage request has been confirmed by the MSP on-chain, attempt 1 of 10...
    Check storage request has been confirmed by the MSP on-chain, attempt 2 of 10...
    Check storage request has been confirmed by the MSP on-chain, attempt 3 of 10...
    Storage request confirmed by MSP on-chain
    Checking for file in MSP backend, attempt 1 of 15...
    File not yet indexed in MSP backend (404 Not Found). Waiting before retry...
    Checking for file in MSP backend, attempt 2 of 15...
    File not yet indexed in MSP backend (404 Not Found). Waiting before retry...
    Checking for file in MSP backend, attempt 3 of 15...
    File not yet indexed in MSP backend (404 Not Found). Waiting before retry...
    Checking for file in MSP backend, attempt 4 of 15...
    File not yet indexed in MSP backend (404 Not Found). Waiting before retry...
    Checking for file in MSP backend, attempt 5 of 15...
    File status is "inProgress", waiting...
    Checking for file in MSP backend, attempt 6 of 15...
    File status is "inProgress", waiting...
    Checking for file in MSP backend, attempt 7 of 15...
    File status is "inProgress", waiting...
    Checking for file in MSP backend, attempt 8 of 15...
    File status is "inProgress", waiting...
    Checking for file in MSP backend, attempt 9 of 15...
    File status is "inProgress", waiting...
    Checking for file in MSP backend, attempt 10 of 15...
    File found in MSP backend: {
      fileKey: '0xd80ba1a305f49240f0c18adb00532f284941455cb2e46c137ccd38755be198dd',
      fingerprint: '0x1bc3a71173c16c1eee04f7e7cf2591678b0b6cdf08eb81c638ae60a38b706aad',
      bucketId: '0x750337cba34ddcfdec3101cf8cc5ae09042a921b5571971533af2aab372604b9',
      location: 'helloworld.txt',
      size: 18n,
      isPublic: true,
      uploadedAt: 2025-12-10T12:03:01.033Z,
      status: 'ready',
      blockHash: '0x07f5319641faf4f30a225223d056adc7026e13a73d20a548b7a3a91d15e30fef',
      txHash: '0xf3acbdf55fbcadfb17ec90a9fe507b4d5d529fdd9b36aec1e173ffadc61877ea'
    }</pre></span>
    <span data-ty="input"><span class="file-path"></span></span>
    </div>
??? code "View complete `index.ts`"

    ```ts title="index.ts"
    import '@storagehub/api-augment';
    import { initWasm } from '@storagehub-sdk/core';
    import { polkadotApi } from './services/clientService.js';
    import {
      uploadFile,
      waitForBackendFileReady,
      waitForMSPConfirmOnChain,
    } from './operations/fileOperations.js';
    async function run() {
        // For anything from @storagehub-sdk/core to work, initWasm() is required
        // on top of the file
        await initWasm();

          // Add your bucket ID here from the bucket you created earlier
          // Example (32byte hash): 0xdd2148ff63c15826ab42953a9d214770e6c8a73b22b83d28819a1777ab9d1322
          const bucketId = 'INSERT_BUCKET_ID';

          // Specify the file name of the file to be uploaded
          const fileName = 'INSERT_FILE_NAME'; // Example: filename.jpeg
          const filePath = new URL(`../files/${fileName}`, import.meta.url).pathname;

          // Upload file
          const { fileKey, uploadReceipt } = await uploadFile(
            bucketId,
            filePath,
            fileName
          );
          console.log(`File uploaded: ${fileKey}`);
          console.log(`Status: ${uploadReceipt.status}`);
          // Wait until indexer/backend knows about the file
          await waitForMSPConfirmOnChain(fileKey.toHex());
          await waitForBackendFileReady(bucketId, fileKey.toHex());
        // Disconnect the Polkadot API at the very end
        await polkadotApi.disconnect();
    }

    run();
    ```

??? code "View complete `fileOperations.ts`"

    ```ts title="fileOperations.ts"
    import { createReadStream, statSync } from 'node:fs';
    import { Readable } from 'node:stream';
    import { FileManager, ReplicationLevel } from '@storagehub-sdk/core';
    import { TypeRegistry } from '@polkadot/types';
    import { AccountId20, H256 } from '@polkadot/types/interfaces';
    import {
      storageHubClient,
      address,
      publicClient,
      polkadotApi,
      account,
    } from '../services/clientService.js';
    import {
      mspClient,
      getMspInfo,
      authenticateUser,
    } from '../services/mspService.js';
    import { PalletFileSystemStorageRequestMetadata } from '@polkadot/types/lookup';

    export async function uploadFile(
      bucketId: string,
      filePath: string,
      fileName: string,
    ) {
      //   ISSUE STORAGE REQUEST

      // Set up FileManager
      const fileSize = statSync(filePath).size;
      const fileManager = new FileManager({
        size: fileSize,
        stream: () =>
          Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
      });

      // Get file details

      const fingerprint = await fileManager.getFingerprint();
      console.log(`Fingerprint: ${fingerprint.toHex()}`);

      const fileSizeBigInt = BigInt(fileManager.getFileSize());
      console.log(`File size: ${fileSize} bytes`);

      // Get MSP details

      // Fetch MSP details from the backend (includes its on-chain ID and libp2p addresses)
      const { mspId, multiaddresses } = await getMspInfo();
      // Ensure the MSP exposes at least one multiaddress (required to reach it over libp2p)
      if (!multiaddresses?.length) {
        throw new Error('MSP multiaddresses are missing');
      }
      // Extract the MSP’s libp2p peer IDs from the multiaddresses
      // Each address should contain a `/p2p/<peerId>` segment
      const peerIds: string[] = extractPeerIDs(multiaddresses);
      // Validate that at least one valid peer ID was found
      if (peerIds.length === 0) {
        throw new Error('MSP multiaddresses had no /p2p/<peerId> segment');
      }

      // Extracts libp2p peer IDs from a list of multiaddresses.
      // A multiaddress commonly ends with `/p2p/<peerId>`, so this function
      // splits on that delimiter and returns the trailing segment when present.
      function extractPeerIDs(multiaddresses: string[]): string[] {
        return (multiaddresses ?? [])
          .map((addr) => addr.split('/p2p/').pop())
          .filter((id): id is string => !!id);
      }

      // Set the redundancy policy for this request.
      // Custom replication allows the client to specify an exact replica count.
      const replicationLevel = ReplicationLevel.Custom;
      const replicas = 1;

      // Issue storage request
      const txHash: `0x${string}` | undefined =
        await storageHubClient.issueStorageRequest(
          bucketId as `0x${string}`,
          fileName,
          fingerprint.toHex() as `0x${string}`,
          fileSizeBigInt,
          mspId as `0x${string}`,
          peerIds,
          replicationLevel,
          replicas,
        );
      console.log('issueStorageRequest() txHash:', txHash);
      if (!txHash) {
        throw new Error('issueStorageRequest() did not return a transaction hash');
      }

      // Wait for storage request transaction
      // Don't proceed until receipt is confirmed on chain
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.status !== 'success') {
        throw new Error(`Storage request failed: ${txHash}`);
      }
      console.log('issueStorageRequest() txReceipt:', receipt);

      //   VERIFY STORAGE REQUEST ON CHAIN

      // Compute file key
      const registry = new TypeRegistry();
      const owner = registry.createType(
        'AccountId20',
        account.address,
      ) as AccountId20;
      const bucketIdH256 = registry.createType('H256', bucketId) as H256;
      const fileKey = await fileManager.computeFileKey(
        owner,
        bucketIdH256,
        fileName,
      );

      // Verify storage request on chain
      const storageRequest =
        await polkadotApi.query.fileSystem.storageRequests(fileKey);
      if (!storageRequest.isSome) {
        throw new Error('Storage request not found on chain');
      }

      // Read the storage request data
      const storageRequestData = storageRequest.unwrap().toHuman();
      console.log('Storage request data:', storageRequestData);
      console.log(
        'Storage request bucketId matches initial bucketId:',
        storageRequestData.bucketId === bucketId,
      );
      console.log(
        'Storage request fingerprint matches initial fingerprint: ',
        storageRequestData.fingerprint === fingerprint.toString(),
      );

      //   UPLOAD FILE TO MSP

      // Authenticating the bucket owner address with MSP prior to file upload is required
      const authProfile = await authenticateUser();
      console.log('Authenticated user profile:', authProfile);

      // Upload file to MSP
      const uploadReceipt = await mspClient.files.uploadFile(
        bucketId,
        fileKey.toHex(),
        await fileManager.getFileBlob(),
        address,
        fileName,
      );
      console.log('File upload receipt:', uploadReceipt);

      if (uploadReceipt.status !== 'upload_successful') {
        throw new Error('File upload to MSP failed');
      }

      return { fileKey, uploadReceipt };
    }

    export async function waitForMSPConfirmOnChain(fileKey: string) {
      const maxAttempts = 20; // Number of polling attempts
      const delayMs = 2000; // Delay between attempts in milliseconds

      for (let i = 0; i < maxAttempts; i++) {
        console.log(
          `Check if storage request has been confirmed by the MSP on-chain, attempt ${i + 1} of ${maxAttempts}...`,
        );

        // Query the runtime for the StorageRequest entry associated with this fileKey
        const req = await polkadotApi.query.fileSystem.storageRequests(fileKey);

        // StorageRequest removed from state before confirmation is an error
        if (req.isNone) {
          throw new Error(
            `StorageRequest for ${fileKey} no longer exists on-chain.`,
          );
        }
        // Decode the on-chain metadata struct
        const data: PalletFileSystemStorageRequestMetadata = req.unwrap();

        // Check MSP status
        const mspStatus = data.mspStatus;
        console.log(`MSP confirmation status: ${mspStatus.type}`);

        const mspConfirmed =
          mspStatus.isAcceptedNewFile || mspStatus.isAcceptedExistingFile;

        // If MSP has confirmed the storage request, we’re good to proceed
        if (mspConfirmed) {
          console.log('Storage request confirmed by MSP on-chain');
          return;
        }

        // Wait before polling again
        await new Promise((r) => setTimeout(r, delayMs));
      }
      // All attempts exhausted
      throw new Error('Timed out waiting for MSP confirmation on-chain');
    }

    export async function waitForBackendFileReady(
      bucketId: string,
      fileKey: string,
    ) {
      // wait up to 12 minutes (144 attempts x 5 seconds)
      // 11 minutes is the amount of time BSPs have to reach the required replication level
      const maxAttempts = 144; // Number of polling attempts
      const delayMs = 5000; // Delay between attempts in milliseconds

      for (let i = 0; i < maxAttempts; i++) {
        console.log(
          `Checking for file in MSP backend, attempt ${i + 1} of ${maxAttempts}...`,
        );

        try {
          // Query MSP backend for the file metadata
          const fileInfo = await mspClient.files.getFileInfo(bucketId, fileKey);

          // File is fully ready — backend has indexed it and can serve it
          if (fileInfo.status === 'ready') {
            console.log('File found in MSP backend:', fileInfo);
            return fileInfo;
          }

          // Failure statuses (irrecoverable for this upload lifecycle)
          if (fileInfo.status === 'revoked') {
            throw new Error('File upload was cancelled by user');
          } else if (fileInfo.status === 'rejected') {
            throw new Error('File upload was rejected by MSP');
          } else if (fileInfo.status === 'expired') {
            throw new Error(
              'Storage request expired: the required number of BSP replicas was not achieved within the deadline',
            );
          }

          // Otherwise still pending (indexer not done, MSP still syncing, etc.)
          console.log(`File status is "${fileInfo.status}", waiting...`);
        } catch (error: any) {
          if (error?.status === 404 || error?.body?.error === 'Not found: Record') {
            // Handle "not yet indexed" as a *non-fatal* condition
            console.log(
              'File not yet indexed in MSP backend (404 Not Found). Waiting before retry...',
            );
          } else {
            // Any unexpected backend error should stop the workflow and surface to the caller
            console.log('Unexpected error while fetching file from MSP:', error);
            throw error;
          }
        }

        // Wait before polling again
        await new Promise((r) => setTimeout(r, delayMs));
      }

      // All attempts exhausted
      throw new Error('Timed out waiting for MSP backend to mark file as ready');
    }
    ```

## Next Steps

<div class="grid cards" markdown>

-  <a href="/store-and-retrieve-data/use-storagehub-sdk/retrieve-your-data/" markdown>:material-arrow-right: 
    
    **Retrieve Your Data**

    Once your file is successfully uploaded, retrieve it from the Main Storage Provider (MSP) using the StorageHub SDK and save it locally.

    </a>

-   <a href="/store-and-retrieve-data/use-storagehub-sdk/end-to-end-storage-workflow/" markdown>:material-arrow-right:

    **Build a Data Workflow End-to-End**

    Learn step-by-step how to store a file on DataHaven and retrieve it from the network.

    </a>

</div>
