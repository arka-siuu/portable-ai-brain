import type { HexString } from '@polkadot/util/types';
import type { ExtraTypes } from '../generate/types.js';
import { Metadata, TypeRegistry } from '@polkadot/types';
interface Result {
    metadata: Metadata;
    registry: TypeRegistry;
}
/**
 * This helper method has been transitioned to work with V14, V15 and up.
 */
export declare function initMeta(staticMeta: HexString, extraTypes?: ExtraTypes): Result;
export {};
