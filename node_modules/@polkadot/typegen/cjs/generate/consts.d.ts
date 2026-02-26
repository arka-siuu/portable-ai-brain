import type { Definitions } from '@polkadot/types/types';
import type { HexString } from '@polkadot/util/types';
import { type ExtraTypes } from './types.js';
/** @internal */
export declare function generateDefaultConsts(dest: string, data: HexString, extraTypes?: ExtraTypes, isStrict?: boolean, customLookupDefinitions?: Definitions): void;
