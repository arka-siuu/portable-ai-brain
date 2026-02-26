"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const tslib_1 = require("tslib");
const asset_hub_kusama_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/asset-hub-kusama-hex"));
const asset_hub_polkadot_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/asset-hub-polkadot-hex"));
const kusama_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/kusama-hex"));
const polkadot_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/polkadot-hex"));
const substrate_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/substrate-hex"));
const index_js_1 = require("./generate/index.js");
const BASE = 'packages/api-augment/src';
const METAS = Object.entries({ assetHubKusama: asset_hub_kusama_hex_1.default, assetHubPolkadot: asset_hub_polkadot_hex_1.default, kusama: kusama_hex_1.default, polkadot: polkadot_hex_1.default, substrate: substrate_hex_1.default });
function main() {
    (0, index_js_1.generateDefaultInterface)();
    (0, index_js_1.generateDefaultLookup)();
    (0, index_js_1.generateDefaultRpc)();
    (0, index_js_1.generateDefaultTsDef)();
    for (const [name, staticMeta] of METAS) {
        console.log();
        console.log(`*** Generating for ${name}`);
        (0, index_js_1.generateDefaultConsts)(`${BASE}/${name}/consts.ts`, staticMeta);
        (0, index_js_1.generateDefaultErrors)(`${BASE}/${name}/errors.ts`, staticMeta);
        (0, index_js_1.generateDefaultEvents)(`${BASE}/${name}/events.ts`, staticMeta);
        (0, index_js_1.generateDefaultQuery)(`${BASE}/${name}/query.ts`, staticMeta);
        (0, index_js_1.generateDefaultRuntime)(`${BASE}/${name}/runtime.ts`, staticMeta);
        (0, index_js_1.generateDefaultTx)(`${BASE}/${name}/tx.ts`, staticMeta);
    }
}
