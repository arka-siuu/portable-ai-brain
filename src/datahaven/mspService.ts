import {
    type HealthStatus,
    type InfoResponse,
    MspClient,
    type UserInfo,
    type ValueProp,
} from '@storagehub-sdk/msp-client';
import { type HttpClientConfig } from '@storagehub-sdk/core';
import { address, walletClient } from './clientService.js';
import { NETWORK } from '../config/networks.js';

// ─── MSP HTTP client config ────────────────────────────────────────────────────

const httpCfg: HttpClientConfig = { baseUrl: NETWORK.mspUrl };

// JWT session token — set after SIWE authentication, reused for all subsequent requests
let sessionToken: string | undefined = undefined;

// sessionProvider is called by MspClient before every authenticated request.
// Returns token + address when authenticated, undefined when not yet authed.
const sessionProvider = async () =>
    sessionToken
        ? ({ token: sessionToken, user: { address } } as const)
        : undefined;

export const mspClient = await MspClient.connect(httpCfg, sessionProvider);

// ─── Info helpers ──────────────────────────────────────────────────────────────

export const getMspInfo = async (): Promise<InfoResponse> => {
    const info = await mspClient.info.getInfo();
    return info;
};

export const getMspHealth = async (): Promise<HealthStatus> => {
    return mspClient.info.getHealth();
};

// ─── SIWE authentication ───────────────────────────────────────────────────────

/**
 * authenticateUser — signs a SIWE challenge with the user's wallet.
 *
 * The MSP verifies the signature and returns a short-lived JWT.
 * That JWT is stored in `sessionToken` and passed via sessionProvider
 * for all subsequent upload/download calls.
 *
 * 🔐 Trust boundary: the private key never leaves this process.
 *    The MSP only sees the signed challenge, not the key.
 */
export const authenticateUser = async (): Promise<UserInfo> => {
    console.log('\n🔐 Authenticating with MSP via SIWE...');
    const domain = 'localhost';
    const uri = 'http://localhost';

    const siweSession = await mspClient.auth.SIWE(walletClient, domain, uri);
    sessionToken = (siweSession as { token: string }).token;

    const profile = await mspClient.auth.getProfile();
    console.log(`   ✅ Authenticated as ${profile.address}`);
    return profile;
};

// ─── Value propositions ────────────────────────────────────────────────────────

/**
 * getValueProps — fetches storage fee tiers from the MSP and selects the first.
 *
 * A "value proposition" is the MSP's price structure for storage.
 * Every bucket must be created under a specific value prop.
 */
export const getValueProps = async (): Promise<`0x${string}`> => {
    const valueProps: ValueProp[] = await mspClient.info.getValuePropositions();
    if (!Array.isArray(valueProps) || valueProps.length === 0) {
        throw new Error('No value propositions available from MSP');
    }
    return valueProps[0].id as `0x${string}`;
};
