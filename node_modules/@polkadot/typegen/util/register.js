export function registerDefinitions(registry, extras) {
    Object.values(extras).forEach((def) => {
        Object.values(def).forEach(({ types }) => {
            registry.register(types);
        });
    });
}
