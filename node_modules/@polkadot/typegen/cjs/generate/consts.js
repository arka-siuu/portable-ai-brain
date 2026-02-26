"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultConsts = generateDefaultConsts;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const defaultDefs = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const definitions_1 = tslib_1.__importDefault(require("@polkadot/types-augment/lookup/definitions"));
const util_1 = require("@polkadot/util");
const index_js_1 = require("../util/index.js");
const lookup_js_1 = require("./lookup.js");
const types_js_1 = require("./types.js");
const generateForMetaTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('consts'));
/** @internal */
function generateForMeta(meta, dest, extraTypes, isStrict, customLookupDefinitions) {
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
        const { lookup, pallets, registry } = meta.asLatest;
        const usedTypes = new Set([]);
        const modules = pallets
            .filter(({ constants }) => constants.length > 0)
            .map(({ constants, name }) => {
            if (!isStrict) {
                (0, index_js_1.setImports)(allDefs, imports, ['Codec']);
            }
            const items = constants
                .map(({ deprecationInfo, docs, name, type }) => {
                const typeDef = lookup.getTypeDef(type);
                const returnType = typeDef.lookupName || (0, index_js_1.formatType)(registry, allDefs, typeDef, imports);
                if (!deprecationInfo.isNotDeprecated) {
                    const deprecationNotice = (0, types_js_1.getDeprecationNotice)(deprecationInfo, (0, util_1.stringCamelCase)(name), 'Constant');
                    const items = docs.length
                        ? ['', deprecationNotice]
                        : [deprecationNotice];
                    docs.push(...items.map((text) => registry.createType('Text', text)));
                }
                // Add the type to the list of used types
                if (!(imports.primitiveTypes[returnType])) {
                    usedTypes.add(returnType);
                }
                (0, index_js_1.setImports)(allDefs, imports, [returnType]);
                return {
                    docs,
                    name: (0, util_1.stringCamelCase)(name),
                    type: returnType
                };
            })
                .sort(index_js_1.compareName);
            return {
                items,
                name: (0, util_1.stringCamelCase)(name)
            };
        })
            .sort(index_js_1.compareName);
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
                    types: ['ApiTypes', 'AugmentedConst']
                }
            ]
        });
    });
}
/** @internal */
function generateDefaultConsts(dest, data, extraTypes = {}, isStrict = false, customLookupDefinitions) {
    const { metadata } = (0, index_js_1.initMeta)(data, extraTypes);
    return generateForMeta(metadata, dest, extraTypes, isStrict, customLookupDefinitions);
}
