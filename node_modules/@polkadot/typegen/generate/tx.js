import Handlebars from 'handlebars';
import * as defaultDefs from '@polkadot/types/interfaces/definitions';
import lookupDefinitions from '@polkadot/types-augment/lookup/definitions';
import { stringCamelCase } from '@polkadot/util';
import { compareName, createImports, formatType, getSimilarTypes, initMeta, readTemplate, setImports, writeFile } from '../util/index.js';
import { ignoreUnusedLookups } from './lookup.js';
import { getDeprecationNotice } from './types.js';
const MAPPED_NAMES = {
    class: 'clazz',
    new: 'updated'
};
const generateForMetaTemplate = Handlebars.compile(readTemplate('tx'));
function mapName(_name) {
    const name = stringCamelCase(_name);
    return MAPPED_NAMES[name] || name;
}
/** @internal */
function generateForMeta(registry, meta, dest, extraTypes, isStrict, customLookupDefinitions) {
    writeFile(dest, () => {
        const allTypes = {
            '@polkadot/types-augment': {
                lookup: {
                    ...lookupDefinitions,
                    ...customLookupDefinitions
                }
            },
            '@polkadot/types/interfaces': defaultDefs,
            ...extraTypes
        };
        const imports = createImports(allTypes);
        const allDefs = Object.entries(allTypes).reduce((defs, [path, obj]) => {
            return Object.entries(obj).reduce((defs, [key, value]) => ({ ...defs, [`${path}/${key}`]: value }), defs);
        }, {});
        const { lookup, pallets } = meta.asLatest;
        const usedTypes = new Set([]);
        const modules = pallets
            .sort(compareName)
            .filter(({ calls }) => calls.isSome)
            .map((data) => {
            const name = data.name;
            const calls = data.calls.unwrap();
            const deprecationInfo = calls.deprecationInfo.toJSON();
            setImports(allDefs, imports, ['SubmittableExtrinsic']);
            const sectionName = stringCamelCase(name);
            const items = lookup.getSiType(calls.type).def.asVariant.variants
                .map(({ docs, fields, index, name }) => {
                const rawStatus = deprecationInfo?.[index.toNumber()];
                if (rawStatus) {
                    const deprecationVariantInfo = meta.registry.createTypeUnsafe('VariantDeprecationInfoV16', [rawStatus]);
                    const deprecationNotice = getDeprecationNotice(deprecationVariantInfo, name.toString(), 'Call');
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
                    const similarTypes = getSimilarTypes(registry, allDefs, typeStr, imports);
                    setImports(allDefs, imports, [typeStr, ...similarTypes]);
                    // Add the type to the list of used types
                    if (!(imports.primitiveTypes[typeStr])) {
                        usedTypes.add(typeStr);
                    }
                    return `${name}: ${similarTypes.join(' | ')}`;
                })
                    .join(', ');
                return {
                    args: typesInfo.map(([, , typeStr]) => formatType(registry, allDefs, typeStr, imports)).join(', '),
                    docs,
                    name: stringCamelCase(name),
                    params
                };
            })
                .sort(compareName);
            return {
                items,
                name: sectionName
            };
        })
            .sort(compareName);
        // filter out the unused lookup types from imports
        ignoreUnusedLookups([...usedTypes], imports);
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
export function generateDefaultTx(dest, data, extraTypes = {}, isStrict = false, customLookupDefinitions) {
    const { metadata, registry } = initMeta(data, extraTypes);
    return generateForMeta(registry, metadata, dest, extraTypes, isStrict, customLookupDefinitions);
}
