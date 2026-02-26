"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMeta = initMeta;
const types_1 = require("@polkadot/types");
const register_js_1 = require("./register.js");
/**
 * This helper method has been transitioned to work with V14, V15 and up.
 */
function initMeta(staticMeta, extraTypes = {}) {
    const registry = new types_1.TypeRegistry();
    (0, register_js_1.registerDefinitions)(registry, extraTypes);
    let metadata;
    try {
        const opaqueMetadata = registry.createType('Option<OpaqueMetadata>', registry.createType('Raw', staticMeta).toU8a()).unwrap();
        metadata = new types_1.Metadata(registry, opaqueMetadata.toHex());
    }
    catch {
        metadata = new types_1.Metadata(registry, staticMeta);
    }
    registry.setMetadata(metadata);
    return { metadata, registry };
}
