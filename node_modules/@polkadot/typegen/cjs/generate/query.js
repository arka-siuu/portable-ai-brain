"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultQuery = generateDefaultQuery;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const defaultDefs = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const util_1 = require("@polkadot/types/util");
const definitions_1 = tslib_1.__importDefault(require("@polkadot/types-augment/lookup/definitions"));
const util_2 = require("@polkadot/util");
const index_js_1 = require("../util/index.js");
const lookup_js_1 = require("./lookup.js");
const types_js_1 = require("./types.js");
const generateForMetaTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('query'));
/** @internal */
function entrySignature(lookup, allDefs, registry, section, storageEntry, imports) {
    try {
        const outputType = lookup.getTypeDef((0, util_1.unwrapStorageSi)(storageEntry.type));
        if (storageEntry.type.isPlain) {
            const typeDef = lookup.getTypeDef(storageEntry.type.asPlain);
            (0, index_js_1.setImports)(allDefs, imports, [
                typeDef.lookupName || typeDef.type,
                storageEntry.modifier.isOptional
                    ? 'Option'
                    : null
            ]);
            return [storageEntry.modifier.isOptional, '', '', (0, index_js_1.formatType)(registry, allDefs, outputType, imports)];
        }
        else if (storageEntry.type.isMap) {
            const { hashers, key, value } = storageEntry.type.asMap;
            const keyDefs = hashers.length === 1
                ? [lookup.getTypeDef(key)]
                : lookup.getSiType(key).def.asTuple.map((k) => lookup.getTypeDef(k));
            const similarTypes = keyDefs.map((k) => (0, index_js_1.getSimilarTypes)(registry, allDefs, k.lookupName || k.type, imports));
            const keyTypes = similarTypes.map((t) => t.join(' | '));
            const defValue = lookup.getTypeDef(value);
            (0, index_js_1.setImports)(allDefs, imports, [
                ...similarTypes.reduce((all, t) => all.concat(t), []),
                storageEntry.modifier.isOptional
                    ? 'Option'
                    : null,
                defValue.lookupName || defValue.type
            ]);
            return [
                storageEntry.modifier.isOptional,
                keyDefs.map((k) => (0, index_js_1.formatType)(registry, allDefs, k.lookupName || k.type, imports)).join(', '),
                keyTypes.map((t, i) => `arg${keyTypes.length === 1 ? '' : (i + 1)}: ${t}`).join(', '),
                outputType.lookupName || (0, index_js_1.formatType)(registry, allDefs, outputType, imports)
            ];
        }
        throw new Error(`Expected Plain or Map type, found ${storageEntry.type.type}`);
    }
    catch (error) {
        throw new Error(`entrySignature: Cannot create signature for query ${section}.${storageEntry.name.toString()}:: ${error.message}`);
    }
}
/** @internal */
function generateForMeta(registry, meta, dest, extraTypes, isStrict, customLookupDefinitions) {
    (0, index_js_1.writeFile)(dest, () => {
        const allTypes = {
            '@polkadot/types-augment': {
                lookup: {
                    ...definitions_1.default,
                    ...customLookupDefinitions
                }
            },
            '@polkadot/types/interfaces': defaultDefs,
            ...extraTypes
        };
        const imports = (0, index_js_1.createImports)(allTypes);
        const allDefs = Object.entries(allTypes).reduce((defs, [path, obj]) => {
            return Object.entries(obj).reduce((defs, [key, value]) => ({ ...defs, [`${path}/${key}`]: value }), defs);
        }, {});
        const { lookup, pallets } = meta.asLatest;
        const usedTypes = new Set([]);
        const modules = pallets
            .filter(({ storage }) => storage.isSome)
            .map(({ name, storage }) => {
            const items = storage.unwrap().items
                .map((storageEntry) => {
                const { deprecationInfo, docs, name } = storageEntry;
                const [isOptional, args, params, _returnType] = entrySignature(lookup, allDefs, registry, name.toString(), storageEntry, imports);
                if (!deprecationInfo.isNotDeprecated) {
                    const deprecationNotice = (0, types_js_1.getDeprecationNotice)(deprecationInfo, (0, util_2.stringCamelCase)(name));
                    const items = docs.length
                        ? ['', deprecationNotice]
                        : [deprecationNotice];
                    docs.push(...items.map((text) => registry.createType('Text', text)));
                }
                // Add the type and args to the list of used types
                if (!(imports.primitiveTypes[_returnType])) {
                    usedTypes.add(_returnType);
                }
                if (!(imports.primitiveTypes[args])) {
                    usedTypes.add(args);
                }
                const returnType = isOptional
                    ? `Option<${_returnType}>`
                    : _returnType;
                return {
                    args,
                    docs,
                    entryType: 'AugmentedQuery',
                    name: (0, util_2.stringCamelCase)(storageEntry.name),
                    params,
                    returnType
                };
            })
                .sort(index_js_1.compareName);
            return {
                items,
                name: (0, util_2.stringCamelCase)(name)
            };
        })
            .sort(index_js_1.compareName);
        imports.typesTypes['Observable'] = true;
        // filter out the unused lookup types from imports
        (0, lookup_js_1.ignoreUnusedLookups)([...usedTypes], imports);
        return generateForMetaTemplate({
            headerType: 'chain',
            imports,
            isStrict,
            modules,
            types: [
                ...Object.keys(imports.localTypes).sort().map((packagePath) => ({
                    file: packagePath.replace('@polkadot/types-augment', '@polkadot/types'),
                    types: Object.keys(imports.localTypes[packagePath])
                })),
                {
                    file: '@polkadot/api-base/types',
                    types: ['ApiTypes', 'AugmentedQuery', 'QueryableStorageEntry']
                }
            ]
        });
    });
}
/** @internal */
function generateDefaultQuery(dest, data, extraTypes = {}, isStrict = false, customLookupDefinitions) {
    const { metadata, registry } = (0, index_js_1.initMeta)(data, extraTypes);
    return generateForMeta(registry, metadata, dest, extraTypes, isStrict, customLookupDefinitions);
}
