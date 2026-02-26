"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultTx = generateDefaultTx;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const defaultDefs = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const definitions_1 = tslib_1.__importDefault(require("@polkadot/types-augment/lookup/definitions"));
const util_1 = require("@polkadot/util");
const index_js_1 = require("../util/index.js");
const lookup_js_1 = require("./lookup.js");
const types_js_1 = require("./types.js");
const MAPPED_NAMES = {
    class: 'clazz',
    new: 'updated'
};
const generateForMetaTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('tx'));
function mapName(_name) {
    const name = (0, util_1.stringCamelCase)(_name);
    return MAPPED_NAMES[name] || name;
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
            .sort(index_js_1.compareName)
            .filter(({ calls }) => calls.isSome)
            .map((data) => {
            const name = data.name;
            const calls = data.calls.unwrap();
            const deprecationInfo = calls.deprecationInfo.toJSON();
            (0, index_js_1.setImports)(allDefs, imports, ['SubmittableExtrinsic']);
            const sectionName = (0, util_1.stringCamelCase)(name);
            const items = lookup.getSiType(calls.type).def.asVariant.variants
                .map(({ docs, fields, index, name }) => {
                const rawStatus = deprecationInfo?.[index.toNumber()];
                if (rawStatus) {
                    const deprecationVariantInfo = meta.registry.createTypeUnsafe('VariantDeprecationInfoV16', [rawStatus]);
                    const deprecationNotice = (0, types_js_1.getDeprecationNotice)(deprecationVariantInfo, name.toString(), 'Call');
                    const notice = docs.length ? ['', deprecationNotice] : [deprecationNotice];
                    docs.push(...notice.map((text) => meta.registry.createType('Text', text)));
                }
                const typesInfo = fields.map(({ name, type, typeName }, index) => {
                    const typeDef = registry.lookup.getTypeDef(type);
                    return [
                        name.isSome
                            ? mapName(name.unwrap())
                            : `param${index}`,
                        typeName.isSome
                            ? typeName.toString()
                            : typeDef.type,
                        typeDef.isFromSi
                            ? typeDef.type
                            : typeDef.lookupName || typeDef.type
                    ];
                });
                const params = typesInfo
                    .map(([name, , typeStr]) => {
                    const similarTypes = (0, index_js_1.getSimilarTypes)(registry, allDefs, typeStr, imports);
                    (0, index_js_1.setImports)(allDefs, imports, [typeStr, ...similarTypes]);
                    // Add the type to the list of used types
                    if (!(imports.primitiveTypes[typeStr])) {
                        usedTypes.add(typeStr);
                    }
                    return `${name}: ${similarTypes.join(' | ')}`;
                })
                    .join(', ');
                return {
                    args: typesInfo.map(([, , typeStr]) => (0, index_js_1.formatType)(registry, allDefs, typeStr, imports)).join(', '),
                    docs,
                    name: (0, util_1.stringCamelCase)(name),
                    params
                };
            })
                .sort(index_js_1.compareName);
            return {
                items,
                name: sectionName
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
                    types: ['ApiTypes', 'AugmentedSubmittable', 'SubmittableExtrinsic', 'SubmittableExtrinsicFunction']
                }
            ]
        });
    });
}
/** @internal */
function generateDefaultTx(dest, data, extraTypes = {}, isStrict = false, customLookupDefinitions) {
    const { metadata, registry } = (0, index_js_1.initMeta)(data, extraTypes);
    return generateForMeta(registry, metadata, dest, extraTypes, isStrict, customLookupDefinitions);
}
