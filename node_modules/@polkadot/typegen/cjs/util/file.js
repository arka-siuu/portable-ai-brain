"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFile = writeFile;
exports.readTemplate = readTemplate;
const tslib_1 = require("tslib");
const node_fs_1 = tslib_1.__importDefault(require("node:fs"));
const node_path_1 = tslib_1.__importDefault(require("node:path"));
const node_process_1 = tslib_1.__importDefault(require("node:process"));
const packageInfo_js_1 = require("../packageInfo.js");
function writeFile(dest, generator, noLog) {
    !noLog && console.log(`${dest}\n\tGenerating`);
    let generated = generator();
    while (generated.includes('\n\n\n')) {
        generated = generated.replace(/\n\n\n/g, '\n\n');
    }
    !noLog && console.log('\tWriting');
    node_fs_1.default.writeFileSync(dest, generated, { flag: 'w' });
    !noLog && console.log('');
}
function readTemplate(template) {
    // Inside the api repo itself, it will be 'auto'
    const rootDir = packageInfo_js_1.packageInfo.path === 'auto'
        ? node_path_1.default.join(node_process_1.default.cwd(), 'packages/typegen/src')
        : packageInfo_js_1.packageInfo.path;
    // NOTE With cjs in a subdir, search one lower as well
    const file = ['./templates', '../templates']
        .map((p) => node_path_1.default.join(rootDir, p, `${template}.hbs`))
        .find((p) => node_fs_1.default.existsSync(p));
    if (!file) {
        throw new Error(`Unable to locate ${template}.hbs from ${rootDir}`);
    }
    return node_fs_1.default.readFileSync(file).toString();
}
