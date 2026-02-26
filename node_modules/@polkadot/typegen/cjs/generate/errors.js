"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultErrors = generateDefaultErrors;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const util_1 = require("@polkadot/util");
const index_js_1 = require("../util/index.js");
const types_js_1 = require("./types.js");
const generateForMetaTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('errors'));
/** @internal */
function generateForMeta(meta, dest, isStrict) {
    (0, index_js_1.writeFile)(dest, () => {
        const imports = (0, index_js_1.createImports)({});
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
                        const deprecationNotice = (0, types_js_1.getDeprecationNotice)(deprecationVariantInfo, name.toString());
                        const notice = docs.length ? ['', deprecationNotice] : [deprecationNotice];
                        docs.push(...notice.map((text) => meta.registry.createType('Text', text)));
                    }
                    return {
                        docs,
                        name: name.toString()
                    };
                })
                    .sort(index_js_1.compareName),
                name: (0, util_1.stringCamelCase)(name)
            };
        })
            .sort(index_js_1.compareName);
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
function generateDefaultErrors(dest, data, extraTypes = {}, isStrict = false) {
    const { metadata } = (0, index_js_1.initMeta)(data, extraTypes);
    return generateForMeta(metadata, dest, isStrict);
}
