import Handlebars from 'handlebars';
import { readTemplate } from './file.js';
Handlebars.registerPartial({
    docs: Handlebars.compile(readTemplate('docs'))
});
export const __TYPEGEN_DUMMY_DOCS = 'DUMMY_DOCS';
