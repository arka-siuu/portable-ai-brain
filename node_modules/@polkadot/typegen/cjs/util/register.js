"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDefinitions = registerDefinitions;
function registerDefinitions(registry, extras) {
    Object.values(extras).forEach((def) => {
        Object.values(def).forEach(({ types }) => {
            registry.register(types);
        });
    });
}
