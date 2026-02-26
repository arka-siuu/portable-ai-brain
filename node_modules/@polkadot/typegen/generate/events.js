import Handlebars from 'handlebars';
import * as defaultDefs from '@polkadot/types/interfaces/definitions';
import lookupDefinitions from '@polkadot/types-augment/lookup/definitions';
import { stringCamelCase } from '@polkadot/util';
import { compareName, createImports, formatType, initMeta, readTemplate, setImports, writeFile } from '../util/index.js';
import { ignoreUnusedLookups } from './lookup.js';
import { getDeprecationNotice } from './types.js';
const generateForMetaTemplate = Handlebars.compile(readTemplate('events'));
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
                        const deprecationNotice = getDeprecationNotice(deprecationVariantInfo, name.toString());
                        const notice = docs.length ? ['', deprecationNotice] : [deprecationNotice];
                        docs.push(...notice.map((text) => meta.registry.createType('Text', text)));
                    }
                    const args = fields
                        .map(({ type }) => lookup.getTypeDef(type))
                        .map((typeDef) => {
                        const arg = typeDef.lookupName || formatType(registry, allDefs, typeDef, imports);
                        // Add the type to the list of used types
                        if (!(imports.primitiveTypes[arg])) {
                            usedTypes.add(arg);
                        }
                        return arg;
                    });
                    const names = fields
                        .map(({ name }) => registry.lookup.sanitizeField(name)[0])
                        .filter((n) => !!n);
                    setImports(allDefs, imports, args);
                    return {
                        docs,
                        name: name.toString(),
                        type: names.length !== 0 && names.length === args.length
                            ? `[${names.map((n, i) => `${ALIAS.includes(n) ? `${n}_` : n}: ${args[i]}`).join(', ')}], { ${names.map((n, i) => `${n}: ${args[i]}`).join(', ')} }`
                            : `[${args.join(', ')}]`
                    };
                })
                    .sort(compareName),
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
                    types: ['ApiTypes', 'AugmentedEvent']
                }
            ]
        });
    });
}
/** @internal */
export function generateDefaultEvents(dest, data, extraTypes = {}, isStrict = false, customLookupDefinitions) {
    const { metadata } = initMeta(data, extraTypes);
    return generateForMeta(metadata, dest, extraTypes, isStrict, customLookupDefinitions);
}
