import type { Registry } from '@polkadot/types/types';
import type { ModuleTypes, TypeImports } from './imports.js';
/** @internal */
export declare function getSimilarTypes(registry: Registry, definitions: Record<string, ModuleTypes>, _type: string, imports: TypeImports): string[];
