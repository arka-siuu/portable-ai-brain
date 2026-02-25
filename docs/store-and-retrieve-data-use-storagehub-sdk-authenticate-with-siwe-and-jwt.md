---
title: Authenticate with SIWE and JWT
description: This guide shows you how to use Sign-In with Ethereum (SIWE) and JSON Web Tokens (JWT) for secure authentication via the StorageHub SDK.
categories:
- Store Data
- StorageHub SDK
url: https://docs.datahaven.xyz/store-and-retrieve-data/use-storagehub-sdk/authenticate-with-siwe-and-jwt/
word_count: 859
token_estimate: 1605
---

# Authenticate with SIWE and JWT

This guide shows how to sign in to a StorageHub Main Storage Provider (MSP) using Sign-In with Ethereum (SIWE, [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361){target=\_blank}) and maintain a session with short-lived JSON Web Tokens (JWTs). The MSP verifies a wallet-signed challenge, issues a JWT for subsequent requests, and resolves an ENS profile where available. The StorageHub SDK wraps this flow so you can check auth status, complete login, and fetch the authenticated profile with a few calls.

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
## Set Up Auth Script

Create an `index.ts` file if you haven't already. Its `run` method will orchestrate all the logic in this guide. By now, your services folder (including the MSP and client helper services) should already be created, which means you should already have the `authenticateUser` helper method implemented. If not, see the [Get Started](/store-and-retrieve-data/use-storagehub-sdk/get-started/) guide.

Add the following code to your `index.ts` file:

```ts title="index.ts"
import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { authenticateUser } from './services/mspService.js';

async function run() {
  // Initialize WASM
  await initWasm();

  // Authenticate address (e.g. before performing actions that require authentication
  // like uploading a file or retrieving private data)
  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);

  await polkadotApi.disconnect();
}

run();
```

In this code, the `authenticateUser` helper method from `mspService.ts` is called. This method:

- Checks and authenticates your address via the MSP Client.
- Calls the SDK's `mspClient.auth.SIWE` method, which produces a JWT token used as proof of authentication.
- Passes the JWT token to the `sessionProvider` constant, one of the two required parameters for `MspClient.connect`.

??? interface "Take a look at the `authenticateUser` helper method code."

    ```ts title="mspService.ts"
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
    ```

When you connect to the MSP with a valid `sessionProvider`, you can trigger certain methods you wouldn’t otherwise be able to:

- **`MspClient.auth.getProfile`**: Returns the authenticated user's profile.
- **`MspClient.files.uploadFile`**: Uploads a file to the MSP.
- **`MspClient.info.getPaymentStreams`**: Returns the authenticated user's payment streams.

## Run Auth Script

Execute the `authenticateUser` method by running the script:

```bash
ts-node index.ts
```

After the address has been authenticated, the `authenticateUser` method that triggers `MspClient.auth.getProfile` upon successful execution, should return a response like this:

!!! note
    The ENS name is hardcoded currently.

<div class="termynal" data-termynal>
    <span data-ty="input"><span class="file-path"></span>ts-node index.ts</span>
    <span data-ty><pre>Authenticated user profile: {
  address: '0x00DA35D84a73db75462D2B2c1ed8974aAA57223e',
  ens: 'user.eth'
}</pre></span>
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
