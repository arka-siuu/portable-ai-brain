import type { HexString } from '@polkadot/util/types';
export declare function getMetadataViaWs(endpoint: string, metadataVer?: number): Promise<HexString>;
export declare function getRpcMethodsViaWs(endpoint: string): Promise<string[]>;
export declare function getRuntimeVersionViaWs(endpoint: string): Promise<[apiHash: string, apiVersion: number][]>;
