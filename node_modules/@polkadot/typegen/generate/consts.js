import Handlebars from 'handlebars';
import * as defaultDefs from '@polkadot/types/interfaces/definitions';
import lookupDefinitions from '@polkadot/types-augment/lookup/definitions';
import { stringCamelCase } from '@polkadot/util';
import { compareName, createImports, formatType, initMeta, readTemplate, setImports, writeFile } from '../util/index.js';
import { ignoreUnusedLookups } from './lookup.js';
import { getDeprecationNotice } from './types.js';
const generateForMetaTemplate = Handlebars.compile(readTemplate('consts'));
/** @internal */
function generateForMeta(meta, dest, extraTypes, isStrict, customLookupDefinitions) {
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
        const { lookup, pallets, registry } = meta.asLatest;
        const usedTypes = new Set([]);
        const modules = pallets
            .filter(({ constants }) => constants.length > 0)
            .map(({ constants, name }) => {
            if (!isStrict) {
                setImports(allDefs, imports, ['Codec']);
            }
            const items = constants
                .map(({ deprecationInfo, docs, name, type }) => {
                const typeDef = lookup.getTypeDef(type);
                const returnType = typeDef.lookupName || formatType(registry, allDefs, typeDef, imports);
                if (!deprecationInfo.isNotDeprecated) {
                    const deprecationNotice = getDeprecationNotice(deprecationInfo, stringCamelCase(name), 'Constant');
                    const items = docs.length
                        ? ['', deprecationNotice]
                        : [deprecationNotice];
                    docs.push(...items.map((text) => registry.createType('Text', text)));
                }
                // Add the type to the list of used types
                if (!(imports.primitiveTypes[returnType])) {
                    usedTypes.add(returnType);
                }
                setImports(allDefs, imports, [returnType]);
                return {
                    docs,
                    name: stringCamelCase(name),
                    type: returnType
                };
            })
                .sort(compareName);
            return {
                items,
                name: stringCamelCase(name)
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
                    types: ['ApiTypes', 'AugmentedConst']
                }
            ]
        });
    });
}
/** @internal */
export function generateDefaultConsts(dest, data, extraTypes = {}, isStrict = false, customLookupDefinitions) {
    const { metadata } = initMeta(data, extraTypes);
    return generateForMeta(metadata, dest, extraTypes, isStrict, customLookupDefinitions);
}
