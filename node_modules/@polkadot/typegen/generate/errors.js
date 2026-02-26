import Handlebars from 'handlebars';
import { stringCamelCase } from '@polkadot/util';
import { compareName, createImports, initMeta, readTemplate, writeFile } from '../util/index.js';
import { getDeprecationNotice } from './types.js';
const generateForMetaTemplate = Handlebars.compile(readTemplate('errors'));
/** @internal */
function generateForMeta(meta, dest, isStrict) {
    writeFile(dest, () => {
        const imports = createImports({});
        const { lookup, pallets } = meta.asLatest;
        const modules = pallets
            .filter(({ errors }) => errors.isSome)
            .map((data) => {
            const name = data.name;
            const errors = data.errors.unwrap();
            const deprecationInfo = errors.deprecationInfo.toJSON();
            return {
                items: lookup.getSiType(errors.type).def.asVariant.variants
                    .map(({ docs, index, name }) => {
                    const rawStatus = deprecationInfo?.[index.toNumber()];
                    if (rawStatus) {
                        const deprecationVariantInfo = meta.registry.createTypeUnsafe('VariantDeprecationInfoV16', [rawStatus]);
                        const deprecationNotice = getDeprecationNotice(deprecationVariantInfo, name.toString());
                        const notice = docs.length ? ['', deprecationNotice] : [deprecationNotice];
                        docs.push(...notice.map((text) => meta.registry.createType('Text', text)));
                    }
                    return {
                        docs,
                        name: name.toString()
                    };
                })
                    .sort(compareName),
                name: stringCamelCase(name)
            };
        })
            .sort(compareName);
        return generateForMetaTemplate({
            headerType: 'chain',
            imports,
            isStrict,
            modules,
            types: [
                {
                    file: '@polkadot/api-base/types',
                    types: ['ApiTypes', 'AugmentedError']
                }
            ]
        });
    });
}
/** @internal */
export function generateDefaultErrors(dest, data, extraTypes = {}, isStrict = false) {
    const { metadata } = initMeta(data, extraTypes);
    return generateForMeta(metadata, dest, isStrict);
}
