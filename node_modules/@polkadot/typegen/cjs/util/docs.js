"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__TYPEGEN_DUMMY_DOCS = void 0;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const file_js_1 = require("./file.js");
handlebars_1.default.registerPartial({
    docs: handlebars_1.default.compile((0, file_js_1.readTemplate)('docs'))
});
exports.__TYPEGEN_DUMMY_DOCS = 'DUMMY_DOCS';
