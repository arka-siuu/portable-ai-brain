import type { Option, Text } from '@polkadot/types-codec';
export type ExtraTypes = Record<string, Record<string, {
    runtime?: Record<string, any>;
    types: Record<string, any>;
}>>;
export declare function getDeprecationNotice<T extends {
    isDeprecated: boolean;
    asDeprecated: {
        note: Text;
        since: Option<Text>;
    };
}>(deprecationInfo: T, name: string, label?: string): string;
