---
title: Retrieve Your Data
description: Learn how to use the StorageHub SDK to fetch a previously uploaded file from your chosen Main Storage Provider (MSP) using its deterministic file key.
categories:
- Store Data
- StorageHub SDK
url: https://docs.datahaven.xyz/store-and-retrieve-data/use-storagehub-sdk/retrieve-your-data/
word_count: 1818
token_estimate: 3518
---

# Retrieve Your Data

This guide shows how to fetch a previously uploaded file from your chosen Main Storage Provider (MSP) using its deterministic file key. You’ll use the file key to download the file and stream the bytes directly to disk—avoiding loading the whole object into memory.

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
- [A file uploaded](/store-and-retrieve-data/use-storagehub-sdk/upload-a-file/){target=\_blank} to DataHaven, along with the [file key](/store-and-retrieve-data/use-storagehub-sdk/upload-a-file/#compute-the-file-key){target=\_blank}

## Initialize the Script Entry Point

First, create an `index.ts` file, if you haven't already. Its `run` method will orchestrate all the logic in this guide, and you’ll replace the labelled placeholders with real code step by step. By now, your services folder (including the MSP and client helper services) should already be created. If not, see the [Get Started](/store-and-retrieve-data/use-storagehub-sdk/get-started/) guide.

The `index.ts` snippet below also imports `fileOperations.ts`, which is not in your project yet—that's expected, as you'll create it later in this guide.

Add the following code to your `index.ts` file:

```ts title="index.ts"
import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { downloadFile, verifyDownload } from './operations/fileOperations.js';
async function run() {
  // For anything from @storagehub-sdk/core to work, initWasm() is required
  // on top of the file
  await initWasm();
  
    const fileKeyHex = 'INSERT_FILE_KEY_AS_HEX';
    // Convert to H256 type if not already
    const fileKey = polkadotApi.createType('H256', fileKeyHex);
    // Make sure the file extension matches the original file
    const filePath = new URL(`./files/INSERT_FILENAME.png`, import.meta.url)
      .pathname;
    const downloadedFilePath = new URL(
      './files/INSERT_FILENAME_downloaded.png',
      import.meta.url
    ).pathname;
  // --- Retrieve file logic ---
  // **PLACEHOLDER FOR STEP 1: ADD DOWNLOAD FILE HELPER METHOD**
  // **PLACEHOLDER FOR STEP 2: VERIFY FILE HELPER METHOD**

  // Disconnect the Polkadot API at the very end
  await polkadotApi.disconnect();
}

await run();
```

## Download and Save File

To download a file you've already uploaded to the network, you will create a `downloadFile` helper method through which you will retrieve the file from the network and then save it locally to your machine. Then, update the `index.ts` file accordingly in order to execute that logic.

### Add Method to Download File

1. Create a new folder called `operations` within the `src` folder (at the same level as the `services` folder) like so:

    ```bash
    mkdir operations
    ```

2. Create a new file within the `operations` folder called `fileOperations.ts`.

3. Add the following code:

    ```ts title="fileOperations.ts"
    import { createWriteStream } from 'node:fs';
    import { Readable } from 'node:stream';
    import { H256 } from '@polkadot/types/interfaces';
    import { mspClient } from '../services/mspService.js';
    import { DownloadResult } from '@storagehub-sdk/msp-client';
    export async function downloadFile(
      fileKey: H256,
      downloadPath: string
    ): Promise<{ path: string; size: number; mime?: string }> {
      // Download file from MSP
      const downloadResponse: DownloadResult = await mspClient.files.downloadFile(
        fileKey.toHex()
      );

      // Check if the download response was successful
      if (downloadResponse.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResponse.status}`);
      }

      // Save downloaded file

      // Create a writable stream to the target file path
      // This stream will receive binary data chunks and write them to disk.
      const writeStream = createWriteStream(downloadPath);
      // Convert the Web ReadableStream into a Node.js-readable stream
      const readableStream = Readable.fromWeb(downloadResponse.stream as any);

      // Pipe the readable (input) stream into the writable (output) stream
      // This transfers the file data chunk by chunk and closes the write stream automatically
      // when finished.
      return new Promise((resolve, reject) => {
        readableStream.pipe(writeStream);
        writeStream.on('finish', async () => {
          const { size } = await import('node:fs/promises').then((fs) =>
            fs.stat(downloadPath)
          );
          const mime =
            downloadResponse.contentType === null
              ? undefined
              : downloadResponse.contentType;

          resolve({
            path: downloadPath,
            size,
            mime, // if available
          });
        });
        writeStream.on('error', reject);
      });
    }
    ```

### Call the Download File Helper Method

1. Proceed with updating the `index.ts` file with the following code in order to execute the download logic you just implemented:

    ```ts title="index.ts"
      // Download file
      const downloadedFile = await downloadFile(fileKey, downloadedFilePath);
      console.log(
        `Downloaded ${downloadedFile.size} bytes to ${downloadedFile.path}`
      );
    ```

    ??? code "View complete `index.ts` file up until this point"

        ```ts title="index.ts"
        import '@storagehub/api-augment';
        import { initWasm } from '@storagehub-sdk/core';
        import { polkadotApi } from './services/clientService.js';
        import { downloadFile, verifyDownload } from './operations/fileOperations.js';
        async function run() {
          // For anything from @storagehub-sdk/core to work, initWasm() is required
          // on top of the file
          await initWasm();
        
            const fileKeyHex = 'INSERT_FILE_KEY_AS_HEX';
            // Convert to H256 type if not already
            const fileKey = polkadotApi.createType('H256', fileKeyHex);
            // Make sure the file extension matches the original file
            const filePath = new URL(`./files/INSERT_FILENAME.png`, import.meta.url)
              .pathname;
            const downloadedFilePath = new URL(
              './files/INSERT_FILENAME_downloaded.png',
              import.meta.url
            ).pathname;
            // Download file
            const downloadedFile = await downloadFile(fileKey, downloadedFilePath);
            console.log(
              `Downloaded ${downloadedFile.size} bytes to ${downloadedFile.path}`
            );
          // Disconnect the Polkadot API at the very end
          await polkadotApi.disconnect();
        }

        await run();
        ```

2. Run the script:

    ```bash
    ts-node index.ts
    ```

    Upon a successful file download, you'll see output similar to:

    <div class="termynal" data-termynal>
        <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
        <span data-ty>Downloaded 18 bytes to /Users/username/Documents/dh-project/src/files/helloworld_downloaded.txt</span>
        <span data-ty="input"><span class="file-path"></span></span>
    </div>
## Verify Downloaded File

To verify the integrity of the file you've just downloaded, you'll create a `verifyDownload` helper method through which the bytes of the original file will be matched to the bytes of the newly downloaded file. Then, you'll update the `index.ts` file accordingly in order to execute that logic.

### Add Method to Verify Download

Implement the `verifyDownload` helper method logic to your `fileOperations.ts` file, by adding the following code:

```ts title="fileOperations.ts"
// Compares an original file with a downloaded file byte-for-byte
export async function verifyDownload(
  originalPath: string,
  downloadedPath: string
): Promise<boolean> {
  const originalBuffer = await import('node:fs/promises').then((fs) =>
    fs.readFile(originalPath)
  );
  const downloadedBuffer = await import('node:fs/promises').then((fs) =>
    fs.readFile(downloadedPath)
  );

  return originalBuffer.equals(downloadedBuffer);
}
```

??? code "View complete `fileOperations.ts` file"

    ```ts title="fileOperations.ts"
    import { createWriteStream } from 'node:fs';
    import { Readable } from 'node:stream';
    import { H256 } from '@polkadot/types/interfaces';
    import { mspClient } from '../services/mspService.js';
    import { DownloadResult } from '@storagehub-sdk/msp-client';

    export async function downloadFile(
      fileKey: H256,
      downloadPath: string
    ): Promise<{ path: string; size: number; mime?: string }> {
      // Download file from MSP
      const downloadResponse: DownloadResult = await mspClient.files.downloadFile(
        fileKey.toHex()
      );

      // Check if the download response was successful
      if (downloadResponse.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResponse.status}`);
      }

      // Save downloaded file

      // Create a writable stream to the target file path
      // This stream will receive binary data chunks and write them to disk.
      const writeStream = createWriteStream(downloadPath);
      // Convert the Web ReadableStream into a Node.js-readable stream
      const readableStream = Readable.fromWeb(downloadResponse.stream as any);

      // Pipe the readable (input) stream into the writable (output) stream
      // This transfers the file data chunk by chunk and closes the write stream automatically
      // when finished.
      return new Promise((resolve, reject) => {
        readableStream.pipe(writeStream);
        writeStream.on('finish', async () => {
          const { size } = await import('node:fs/promises').then((fs) =>
            fs.stat(downloadPath)
          );
          const mime =
            downloadResponse.contentType === null
              ? undefined
              : downloadResponse.contentType;

          resolve({
            path: downloadPath,
            size,
            mime, // if available
          });
        });
        writeStream.on('error', reject);
      });
    }

    // Compares an original file with a downloaded file byte-for-byte
    export async function verifyDownload(
      originalPath: string,
      downloadedPath: string
    ): Promise<boolean> {
      const originalBuffer = await import('node:fs/promises').then((fs) =>
        fs.readFile(originalPath)
      );
      const downloadedBuffer = await import('node:fs/promises').then((fs) =>
        fs.readFile(downloadedPath)
      );

      return originalBuffer.equals(downloadedBuffer);
    }
    ```

### Call the Verify Download Helper Method

1. Update the `index.ts` file with the following code in order to execute the verification logic you just implemented:

    ```ts title="index.ts"
      const isValid = await verifyDownload(filePath, downloadedFilePath);
      console.log(`File integrity verified: ${isValid ? 'PASSED' : 'FAILED'}`);
    ```

    ??? code "View complete `index.ts` file"

        ```ts title="index.ts"
        import '@storagehub/api-augment';
        import { initWasm } from '@storagehub-sdk/core';
        import { polkadotApi } from './services/clientService.js';
        import { downloadFile, verifyDownload } from './operations/fileOperations.js';

        async function run() {
          // For anything from @storagehub-sdk/core to work, initWasm() is required
          // on top of the file
          await initWasm();

          const fileKeyHex = 'INSERT_FILE_KEY_AS_HEX';
          // Convert to H256 type if not already
          const fileKey = polkadotApi.createType('H256', fileKeyHex);
          // Make sure the file extension matches the original file
          const filePath = new URL(`./files/INSERT_FILENAME.png`, import.meta.url)
            .pathname;
          const downloadedFilePath = new URL(
            './files/INSERT_FILENAME_downloaded.png',
            import.meta.url
          ).pathname;

          // Download file
          const downloadedFile = await downloadFile(fileKey, downloadedFilePath);
          console.log(
            `Downloaded ${downloadedFile.size} bytes to ${downloadedFile.path}`
          );

          const isValid = await verifyDownload(filePath, downloadedFilePath);
          console.log(`File integrity verified: ${isValid ? 'PASSED' : 'FAILED'}`);

          // Disconnect the Polkadot API at the very end
          await polkadotApi.disconnect();
        }

        await run();
        ```

2. Run the script:

    ```bash
    ts-node index.ts
    ```

    Upon a successful file download, you'll see the following output:

    <div class="termynal" data-termynal>
        <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
        <span data-ty>File integrity verified: PASSED</span>
        <span data-ty="input"><span class="file-path"></span></span>
    </div>
## Next Steps

<div class="grid cards" markdown>

-   <a href="/store-and-retrieve-data/use-storagehub-sdk/end-to-end-storage-workflow/" markdown>:material-arrow-right:

    **Build a Data Workflow End-to-End**

    Learn step-by-step how to store a file on DataHaven and retrieve it from the network.

    </a>

-  <a href="/how-it-works/data-and-provider-model/data-flow-and-lifecycle/" markdown>:material-arrow-right: 
    
    **Data Flow and Lifecycle**

    Read this end-to-end overview to learn how data moves through the DataHaven network.

    </a>

</div>
