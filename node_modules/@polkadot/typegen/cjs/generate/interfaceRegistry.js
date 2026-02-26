"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInterfaceTypes = generateInterfaceTypes;
exports.generateDefaultInterface = generateDefaultInterface;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const codec_1 = require("@polkadot/types/codec");
const create_1 = require("@polkadot/types/create");
const defaultDefinitions = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const defaultPrimitives = tslib_1.__importStar(require("@polkadot/types/primitive"));
const index_js_1 = require("../util/index.js");
const primitiveClasses = {
    ...defaultPrimitives,
    Json: codec_1.Json,
    Raw: codec_1.Raw
};
const generateInterfaceTypesTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('interfaceRegistry'));
/** @internal */
function generateInterfaceTypes(importDefinitions, dest) {
    const registry = new create_1.TypeRegistry();
    (0, index_js_1.writeFile)(dest, () => {
        Object.entries(importDefinitions).reduce((acc, def) => Object.assign(acc, def), {});
        const imports = (0, index_js_1.createImports)(importDefinitions);
        const definitions = imports.definitions;
        const items = [];
        // first we create imports for our known classes from the API
        Object
            .keys(primitiveClasses)
            .filter((name) => !name.includes('Generic'))
            .forEach((primitiveName) => {
            (0, index_js_1.setImports)(definitions, imports, [primitiveName]);
            items.push(primitiveName);
        });
        const existingTypes = {};
        // ensure we have everything registered since we will get the definition
        // form the available types (so any unknown should show after this)
        Object.values(definitions).forEach(({ types }) => {
            registry.register(types);
        });
        // create imports for everything that we have available
        Object.values(definitions).forEach(({ types }) => {
            (0, index_js_1.setImports)(definitions, imports, Object.keys(types));
            const uniqueTypes = Object.keys(types).filter((type) => !existingTypes[type]);
            uniqueTypes.forEach((type) => {
                existingTypes[type] = true;
                items.push(type);
            });
        });
        return generateInterfaceTypesTemplate({
            headerType: 'defs',
            imports,
            items: items.sort((a, b) => a.localeCompare(b)),
            types: [
                ...Object.keys(imports.localTypes).sort().map((packagePath) => ({
                    file: packagePath,
                    types: Object.keys(imports.localTypes[packagePath])
                }))
            ]
        });
    });
}
function generateDefaultInterface() {
    generateInterfaceTypes({ '@polkadot/types/interfaces': defaultDefinitions }, 'packages/types-augment/src/registry/interfaces.ts');
}
