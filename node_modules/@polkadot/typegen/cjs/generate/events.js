"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultEvents = generateDefaultEvents;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const defaultDefs = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const definitions_1 = tslib_1.__importDefault(require("@polkadot/types-augment/lookup/definitions"));
const util_1 = require("@polkadot/util");
const index_js_1 = require("../util/index.js");
const lookup_js_1 = require("./lookup.js");
const types_js_1 = require("./types.js");
const generateForMetaTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('events'));
const ALIAS = [
    'symbol',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'static',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield'
];
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
            .filter(({ events }) => events.isSome)
            .map((data) => {
            const name = data.name;
            const events = data.events.unwrap();
            const deprecationInfo = events.deprecationInfo.toJSON();
            return {
                items: lookup.getSiType(events.type).def.asVariant.variants
                    .map(({ docs, fields, index, name }) => {
                    const rawStatus = deprecationInfo?.[index.toNumber()];
                    if (rawStatus) {
                        const deprecationVariantInfo = meta.registry.createTypeUnsafe('VariantDeprecationInfoV16', [rawStatus]);
                        const deprecationNotice = (0, types_js_1.getDeprecationNotice)(deprecationVariantInfo, name.toString());
                        const notice = docs.length ? ['', deprecationNotice] : [deprecationNotice];
                        docs.push(...notice.map((text) => meta.registry.createType('Text', text)));
                    }
                    const args = fields
                        .map(({ type }) => lookup.getTypeDef(type))
                        .map((typeDef) => {
                        const arg = typeDef.lookupName || (0, index_js_1.formatType)(registry, allDefs, typeDef, imports);
                        // Add the type to the list of used types
                        if (!(imports.primitiveTypes[arg])) {
                            usedTypes.add(arg);
                        }
                        return arg;
                    });
                    const names = fields
                        .map(({ name }) => registry.lookup.sanitizeField(name)[0])
                        .filter((n) => !!n);
                    (0, index_js_1.setImports)(allDefs, imports, args);
                    return {
                        docs,
                        name: name.toString(),
                        type: names.length !== 0 && names.length === args.length
                            ? `[${names.map((n, i) => `${ALIAS.includes(n) ? `${n}_` : n}: ${args[i]}`).join(', ')}], { ${names.map((n, i) => `${n}: ${args[i]}`).join(', ')} }`
                            : `[${args.join(', ')}]`
                    };
                })
                    .sort(index_js_1.compareName),
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
                    types: ['ApiTypes', 'AugmentedEvent']
                }
            ]
        });
    });
}
/** @internal */
function generateDefaultEvents(dest, data, extraTypes = {}, isStrict = false, customLookupDefinitions) {
    const { metadata } = (0, index_js_1.initMeta)(data, extraTypes);
    return generateForMeta(metadata, dest, extraTypes, isStrict, customLookupDefinitions);
}
