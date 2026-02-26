"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeprecationNotice = getDeprecationNotice;
function getDeprecationNotice(deprecationInfo, name, label) {
    let deprecationNotice = '@deprecated';
    if (deprecationInfo.isDeprecated) {
        const { note, since } = deprecationInfo.asDeprecated;
        const sinceText = since.isSome ? ` Since ${since.unwrap().toString()}.` : '';
        deprecationNotice += ` ${note.toString()}${sinceText}`;
    }
    else {
        const labelText = label ? `${label} ` : '';
        deprecationNotice += ` ${labelText}${name} has been deprecated`;
    }
    return deprecationNotice;
}
