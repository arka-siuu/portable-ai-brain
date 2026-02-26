import type { HexString } from '@polkadot/util/types';
import { type TypeImports } from '../util/index.js';
export declare function generateDefaultLookup(destDir?: string, staticData?: HexString): void;
export declare function ignoreUnusedLookups(usedTypes: string[], imports: TypeImports): void;
