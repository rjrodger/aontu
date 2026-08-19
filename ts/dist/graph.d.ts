import type { Val } from './type';
export type EntityEntry = {
    id: string;
    paths: string[];
};
export type Edge = {
    from: string;
    key: string;
    to: string;
    at: string;
};
export type Graph = {
    entities: EntityEntry[];
    edges: Edge[];
};
export declare function graphOf(root: Val): Graph;
