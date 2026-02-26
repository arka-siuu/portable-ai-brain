import { Metadata, TypeRegistry } from '@polkadot/types';
import { registerDefinitions } from './register.js';
/**
 * This helper method has been transitioned to work with V14, V15 and up.
 */
export function initMeta(staticMeta, extraTypes = {}) {
    const registry = new TypeRegistry();
    registerDefinitions(registry, extraTypes);
    let metadata;
    try {
        const opaqueMetadata = registry.createType('Option<OpaqueMetadata>', registry.createType('Raw', staticMeta).toU8a()).unwrap();
        metadata = new Metadata(registry, opaqueMetadata.toHex());
    }
    catch {
        metadata = new Metadata(registry, staticMeta);
    }
    registry.setMetadata(metadata);
    return { metadata, registry };
}
