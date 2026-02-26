"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRpcTypes = generateRpcTypes;
exports.generateDefaultRpc = generateDefaultRpc;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const defaultDefinitions = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const static_substrate_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/static-substrate"));
const index_js_1 = require("../util/index.js");
const StorageKeyType = 'StorageKey | string | Uint8Array | any';
const generateRpcTypesTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('rpc'));
/** @internal */
function generateRpcTypes(registry, importDefinitions, dest, extraTypes) {
    (0, index_js_1.writeFile)(dest, () => {
        const allTypes = { '@polkadot/types/interfaces': importDefinitions, ...extraTypes };
        const imports = (0, index_js_1.createImports)(allTypes);
        const definitions = imports.definitions;
        const allDefs = Object.entries(allTypes).reduce((defs, [path, obj]) => {
            return Object.entries(obj).reduce((defs, [key, value]) => ({ ...defs, [`${path}/${key}`]: value }), defs);
        }, {});
        const rpcKeys = Object
            .keys(definitions)
            .filter((key) => Object.keys(definitions[key].rpc || {}).length !== 0)
            .sort();
        const additional = {};
        const modules = rpcKeys.map((sectionFullName) => {
            const rpc = definitions[sectionFullName].rpc || {};
            const section = sectionFullName.split('/').pop();
            const allMethods = Object.keys(rpc).sort().map((methodName) => {
                const def = rpc[methodName];
                let args;
                let type;
                let generic;
                // These are too hard to type with generics, do manual overrides
                if (section === 'state') {
                    (0, index_js_1.setImports)(allDefs, imports, ['Codec', 'Hash', 'StorageKey', 'Vec']);
                    if (methodName === 'getStorage') {
                        generic = 'T = Codec';
                        args = [`key: ${StorageKeyType}, block?: Hash | Uint8Array | string`];
                        type = 'T';
                    }
                    else if (methodName === 'queryStorage') {
                        generic = 'T = Codec[]';
                        args = [`keys: Vec<StorageKey> | (${StorageKeyType})[], fromBlock?: Hash | Uint8Array | string, toBlock?: Hash | Uint8Array | string`];
                        type = '[Hash, T][]';
                    }
                    else if (methodName === 'queryStorageAt') {
                        generic = 'T = Codec[]';
                        args = [`keys: Vec<StorageKey> | (${StorageKeyType})[], at?: Hash | Uint8Array | string`];
                        type = 'T';
                    }
                    else if (methodName === 'subscribeStorage') {
                        generic = 'T = Codec[]';
                        args = [`keys?: Vec<StorageKey> | (${StorageKeyType})[]`];
                        type = 'T';
                    }
                }
                if (args === undefined) {
                    (0, index_js_1.setImports)(allDefs, imports, [def.type]);
                    args = def.params.map((param) => {
                        const similarTypes = (0, index_js_1.getSimilarTypes)(registry, definitions, param.type, imports);
                        (0, index_js_1.setImports)(allDefs, imports, [param.type, ...similarTypes]);
                        return `${param.name}${param.isOptional ? '?' : ''}: ${similarTypes.join(' | ')}`;
                    });
                    type = (0, index_js_1.formatType)(registry, allDefs, def.type, imports);
                    generic = '';
                }
                const item = {
                    args: args.join(', '),
                    docs: def.deprecated
                        ? [`@deprecated ${def.deprecated}`, def.description]
                        : [def.description],
                    generic,
                    name: methodName,
                    type
                };
                if (def.aliasSection) {
                    if (!additional[def.aliasSection]) {
                        additional[def.aliasSection] = {
                            items: [],
                            name: def.aliasSection
                        };
                    }
                    additional[def.aliasSection].items.push(item);
                    return null;
                }
                return item;
            }).filter((item) => !!item);
            return {
                items: allMethods,
                name: section || 'unknown'
            };
        }).concat(...Object.values(additional)).sort((a, b) => a.name.localeCompare(b.name));
        imports.typesTypes['Observable'] = true;
        return generateRpcTypesTemplate({
            headerType: 'chain',
            imports,
            modules,
            types: [
                ...Object.keys(imports.localTypes).sort().map((packagePath) => ({
                    file: packagePath.replace('@polkadot/types-augment', '@polkadot/types'),
                    types: Object.keys(imports.localTypes[packagePath])
                })),
                {
                    file: '@polkadot/rpc-core/types',
                    types: ['AugmentedRpc']
                }
            ]
        });
    });
}
function generateDefaultRpc(dest = 'packages/rpc-augment/src/augment/jsonrpc.ts', extraTypes = {}) {
    const { registry } = (0, index_js_1.initMeta)(static_substrate_1.default, extraTypes);
    generateRpcTypes(registry, defaultDefinitions, dest, extraTypes);
}
